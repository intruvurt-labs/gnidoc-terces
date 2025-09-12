import React from "react";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-orbitron font-bold text-cyber-yellow mb-4 text-center">Sign up / Log in</h1>
      <p className="text-sm text-gray-400 mb-6 text-center">Choose a provider to continue</p>
      <div className="grid grid-cols-2 gap-3">
        <a href="/auth/google" className="cyber-border rounded-lg">
          <div className="bg-dark-panel p-3 rounded-lg text-center w-full">
            <i className="fab fa-google text-cyber-yellow text-xl"></i>
            <div className="text-xs text-gray-300 mt-1">Google</div>
          </div>
        </a>
        <a href="/auth/github" className="cyber-border rounded-lg">
          <div className="bg-dark-panel p-3 rounded-lg text-center w-full">
            <i className="fab fa-github text-cyber-yellow text-xl"></i>
            <div className="text-xs text-gray-300 mt-1">GitHub</div>
          </div>
        </a>
      </div>
      <div className="text-[10px] text-gray-500 mt-3 text-center">OAuth requires configuration.</div>
    </div>
  );
}
