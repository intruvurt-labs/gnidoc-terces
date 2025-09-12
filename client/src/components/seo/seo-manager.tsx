import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOManagerProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  siteName?: string;
  locale?: string;
  noIndex?: boolean;
}

export function SEOManager({
  title = "GINDOC - Enterprise Multi-AI Orchestration Platform",
  description = "Revolutionary enterprise-grade platform for multi-AI orchestration, security scanning, and automated code generation. Military-grade security with advanced threat detection.",
  keywords = [
    "AI orchestration",
    "multi-AI platform",
    "enterprise security",
    "code generation",
    "threat detection",
    "automated scanning",
    "cybersecurity",
    "GINDOC",
    "Intruvurt Labs",
    "military-grade security",
    "AI automation",
    "intelligent analysis"
  ],
  image = "https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Fd05a8822b9d0435bb27e389c3fe04d2a?format=webp&width=800",
  url = "https://intruvurt.space",
  type = "website",
  author = "Intruvurt Labs • Doble Duche",
  siteName = "GINDOC Platform",
  locale = "en_US",
  noIndex = false
}: SEOManagerProps) {
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GINDOC Platform",
    "applicationCategory": "DeveloperApplication",
    "description": description,
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "Intruvurt Labs",
      "url": "https://intruvurt.com"
    },
    "provider": {
      "@type": "Organization",
      "name": "Intruvurt Labs • Doble Duche",
      "url": "https://intruvurt.com"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "127"
    },
    "features": [
      "Multi-AI Orchestration",
      "Enterprise Security Scanning", 
      "Automated Code Generation",
      "Real-time Threat Detection",
      "Military-grade Protection",
      "Advanced Analytics",
      "Multi-format Export",
      "Comprehensive Documentation"
    ]
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow"} />
      <meta name="language" content={locale.split('_')[0]} />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@IntruvurtLabs" />
      <meta name="twitter:site" content="@GINDOCPlatform" />
      
      {/* LinkedIn */}
      <meta property="linkedin:owner" content="intruvurt-labs" />
      
      {/* Technical Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="msapplication-TileColor" content="#00ff41" />
      <meta name="theme-color" content="#000000" />
      
      {/* Security Headers */}
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:;" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      
      {/* Progressive Web App */}
      <meta name="application-name" content="GINDOC" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="GINDOC" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/png" href="https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Fd05a8822b9d0435bb27e389c3fe04d2a?format=webp&width=256" />
      <link rel="icon" type="image/png" sizes="32x32" href="https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Fd05a8822b9d0435bb27e389c3fe04d2a?format=webp&width=32" />
      <link rel="icon" type="image/png" sizes="16x16" href="https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Fd05a8822b9d0435bb27e389c3fe04d2a?format=webp&width=16" />
      <link rel="apple-touch-icon" sizes="180x180" href="https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Fd05a8822b9d0435bb27e389c3fe04d2a?format=webp&width=180" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* RSS Feed */}
      <link rel="alternate" type="application/rss+xml" title="GINDOC Updates" href="/feed.xml" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.intruvurt.space" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//api.intruvurt.space" />
      <link rel="dns-prefetch" href="//cdn.intruvurt.space" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Additional Business Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Intruvurt Labs",
          "alternateName": "GINDOC Platform",
          "url": "https://intruvurt.space",
          "logo": "https://cdn.builder.io/api/v1/image/assets%2F29ccaf1d7d264cd2bd339333fe296f0c%2Fd05a8822b9d0435bb27e389c3fe04d2a?format=webp&width=800",
          "description": "Enterprise-grade multi-AI orchestration platform with military-level security",
          "foundingDate": "2024",
          "founders": [
            {
              "@type": "Person",
              "name": "Doble Duche"
            }
          ],
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "US"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-555-GINDOC",
            "contactType": "technical support",
            "email": "support@gindoc.com"
          },
          "sameAs": [
            "https://twitter.com/GINDOCPlatform",
            "https://linkedin.com/company/intruvurt-labs",
            "https://github.com/intruvurt-labs"
          ]
        })}
      </script>
      
      {/* Performance Hints */}
      <link rel="preload" href="/fonts/orbitron.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/css/critical.css" as="style" />
      
      {/* Copyright and Legal */}
      <meta name="copyright" content="© 2025 Intruvurt Labs • Doble Duche. All rights reserved." />
      <meta name="license" content="Enterprise License" />
      <meta name="terms-of-service" content="https://gindoc.com/terms" />
      <meta name="privacy-policy" content="https://gindoc.com/privacy" />
    </Helmet>
  );
}

// SEO utility functions
export const generateSEOMetadata = (pageType: string, data?: any) => {
  const baseUrl = "https://intruvurt.space";
  
  const seoConfigs = {
    home: {
      title: "GINDOC - Enterprise Multi-AI Orchestration Platform",
      description: "Revolutionary enterprise-grade platform for multi-AI orchestration, security scanning, and automated code generation. Military-grade security with advanced threat detection.",
      url: baseUrl,
      keywords: ["AI orchestration", "enterprise security", "code generation", "threat detection"]
    },
    security: {
      title: "Advanced Security Scanning - GINDOC Platform",
      description: "Military-grade security scanning with real-time threat detection, vulnerability assessment, and automated protection. Enterprise cybersecurity solutions.",
      url: `${baseUrl}/security`,
      keywords: ["security scanning", "threat detection", "vulnerability assessment", "cybersecurity"]
    },
    analysis: {
      title: "AI-Powered Code Analysis - GINDOC Platform", 
      description: "Comprehensive code analysis with multi-AI insights, quality assessment, and automated optimization recommendations. Enterprise development tools.",
      url: `${baseUrl}/analysis`,
      keywords: ["code analysis", "AI insights", "quality assessment", "development tools"]
    },
    documentation: {
      title: "Documentation & API Reference - GINDOC Platform",
      description: "Complete documentation, API reference, and integration guides for GINDOC enterprise platform. Developer resources and tutorials.",
      url: `${baseUrl}/docs`,
      keywords: ["documentation", "API reference", "developer guides", "integration"]
    }
  };

  return seoConfigs[pageType] || seoConfigs.home;
};

// Copyright and licensing component
export function CopyrightNotice() {
  return (
    <div className="text-center text-sm text-gray-500 mt-8 p-4 border-t border-gray-200">
      <div className="space-y-2">
        <p>
          <strong>© 2025 Intruvurt Labs • Doble Duche.</strong> All rights reserved.
        </p>
        <p>
          GINDOC™ is a trademark of Intruvurt Labs. Enterprise License.
        </p>
        <p>
          <span className="inline-flex items-center space-x-4">
            <a href="/terms" className="hover:text-cyber-green transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-cyber-green transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="/security" className="hover:text-cyber-green transition-colors">Security</a>
            <span>•</span>
            <a href="/contact" className="hover:text-cyber-green transition-colors">Contact</a>
          </span>
        </p>
        <p className="text-xs text-gray-400">
          Enterprise-grade Multi-AI Orchestration Platform • Military-level Security Architecture
        </p>
      </div>
    </div>
  );
}

// Documentation metadata
export const DOCUMENTATION_METADATA = {
  version: "1.0.0",
  lastUpdated: "2024-01-15",
  maintainers: ["Intruvurt Labs", "Doble Duche"],
  license: "Enterprise License",
  support: {
    email: "support@gindoc.com",
    documentation: "https://docs.gindoc.com",
    community: "https://community.gindoc.com",
    github: "https://github.com/intruvurt-labs/gindoc"
  },
  compliance: {
    gdpr: true,
    ccpa: true,
    soc2: true,
    iso27001: true,
    nist: true
  }
};
