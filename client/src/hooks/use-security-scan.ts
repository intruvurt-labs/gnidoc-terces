import { useState, useEffect } from 'react';

interface SecurityIssue {
  id: string;
  type: 'vulnerability' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location?: string;
  recommendation: string;
}

interface SecurityScanResult {
  overallScore: string;
  vulnerabilities: number;
  codeQuality: string;
  blockchainSecurity: string;
  issues: SecurityIssue[];
  scanTime: Date;
}

const SECURITY_PATTERNS = [
  {
    pattern: /password\s*=\s*['""][^'"]*['"]/gi,
    type: 'vulnerability',
    severity: 'critical',
    title: 'Hardcoded Password',
    description: 'Password found in code',
    recommendation: 'Use environment variables or secure vaults'
  },
  {
    pattern: /api[_-]?key\s*=\s*['""][^'"]*['"]/gi,
    type: 'vulnerability', 
    severity: 'high',
    title: 'Exposed API Key',
    description: 'API key found in code',
    recommendation: 'Move to environment variables'
  },
  {
    pattern: /eval\s*\(/gi,
    type: 'vulnerability',
    severity: 'high', 
    title: 'Code Injection Risk',
    description: 'Use of eval() detected',
    recommendation: 'Avoid eval(), use safer alternatives'
  },
  {
    pattern: /innerHTML\s*=/gi,
    type: 'warning',
    severity: 'medium',
    title: 'XSS Risk',
    description: 'Direct innerHTML manipulation',
    recommendation: 'Use textContent or sanitize HTML'
  },
  {
    pattern: /console\.log/gi,
    type: 'info',
    severity: 'low',
    title: 'Debug Code',
    description: 'Console logging detected',
    recommendation: 'Remove debug statements for production'
  },
  {
    pattern: /document\.write/gi,
    type: 'vulnerability',
    severity: 'medium',
    title: 'Unsafe DOM Manipulation', 
    description: 'document.write() usage detected',
    recommendation: 'Use modern DOM methods instead'
  },
  {
    pattern: /window\.location\.href\s*=\s*[^;]+/gi,
    type: 'warning',
    severity: 'medium',
    title: 'Potential Open Redirect',
    description: 'Direct URL redirection',
    recommendation: 'Validate URLs before redirection'
  }
];

export function useSecurityScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [realtimeStats, setRealtimeStats] = useState({
    filesScanned: 0,
    threatsFound: 0,
    currentFile: '',
    progress: 0
  });

  const performScan = async (code: string): Promise<SecurityScanResult> => {
    setIsScanning(true);
    setRealtimeStats({ filesScanned: 0, threatsFound: 0, currentFile: '', progress: 0 });

    // Simulate real-time scanning
    const files = ['main.js', 'auth.js', 'api.js', 'utils.js', 'config.js'];
    const issues: SecurityIssue[] = [];

    for (let i = 0; i < files.length; i++) {
      setRealtimeStats(prev => ({
        ...prev,
        currentFile: files[i],
        filesScanned: i + 1,
        progress: ((i + 1) / files.length) * 100
      }));

      // Simulate scan delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check for security patterns
      SECURITY_PATTERNS.forEach((pattern, index) => {
        const matches = code.match(pattern.pattern);
        if (matches) {
          matches.forEach((match, matchIndex) => {
            const issue: SecurityIssue = {
              id: `${i}-${index}-${matchIndex}`,
              type: pattern.type as any,
              severity: pattern.severity as any,
              title: pattern.title,
              description: `${pattern.description}: "${match.substring(0, 50)}..."`,
              location: files[i],
              recommendation: pattern.recommendation
            };
            issues.push(issue);
          });
        }
      });

      setRealtimeStats(prev => ({
        ...prev,
        threatsFound: issues.length
      }));
    }

    // Calculate security score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    
    let score = 'A+';
    let blockchainSecurity = 'SECURE';
    
    if (criticalCount > 0) {
      score = 'F';
      blockchainSecurity = 'CRITICAL RISK';
    } else if (highCount > 0) {
      score = 'D';
      blockchainSecurity = 'HIGH RISK';
    } else if (mediumCount > 2) {
      score = 'C';
      blockchainSecurity = 'MEDIUM RISK';
    } else if (mediumCount > 0 || issues.length > 3) {
      score = 'B';
      blockchainSecurity = 'LOW RISK';
    }

    const result: SecurityScanResult = {
      overallScore: score,
      vulnerabilities: issues.filter(i => i.type === 'vulnerability').length,
      codeQuality: score,
      blockchainSecurity,
      issues,
      scanTime: new Date()
    };

    setIsScanning(false);
    setScanResult(result);
    return result;
  };

  return {
    isScanning,
    scanResult,
    realtimeStats,
    performScan,
    clearResults: () => setScanResult(null)
  };
}
