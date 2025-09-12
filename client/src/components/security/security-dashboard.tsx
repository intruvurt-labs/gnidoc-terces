'use client';

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  TrendingUp, 
  Activity,
  Zap,
  Lock,
  Skull,
  Target,
  Globe,
  Clock,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface SecurityMetrics {
  overallScore: number;
  status: 'PASS' | 'REVIEW' | 'FAIL' | 'INCONCLUSIVE';
  riskLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatsBlocked: number;
  activeThreats: number;
  scansCompleted: number;
  quarantinedIPs: number;
  uptime: number;
}

interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: 'VULNERABILITY' | 'MALWARE' | 'ATTACK' | 'ANOMALY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  source: string;
  status: 'ACTIVE' | 'MITIGATED' | 'INVESTIGATING';
  automaticResponse?: string[];
}

interface RealTimeStats {
  requestsPerSecond: number;
  blockedRequests: number;
  suspiciousActivity: number;
  geoDistribution: Record<string, number>;
  threatTrends: Array<{
    timestamp: Date;
    count: number;
    type: string;
  }>;
}

export function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    overallScore: 87,
    status: 'PASS',
    riskLevel: 'LOW',
    threatsBlocked: 143,
    activeThreats: 2,
    scansCompleted: 89,
    quarantinedIPs: 5,
    uptime: 99.8
  });

  const [threats, setThreats] = useState<ThreatEvent[]>([
    {
      id: 'threat_001',
      timestamp: new Date(Date.now() - 300000),
      type: 'ATTACK',
      severity: 'HIGH',
      title: 'SQL Injection Attempt',
      description: 'Multiple SQL injection patterns detected from IP 192.168.1.100',
      source: 'Real-time Monitor',
      status: 'MITIGATED',
      automaticResponse: ['BLOCK_IP', 'LOG_EVENT', 'ALERT_ADMIN']
    },
    {
      id: 'threat_002',
      timestamp: new Date(Date.now() - 120000),
      type: 'VULNERABILITY',
      severity: 'CRITICAL',
      title: 'Hardcoded Private Key',
      description: 'Private key detected in uploaded smart contract code',
      source: 'Fortress Scanner',
      status: 'ACTIVE'
    },
    {
      id: 'threat_003',
      timestamp: new Date(Date.now() - 60000),
      type: 'ANOMALY',
      severity: 'MEDIUM',
      title: 'Unusual Request Pattern',
      description: 'Abnormal request frequency from new client',
      source: 'Behavioral Analysis',
      status: 'INVESTIGATING'
    }
  ]);

  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats>({
    requestsPerSecond: 12.4,
    blockedRequests: 7,
    suspiciousActivity: 3,
    geoDistribution: {
      'US': 45,
      'EU': 30,
      'ASIA': 20,
      'OTHER': 5
    },
    threatTrends: []
  });

  const allowedTabs = ['overview', 'threats', 'scans', 'analysis'] as const;
  const initialTab = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab') || 'overview';
      return allowedTabs.includes(t as any) ? t : 'overview';
    } catch {
      return 'overview';
    }
  })();
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);

  const [location] = useLocation();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t && t !== selectedTab && allowedTabs.includes(t as any)) {
        setSelectedTab(t);
      }
    } catch {
      // ignore
    }
  }, [location]);

  const handleTabChange = (val: string) => {
    setSelectedTab(val);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', val);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics randomly
      setMetrics(prev => ({
        ...prev,
        overallScore: Math.max(70, prev.overallScore + (Math.random() - 0.5) * 2),
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3)
      }));

      // Update real-time stats
      setRealTimeStats(prev => ({
        ...prev,
        requestsPerSecond: 8 + Math.random() * 10,
        blockedRequests: prev.blockedRequests + Math.floor(Math.random() * 2),
        suspiciousActivity: Math.max(0, prev.suspiciousActivity + Math.floor(Math.random() * 3) - 1)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-500';
      case 'REVIEW': return 'text-yellow-500';
      case 'FAIL': return 'text-red-500';
      case 'INCONCLUSIVE': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'REVIEW': return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'FAIL': return <XCircle className="w-6 h-6 text-red-500" />;
      case 'INCONCLUSIVE': return <HelpCircle className="w-6 h-6 text-orange-500" />;
      default: return <Shield className="w-6 h-6 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      'CRITICAL': 'bg-red-500 text-white',
      'HIGH': 'bg-orange-500 text-white',
      'MEDIUM': 'bg-yellow-500 text-black',
      'LOW': 'bg-blue-500 text-white'
    };
    return <Badge className={colors[severity] || 'bg-gray-500 text-white'}>{severity}</Badge>;
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-cyan-400" />
          <h1 className="text-4xl md:text-6xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            gnidoC Security
          </h1>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
            MILITARY GRADE
          </Badge>
        </div>
        <p className="text-gray-400">Real-time threat monitoring and protection system</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-900/50 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">System Status</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(metrics.status)}
                  <span className={`text-xl font-bold ${getStatusColor(metrics.status)}`}>
                    {metrics.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">{metrics.overallScore.toFixed(2)}%</p>
                <p className="text-xs text-gray-400">Security Score</p>
              </div>
            </div>
            <Progress 
              value={metrics.overallScore} 
              className="mt-3 h-2"
              
            />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Risk Level</p>
                <p className="text-xl font-bold text-orange-400">{metrics.riskLevel}</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-400">
              {metrics.activeThreats} active threats
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Skull className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Threats Blocked</p>
                <p className="text-xl font-bold text-red-400">{metrics.threatsBlocked}</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-400">
              +{realTimeStats.blockedRequests} in last hour
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">System Uptime</p>
                <p className="text-xl font-bold text-green-400">{metrics.uptime.toFixed(2)}%</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-400">
              {realTimeStats.requestsPerSecond.toFixed(1)} req/sec
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-cyan-500/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="threats" className="data-[state=active]:bg-red-500/20">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Threat Feed
          </TabsTrigger>
          <TabsTrigger value="scans" className="data-[state=active]:bg-blue-500/20">
            <Eye className="w-4 h-4 mr-2" />
            Scan Results
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-purple-500/20">
            <Target className="w-4 h-4 mr-2" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Monitoring */}
            <Card className="bg-gray-900/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Activity className="w-5 h-5" />
                  Real-time Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Requests/sec</span>
                    <span className="text-green-400 font-mono">
                      {realTimeStats.requestsPerSecond.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Blocked requests</span>
                    <span className="text-red-400 font-mono">{realTimeStats.blockedRequests}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Suspicious activity</span>
                    <span className="text-orange-400 font-mono">{realTimeStats.suspiciousActivity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Quarantined IPs</span>
                    <span className="text-purple-400 font-mono">{metrics.quarantinedIPs}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card className="bg-gray-900/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Globe className="w-5 h-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(realTimeStats.geoDistribution).map(([region, percentage]) => (
                    <div key={region} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{region}</span>
                        <span className="text-green-400">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card className="bg-gray-900/50 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Zap className="w-5 h-5" />
                System Health & Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{metrics.scansCompleted}</div>
                  <div className="text-sm text-gray-400">Scans Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{metrics.uptime.toFixed(2)}%</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">2.3ms</div>
                  <div className="text-sm text-gray-400">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">847</div>
                  <div className="text-sm text-gray-400">Rules Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-red-400">Live Threat Feed</h2>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
              {threats.filter(t => t.status === 'ACTIVE').length} Active
            </Badge>
          </div>
          
          <div className="space-y-4">
            {threats.map((threat) => (
              <Card key={threat.id} className="bg-gray-900/50 border-red-500/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{threat.title}</h3>
                        <p className="text-sm text-gray-400">{threat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(threat.severity)}
                      <Badge 
                        className={
                          threat.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' :
                          threat.status === 'MITIGATED' ? 'bg-green-500/20 text-green-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }
                      >
                        {threat.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {threat.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {threat.source}
                    </span>
                  </div>

                  {threat.automaticResponse && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-400 mb-2">Automatic Response:</p>
                      <div className="flex flex-wrap gap-2">
                        {threat.automaticResponse.map((action, index) => (
                          <Badge key={index} className="bg-blue-500/20 text-blue-400 text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-900/50 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-green-400">PASS Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">67</div>
                  <p className="text-gray-400">Clean scans</p>
                  <Progress value={75} className="mt-3 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-orange-400">INCONCLUSIVE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-400 mb-2">12</div>
                  <p className="text-gray-400">Require review</p>
                  <Progress value={15} className="mt-3 h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400">FAIL Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-400 mb-2">8</div>
                  <p className="text-gray-400">Critical issues</p>
                  <Progress value={10} className="mt-3 h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <HelpCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-400">
              <strong>INCONCLUSIVE Results:</strong> These scans require manual review due to complex patterns 
              or ambiguous threat indicators. Security team attention recommended.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400">Threat Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Malware detected</span>
                    <span className="text-red-400 font-mono">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vulnerabilities found</span>
                    <span className="text-orange-400 font-mono">15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Suspicious patterns</span>
                    <span className="text-yellow-400 font-mono">7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Zero-day indicators</span>
                    <span className="text-purple-400 font-mono">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Protection Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Detection accuracy</span>
                    <span className="text-green-400 font-mono">98.7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">False positive rate</span>
                    <span className="text-blue-400 font-mono">1.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response time</span>
                    <span className="text-cyan-400 font-mono">&lt;50ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coverage</span>
                    <span className="text-green-400 font-mono">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
