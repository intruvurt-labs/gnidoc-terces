import React, { type ReactNode } from "react";
import MatrixBackground from "@/components/background/matrix-background";
import { CopyrightNotice } from "@/components/seo/seo-manager";

interface CyberpunkLayoutProps {
  children: ReactNode;
}

export default function CyberpunkLayout({ children }: CyberpunkLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg text-white relative">
      <MatrixBackground />

      {/* Header */}
      <header className="border-b border-cyber-green/30 bg-dark-panel/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/" className="cyber-border rounded-lg" aria-label="Go to Home">
                <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center">
                  <span className="brand-bevel text-2xl md:text-3xl" aria-label="gnidoC Terces">gnidoC Terces</span>
                </div>
              </a>
              <div className="flex flex-col">
                <span className="text-cyber-cyan font-orbitron text-sm">Multi-AI Orchestration Platform</span>
                <span className="text-xs text-gray-400">by Intruvurt Labs • Doble Duche</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="cyber-border rounded-lg transition-all" data-testid="button-home">
                <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center space-x-2">
                  <i className="fas fa-home text-cyber-cyan"></i>
                  <span className="text-sm text-white">Home</span>
                </div>
              </a>
              <a href="/settings" className="cyber-border rounded-lg transition-all" data-testid="button-settings">
                <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center space-x-2">
                  <i className="fas fa-cog text-cyber-green"></i>
                  <span className="text-sm text-white">Settings</span>
                </div>
              </a>
              <a href="/security" className="cyber-border-red rounded-lg transition-all" data-testid="button-security-scan">
                <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center space-x-2">
                  <i className="fas fa-shield-alt text-cyber-red"></i>
                  <span className="text-sm text-white">Security Scan</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="mt-12">
        <CopyrightNotice />
      </footer>
    </div>
  );
}
