/**
 * GITHUB API INTEGRATION
 * Programmatic code pushing, repository management, and automated commits
 * Enterprise-grade Git operations with security scanning integration
 */

import fetch from 'node-fetch';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface FileChange {
  path: string;
  content: string;
  mode?: '100644' | '100755' | '040000' | '160000' | '120000';
  type?: 'blob' | 'tree' | 'commit';
}

export interface CommitInfo {
  message: string;
  author: {
    name: string;
    email: string;
    date?: string;
  };
  committer?: {
    name: string;
    email: string;
    date?: string;
  };
}

export interface PushResult {
  success: boolean;
  commitSha?: string;
  message: string;
  url?: string;
  filesChanged: number;
  warnings?: string[];
}

export interface RepositoryInfo {
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  defaultBranch: string;
  languages: Record<string, number>;
  size: number;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export class GitHubIntegration extends EventEmitter {
  private config: GitHubConfig;
  private apiUrl = 'https://api.github.com';

  constructor(config: GitHubConfig) {
    super();
    this.config = {
      ...config,
      branch: config.branch || 'main'
    };
  }

  /**
   * Test GitHub API connection and permissions
   */
  async testConnection(): Promise<{ success: boolean; message: string; permissions?: string[] }> {
    try {
      const response = await this.makeRequest('GET', '/user');
      const userInfo = await response.json() as any;
      
      if (response.ok) {
        // Test repository access
        const repoResponse = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}`);
        
        if (repoResponse.ok) {
          const repoInfo = await repoResponse.json() as any;
          const permissions = repoInfo.permissions || {};
          
          return {
            success: true,
            message: `Connected as ${userInfo.login}. Repository access confirmed.`,
            permissions: Object.keys(permissions).filter(key => permissions[key])
          };
        } else {
          return {
            success: false,
            message: `Repository access failed: ${repoResponse.status} ${repoResponse.statusText}`
          };
        }
      } else {
        return {
          success: false,
          message: `Authentication failed: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<RepositoryInfo> {
    try {
      const response = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch repository info: ${response.status} ${response.statusText}`);
      }
      
      const repo = await response.json() as any;
      
      // Get languages
      const languagesResponse = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}/languages`);
      const languages = languagesResponse.ok ? await languagesResponse.json() as Record<string, number> : {};
      
      return {
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        private: repo.private,
        defaultBranch: repo.default_branch,
        languages,
        size: repo.size,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        openIssuesCount: repo.open_issues_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }

  /**
   * Push code changes to GitHub repository
   */
  async pushChanges(
    files: FileChange[], 
    commitInfo: CommitInfo,
    options: {
      createBranch?: boolean;
      forcePush?: boolean;
      runSecurityScan?: boolean;
    } = {}
  ): Promise<PushResult> {
    try {
      const branch = this.config.branch!;
      let warnings: string[] = [];

      this.emit('pushStarted', { files: files.length, branch });

      // Security scan before push (if enabled)
      if (options.runSecurityScan) {
        this.emit('securityScanStarted');
        const scanResults = await this.performSecurityScan(files);
        if (scanResults.criticalIssues > 0) {
          warnings.push(`Security scan found ${scanResults.criticalIssues} critical issues`);
          if (!options.forcePush) {
            return {
              success: false,
              message: 'Push blocked due to security issues. Use forcePush: true to override.',
              filesChanged: 0,
              warnings
            };
          }
        }
        this.emit('securityScanCompleted', scanResults);
      }

      // Get current branch reference
      let baseSha: string;
      try {
        const refResponse = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${branch}`);
        
        if (refResponse.ok) {
          const ref = await refResponse.json() as any;
          baseSha = ref.object.sha;
        } else if (refResponse.status === 404 && options.createBranch) {
          // Branch doesn't exist, get default branch SHA to create new branch
          const defaultRefResponse = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}/git/ref/heads/${(await this.getRepositoryInfo()).defaultBranch}`);
          
          if (!defaultRefResponse.ok) {
            throw new Error('Failed to get default branch reference');
          }
          
          const defaultRef = await defaultRefResponse.json() as any;
          baseSha = defaultRef.object.sha;
          
          // Create new branch
          await this.createBranch(branch, baseSha);
          this.emit('branchCreated', { branch, baseSha });
        } else {
          throw new Error(`Branch '${branch}' not found and createBranch is false`);
        }
      } catch (error) {
        throw new Error(`Failed to get branch reference: ${error.message}`);
      }

      // Get base tree
      const baseCommitResponse = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}/git/commits/${baseSha}`);
      
      if (!baseCommitResponse.ok) {
        throw new Error('Failed to get base commit');
      }
      
      const baseCommit = await baseCommitResponse.json() as any;
      const baseTreeSha = baseCommit.tree.sha;

      // Create blobs for each file
      const blobs: { path: string; sha: string; mode: string }[] = [];
      
      for (const file of files) {
        this.emit('fileProcessing', { path: file.path });
        
        const blobResponse = await this.makeRequest('POST', `/repos/${this.config.owner}/${this.config.repo}/git/blobs`, {
          content: file.content,
          encoding: 'utf-8'
        });
        
        if (!blobResponse.ok) {
          throw new Error(`Failed to create blob for ${file.path}`);
        }
        
        const blob = await blobResponse.json() as any;
        blobs.push({
          path: file.path,
          sha: blob.sha,
          mode: file.mode || '100644'
        });
      }

      // Create new tree
      const treeResponse = await this.makeRequest('POST', `/repos/${this.config.owner}/${this.config.repo}/git/trees`, {
        base_tree: baseTreeSha,
        tree: blobs.map(blob => ({
          path: blob.path,
          mode: blob.mode,
          type: 'blob',
          sha: blob.sha
        }))
      });
      
      if (!treeResponse.ok) {
        throw new Error('Failed to create tree');
      }
      
      const tree = await treeResponse.json() as any;

      // Create commit
      const commitResponse = await this.makeRequest('POST', `/repos/${this.config.owner}/${this.config.repo}/git/commits`, {
        message: commitInfo.message,
        author: {
          name: commitInfo.author.name,
          email: commitInfo.author.email,
          date: commitInfo.author.date || new Date().toISOString()
        },
        committer: commitInfo.committer || {
          name: commitInfo.author.name,
          email: commitInfo.author.email,
          date: commitInfo.author.date || new Date().toISOString()
        },
        tree: tree.sha,
        parents: [baseSha]
      });
      
      if (!commitResponse.ok) {
        throw new Error('Failed to create commit');
      }
      
      const commit = await commitResponse.json() as any;

      // Update branch reference
      const updateRefResponse = await this.makeRequest('PATCH', `/repos/${this.config.owner}/${this.config.repo}/git/refs/heads/${branch}`, {
        sha: commit.sha,
        force: options.forcePush || false
      });
      
      if (!updateRefResponse.ok) {
        throw new Error('Failed to update branch reference');
      }

      const result: PushResult = {
        success: true,
        commitSha: commit.sha,
        message: `Successfully pushed ${files.length} files to ${branch}`,
        url: `https://github.com/${this.config.owner}/${this.config.repo}/commit/${commit.sha}`,
        filesChanged: files.length,
        warnings
      };

      this.emit('pushCompleted', result);
      return result;

    } catch (error) {
      const result: PushResult = {
        success: false,
        message: `Push failed: ${error.message}`,
        filesChanged: 0
      };
      
      this.emit('pushFailed', { error: error.message });
      return result;
    }
  }

  /**
   * Create a new branch
   */
  private async createBranch(branchName: string, sha: string): Promise<void> {
    const response = await this.makeRequest('POST', `/repos/${this.config.owner}/${this.config.repo}/git/refs`, {
      ref: `refs/heads/${branchName}`,
      sha
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create branch: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Perform security scan on files before push
   */
  private async performSecurityScan(files: FileChange[]): Promise<{ criticalIssues: number; warnings: number; issues: any[] }> {
    let criticalIssues = 0;
    let warnings = 0;
    const issues: any[] = [];

    // Security patterns to check
    const securityPatterns = [
      {
        pattern: /(?:password|secret|key|token)\s*[=:]\s*["'][^"']{8,}["']/gi,
        severity: 'CRITICAL',
        message: 'Hardcoded credentials detected'
      },
      {
        pattern: /api[_-]?key\s*[=:]\s*["'][^"']+["']/gi,
        severity: 'CRITICAL', 
        message: 'API key exposed in code'
      },
      {
        pattern: /private[_-]?key\s*[=:]\s*["'][^"']{32,}["']/gi,
        severity: 'CRITICAL',
        message: 'Private key exposed in code'
      },
      {
        pattern: /console\.log|debugger/gi,
        severity: 'WARNING',
        message: 'Debug code detected'
      }
    ];

    for (const file of files) {
      for (const { pattern, severity, message } of securityPatterns) {
        const matches = file.content.match(pattern);
        if (matches) {
          const issue = {
            file: file.path,
            severity,
            message,
            matches: matches.length
          };
          
          issues.push(issue);
          
          if (severity === 'CRITICAL') {
            criticalIssues++;
          } else if (severity === 'WARNING') {
            warnings++;
          }
        }
      }
    }

    return { criticalIssues, warnings, issues };
  }

  /**
   * Get commit history
   */
  async getCommitHistory(limit: number = 10): Promise<any[]> {
    try {
      const response = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}/commits?per_page=${limit}&sha=${this.config.branch}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commit history: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as any[];
    } catch (error) {
      throw new Error(`Failed to get commit history: ${error.message}`);
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(options: {
    title: string;
    body: string;
    head: string;
    base: string;
    draft?: boolean;
  }): Promise<any> {
    try {
      const response = await this.makeRequest('POST', `/repos/${this.config.owner}/${this.config.repo}/pulls`, {
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base,
        draft: options.draft || false
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create pull request: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  /**
   * Get repository file content
   */
  async getFileContent(path: string): Promise<string> {
    try {
      const response = await this.makeRequest('GET', `/repos/${this.config.owner}/${this.config.repo}/contents/${path}?ref=${this.config.branch}`);
      
      if (!response.ok) {
        throw new Error(`File not found: ${path}`);
      }
      
      const file = await response.json() as any;
      
      if (file.type !== 'file') {
        throw new Error('Path is not a file');
      }
      
      return Buffer.from(file.content, 'base64').toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async makeRequest(method: string, endpoint: string, body?: any): Promise<Response> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const options: any = {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'GINDOC-Platform/1.0'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    return fetch(url, options);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get current configuration (without token)
   */
  getConfig(): Omit<GitHubConfig, 'token'> {
    const { token, ...safeConfig } = this.config;
    return safeConfig;
  }
}

// Factory function to create GitHub integration instances
export function createGitHubIntegration(config: GitHubConfig): GitHubIntegration {
  return new GitHubIntegration(config);
}

// Utility function to validate GitHub token format
export function isValidGitHubToken(token: string): boolean {
  // GitHub personal access tokens start with 'ghp_' (new format) or are 40 characters (classic)
  return /^ghp_[a-zA-Z0-9]{36}$/.test(token) || /^[a-f0-9]{40}$/.test(token);
}

// Example usage configuration
export const GITHUB_INTEGRATION_EXAMPLES = {
  basicConfig: {
    token: 'your_github_token_here',
    owner: 'your-username',
    repo: 'your-repository',
    branch: 'main'
  },
  
  enterpriseConfig: {
    token: 'your_github_token_here',
    owner: 'your-organization',
    repo: 'enterprise-project',
    branch: 'development'
  },
  
  exampleFileChanges: [
    {
      path: 'src/index.ts',
      content: 'console.log("Hello, automated GitHub push!");'
    },
    {
      path: 'README.md',
      content: '# Automated Update\n\nThis was pushed programmatically via GINDOC platform.'
    }
  ],
  
  exampleCommitInfo: {
    message: 'feat: automated code generation and security improvements\n\n- Generated by GINDOC platform\n- Includes security scanning\n- Enterprise-grade code quality',
    author: {
      name: 'GINDOC Platform',
      email: 'platform@gindoc.com'
    }
  }
};
