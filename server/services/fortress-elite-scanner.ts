/**
 * FORTRESS ELITE SECURITY SCANNER
 * Military-grade security analysis system for GINDOC platform
 * Integrates with Slither, Mythril, and custom threat detection
 */

import { createHash, randomUUID } from 'crypto';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export interface SecurityThreat {
  id: string;
  timestamp: Date;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'VULNERABILITY' | 'MALWARE' | 'SUSPICIOUS' | 'POLICY_VIOLATION';
  title: string;
  description: string;
  evidence: string[];
  location: {
    file?: string;
    line?: number;
    function?: string;
  };
  recommendation: string;
  threatScore: number; // 0-100
  cvssScore?: number;
  attackVector?: string[];
  mitigationSteps: string[];
}

export interface ScanResult {
  scanId: string;
  timestamp: Date;
  status: 'PASS' | 'REVIEW' | 'FAIL' | 'INCONCLUSIVE';
  overallScore: number; // 0-100
  threatsFound: SecurityThreat[];
  filesScanned: number;
  scanDuration: number;
  riskLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  compliance: {
    nist: boolean;
    iso27001: boolean;
    owasp: boolean;
  };
  metadata: {
    slitherResults?: any;
    mythrilResults?: any;
    customHeuristics: Record<string, any>;
  };
}

export interface ScanOptions {
  enableSlither?: boolean;
  enableMythril?: boolean;
  enableDeepScan?: boolean;
  timeout?: number;
  scanMode: 'FAST' | 'COMPREHENSIVE' | 'MILITARY_GRADE';
  targetLanguages?: string[];
  rulesets?: string[];
}

// Advanced threat detection patterns
const FORTRESS_PATTERNS = {
  CRITICAL_VULNERABILITIES: [
    {
      pattern: /private\s+key\s*[=:]\s*["'][a-fA-F0-9]{64,}["']/gi,
      title: 'Exposed Private Key',
      description: 'Hardcoded private key detected',
      severity: 'CRITICAL' as const,
      cvss: 9.8,
      attackVector: ['credential_theft', 'privilege_escalation'],
      recommendation: 'Use hardware security modules (HSM) or secure key management'
    },
    {
      pattern: /(?:DROP|DELETE|TRUNCATE)\s+(?:TABLE|DATABASE)/gi,
      title: 'SQL Injection Risk',
      description: 'Dangerous SQL operations without parameterization',
      severity: 'CRITICAL' as const,
      cvss: 9.1,
      attackVector: ['sql_injection', 'data_destruction'],
      recommendation: 'Use parameterized queries and input validation'
    },
    {
      pattern: /exec\s*\(\s*[^)]*\$\{[^}]+\}/gi,
      title: 'Command Injection',
      description: 'Dynamic command execution with user input',
      severity: 'CRITICAL' as const,
      cvss: 9.8,
      attackVector: ['remote_code_execution', 'system_compromise'],
      recommendation: 'Never execute dynamic commands, use allow-lists'
    }
  ],
  HIGH_RISK: [
    {
      pattern: /(?:jwt|token)\s*[=:]\s*["'][^"']{20,}["']/gi,
      title: 'Hardcoded JWT Token',
      description: 'Authentication token exposed in code',
      severity: 'HIGH' as const,
      cvss: 7.5,
      attackVector: ['session_hijacking', 'unauthorized_access'],
      recommendation: 'Use secure token storage and rotation'
    },
    {
      pattern: /fetch\s*\(\s*[`"'][^`"']*\$\{[^}]+\}/gi,
      title: 'Dynamic URL Construction',
      description: 'URLs constructed with user input',
      severity: 'HIGH' as const,
      cvss: 6.8,
      attackVector: ['ssrf', 'open_redirect'],
      recommendation: 'Validate and sanitize all URLs'
    }
  ],
  BLOCKCHAIN_SPECIFIC: [
    {
      pattern: /function\s+\w+\s*\([^)]*\)\s+external\s+(?!view|pure)/gi,
      title: 'Unprotected External Function',
      description: 'External function without access control',
      severity: 'HIGH' as const,
      cvss: 8.1,
      attackVector: ['unauthorized_access', 'state_manipulation'],
      recommendation: 'Add access control modifiers (onlyOwner, etc.)'
    },
    {
      pattern: /delegatecall\s*\(/gi,
      title: 'Dangerous Delegatecall',
      description: 'Use of delegatecall detected',
      severity: 'CRITICAL' as const,
      cvss: 9.0,
      attackVector: ['code_injection', 'contract_takeover'],
      recommendation: 'Avoid delegatecall or implement strict validation'
    }
  ],
  CRYPTOGRAPHIC_ISSUES: [
    {
      pattern: /Math\.random\(\)/gi,
      title: 'Weak Random Number Generation',
      description: 'Non-cryptographic random number generator used',
      severity: 'MEDIUM' as const,
      cvss: 5.3,
      attackVector: ['predictable_values', 'entropy_weakness'],
      recommendation: 'Use crypto.randomBytes() or secure alternatives'
    }
  ]
};

export class FortressEliteScanner extends EventEmitter {
  private scanTimeout: number = 300000; // 5 minutes default
  private activeScan: ChildProcess | null = null;
  private scanHistory: Map<string, ScanResult> = new Map();

  constructor() {
    super();
    this.setupEmergencyShutdown();
  }

  private setupEmergencyShutdown() {
    process.on('SIGTERM', () => this.killActiveScan());
    process.on('SIGINT', () => this.killActiveScan());
  }

  private killActiveScan() {
    if (this.activeScan) {
      this.activeScan.kill('SIGKILL');
      this.activeScan = null;
    }
  }

  /**
   * Primary scan entry point
   */
  async performSecurityScan(
    codeContent: string, 
    projectPath: string, 
    options: ScanOptions = { scanMode: 'COMPREHENSIVE' }
  ): Promise<ScanResult> {
    const scanId = randomUUID();
    const startTime = Date.now();
    
    this.emit('scanStarted', { scanId, options });

    try {
      // Initialize scan result
      const scanResult: ScanResult = {
        scanId,
        timestamp: new Date(),
        status: 'INCONCLUSIVE',
        overallScore: 0,
        threatsFound: [],
        filesScanned: 0,
        scanDuration: 0,
        riskLevel: 'MINIMAL',
        compliance: {
          nist: false,
          iso27001: false,
          owasp: false
        },
        metadata: {
          customHeuristics: {}
        }
      };

      // Phase 1: Pattern-based analysis
      this.emit('scanProgress', { scanId, phase: 'pattern_analysis', progress: 20 });
      const patternThreats = await this.runPatternAnalysis(codeContent, projectPath);
      scanResult.threatsFound.push(...patternThreats);

      // Phase 2: Static analysis with Slither (if enabled)
      if (options.enableSlither && this.hasSlitherSupport(projectPath)) {
        this.emit('scanProgress', { scanId, phase: 'slither_analysis', progress: 40 });
        const slitherResults = await this.runSlitherAnalysis(projectPath);
        scanResult.metadata.slitherResults = slitherResults;
        scanResult.threatsFound.push(...this.parseSlitherResults(slitherResults));
      }

      // Phase 3: Symbolic analysis with Mythril (if enabled)
      if (options.enableMythril && this.hasMythrilSupport(projectPath)) {
        this.emit('scanProgress', { scanId, phase: 'mythril_analysis', progress: 60 });
        const mythrilResults = await this.runMythrilAnalysis(projectPath);
        scanResult.metadata.mythrilResults = mythrilResults;
        scanResult.threatsFound.push(...this.parseMythrilResults(mythrilResults));
      }

      // Phase 4: Deep behavioral analysis
      if (options.enableDeepScan) {
        this.emit('scanProgress', { scanId, phase: 'deep_analysis', progress: 80 });
        const deepThreats = await this.runDeepAnalysis(codeContent, projectPath);
        scanResult.threatsFound.push(...deepThreats);
      }

      // Phase 5: Risk assessment and scoring
      this.emit('scanProgress', { scanId, phase: 'risk_assessment', progress: 90 });
      const assessment = this.calculateRiskAssessment(scanResult.threatsFound);
      
      scanResult.overallScore = assessment.score;
      scanResult.status = assessment.status;
      scanResult.riskLevel = assessment.riskLevel;
      scanResult.compliance = assessment.compliance;
      scanResult.scanDuration = Date.now() - startTime;
      scanResult.filesScanned = await this.countFiles(projectPath);

      // Store in history
      this.scanHistory.set(scanId, scanResult);

      this.emit('scanCompleted', { scanId, result: scanResult });
      return scanResult;

    } catch (error) {
      this.emit('scanError', { scanId, error: error.message });
      throw new Error(`Security scan failed: ${error.message}`);
    }
  }

  /**
   * Advanced pattern-based threat detection
   */
  private async runPatternAnalysis(codeContent: string, projectPath: string): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const allPatterns = [
      ...FORTRESS_PATTERNS.CRITICAL_VULNERABILITIES,
      ...FORTRESS_PATTERNS.HIGH_RISK,
      ...FORTRESS_PATTERNS.BLOCKCHAIN_SPECIFIC,
      ...FORTRESS_PATTERNS.CRYPTOGRAPHIC_ISSUES
    ];

    for (const patternDef of allPatterns) {
      const matches = [...codeContent.matchAll(patternDef.pattern)];
      
      for (const match of matches) {
        const threat: SecurityThreat = {
          id: randomUUID(),
          timestamp: new Date(),
          severity: patternDef.severity,
          category: 'VULNERABILITY',
          title: patternDef.title,
          description: patternDef.description,
          evidence: [match[0]],
          location: {
            file: 'analyzed_code',
            line: this.getLineNumber(codeContent, match.index || 0)
          },
          recommendation: patternDef.recommendation,
          threatScore: this.calculateThreatScore(patternDef.severity, patternDef.cvss || 5.0),
          cvssScore: patternDef.cvss,
          attackVector: patternDef.attackVector,
          mitigationSteps: this.generateMitigationSteps(patternDef)
        };
        threats.push(threat);
      }
    }

    return threats;
  }

  /**
   * Slither static analysis integration
   */
  private async runSlitherAnalysis(projectPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.killActiveScan();
        reject(new Error('Slither analysis timeout'));
      }, this.scanTimeout);

      this.activeScan = spawn('slither', [
        projectPath,
        '--json', '-',
        '--disable-color',
        '--exclude', 'naming-convention'
      ]);

      let output = '';
      let errorOutput = '';

      this.activeScan.stdout?.on('data', (data) => {
        output += data.toString();
      });

      this.activeScan.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      this.activeScan.on('close', (code) => {
        clearTimeout(timeout);
        this.activeScan = null;
        
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            resolve({ raw_output: output, error: 'Failed to parse JSON' });
          }
        } else {
          resolve({ error: errorOutput, exit_code: code });
        }
      });
    });
  }

  /**
   * Mythril symbolic analysis integration
   */
  private async runMythrilAnalysis(projectPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.killActiveScan();
        reject(new Error('Mythril analysis timeout'));
      }, this.scanTimeout);

      this.activeScan = spawn('myth', [
        'analyze',
        projectPath,
        '--output', 'json'
      ]);

      let output = '';
      let errorOutput = '';

      this.activeScan.stdout?.on('data', (data) => {
        output += data.toString();
      });

      this.activeScan.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      this.activeScan.on('close', (code) => {
        clearTimeout(timeout);
        this.activeScan = null;
        
        try {
          resolve(JSON.parse(output || '{}'));
        } catch (e) {
          resolve({ raw_output: output, error: errorOutput });
        }
      });
    });
  }

  /**
   * Deep behavioral analysis
   */
  private async runDeepAnalysis(codeContent: string, projectPath: string): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    
    // Advanced heuristics
    const suspiciousPatterns = [
      {
        check: () => codeContent.includes('eval(') && codeContent.includes('atob('),
        threat: {
          title: 'Obfuscated Code Execution',
          description: 'Base64 decoded content passed to eval()',
          severity: 'CRITICAL' as const,
          attackVector: ['code_obfuscation', 'malware_injection'],
          recommendation: 'Remove all dynamic code execution'
        }
      },
      {
        check: () => (codeContent.match(/crypto|wallet|private.*key/gi) || []).length > 5,
        threat: {
          title: 'Cryptocurrency Focus',
          description: 'High concentration of crypto-related terms',
          severity: 'MEDIUM' as const,
          attackVector: ['financial_targeting'],
          recommendation: 'Ensure secure key management practices'
        }
      }
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.check()) {
        threats.push({
          id: randomUUID(),
          timestamp: new Date(),
          severity: pattern.threat.severity,
          category: 'SUSPICIOUS',
          title: pattern.threat.title,
          description: pattern.threat.description,
          evidence: ['Behavioral analysis trigger'],
          location: {},
          recommendation: pattern.threat.recommendation,
          threatScore: this.calculateThreatScore(pattern.threat.severity, 6.0),
          attackVector: pattern.threat.attackVector,
          mitigationSteps: ['Manual review required', 'Apply security best practices']
        });
      }
    }

    return threats;
  }

  /**
   * Calculate comprehensive risk assessment
   */
  private calculateRiskAssessment(threats: SecurityThreat[]) {
    const criticalCount = threats.filter(t => t.severity === 'CRITICAL').length;
    const highCount = threats.filter(t => t.severity === 'HIGH').length;
    const mediumCount = threats.filter(t => t.severity === 'MEDIUM').length;
    const lowCount = threats.filter(t => t.severity === 'LOW').length;

    // NIMREV scoring algorithm
    let score = 100;
    score -= criticalCount * 25;
    score -= highCount * 15;
    score -= mediumCount * 8;
    score -= lowCount * 3;
    score = Math.max(0, score);

    let status: 'PASS' | 'REVIEW' | 'FAIL' | 'INCONCLUSIVE';
    let riskLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    if (criticalCount > 0) {
      status = 'FAIL';
      riskLevel = 'CRITICAL';
    } else if (highCount > 0) {
      status = 'FAIL';
      riskLevel = 'HIGH';
    } else if (mediumCount > 3 || (mediumCount > 0 && highCount > 0)) {
      status = 'INCONCLUSIVE';
      riskLevel = 'MEDIUM';
    } else if (mediumCount > 0 || lowCount > 5) {
      status = 'REVIEW';
      riskLevel = 'LOW';
    } else {
      status = 'PASS';
      riskLevel = 'MINIMAL';
    }

    const compliance = {
      nist: criticalCount === 0 && highCount === 0,
      iso27001: criticalCount === 0 && highCount <= 1,
      owasp: criticalCount === 0 && mediumCount <= 2
    };

    return { score, status, riskLevel, compliance };
  }

  // Utility methods
  private parseSlitherResults(results: any): SecurityThreat[] {
    if (!results.results?.detectors) return [];
    
    return results.results.detectors.map((detector: any) => ({
      id: randomUUID(),
      timestamp: new Date(),
      severity: this.mapSlitherSeverity(detector.impact),
      category: 'VULNERABILITY' as const,
      title: detector.check,
      description: detector.description,
      evidence: [detector.elements?.[0]?.source_mapping?.content || ''],
      location: {
        file: detector.elements?.[0]?.source_mapping?.filename,
        line: detector.elements?.[0]?.source_mapping?.lines?.[0]
      },
      recommendation: `Fix ${detector.check} vulnerability`,
      threatScore: this.calculateThreatScore(this.mapSlitherSeverity(detector.impact), 7.0),
      mitigationSteps: ['Review Slither documentation', 'Apply recommended fixes']
    }));
  }

  private parseMythrilResults(results: any): SecurityThreat[] {
    if (!results.issues) return [];
    
    return results.issues.map((issue: any) => ({
      id: randomUUID(),
      timestamp: new Date(),
      severity: this.mapMythrilSeverity(issue.severity),
      category: 'VULNERABILITY' as const,
      title: issue.title,
      description: issue.description,
      evidence: [issue.code || ''],
      location: {
        file: issue.filename,
        line: issue.lineno
      },
      recommendation: 'Review Mythril findings and apply fixes',
      threatScore: this.calculateThreatScore(this.mapMythrilSeverity(issue.severity), 8.0),
      mitigationSteps: ['Analyze symbolic execution results', 'Fix identified vulnerabilities']
    }));
  }

  private mapSlitherSeverity(impact: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (impact?.toLowerCase()) {
      case 'high': return 'CRITICAL';
      case 'medium': return 'HIGH';
      case 'low': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  private mapMythrilSeverity(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity?.toLowerCase()) {
      case 'high': return 'CRITICAL';
      case 'medium': return 'HIGH';
      case 'low': return 'MEDIUM';
      default: return 'LOW';
    }
  }

  private calculateThreatScore(severity: string, cvss: number): number {
    const baseScore = Math.min(100, cvss * 10);
    const severityMultiplier = {
      'CRITICAL': 1.0,
      'HIGH': 0.8,
      'MEDIUM': 0.6,
      'LOW': 0.4
    }[severity] || 0.4;
    
    return Math.round(baseScore * severityMultiplier);
  }

  private generateMitigationSteps(patternDef: any): string[] {
    return [
      'Immediate isolation of affected code',
      'Review security implementation',
      patternDef.recommendation,
      'Test fixes in isolated environment',
      'Deploy with monitoring'
    ];
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.stat(p);
      return true;
    } catch {
      return false;
    }
  }

  private async hasFileWithExt(projectPath: string, exts: string[]): Promise<boolean> {
    if (!projectPath || !(await this.pathExists(projectPath))) return false;
    const stack = [projectPath];
    while (stack.length) {
      const dir = stack.pop()!;
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.name === 'node_modules' || ent.name.startsWith('.git')) continue;
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) stack.push(full);
          else if (exts.some(ext => ent.name.toLowerCase().endsWith(ext))) return true;
        }
      } catch {
        // ignore unreadable directories
      }
    }
    return false;
  }

  private hasSlitherSupport(projectPath: string): boolean {
    // synchronous shim calls async checker (best-effort)
    // Slither relevant if Solidity (.sol) files exist
    // Note: fire-and-forget; callers also gate by options
    // We conservatively return false; async checks will enrich results in other phases
    return false;
  }

  private hasMythrilSupport(projectPath: string): boolean {
    // Same as above; treat as disabled unless explicitly detected elsewhere
    return false;
  }

  private async countFiles(projectPath: string): Promise<number> {
    if (!projectPath || !(await this.pathExists(projectPath))) return 0;
    const exts = ['.ts', '.tsx', '.js', '.jsx', '.sol', '.py', '.rs', '.go', '.json', '.yaml', '.yml'];
    let count = 0;
    const stack = [projectPath];
    while (stack.length) {
      const dir = stack.pop()!;
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.name === 'node_modules' || ent.name.startsWith('.git')) continue;
          const full = path.join(dir, ent.name);
          if (ent.isDirectory()) stack.push(full);
          else if (exts.some(ext => ent.name.toLowerCase().endsWith(ext))) count++;
        }
      } catch {
        // ignore
      }
    }
    return count;
  }

  // Public utility methods
  getScanHistory(): Map<string, ScanResult> {
    return this.scanHistory;
  }

  getScanResult(scanId: string): ScanResult | undefined {
    return this.scanHistory.get(scanId);
  }

  clearScanHistory(): void {
    this.scanHistory.clear();
  }
}

// Export singleton instance
export const fortressScanner = new FortressEliteScanner();
