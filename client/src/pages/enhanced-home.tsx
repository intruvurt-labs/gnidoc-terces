import React, { useState, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { SEOManager, CopyrightNotice, generateSEOMetadata } from '@/components/seo/seo-manager';
import { SecurityDashboard } from '@/components/security/security-dashboard';
import EnhancedFileManager from '@/components/enhanced-file-manager';
import { TriAnalysisResults } from '@/components/tri-analysis-results';
import { useTriAnalysis } from '@/hooks/use-tri-analysis';
import { useSecurityScan } from '@/hooks/use-security-scan';
import { useEnhancedSecurityScan } from '@/hooks/use-enhanced-security-scan';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Activity, 
  BarChart3, 
  FileText, 
  Settings,
  Zap,
  Target,
  Globe,
  Lock,
  Eye,
  Cpu,
  Database,
  Cloud,
  Rocket
} from 'lucide-react';

export function EnhancedHome() {
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: 99.9,
    activeScans: 12,
    threatsBlocked: 847,
    apiCalls: 15420,
    dataProcessed: '2.4TB'
  });

  const { 
    isAnalyzing, 
    analysisResult, 
    performTriAnalysis, 
    clearResults: clearAnalysisResults 
  } = useTriAnalysis();

  const { 
    isScanning: isBasicScanning, 
    scanResult: basicScanResult, 
    performScan: performBasicScan 
  } = useSecurityScan();

  const {
    isScanning: isEnhancedScanning,
    scanResult: enhancedScanResult,
    performEnhancedScan
  } = useEnhancedSecurityScan();

  // Real-time metrics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        activeScans: Math.max(5, prev.activeScans + Math.floor(Math.random() * 3) - 1),
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 2),
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 50),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleFilesChange = (files: any[]) => {
    setUploadedFiles(files);
  };

  const handleRunAnalysis = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload some files first');
      return;
    }

    try {
      await performTriAnalysis(uploadedFiles);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleSecurityScan = async () => {
    const allCode = uploadedFiles
      .filter(f => f.category === 'code' && f.content)
      .map(f => f.content)
      .join('\n\n');

    if (!allCode) {
      alert('Please upload some code files first');
      return;
    }

    try {
      await performEnhancedScan(allCode, '/tmp/scan', { scanMode: 'MILITARY_GRADE' });
    } catch (error) {
      console.error('Security scan failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-500';
      case 'REVIEW': return 'text-yellow-500';
      case 'FAIL': return 'text-red-500';
      case 'INCONCLUSIVE': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const seoMetadata = generateSEOMetadata('home', {
    analysisResult,
    enhancedScanResult,
    systemMetrics
  });

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-dark-bg text-white">
        <SEOManager {...seoMetadata} />
        
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyber-green/10 via-transparent to-cyber-cyan/10"></div>
          <div className="container mx-auto px-6 py-12 relative">
            <div className="text-center space-y-6">
              <div className="flex justify-center space-x-4 mb-4">
                <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/50">
                  <Shield className="w-3 h-3 mr-1" />
                  Enterprise Security
                </Badge>
                <Badge className="bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50">
                  <Cpu className="w-3 h-3 mr-1" />
                  Multi-AI Orchestration
                </Badge>
                <Badge className="bg-cyber-purple/20 text-cyber-purple border-cyber-purple/50">
                  <Lock className="w-3 h-3 mr-1" />
                  Military Grade
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-orbitron font-bold animated-rainbow-text">
                GINDOC PLATFORM
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Revolutionary Enterprise Multi-AI Orchestration Platform with Military-Grade Security
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-green">{systemMetrics.uptime}%</div>
                  <div className="text-xs text-gray-400">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-cyan">{systemMetrics.activeScans}</div>
                  <div className="text-xs text-gray-400">Active Scans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-yellow">{systemMetrics.threatsBlocked}</div>
                  <div className="text-xs text-gray-400">Threats Blocked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyber-purple">{systemMetrics.apiCalls.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">API Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{systemMetrics.dataProcessed}</div>
                  <div className="text-xs text-gray-400">Data Processed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-dark-panel border border-cyber-green/30 grid grid-cols-2 lg:grid-cols-5 w-full">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-cyber-green/20 data-[state=active]:text-cyber-green"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="files"
                className="data-[state=active]:bg-cyber-cyan/20 data-[state=active]:text-cyber-cyan"
              >
                <FileText className="w-4 h-4 mr-2" />
                File Manager
              </TabsTrigger>
              <TabsTrigger 
                value="analysis"
                className="data-[state=active]:bg-cyber-purple/20 data-[state=active]:text-cyber-purple"
              >
                <Target className="w-4 h-4 mr-2" />
                Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-cyber-red/20 data-[state=active]:text-cyber-red"
              >
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="monitoring"
                className="data-[state=active]:bg-cyber-yellow/20 data-[state=active]:text-cyber-yellow"
              >
                <Activity className="w-4 h-4 mr-2" />
                Monitoring
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* System Status */}
                <Card className="bg-dark-panel border-cyber-green/30">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyber-green">
                      <Activity className="w-5 h-5 mr-2" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform Status</span>
                        <Badge className="bg-green-500/20 text-green-400">Operational</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Security Level</span>
                        <Badge className="bg-cyber-red/20 text-cyber-red">MILITARY GRADE</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">AI Models</span>
                        <Badge className="bg-cyber-cyan/20 text-cyber-cyan">3 Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Database</span>
                        <Badge className="bg-cyber-purple/20 text-cyber-purple">Connected</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-dark-panel border-cyber-cyan/30">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyber-cyan">
                      <Zap className="w-5 h-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={handleRunAnalysis}
                      disabled={uploadedFiles.length === 0 || isAnalyzing}
                      className="w-full glass-button"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      {isAnalyzing ? 'Analyzing...' : 'Run Tri-Analysis'}
                    </Button>
                    <Button
                      onClick={handleSecurityScan}
                      disabled={uploadedFiles.filter(f => f.category === 'code').length === 0 || isEnhancedScanning}
                      className="w-full glass-button"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {isEnhancedScanning ? 'Scanning...' : 'Security Scan'}
                    </Button>
                    <Button
                      onClick={() => setActiveTab('files')}
                      className="w-full glass-button"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Files
                    </Button>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-dark-panel border-cyber-purple/30">
                  <CardHeader>
                    <CardTitle className="flex items-center text-cyber-purple">
                      <Eye className="w-5 h-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Files Uploaded</span>
                        <span className="text-cyber-green">{uploadedFiles.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Last Analysis</span>
                        <span className="text-gray-300">
                          {analysisResult ? 'Completed' : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Security Scans</span>
                        <span className="text-gray-300">
                          {enhancedScanResult ? '1 Complete' : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Export Ready</span>
                        <span className="text-cyber-cyan">
                          {(analysisResult || enhancedScanResult) ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Summary */}
              {(analysisResult || enhancedScanResult) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analysisResult && (
                    <Card className="bg-dark-panel border-cyber-cyan/30">
                      <CardHeader>
                        <CardTitle className="text-cyber-cyan">Analysis Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Overall Score</span>
                            <span className="text-cyber-green font-bold">
                              {analysisResult.recommendations.overallScore}/10
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Files Analyzed</span>
                            <span>{analysisResult.fileCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Code Quality</span>
                            <span className="text-cyber-purple">
                              {analysisResult.codeAnalysis.qualityScore}/10
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {enhancedScanResult && (
                    <Card className="bg-dark-panel border-cyber-red/30">
                      <CardHeader>
                        <CardTitle className="text-cyber-red">Security Scan Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Security Status</span>
                            <Badge className={getStatusColor(enhancedScanResult.finalStatus)}>
                              {enhancedScanResult.finalStatus}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Overall Score</span>
                            <span className="text-cyber-green font-bold">
                              {enhancedScanResult.finalScore}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Threats Found</span>
                            <span className="text-cyber-red">
                              {enhancedScanResult.combinedThreats.length}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="files">
              <EnhancedFileManager 
                onFilesChange={handleFilesChange}
                analysisData={analysisResult}
                enableExport={true}
              />
            </TabsContent>

            <TabsContent value="analysis">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-orbitron font-bold text-cyber-purple">
                    Tri-Analysis Engine
                  </h2>
                  <Button
                    onClick={handleRunAnalysis}
                    disabled={uploadedFiles.length === 0 || isAnalyzing}
                    className="glass-button"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                </div>

                {analysisResult ? (
                  <TriAnalysisResults result={analysisResult} />
                ) : (
                  <Card className="bg-dark-panel border-cyber-purple/30">
                    <CardContent className="text-center py-12">
                      <Target className="w-16 h-16 text-cyber-purple mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-orbitron text-cyber-purple mb-2">
                        No Analysis Results
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Upload some files and run the tri-analysis to see comprehensive insights.
                      </p>
                      <Button
                        onClick={() => setActiveTab('files')}
                        className="glass-button"
                      >
                        Upload Files
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-orbitron font-bold text-cyber-red">
                    Fortress Elite Security
                  </h2>
                  <Button
                    onClick={handleSecurityScan}
                    disabled={uploadedFiles.filter(f => f.category === 'code').length === 0 || isEnhancedScanning}
                    className="glass-button"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {isEnhancedScanning ? 'Scanning...' : 'Military Scan'}
                  </Button>
                </div>

                {enhancedScanResult ? (
                  <div className="space-y-6">
                    <Alert className="bg-cyber-green/10 border-cyber-green/30">
                      <Shield className="h-4 w-4 text-cyber-green" />
                      <AlertDescription className="text-cyber-green">
                        Enhanced security scan completed with {enhancedScanResult.finalStatus} status.
                        Overall security score: {enhancedScanResult.finalScore}%
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="bg-dark-panel border-cyber-green/30">
                        <CardHeader>
                          <CardTitle className="text-cyber-green">Fortress Scanner</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Status</span>
                              <Badge className={getStatusColor(enhancedScanResult.fortressResults.status)}>
                                {enhancedScanResult.fortressResults.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Score</span>
                              <span className="font-bold">{enhancedScanResult.fortressResults.overallScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Threats</span>
                              <span className="text-cyber-red">{enhancedScanResult.fortressResults.threatsFound.length}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-dark-panel border-cyber-cyan/30">
                        <CardHeader>
                          <CardTitle className="text-cyber-cyan">Threat Intelligence</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Risk Score</span>
                              <span className="font-bold">{enhancedScanResult.threatIntelResults.riskScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Intel Threats</span>
                              <span className="text-cyber-red">{enhancedScanResult.threatIntelResults.threats.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Recommendations</span>
                              <span>{enhancedScanResult.threatIntelResults.recommendations.length}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-dark-panel border-cyber-purple/30">
                        <CardHeader>
                          <CardTitle className="text-cyber-purple">Business Impact</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Financial Risk</span>
                              <span className="text-cyber-red">{enhancedScanResult.businessImpact.financialRisk}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Operational Risk</span>
                              <span className="text-cyber-yellow">{enhancedScanResult.businessImpact.operationalRisk}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Compliance Risk</span>
                              <span className="text-cyber-purple">{enhancedScanResult.businessImpact.complianceRisk}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card className="bg-dark-panel border-cyber-red/30">
                    <CardContent className="text-center py-12">
                      <Shield className="w-16 h-16 text-cyber-red mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-orbitron text-cyber-red mb-2">
                        No Security Scan Results
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Upload code files and run a security scan to see detailed threat analysis.
                      </p>
                      <Button
                        onClick={() => setActiveTab('files')}
                        className="glass-button"
                      >
                        Upload Code Files
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monitoring">
              <SecurityDashboard />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <CopyrightNotice />
      </div>
    </HelmetProvider>
  );
}

export default EnhancedHome;
