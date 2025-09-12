import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LoadingModal from "@/components/ui/loading-modal";
import CodeEditor from "@/components/ui/code-editor";
import FileCard from "@/components/ui/file-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useConnectionHealth } from "@/hooks/use-connection-health";
import { useSecurityScan } from "@/hooks/use-security-scan";
import { useTriAnalysis } from "@/hooks/use-tri-analysis";
import { useAIStatus } from "@/hooks/use-ai-status";
import { useDownloadHistory } from "@/hooks/use-download-history";
import { type UploadedFile } from "@/hooks/use-file-upload";
import FileManager from "@/components/file-manager";
import TriAnalysisResults from "@/components/tri-analysis-results";
import { useToast } from "@/hooks/use-toast";

import { type Project, type GeneratedFile } from "@shared/schema";

export default function Home() {
  const [prompt, setPrompt] = useState(
    "Create a modern React TypeScript todo application with dark theme and local storage persistence"
  );
  const [activeAI, setActiveAI] = useState<"gemini" | "runway" | "imagen">("gemini");
  const [outputMode, setOutputMode] = useState<"code" | "preview" | "files">("code");
  const [showAbout, setShowAbout] = useState(false);
  const { toast } = useToast();

  const {
    isGenerating,
    progress,
    status,
    generateCode,
    generateImage,
    generateVideo,
    performSecurityScan,
    result,
  } = useAIGeneration();

  const { data: aiStatus } = useAIStatus();

  const { isHealthy, isOnline, healthError } = useConnectionHealth();
  const {
    isScanning: isSecurityScanning,
    scanResult,
    realtimeStats,
    performScan,
  } = useSecurityScan();
  const {
    isAnalyzing,
    analysisResult,
    progress: analysisProgress,
    currentStep,
    performTriAnalysis,
    clearResults,
  } = useTriAnalysis();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Fetch recent projects
  const {
    data: projects = [],
    error: projectsError,
    isLoading: projectsLoading,
  } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    refetchInterval: 5000, // Refetch every 5 seconds
    retry: 3,
    retryDelay: 1000,
  });

  const latestProject = projects[0];
  const { data: files = [], error: filesError } = useQuery<GeneratedFile[]>({
    queryKey: ["/api/projects", latestProject?.id, "files"],
    enabled: !!latestProject?.id,
    retry: 2,
  });

  // Log errors
  if (projectsError) console.error("Projects fetch error:", projectsError);
  if (filesError) console.error("Files fetch error:", filesError);

  const handleGenerate = (type: "code" | "image" | "video" | "security") => {
    if (!prompt.trim() && type !== "security") {
      toast({
        title: "Input Required",
        description: "Please enter a prompt to generate content",
        variant: "destructive",
      });
      return;
    }

    switch (type) {
      case "code":
        generateCode(prompt, {
          language: "typescript",
          framework: "react",
          includeTests: false,
        });
        break;
      case "image":
        generateImage(prompt);
        break;
      case "video":
        generateVideo(prompt);
        break;
      case "security":
        if (
          latestProject?.result &&
          typeof latestProject.result === "object" &&
          "code" in latestProject.result
        ) {
          performSecurityScan(String(latestProject.result.code));
        } else {
          const demoCode = `
// Demo React Component for Security Analysis
import React, { useState } from 'react';
const DemoComponent = () => {
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = () => {
    document.getElementById('output').innerHTML = userInput; // XSS vuln
  };
  const validatePassword = (pwd) => pwd.length > 3; // weak
  const processInput = (input) => eval('return ' + input); // injection
  return (
    <div>
      <input value={userInput} onChange={(e) => setUserInput(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
      <div id="output"></div>
    </div>
  );
};
export default DemoComponent;`;
          performSecurityScan(demoCode);
        }
        break;
    }
  };

  const downloadFile = async (file: GeneratedFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const getAIStatus = (ai: string) => {
    if (ai === activeAI && isGenerating)
      return { status: "PROCESSING", color: "text-cyber-green" };
    if (ai === "gemini") return { status: "ACTIVE", color: "text-cyber-green" };
    if (ai === "imagen") return { status: "READY", color: "text-cyber-purple" };
    return { status: "STANDBY", color: "text-gray-500" };
  };

  return (
    <>
      <LoadingModal isOpen={isGenerating} progress={progress} status={status} />

      {/* Tri-Analysis Loading Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-morph rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <i className="fas fa-chart-line text-cyber-purple text-4xl mb-4"></i>
              <h3 className="text-xl font-orbitron font-bold text-cyber-purple mb-2">
                Tri-Analysis Processing
              </h3>
              <p className="text-gray-300 mb-4">{currentStep}</p>
              <div className="w-full bg-dark-card rounded-full h-3 mb-2">
                <div
                  className="bg-cyber-purple h-3 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <div className="text-cyber-purple font-orbitron text-sm">
                {analysisProgress}% Complete
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection / Health / Errors */}
      {!isOnline && (
        <div className="glass-morph rounded-xl p-4 mb-6 border border-cyber-red/50 bg-cyber-red/10">
          <div className="flex items-center space-x-2">
            <i className="fas fa-wifi text-cyber-red"></i>
            <span className="text-cyber-red font-orbitron">Offline</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">No internet connection.</p>
        </div>
      )}
      {isOnline && !isHealthy && (
        <div className="glass-morph rounded-xl p-4 mb-6 border border-cyber-yellow/50 bg-cyber-yellow/10">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-cyber-yellow"></i>
            <span className="text-cyber-yellow font-orbitron">Service Issue</span>
          </div>
          {healthError && <p className="text-xs text-gray-400 mt-1">Error: {String(healthError)}</p>}
        </div>
      )}
      {(projectsError || filesError) && isOnline && (
        <div className="glass-morph rounded-xl p-4 mb-6 border border-cyber-red/50 bg-cyber-red/10">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-cyber-red"></i>
            <span className="text-cyber-red font-orbitron">Data Fetch Error</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="responsive-grid lg:grid-cols-3">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Orchestration Hub */}
          <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-orbitron font-bold text-black">
                gnidoC Terces
              </h2>
            </div>

            {/* Prompt */}
            <div className="space-y-4">
              <Textarea
                placeholder="Describe your app or upload files..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-40 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white font-fira text-sm focus:border-cyber-green focus:ring-2 focus:ring-cyber-green/20"
              />

              {/* Generation Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                {[
                  { type: "code", icon: "fas fa-code", label: "Code", color: "text-cyber-green" },
                  { type: "image", icon: "fas fa-image", label: "Image", color: "text-cyber-cyan" },
                  { type: "video", icon: "fas fa-video", label: "Video", color: "text-cyber-purple" },
                  { type: "security", icon: "fas fa-shield-alt", label: "Security", color: "text-cyber-red" },
                  { type: "tri", icon: "fas fa-chart-line", label: "Tri-Analysis", color: "text-cyber-purple" },
                ].map((btn, i) => (
                  <Button
                    key={btn.type}
                    onClick={() =>
                      btn.type === "tri"
                        ? uploadedFiles.length > 0 && performTriAnalysis(uploadedFiles)
                        : handleGenerate(btn.type as any)
                    }
                    disabled={
                      isGenerating ||
                      (btn.type !== "security" && !prompt.trim()) ||
                      (btn.type === "tri" && uploadedFiles.length === 0)
                    }
                    className="cyber-border rounded-lg h-auto p-0"
                    style={{ animationDelay: `${0.1 * (i + 1)}s` }}
                  >
                    <div className="bg-dark-panel p-3 rounded-lg text-center w-full">
                      <i className={`${btn.icon} ${btn.color} text-xl mb-2 block`}></i>
                      <span className="text-xs font-orbitron">{btn.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Output Panel */}
          {latestProject && (
            <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-orbitron font-bold text-cyber-green">Output</h3>
                <span className="text-xs text-gray-400 capitalize">{latestProject.type}</span>
              </div>
              {latestProject.type === 'code' && latestProject.result && typeof latestProject.result === 'object' && 'code' in latestProject.result && (
                <div className="space-y-3">
                  <CodeEditor
                    code={String((latestProject.result as any).code)}
                    language="typescript"
                  />
                </div>
              )}
              {latestProject.type === 'image' && latestProject.result && typeof latestProject.result === 'object' && 'imageData' in latestProject.result && (
                <div className="relative flex items-center justify-center">
                  <img
                    src={`data:image/png;base64,${String((latestProject.result as any).imageData)}`}
                    alt="Generated"
                    className="max-h-96 rounded border border-cyber-cyan/30"
                  />
                  <a
                    href={`data:image/png;base64,${String((latestProject.result as any).imageData)}`}
                    download="generated-image.png"
                    className="absolute top-2 right-2 glass-button px-3 py-1 rounded"
                  >
                    <i className="fas fa-download mr-2"></i>Download PNG
                  </a>
                </div>
              )}
              {latestProject.type === 'video' && latestProject.result && typeof latestProject.result === 'object' && (
                <div className="bg-dark-card rounded p-3 text-sm text-gray-300 border border-gray-600">
                  {'videoUrl' in (latestProject.result as any) && (latestProject.result as any).videoUrl ? (
                    <div className="space-y-2">
                      <video controls className="w-full max-h-[420px] rounded border border-cyber-cyan/30">
                        <source src={String((latestProject.result as any).videoUrl)} type="video/mp4" />
                      </video>
                      <a
                        href={String((latestProject.result as any).videoUrl)}
                        download
                        className="inline-flex items-center glass-button px-3 py-1 rounded"
                      >
                        <i className="fas fa-download mr-2"></i>Download MP4
                      </a>
                    </div>
                  ) : ('videoData' in (latestProject.result as any) ? (
                    <pre className="whitespace-pre-wrap break-words">{String((latestProject.result as any).videoData)}</pre>
                  ) : null)}
                </div>
              )}
              {latestProject.type === 'security' && latestProject.result && typeof latestProject.result === 'object' && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-cyber-red font-orbitron">Security Analysis</span>
                    <span className="text-xs text-gray-400">AI</span>
                  </div>
                  <pre className="bg-dark-card border border-gray-600 rounded p-3 overflow-auto max-h-96 text-gray-300">
{JSON.stringify(latestProject.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* File Manager + Results */}
          <FileManager onFilesChange={setUploadedFiles} />
          {files && files.length > 0 && (
            <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition">
              <h3 className="text-lg font-orbitron font-bold text-cyber-cyan mb-3">
                <i className="fas fa-file-code mr-2"></i>Generated Files
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-dark-card rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{file.fileName}</div>
                      <div className="text-xs text-gray-400">{file.fileType}</div>
                    </div>
                    <Button size="sm" onClick={() => downloadFile(file)}>
                      <i className="fas fa-download mr-2"></i>Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {analysisResult && <TriAnalysisResults result={analysisResult} onClear={clearResults} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {/* AI Status */}
          <div className="glass-morph rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-orbitron font-bold text-cyber-green mb-2">
              <i className="fas fa-heartbeat mr-2"></i>AI Status
            </h3>
            <div className="flex justify-center mb-4">
              <span className="logo-face" aria-hidden />
            </div>
            {(() => {
              const providers = [
                { key: 'gemini', label: 'Gemini' },
                { key: 'openai', label: 'OpenAI' },
                { key: 'anthropic', label: 'Anthropic' },
                { key: 'vision', label: 'Google Vision' },
                { key: 'runway', label: 'Runway' },
              ] as const;
              return (
                <div className="space-y-1">
                  {providers.map((p) => {
                    const configured = aiStatus?.providers?.[p.key as keyof typeof aiStatus.providers]?.configured;
                    const loading = typeof configured === 'undefined';
                    return (
                      <div key={p.key} className="flex items-center justify-between">
                        <span className="text-sm">{p.label}</span>
                        <span className={`text-xs ${loading ? 'text-gray-400' : configured ? 'text-cyber-green' : 'text-cyber-red'}`}>
                          {loading ? 'Checking…' : configured ? 'Configured' : 'Missing'}
                        </span>
                      </div>
                    );
                  })}
                  <div className="text-[10px] text-gray-500 mt-2">{aiStatus?.timestamp ? `Updated: ${new Date(aiStatus.timestamp).toLocaleTimeString()}` : 'Checking…'}</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
