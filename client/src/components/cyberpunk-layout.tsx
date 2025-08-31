import { ReactNode } from "react";
import gindocLogo from "@assets/gindoc_1755279048391.png";

interface CyberpunkLayoutProps {
  children: ReactNode;
}

export default function CyberpunkLayout({ children }: CyberpunkLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg text-white relative">
      {/* Scan Line Animation */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-cyber-green opacity-50 z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="border-b border-cyber-green/30 bg-dark-panel/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="cyber-border rounded-lg">
                <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center space-x-3">
                  <img src={gindocLogo} alt="GINDOC" className="w-8 h-8 rounded" />
                  <h1 className="text-2xl font-orbitron font-bold" data-testid="logo-title">GINDOC</h1>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-cyber-cyan font-orbitron text-sm">Multi-AI Orchestration Platform</span>
                <span className="text-xs text-gray-400">by Intruvurt Labs • Doble Duche</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="cyber-border rounded-lg transition-all" data-testid="button-settings">
                <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center space-x-2">
                  <i className="fas fa-cog text-cyber-green"></i>
                  <span className="text-sm text-white">Settings</span>
                </div>
              </button>
              <button className="cyber-border-red rounded-lg transition-all" data-testid="button-security-scan">
                <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center space-x-2">
                  <i className="fas fa-shield-alt text-cyber-red"></i>
                  <span className="text-sm text-white">Security Scan</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
