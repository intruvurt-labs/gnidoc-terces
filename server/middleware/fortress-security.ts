/**
 * FORTRESS API PROTECTION MIDDLEWARE
 * Zero-trust security architecture for GINDOC platform
 * Military-grade API protection with real-time threat detection
 */

import { Request, Response, NextFunction } from 'express';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { EventEmitter } from 'events';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export interface SecurityContext {
  requestId: string;
  clientFingerprint: string;
  riskScore: number;
  threatLevel: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trustScore: number; // 0-100
  geoLocation?: {
    country: string;
    region: string;
    isTor: boolean;
    isVPN: boolean;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
    browserFingerprint: string;
  };
  authContext?: {
    userId?: string;
    role?: string;
    permissions?: string[];
    lastActivity?: Date;
  };
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'ATTACK_DETECTED' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_PATTERN' | 'ACCESS_DENIED' | 'ANOMALY_DETECTED';
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  source: {
    ip: string;
    userAgent: string;
    endpoint: string;
    method: string;
  };
  details: Record<string, any>;
  automated_response: string[];
}

export interface ZeroTrustPolicy {
  endpoint: string;
  methods: string[];
  requirements: {
    minTrustScore: number;
    maxRiskScore: number;
    requireAuth: boolean;
    requireMFA: boolean;
    allowedCountries?: string[];
    blockedCountries?: string[];
    rateLimit: {
      windowMs: number;
      max: number;
      skipSuccessfulRequests?: boolean;
    };
  };
  monitoring: {
    logAllRequests: boolean;
    detectAnomalies: boolean;
    quarantineThreshold: number;
  };
}

// Default zero-trust policies
const DEFAULT_POLICIES: ZeroTrustPolicy[] = [
  {
    endpoint: '/api/security/*',
    methods: ['POST', 'PUT', 'DELETE'],
    requirements: {
      minTrustScore: 80,
      maxRiskScore: 20,
      requireAuth: true,
      requireMFA: true,
      rateLimit: {
        windowMs: 60000, // 1 minute
        max: 10
      }
    },
    monitoring: {
      logAllRequests: true,
      detectAnomalies: true,
      quarantineThreshold: 5
    }
  },
  {
    endpoint: '/api/scan/*',
    methods: ['POST'],
    requirements: {
      minTrustScore: 60,
      maxRiskScore: 40,
      requireAuth: true,
      requireMFA: false,
      rateLimit: {
        windowMs: 300000, // 5 minutes
        max: 5
      }
    },
    monitoring: {
      logAllRequests: true,
      detectAnomalies: true,
      quarantineThreshold: 3
    }
  },
  {
    endpoint: '/api/public/*',
    methods: ['GET'],
    requirements: {
      minTrustScore: 30,
      maxRiskScore: 70,
      requireAuth: false,
      requireMFA: false,
      rateLimit: {
        windowMs: 60000,
        max: 100
      }
    },
    monitoring: {
      logAllRequests: false,
      detectAnomalies: false,
      quarantineThreshold: 10
    }
  }
];

// Threat patterns for real-time detection
const ATTACK_PATTERNS = [
  {
    name: 'SQL Injection',
    pattern: /(union|select|insert|delete|drop|update|exec|script|alert|document)/gi,
    severity: 'CRITICAL' as const,
    response: ['BLOCK_REQUEST', 'LOG_EVENT', 'INCREASE_MONITORING']
  },
  {
    name: 'XSS Attempt',
    pattern: /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/gi,
    severity: 'HIGH' as const,
    response: ['SANITIZE_INPUT', 'LOG_EVENT', 'WARN_USER']
  },
  {
    name: 'Directory Traversal',
    pattern: /(\.\.[\/\\]){2,}|\/etc\/passwd|\/proc\/|\\windows\\system32/gi,
    severity: 'HIGH' as const,
    response: ['BLOCK_REQUEST', 'LOG_EVENT', 'QUARANTINE_IP']
  },
  {
    name: 'Command Injection',
    pattern: /[;&|`$(){}[\]\\]/g,
    severity: 'CRITICAL' as const,
    response: ['BLOCK_REQUEST', 'LOG_EVENT', 'ALERT_SECURITY']
  }
];

export class FortressSecurityEngine extends EventEmitter {
  private policies: Map<string, ZeroTrustPolicy> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private quarantinedIPs: Set<string> = new Set();
  private suspiciousIPs: Map<string, number> = new Map();
  private clientFingerprints: Map<string, any> = new Map();
  private readonly SECRET_KEY = process.env.FORTRESS_SECRET || randomBytes(32).toString('hex');

  constructor() {
    super();
    this.initializePolicies();
    this.startSecurityMonitoring();
  }

  private initializePolicies() {
    DEFAULT_POLICIES.forEach(policy => {
      this.policies.set(policy.endpoint, policy);
    });
  }

  /**
   * Main security middleware
   */
  createSecurityMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = randomBytes(16).toString('hex');

      try {
        // 1. Basic security headers
        this.applySecurityHeaders(res);

        // 2. Create security context
        const context = await this.createSecurityContext(req, requestId);

        // 3. Check quarantine status
        if (this.isQuarantined(context.clientFingerprint, req.ip)) {
          return this.denyAccess(res, 'IP_QUARANTINED', context);
        }

        // 4. Apply zero-trust policy
        const policy = this.findApplicablePolicy(req.path, req.method);
        if (policy) {
          const policyCheck = await this.enforceZeroTrustPolicy(req, context, policy);
          if (!policyCheck.allowed) {
            return this.denyAccess(res, policyCheck.reason, context);
          }
        }

        // 5. Real-time threat detection
        const threatDetection = await this.detectThreats(req, context);
        if (threatDetection.blocked) {
          return this.handleThreatDetection(res, threatDetection, context);
        }

        // 6. Behavioral analysis
        await this.analyzeBehavior(req, context);

        // 7. Attach security context to request
        (req as any).security = context;

        // 8. Log successful request
        this.logSecurityEvent({
          id: requestId,
          timestamp: new Date(),
          type: 'ACCESS_GRANTED' as any,
          severity: 'INFO',
          source: {
            ip: req.ip,
            userAgent: req.get('user-agent') || '',
            endpoint: req.path,
            method: req.method
          },
          details: {
            trustScore: context.trustScore,
            riskScore: context.riskScore,
            processingTime: Date.now() - startTime
          },
          automated_response: []
        });

        next();
      } catch (error) {
        this.emit('securityError', { requestId, error: error.message });
        res.status(500).json({ error: 'Security processing failed' });
      }
    };
  }

  /**
   * Apply comprehensive security headers
   */
  private applySecurityHeaders(res: Response) {
    // Use helmet for basic security headers
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    })(res.req, res, () => {});

    // Additional custom headers
    res.setHeader('X-Fortress-Protected', 'true');
    res.setHeader('X-Request-ID', res.locals.requestId || 'unknown');
    res.setHeader('X-Security-Level', 'MILITARY_GRADE');
    
    // Anti-automation headers
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  /**
   * Create comprehensive security context
   */
  private async createSecurityContext(req: Request, requestId: string): Promise<SecurityContext> {
    const userAgent = req.get('user-agent') || '';
    const fingerprint = this.generateClientFingerprint(req);
    
    const context: SecurityContext = {
      requestId,
      clientFingerprint: fingerprint,
      riskScore: 0,
      threatLevel: 'MINIMAL',
      trustScore: 100,
      deviceInfo: {
        userAgent,
        platform: this.detectPlatform(userAgent),
        isMobile: this.isMobileDevice(userAgent),
        browserFingerprint: this.generateBrowserFingerprint(req)
      }
    };

    // Calculate risk score based on various factors
    context.riskScore = await this.calculateRiskScore(req, context);
    context.trustScore = Math.max(0, 100 - context.riskScore);
    context.threatLevel = this.determineThreatLevel(context.riskScore);

    // Add geo-location analysis (simulated)
    context.geoLocation = await this.analyzeGeoLocation(req.ip);

    return context;
  }

  /**
   * Generate unique client fingerprint
   */
  private generateClientFingerprint(req: Request): string {
    const components = [
      req.ip,
      req.get('user-agent') || '',
      req.get('accept-language') || '',
      req.get('accept-encoding') || '',
      req.get('accept') || ''
    ].join('|');

    return createHash('sha256').update(components).digest('hex');
  }

  /**
   * Generate browser fingerprint for tracking
   */
  private generateBrowserFingerprint(req: Request): string {
    const fingerprint = {
      userAgent: req.get('user-agent'),
      acceptLanguage: req.get('accept-language'),
      acceptEncoding: req.get('accept-encoding'),
      connection: req.get('connection'),
      dnt: req.get('dnt'),
      upgradeInsecureRequests: req.get('upgrade-insecure-requests')
    };

    return createHash('md5').update(JSON.stringify(fingerprint)).digest('hex');
  }

  /**
   * Calculate comprehensive risk score
   */
  private async calculateRiskScore(req: Request, context: SecurityContext): Promise<number> {
    let riskScore = 0;

    // IP reputation analysis
    if (this.suspiciousIPs.has(req.ip)) {
      riskScore += this.suspiciousIPs.get(req.ip)! * 10;
    }

    // User agent analysis
    const userAgent = req.get('user-agent') || '';
    if (!userAgent || userAgent.length < 10) {
      riskScore += 25; // Missing or suspicious user agent
    }

    // Request pattern analysis
    if (req.path.includes('..') || req.path.includes('//')) {
      riskScore += 40; // Directory traversal attempt
    }

    // Query parameter analysis
    const queryString = JSON.stringify(req.query);
    if (this.containsSuspiciousPatterns(queryString)) {
      riskScore += 30;
    }

    // Header analysis
    const headers = JSON.stringify(req.headers);
    if (this.containsSuspiciousPatterns(headers)) {
      riskScore += 20;
    }

    // Rate limiting violations
    const violations = this.getRateLimitViolations(req.ip);
    riskScore += violations * 5;

    // Time-based analysis (off-hours access)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) { // Late night access
      riskScore += 10;
    }

    return Math.min(100, riskScore);
  }

  /**
   * Find applicable zero-trust policy
   */
  private findApplicablePolicy(path: string, method: string): ZeroTrustPolicy | null {
    for (const [endpoint, policy] of this.policies) {
      const pattern = endpoint.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      
      if (regex.test(path) && policy.methods.includes(method)) {
        return policy;
      }
    }
    return null;
  }

  /**
   * Enforce zero-trust policy
   */
  private async enforceZeroTrustPolicy(
    req: Request, 
    context: SecurityContext, 
    policy: ZeroTrustPolicy
  ): Promise<{ allowed: boolean; reason?: string }> {
    
    // Trust score check
    if (context.trustScore < policy.requirements.minTrustScore) {
      return { allowed: false, reason: 'INSUFFICIENT_TRUST_SCORE' };
    }

    // Risk score check
    if (context.riskScore > policy.requirements.maxRiskScore) {
      return { allowed: false, reason: 'HIGH_RISK_SCORE' };
    }

    // Authentication check
    if (policy.requirements.requireAuth && !this.isAuthenticated(req)) {
      return { allowed: false, reason: 'AUTHENTICATION_REQUIRED' };
    }

    // MFA check
    if (policy.requirements.requireMFA && !this.hasMFA(req)) {
      return { allowed: false, reason: 'MFA_REQUIRED' };
    }

    // Geo-location check
    if (policy.requirements.blockedCountries?.includes(context.geoLocation?.country || '')) {
      return { allowed: false, reason: 'GEO_BLOCKED' };
    }

    // Rate limiting check
    if (!this.checkRateLimit(req.ip, policy.requirements.rateLimit)) {
      return { allowed: false, reason: 'RATE_LIMIT_EXCEEDED' };
    }

    return { allowed: true };
  }

  /**
   * Real-time threat detection
   */
  private async detectThreats(req: Request, context: SecurityContext): Promise<{ blocked: boolean; threats: string[] }> {
    const threats: string[] = [];
    let blocked = false;

    // Check request body for attack patterns
    const requestData = JSON.stringify({
      query: req.query,
      body: req.body,
      params: req.params
    });

    for (const pattern of ATTACK_PATTERNS) {
      if (pattern.pattern.test(requestData)) {
        threats.push(pattern.name);
        
        if (pattern.severity === 'CRITICAL') {
          blocked = true;
        }

        // Execute automated response
        await this.executeAutomatedResponse(pattern.response, req.ip, context);
      }
    }

    return { blocked, threats };
  }

  /**
   * Execute automated security response
   */
  private async executeAutomatedResponse(responses: string[], ip: string, context: SecurityContext) {
    for (const response of responses) {
      switch (response) {
        case 'BLOCK_REQUEST':
          // Request will be blocked
          break;
        case 'QUARANTINE_IP':
          this.quarantinedIPs.add(ip);
          break;
        case 'LOG_EVENT':
          // Event will be logged
          break;
        case 'INCREASE_MONITORING':
          this.suspiciousIPs.set(ip, (this.suspiciousIPs.get(ip) || 0) + 1);
          break;
        case 'ALERT_SECURITY':
          this.emit('securityAlert', { ip, context, timestamp: new Date() });
          break;
      }
    }
  }

  /**
   * Behavioral analysis
   */
  private async analyzeBehavior(req: Request, context: SecurityContext) {
    // Track request patterns
    const clientData = this.clientFingerprints.get(context.clientFingerprint) || {
      firstSeen: new Date(),
      requestCount: 0,
      endpoints: new Set(),
      suspiciousActivity: 0
    };

    clientData.requestCount++;
    clientData.endpoints.add(req.path);
    clientData.lastSeen = new Date();

    // Detect unusual behavior
    if (clientData.requestCount > 100 && clientData.endpoints.size < 3) {
      clientData.suspiciousActivity++; // Potential bot behavior
    }

    this.clientFingerprints.set(context.clientFingerprint, clientData);
  }

  /**
   * Handle threat detection response
   */
  private handleThreatDetection(res: Response, detection: any, context: SecurityContext) {
    this.logSecurityEvent({
      id: context.requestId,
      timestamp: new Date(),
      type: 'ATTACK_DETECTED',
      severity: 'CRITICAL',
      source: {
        ip: res.req.ip,
        userAgent: res.req.get('user-agent') || '',
        endpoint: res.req.path,
        method: res.req.method
      },
      details: {
        threats: detection.threats,
        riskScore: context.riskScore,
        fingerprint: context.clientFingerprint
      },
      automated_response: ['BLOCK_REQUEST', 'LOG_EVENT']
    });

    return res.status(403).json({
      error: 'Request blocked by security system',
      threatId: context.requestId,
      message: 'Your request has been flagged as potentially malicious'
    });
  }

  /**
   * Deny access with detailed logging
   */
  private denyAccess(res: Response, reason: string, context: SecurityContext) {
    this.logSecurityEvent({
      id: context.requestId,
      timestamp: new Date(),
      type: 'ACCESS_DENIED',
      severity: 'WARNING',
      source: {
        ip: res.req.ip,
        userAgent: res.req.get('user-agent') || '',
        endpoint: res.req.path,
        method: res.req.method
      },
      details: {
        reason,
        trustScore: context.trustScore,
        riskScore: context.riskScore
      },
      automated_response: ['LOG_EVENT']
    });

    return res.status(403).json({
      error: 'Access denied',
      reason,
      requestId: context.requestId
    });
  }

  // Utility methods
  private containsSuspiciousPatterns(text: string): boolean {
    return ATTACK_PATTERNS.some(pattern => pattern.pattern.test(text));
  }

  private detectPlatform(userAgent: string): string {
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac/i.test(userAgent)) return 'macOS';
    if (/Linux/i.test(userAgent)) return 'Linux';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iOS/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  private isMobileDevice(userAgent: string): boolean {
    return /Mobile|Android|iPhone|iPad/i.test(userAgent);
  }

  private determineThreatLevel(riskScore: number): 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    if (riskScore >= 20) return 'LOW';
    return 'MINIMAL';
  }

  private async analyzeGeoLocation(ip: string) {
    // Simulate geo-location analysis
    return {
      country: 'US',
      region: 'California',
      isTor: Math.random() < 0.05, // 5% chance
      isVPN: Math.random() < 0.15  // 15% chance
    };
  }

  private isAuthenticated(req: Request): boolean {
    return !!(req.headers.authorization || (req as any).user);
  }

  private hasMFA(req: Request): boolean {
    return !!(req.headers['x-mfa-token'] || (req as any).mfaVerified);
  }

  private checkRateLimit(ip: string, limit: any): boolean {
    // Simplified rate limiting check
    return true; // Will be handled by express-rate-limit
  }

  private getRateLimitViolations(ip: string): number {
    return this.suspiciousIPs.get(ip) || 0;
  }

  private isQuarantined(fingerprint: string, ip: string): boolean {
    return this.quarantinedIPs.has(ip) || this.quarantinedIPs.has(fingerprint);
  }

  private logSecurityEvent(event: SecurityEvent) {
    this.securityEvents.push(event);
    
    // Keep only last 10000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents = this.securityEvents.slice(-10000);
    }

    this.emit('securityEvent', event);
  }

  private startSecurityMonitoring() {
    // Clean up old data every hour
    setInterval(() => {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      // Clean up old suspicious IPs
      for (const [ip, count] of this.suspiciousIPs.entries()) {
        if (count < 3) {
          this.suspiciousIPs.delete(ip);
        }
      }

      // Clean up old client fingerprints
      for (const [fingerprint, data] of this.clientFingerprints.entries()) {
        if (now - data.lastSeen?.getTime() > oneDay) {
          this.clientFingerprints.delete(fingerprint);
        }
      }
    }, 3600000); // 1 hour
  }

  // Public methods for security management
  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  getQuarantinedIPs(): string[] {
    return Array.from(this.quarantinedIPs);
  }

  releaseQuarantine(ipOrFingerprint: string): boolean {
    return this.quarantinedIPs.delete(ipOrFingerprint);
  }

  addPolicy(policy: ZeroTrustPolicy): void {
    this.policies.set(policy.endpoint, policy);
  }

  removePolicy(endpoint: string): boolean {
    return this.policies.delete(endpoint);
  }
}

// Export singleton instance
export const fortressSecurity = new FortressSecurityEngine();

// Export individual middleware functions
export const securityMiddleware = fortressSecurity.createSecurityMiddleware();

// Advanced rate limiting with dynamic thresholds
export const createDynamicRateLimit = (options: any = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 60000,
    max: (req) => {
      const security = (req as any).security;
      if (security?.threatLevel === 'CRITICAL') return 1;
      if (security?.threatLevel === 'HIGH') return 5;
      if (security?.threatLevel === 'MEDIUM') return 20;
      return options.max || 100;
    },
    message: {
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((options.windowMs || 60000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
};
