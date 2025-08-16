import { useState, useCallback } from 'react';

// Import only type definitions from shared schema
export interface ScanResult {
  scanId: string;
  timestamp: Date;
  status: 'PASS' | 'REVIEW' | 'FAIL' | 'INCONCLUSIVE';
  overallScore: number;
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
  threatScore: number;
  cvssScore?: number;
  attackVector?: string[];
  mitigationSteps: string[];
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

export interface ThreatAssessment {
  id: string;
  timestamp: Date;
  overallRisk: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  threats: Array<{
    id: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    confidence: number;
    indicators: string[];
    mitigations: string[];
  }>;
  sources: string[];
  recommendations: string[];
}

export interface EnhancedSecurityResult {
  scanId: string;
  timestamp: Date;
  fortressResults: ScanResult;
  threatIntelResults: ThreatAssessment;
  finalScore: number;
  finalStatus: 'PASS' | 'REVIEW' | 'FAIL' | 'INCONCLUSIVE';
  combinedThreats: Array<{
    id: string;
    source: 'FORTRESS' | 'THREAT_INTEL' | 'BEHAVIORAL';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    recommendation: string;
    confidence: number;
  }>;
  businessImpact: {
    financialRisk: number; // 0-100
    reputationRisk: number; // 0-100
    operationalRisk: number; // 0-100
    complianceRisk: number; // 0-100
    recommendations: string[];
  };
  moneyMakingOpportunities: {
    apiEndpointIdeas: string[];
    securityServicesRevenue: string[];
    enterpriseFeatures: string[];
    passiveIncomeStreams: string[];
  };
}

export interface ScanProgress {
  phase: string;
  progress: number;
  currentFile?: string;
  threatsFound: number;
  timeElapsed: number;
  estimatedTimeRemaining: number;
}

export function useEnhancedSecurityScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<EnhancedSecurityResult | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    phase: '',
    progress: 0,
    threatsFound: 0,
    timeElapsed: 0,
    estimatedTimeRemaining: 0
  });

  const performEnhancedScan = useCallback(async (
    codeContent: string,
    projectPath: string = '/tmp/scan',
    options: ScanOptions = { scanMode: 'MILITARY_GRADE' }
  ): Promise<EnhancedSecurityResult> => {
    setIsScanning(true);
    const startTime = Date.now();
    let currentPhase = 'Initializing scan...';

    try {
      // Phase 1: Initialize
      setScanProgress({
        phase: currentPhase,
        progress: 5,
        threatsFound: 0,
        timeElapsed: 0,
        estimatedTimeRemaining: 120000 // 2 minutes estimate
      });

      // Phase 2: Fortress Elite Scanner
      currentPhase = 'Running Fortress Elite military-grade analysis...';
      setScanProgress(prev => ({ ...prev, phase: currentPhase, progress: 20 }));
      
      const fortressResponse = await fetch('/api/security/fortress-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeContent,
          projectPath,
          options: {
            ...options,
            enableSlither: true,
            enableMythril: true,
            enableDeepScan: true
          }
        }),
      });

      if (!fortressResponse.ok) {
        throw new Error(`Fortress scan failed: ${fortressResponse.statusText}`);
      }

      const fortressResults: ScanResult = await fortressResponse.json();

      // Phase 3: Threat Intelligence Analysis
      currentPhase = 'Analyzing against threat intelligence databases...';
      setScanProgress(prev => ({ 
        ...prev, 
        phase: currentPhase, 
        progress: 50,
        threatsFound: fortressResults.threatsFound.length 
      }));

      const threatIntelResponse = await fetch('/api/security/threat-intel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeContent,
          projectPath,
          fortressResults
        }),
      });

      if (!threatIntelResponse.ok) {
        throw new Error(`Threat intelligence analysis failed: ${threatIntelResponse.statusText}`);
      }

      const threatIntelResults: ThreatAssessment = await threatIntelResponse.json();

      // Phase 4: Combined Analysis
      currentPhase = 'Performing combined threat correlation...';
      setScanProgress(prev => ({ 
        ...prev, 
        phase: currentPhase, 
        progress: 75,
        threatsFound: fortressResults.threatsFound.length + threatIntelResults.threats.length
      }));

      // Combine and correlate threats
      const combinedThreats = [
        ...fortressResults.threatsFound.map(threat => ({
          id: threat.id,
          source: 'FORTRESS' as const,
          severity: threat.severity,
          title: threat.title,
          description: threat.description,
          recommendation: threat.recommendation,
          confidence: 85 + (threat.threatScore / 100) * 15 // 85-100% confidence
        })),
        ...threatIntelResults.threats.map(threat => ({
          id: threat.id,
          source: 'THREAT_INTEL' as const,
          severity: threat.severity,
          title: threat.description,
          description: `${threat.type} detected: ${threat.description}`,
          recommendation: 'Review threat intelligence findings and apply mitigations',
          confidence: threat.confidence
        }))
      ];

      // Phase 5: Business Impact Analysis
      currentPhase = 'Calculating business impact and revenue opportunities...';
      setScanProgress(prev => ({ 
        ...prev, 
        phase: currentPhase, 
        progress: 90,
        timeElapsed: Date.now() - startTime
      }));

      const businessImpact = calculateBusinessImpact(combinedThreats);
      const moneyMakingOpportunities = generateRevenueOpportunities(fortressResults, threatIntelResults);

      // Phase 6: Final Scoring
      const finalScore = calculateCombinedScore(fortressResults, threatIntelResults);
      const finalStatus = determineFinalStatus(finalScore, combinedThreats);

      const result: EnhancedSecurityResult = {
        scanId: fortressResults.scanId,
        timestamp: new Date(),
        fortressResults,
        threatIntelResults,
        finalScore,
        finalStatus,
        combinedThreats,
        businessImpact,
        moneyMakingOpportunities
      };

      setScanProgress(prev => ({ 
        ...prev, 
        phase: 'Scan completed successfully', 
        progress: 100,
        timeElapsed: Date.now() - startTime,
        estimatedTimeRemaining: 0
      }));

      setScanResult(result);
      return result;

    } catch (error) {
      setScanProgress(prev => ({ 
        ...prev, 
        phase: `Error: ${error.message}`, 
        progress: 0,
        timeElapsed: Date.now() - startTime
      }));
      throw error;
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 1000);
    }
  }, []);

  const calculateBusinessImpact = (threats: any[]): EnhancedSecurityResult['businessImpact'] => {
    const criticalCount = threats.filter(t => t.severity === 'CRITICAL').length;
    const highCount = threats.filter(t => t.severity === 'HIGH').length;
    const mediumCount = threats.filter(t => t.severity === 'MEDIUM').length;

    const financialRisk = Math.min(100, (criticalCount * 40) + (highCount * 25) + (mediumCount * 10));
    const reputationRisk = Math.min(100, (criticalCount * 35) + (highCount * 20) + (mediumCount * 8));
    const operationalRisk = Math.min(100, (criticalCount * 30) + (highCount * 18) + (mediumCount * 12));
    const complianceRisk = Math.min(100, (criticalCount * 45) + (highCount * 30) + (mediumCount * 15));

    const recommendations = [
      financialRisk > 70 ? 'Immediate financial risk mitigation required' : '',
      reputationRisk > 60 ? 'Brand protection measures needed' : '',
      operationalRisk > 50 ? 'Business continuity planning recommended' : '',
      complianceRisk > 80 ? 'Regulatory compliance review urgent' : '',
      'Consider cyber insurance evaluation',
      'Implement continuous security monitoring'
    ].filter(Boolean);

    return {
      financialRisk,
      reputationRisk,
      operationalRisk,
      complianceRisk,
      recommendations
    };
  };

  const generateRevenueOpportunities = (
    fortressResults: ScanResult, 
    threatResults: ThreatAssessment
  ): EnhancedSecurityResult['moneyMakingOpportunities'] => {
    return {
      apiEndpointIdeas: [
        'POST /api/security/scan - Premium security scanning service ($10-50 per scan)',
        'GET /api/threats/intelligence - Real-time threat feed subscription ($100/month)',
        'POST /api/security/audit - Comprehensive security audit ($500-2000 per audit)',
        'GET /api/security/compliance - Compliance checking service ($200/month)',
        'POST /api/security/monitoring - 24/7 monitoring service ($300/month)',
        'GET /api/security/reports - Custom security reports ($50 per report)'
      ],
      securityServicesRevenue: [
        'White-label security scanning for other platforms ($1000-5000/month licensing)',
        'Enterprise security consulting services ($200-400/hour)',
        'Custom threat intelligence feeds for enterprises ($500-2000/month)',
        'Security training and certification programs ($100-500 per student)',
        'Incident response services ($300-600/hour)',
        'Penetration testing services ($2000-10000 per engagement)'
      ],
      enterpriseFeatures: [
        'Multi-tenant security dashboards ($500/month per tenant)',
        'Custom rule engine for enterprise policies ($1000/month)',
        'Advanced analytics and reporting ($300/month)',
        'Integration with enterprise SIEM systems ($800/month)',
        'Dedicated security support team ($2000/month)',
        'Custom branding and white-labeling ($1500 setup + $300/month)'
      ],
      passiveIncomeStreams: [
        'Affiliate partnerships with security vendors (5-15% commission)',
        'Selling security datasets to researchers ($50-200 per dataset)',
        'Creating security courses and tutorials ($30-200 per course)',
        'Building security plugins for popular platforms ($10-50 per download)',
        'Hosting security webinars and conferences ($500-5000 per event)',
        'Writing security books and guides ($1000-10000 in royalties)'
      ]
    };
  };

  const calculateCombinedScore = (fortressResults: ScanResult, threatResults: ThreatAssessment): number => {
    // Weighted combination of scores
    const fortressWeight = 0.6;
    const threatIntelWeight = 0.4;
    
    const fortressScore = fortressResults.overallScore;
    const threatIntelScore = Math.max(0, 100 - threatResults.riskScore);
    
    return Math.round((fortressScore * fortressWeight) + (threatIntelScore * threatIntelWeight));
  };

  const determineFinalStatus = (
    score: number, 
    threats: any[]
  ): 'PASS' | 'REVIEW' | 'FAIL' | 'INCONCLUSIVE' => {
    const criticalCount = threats.filter(t => t.severity === 'CRITICAL').length;
    const highCount = threats.filter(t => t.severity === 'HIGH').length;
    const lowConfidenceThreats = threats.filter(t => t.confidence < 70).length;

    if (criticalCount > 0) {
      return 'FAIL';
    } else if (highCount > 0) {
      return 'FAIL';
    } else if (lowConfidenceThreats > 2 || score < 60) {
      return 'INCONCLUSIVE';
    } else if (score < 80) {
      return 'REVIEW';
    } else {
      return 'PASS';
    }
  };

  return {
    isScanning,
    scanResult,
    scanProgress,
    performEnhancedScan,
    clearResults: () => setScanResult(null)
  };
}
