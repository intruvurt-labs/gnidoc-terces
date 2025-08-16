import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CyberpunkLayout from "@/components/cyberpunk-layout";
import LoadingModal from "@/components/ui/loading-modal";
import CodeEditor from "@/components/ui/code-editor";
import FileCard from "@/components/ui/file-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useConnectionHealth } from "@/hooks/use-connection-health";
import { useSecurityScan } from "@/hooks/use-security-scan";
import { useTriAnalysis } from "@/hooks/use-tri-analysis";
import { type UploadedFile } from "@/hooks/use-file-upload";
import FileManager from "@/components/file-manager";
import TriAnalysisResults from "@/components/tri-analysis-results";
import { type Project, type GeneratedFile } from "@shared/schema";
import gindocLogo from "@assets/gindoc_1755279048391.png";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [activeAI, setActiveAI] = useState<'gemini' | 'runway' | 'imagen'>('gemini');
  const [outputMode, setOutputMode] = useState<'code' | 'preview' | 'files'>('code');
  const [showAbout, setShowAbout] = useState(false);

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

  const { isHealthy, isOnline, healthError } = useConnectionHealth();
  const { isScanning: isSecurityScanning, scanResult, realtimeStats, performScan } = useSecurityScan();
  const { isAnalyzing, analysisResult, progress: analysisProgress, currentStep, performTriAnalysis, clearResults } = useTriAnalysis();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Fetch recent projects
  const { data: projects = [], error: projectsError, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch files for the latest project
  const latestProject = projects[0];
  const { data: files = [], error: filesError } = useQuery<GeneratedFile[]>({
    queryKey: ["/api/projects", latestProject?.id, "files"],
    enabled: !!latestProject?.id,
    retry: 2,
  });

  // Log errors for debugging
  if (projectsError) {
    console.error('Projects fetch error:', projectsError);
  }
  if (filesError) {
    console.error('Files fetch error:', filesError);
  }

  const handleGenerate = (type: 'code' | 'image' | 'video' | 'security') => {
    if (!prompt.trim()) return;

    switch (type) {
      case 'code':
        generateCode(prompt, {
          language: 'typescript',
          framework: 'react',
          includeTests: false,
        });
        break;
      case 'image':
        generateImage(prompt);
        break;
      case 'video':
        generateVideo(prompt);
        break;
      case 'security':
        if (latestProject?.result && typeof latestProject.result === 'object' && 'code' in latestProject.result) {
          performScan(String(latestProject.result.code));
        } else if (prompt.trim()) {
          performScan(prompt);
        }
        break;
    }
  };

  const downloadFile = async (file: GeneratedFile) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getAIStatus = (ai: string) => {
    if (ai === activeAI && isGenerating) return { status: 'PROCESSING', color: 'text-cyber-green animate-pulse' };
    if (ai === 'gemini') return { status: 'ACTIVE', color: 'text-cyber-green animate-pulse' };
    if (ai === 'imagen') return { status: 'READY', color: 'text-cyber-purple animate-pulse' };
    return { status: 'STANDBY', color: 'text-gray-500' };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    // Handle file upload logic here
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPrompt(prev => prev + `\n\nFile: ${file.name}\n${content}`);
      };
      reader.readAsText(file);
    });
  };

  return (
    <CyberpunkLayout>
      <LoadingModal
        isOpen={isGenerating}
        progress={progress}
        status={status}
      />

      {/* Tri-Analysis Loading Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="glass-morph rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <i className="fas fa-chart-line text-cyber-purple text-4xl mb-4 animate-pulse"></i>
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

      {/* Connection Status */}
      {!isOnline && (
        <div className="glass-morph rounded-xl p-4 mb-6 border border-cyber-red/50 bg-cyber-red/10">
          <div className="flex items-center space-x-2">
            <i className="fas fa-wifi text-cyber-red"></i>
            <span className="text-cyber-red font-orbitron">Offline</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            No internet connection. Please check your network and try again.
          </p>
        </div>
      )}

      {/* Health Status */}
      {isOnline && !isHealthy && (
        <div className="glass-morph rounded-xl p-4 mb-6 border border-cyber-yellow/50 bg-cyber-yellow/10">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-cyber-yellow"></i>
            <span className="text-cyber-yellow font-orbitron">Service Issue</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            System services are currently experiencing issues. Some features may be unavailable.
          </p>
          {healthError && (
            <p className="text-xs text-gray-400 mt-1">
              Error: {String(healthError)}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {(projectsError || filesError) && isOnline && (
        <div className="glass-morph rounded-xl p-4 mb-6 border border-cyber-red/50 bg-cyber-red/10">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-cyber-red"></i>
            <span className="text-cyber-red font-orbitron">Data Fetch Error</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            Unable to fetch data. The system is attempting to reconnect...
          </p>
          {projectsError && (
            <p className="text-xs text-gray-400 mt-1">
              Projects: {String(projectsError)}
            </p>
          )}
          {filesError && (
            <p className="text-xs text-gray-400 mt-1">
              Files: {String(filesError)}
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {projectsLoading && (
        <div className="glass-morph rounded-xl p-8 mb-6 text-center">
          <i className="fas fa-spinner fa-spin text-cyber-green text-2xl mb-2"></i>
          <p className="text-gray-300">Loading projects...</p>
        </div>
      )}
      
      {/* About Section */}
      {showAbout && (
        <div className="glass-morph rounded-xl p-6 mb-6 border border-cyber-green/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-orbitron font-bold text-cyber-green">About GINDOC</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAbout(false)}
              className="text-cyber-red hover:text-cyber-cyan"
              data-testid="button-close-about"
            >
              ✕
            </Button>
          </div>
          <div className="flex items-start space-x-6">
            <img src={gindocLogo} alt="GINDOC Logo" className="w-32 h-32 rounded-lg border border-cyber-green/30" />
            <div className="flex-1">
              <p className="text-gray-300 mb-4">
                <strong className="text-cyber-cyan">GINDOC</strong> is an advanced AI-powered development platform 
                specializing in complete code generation, blockchain security analysis, and multi-modal content creation.
              </p>
              <p className="text-gray-300 mb-4">
                Created by <strong className="text-cyber-purple">Intruvurt Labs</strong> and 
                developed by <strong className="text-cyber-green">Doble Duche</strong>, 
                GINDOC orchestrates multiple AI models to provide comprehensive solutions for modern development challenges.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-dark-card p-3 rounded border border-cyber-green/20">
                  <h4 className="text-cyber-green font-bold mb-2">Code Generation</h4>
                  <p className="text-xs text-gray-400">Full-stack applications with Gemini AI</p>
                </div>
                <div className="bg-dark-card p-3 rounded border border-cyber-cyan/20">
                  <h4 className="text-cyber-cyan font-bold mb-2">Image Creation</h4>
                  <p className="text-xs text-gray-400">Visual content with Imagen 3.0</p>
                </div>
                <div className="bg-dark-card p-3 rounded border border-cyber-purple/20">
                  <h4 className="text-cyber-purple font-bold mb-2">Video Generation</h4>
                  <p className="text-xs text-gray-400">Dynamic videos with Runway ML</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="responsive-grid lg:grid-cols-3 animate-fade-in">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-6 animate-slide-up">
          
          {/* AI Orchestration Panel */}
          <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-orbitron font-bold text-cyber-green flex items-center">
                <i className="fas fa-brain mr-3 text-cyber-cyan"></i>
                AI Orchestration Hub
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAbout(!showAbout)}
                  className="px-3 py-1 text-xs font-fira text-cyber-cyan hover:text-cyber-green"
                  data-testid="button-about"
                >
                  ABOUT
                </Button>
                <Button
                  variant={activeAI === 'gemini' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveAI('gemini')}
                  className="px-3 py-1 text-xs font-fira bg-cyber-green/20 border-cyber-green text-cyber-green hover:bg-cyber-green/30"
                  data-testid="button-ai-gemini"
                >
                  GEMINI
                </Button>
                <Button
                  variant={activeAI === 'runway' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveAI('runway')}
                  className="px-3 py-1 text-xs font-fira bg-dark-card border-gray-600 text-gray-400 hover:border-cyber-red hover:text-cyber-red"
                  data-testid="button-ai-runway"
                >
                  RUNWAY
                </Button>
                <Button
                  variant={activeAI === 'imagen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveAI('imagen')}
                  className="px-3 py-1 text-xs font-fira bg-dark-card border-gray-600 text-gray-400 hover:border-cyber-purple hover:text-cyber-purple"
                  data-testid="button-ai-imagen"
                >
                  IMAGEN
                </Button>
              </div>
            </div>

            {/* Prompt Interface */}
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Describe your complete application concept, upload code files, or paste existing code for analysis and enhancement..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-40 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 font-fira text-sm focus:border-cyber-green focus:outline-none focus:ring-2 focus:ring-cyber-green/20 resize-none smooth-transition"
                  maxLength={50000}
                  data-testid="input-prompt"
                />
                <div className="absolute bottom-3 right-3 flex items-center space-x-3">
                  <div className="text-xs text-gray-500">
                    {prompt.length}/50000
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs">
                      <i className="fas fa-paperclip text-cyber-green"></i>
                      <span className="text-cyber-green">{uploadedFiles.length} files</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Generation Options */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                <Button
                  onClick={() => handleGenerate('code')}
                  disabled={isGenerating || !prompt.trim()}
                  className="cyber-border rounded-lg hover:animate-glow-pulse smooth-transition h-auto p-0 animate-float"
                  data-testid="button-generate-code"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="bg-dark-panel p-3 rounded-lg text-center w-full smooth-transition">
                    <i className="fas fa-code text-cyber-green text-xl mb-2 block smooth-transition"></i>
                    <span className="text-xs font-orbitron">Generate Code</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleGenerate('image')}
                  disabled={isGenerating || !prompt.trim()}
                  className="cyber-border rounded-lg hover:animate-glow-pulse smooth-transition h-auto p-0 animate-float"
                  data-testid="button-generate-image"
                  style={{ animationDelay: '0.2s' }}
                >
                  <div className="bg-dark-panel p-3 rounded-lg text-center w-full smooth-transition">
                    <i className="fas fa-image text-cyber-cyan text-xl mb-2 block smooth-transition"></i>
                    <span className="text-xs font-orbitron">Create Image</span>
                  </div>
                </Button>

                <Button
                  onClick={() => handleGenerate('video')}
                  disabled={isGenerating || !prompt.trim()}
                  className="cyber-border rounded-lg hover:animate-glow-pulse smooth-transition h-auto p-0 animate-float"
                  data-testid="button-generate-video"
                  style={{ animationDelay: '0.3s' }}
                >
                  <div className="bg-dark-panel p-3 rounded-lg text-center w-full smooth-transition">
                    <i className="fas fa-video text-cyber-purple text-xl mb-2 block smooth-transition"></i>
                    <span className="text-xs font-orbitron">Generate Video</span>
                  </div>
                </Button>

                <Button
                  onClick={() => handleGenerate('security')}
                  disabled={isGenerating || !latestProject?.result || !('code' in (latestProject.result as any))}
                  className="cyber-border-red rounded-lg hover:animate-glow-pulse smooth-transition h-auto p-0 animate-float"
                  data-testid="button-security-scan"
                  style={{ animationDelay: '0.4s' }}
                >
                  <div className="bg-dark-panel p-3 rounded-lg text-center w-full smooth-transition">
                    <i className="fas fa-shield-alt text-cyber-red text-xl mb-2 block smooth-transition"></i>
                    <span className="text-xs font-orbitron">Security Scan</span>
                  </div>
                </Button>

                <Button
                  onClick={() => uploadedFiles.length > 0 && performTriAnalysis(uploadedFiles)}
                  disabled={isAnalyzing || uploadedFiles.length === 0}
                  className="cyber-border rounded-lg hover:animate-glow-pulse smooth-transition h-auto p-0 animate-float"
                  data-testid="button-tri-analysis"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="bg-dark-panel p-3 rounded-lg text-center w-full smooth-transition">
                    <i className={`fas ${isAnalyzing ? 'fa-cog fa-spin' : 'fa-chart-line'} text-cyber-purple text-xl mb-2 block smooth-transition`}></i>
                    <span className="text-xs font-orbitron">Tri-Analysis</span>
                  </div>
                </Button>
              </div>

              {/* Demo Button */}
              <Button
                onClick={() => fetch('/api/demo', { method: 'POST' }).then(() => window.location.reload())}
                className="w-full bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 font-orbitron font-bold py-2 text-sm border border-cyber-cyan/50 hover:border-cyber-cyan transition-all duration-300"
                data-testid="button-demo"
              >
                <i className="fas fa-play mr-2"></i>
                LOAD DEMO PROJECT (React TypeScript Todo App)
              </Button>

              {/* Main Execute Button */}
              <Button
                onClick={() => handleGenerate('code')}
                disabled={isGenerating || !prompt.trim()}
                className="w-full cyber-border rounded-lg hover:animate-glow-pulse transition-all h-auto p-0"
                data-testid="button-execute-generation"
              >
                <div className="bg-dark-panel py-4 rounded-lg w-full">
                  <span className="font-orbitron font-bold text-lg text-cyber-green">
                    <i className="fas fa-rocket mr-2"></i>
                    {isGenerating ? 'GENERATING...' : 'EXECUTE GENERATION'}
                  </span>
                </div>
              </Button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="glass-morph rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-orbitron font-bold text-cyber-green">
                <i className="fas fa-terminal mr-3"></i>
                Output Console
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant={outputMode === 'code' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOutputMode('code')}
                  className="px-3 py-1 text-xs bg-cyber-green/20 border-cyber-green text-cyber-green"
                  data-testid="button-output-code"
                >
                  CODE
                </Button>
                <Button
                  variant={outputMode === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOutputMode('preview')}
                  className="px-3 py-1 text-xs bg-dark-card border-gray-600 text-gray-400 hover:border-cyber-cyan hover:text-cyber-cyan"
                  data-testid="button-output-preview"
                >
                  PREVIEW
                </Button>
                <Button
                  variant={outputMode === 'files' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOutputMode('files')}
                  className="px-3 py-1 text-xs bg-dark-card border-gray-600 text-gray-400 hover:border-cyber-purple hover:text-cyber-purple"
                  data-testid="button-output-files"
                >
                  FILES
                </Button>
              </div>
            </div>

            {/* Code Display */}
            {outputMode === 'code' && latestProject?.result && typeof latestProject.result === 'object' && 'code' in latestProject.result && (
              <CodeEditor
                code={String(latestProject.result.code)}
                language="javascript"
                fileName="generated-app"
              />
            )}

            {outputMode === 'code' && (!latestProject?.result || !('code' in (latestProject.result as any))) && (
              <div className="bg-dark-card border border-cyber-green/30 rounded-lg p-8 text-center">
                <i className="fas fa-code text-cyber-green text-4xl mb-4 opacity-50"></i>
                <p className="text-gray-500 text-lg" data-testid="text-no-code">
                  Generated code will appear here
                </p>
              </div>
            )}

            {/* Files Display */}
            {outputMode === 'files' && files.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={downloadFile}
                  />
                ))}
              </div>
            )}

            {outputMode === 'files' && files.length === 0 && (
              <div className="bg-dark-card border border-cyber-green/30 rounded-lg p-8 text-center">
                <i className="fas fa-folder-open text-cyber-green text-4xl mb-4 opacity-50"></i>
                <p className="text-gray-500 text-lg" data-testid="text-no-files">
                  Generated files will appear here
                </p>
              </div>
            )}

            {/* Image Preview */}
            {outputMode === 'preview' && latestProject?.result && typeof latestProject.result === 'object' && 'imageData' in latestProject.result && (
              <div className="bg-dark-card border border-cyber-green/30 rounded-lg p-4">
                <img
                  src={`data:image/png;base64,${String(latestProject.result.imageData)}`}
                  alt="Generated image"
                  className="w-full h-auto rounded"
                  data-testid="img-generated-preview"
                />
              </div>
            )}

            {/* Video Preview */}
            {outputMode === 'preview' && latestProject?.result && typeof latestProject.result === 'object' && 'videoData' in latestProject.result && (
              <div className="bg-dark-card border border-cyber-green/30 rounded-lg p-4">
                <div className="text-center text-cyber-purple">
                  <i className="fas fa-video text-6xl mb-4"></i>
                  <p className="text-white">Video: {String(latestProject.result.videoData)}</p>
                </div>
              </div>
            )}

            {outputMode === 'preview' && (!latestProject?.result || (!('imageData' in (latestProject.result as any)) && !('videoData' in (latestProject.result as any)))) && (
              <div className="bg-dark-card border border-cyber-green/30 rounded-lg p-8 text-center">
                <i className="fas fa-eye text-cyber-cyan text-4xl mb-4 opacity-50"></i>
                <p className="text-gray-500 text-lg">
                  Generated content preview will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>

          {/* AI Status Panel */}
          <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition animate-float" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-lg font-orbitron font-bold text-cyber-green mb-4">
              <i className="fas fa-heartbeat mr-2"></i>
              AI Status
            </h3>
            
            <div className="space-y-4">
              {(['gemini', 'runway', 'imagen'] as const).map((ai) => {
                const status = getAIStatus(ai);
                return (
                  <div key={ai} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${status.color === 'text-cyber-green animate-pulse' ? 'bg-cyber-green' : 
                        status.color === 'text-cyber-purple animate-pulse' ? 'bg-cyber-purple' : 'bg-gray-500'} ${status.color.includes('animate-pulse') ? 'animate-pulse' : ''}`}></div>
                      <span className="text-sm font-fira capitalize" data-testid={`text-ai-name-${ai}`}>{ai === 'gemini' ? 'Gemini Pro' : ai === 'runway' ? 'Runway ML' : 'Imagen 3.0'}</span>
                    </div>
                    <span className={`text-xs ${status.color}`} data-testid={`text-ai-status-${ai}`}>{status.status}</span>
                  </div>
                );
              })}
            </div>

            {/* Processing Queue */}
            {isGenerating && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-orbitron text-cyber-cyan mb-3">Processing Queue</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300" data-testid="text-processing-task">{status}</span>
                    <div className="w-16 bg-dark-card rounded-full h-1">
                      <div className="bg-cyber-green h-1 rounded-full animate-pulse" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security Monitor */}
          <div className="glass-morph rounded-xl p-4 sm:p-6 smooth-transition animate-float" style={{ animationDelay: '0.7s' }}>
            <h3 className="text-lg font-orbitron font-bold text-cyber-red mb-4">
              <i className="fas fa-shield-alt mr-2"></i>
              Security Monitor
              {isSecurityScanning && <i className="fas fa-spinner fa-spin ml-2 text-cyber-yellow"></i>}
            </h3>

            {isSecurityScanning && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-cyber-cyan">Scanning: {realtimeStats.currentFile}</span>
                  <span className="text-cyber-green">{Math.round(realtimeStats.progress)}%</span>
                </div>
                <div className="w-full bg-dark-card rounded-full h-2">
                  <div
                    className="bg-cyber-green h-2 rounded-full transition-all duration-300"
                    style={{ width: `${realtimeStats.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Files: {realtimeStats.filesScanned}/5</span>
                  <span>Threats: {realtimeStats.threatsFound}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Blockchain Security</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  scanResult?.blockchainSecurity === 'SECURE' ? 'text-cyber-green bg-cyber-green/20' :
                  scanResult?.blockchainSecurity?.includes('CRITICAL') ? 'text-cyber-red bg-cyber-red/20' :
                  scanResult?.blockchainSecurity?.includes('HIGH') ? 'text-cyber-red bg-cyber-red/20' :
                  scanResult?.blockchainSecurity?.includes('MEDIUM') ? 'text-cyber-yellow bg-cyber-yellow/20' :
                  scanResult?.blockchainSecurity?.includes('LOW') ? 'text-cyber-cyan bg-cyber-cyan/20' :
                  'text-cyber-green bg-cyber-green/20'
                }`} data-testid="text-blockchain-security">
                  {scanResult?.blockchainSecurity || 'SECURE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Code Quality</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  scanResult?.codeQuality === 'A+' || scanResult?.codeQuality === 'A' ? 'text-cyber-green bg-cyber-green/20' :
                  scanResult?.codeQuality === 'B' ? 'text-cyber-cyan bg-cyber-cyan/20' :
                  scanResult?.codeQuality === 'C' ? 'text-cyber-yellow bg-cyber-yellow/20' :
                  scanResult?.codeQuality === 'D' || scanResult?.codeQuality === 'F' ? 'text-cyber-red bg-cyber-red/20' :
                  'text-cyber-green bg-cyber-green/20'
                }`} data-testid="text-code-quality">
                  {scanResult?.codeQuality || 'A+'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Vulnerabilities</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  !scanResult?.vulnerabilities || scanResult.vulnerabilities === 0 ? 'text-cyber-green bg-cyber-green/20' :
                  scanResult.vulnerabilities < 3 ? 'text-cyber-yellow bg-cyber-yellow/20' :
                  'text-cyber-red bg-cyber-red/20'
                }`} data-testid="text-vulnerabilities">
                  {scanResult?.vulnerabilities || 0} FOUND
                </span>
              </div>

              {scanResult && scanResult.issues.length > 0 && (
                <div className="mt-3 bg-dark-card rounded p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs text-cyber-red mb-2 font-orbitron">RECENT FINDINGS:</div>
                  {scanResult.issues.slice(0, 3).map((issue, index) => (
                    <div key={issue.id} className="text-xs mb-1 p-1 bg-dark-panel rounded">
                      <div className={`font-bold ${
                        issue.severity === 'critical' ? 'text-cyber-red' :
                        issue.severity === 'high' ? 'text-cyber-red' :
                        issue.severity === 'medium' ? 'text-cyber-yellow' :
                        'text-cyber-cyan'
                      }`}>
                        {issue.title} ({issue.severity.toUpperCase()})
                      </div>
                      <div className="text-gray-400">{issue.location}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => handleGenerate('security')}
              disabled={isSecurityScanning || (!latestProject?.result && !prompt.trim())}
              className="w-full mt-4 cyber-border-red rounded-lg hover:animate-glow-pulse smooth-transition"
              data-testid="button-full-security-scan"
            >
              <span className="font-orbitron text-cyber-red">
                <i className={`${isSecurityScanning ? 'fas fa-spinner fa-spin' : 'fas fa-search'} mr-2`}></i>
                {isSecurityScanning ? 'SCANNING...' : 'FULL SCAN'}
              </span>
            </Button>
          </div>

          {/* Recent Projects */}
          <div className="glass-morph rounded-xl p-6">
            <h3 className="text-lg font-orbitron font-bold text-cyber-cyan mb-4">
              <i className="fas fa-history mr-2"></i>
              Recent Projects
            </h3>
            
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="bg-dark-card rounded p-3 hover:border hover:border-cyber-cyan/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-fira text-white truncate" data-testid={`text-project-name-${project.id}`}>{project.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.status === 'completed' ? 'bg-cyber-green/20 text-cyber-green' :
                      project.status === 'processing' ? 'bg-cyber-cyan/20 text-cyber-cyan' :
                      'bg-cyber-red/20 text-cyber-red'
                    }`} data-testid={`text-project-status-${project.id}`}>
                      {project.status?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate" data-testid={`text-project-description-${project.id}`}>
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-cyber-purple" data-testid={`text-project-type-${project.id}`}>{project.type?.toUpperCase()}</span>
                    <span className="text-xs text-gray-500" data-testid={`text-project-model-${project.id}`}>{project.aiModel?.toUpperCase()}</span>
                  </div>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center py-8">
                  <i className="fas fa-folder-open text-gray-500 text-3xl mb-3"></i>
                  <p className="text-gray-500 text-sm" data-testid="text-no-projects">No projects yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CyberpunkLayout>
  );
}
