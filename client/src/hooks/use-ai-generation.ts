import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type AIGenerationRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  status: string;
}

export function useAIGeneration() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    status: "Ready",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (request: AIGenerationRequest) => {
      setState({ isGenerating: true, progress: 10, status: "Initializing AI..." });
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 10, 90),
          status: prev.progress < 30 ? "Analyzing prompt..." :
                  prev.progress < 60 ? "Processing with AI..." :
                  "Generating output...",
        }));
      }, 500);

      try {
        const response = await apiRequest("POST", "/api/generate", request);
        clearInterval(progressInterval);
        
        setState({ isGenerating: false, progress: 100, status: "Completed" });
        
        const result = await response.json();
        
        if (result.status === 'error') {
          throw new Error(result.error);
        }
        
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setState({ isGenerating: false, progress: 0, status: "Error" });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Generation Complete!",
        description: `Successfully generated ${data.files.length} files`,
      });
      
      // Invalidate projects cache
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Reset state after a delay
      setTimeout(() => {
        setState({ isGenerating: false, progress: 0, status: "Ready" });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      
      setState({ isGenerating: false, progress: 0, status: "Error" });
    },
  });

  const generateCode = (prompt: string, options?: any) => {
    generateMutation.mutate({
      prompt,
      type: 'code',
      aiModel: 'gemini',
      options,
    });
  };

  const generateImage = (prompt: string) => {
    generateMutation.mutate({
      prompt,
      type: 'image',
      aiModel: 'imagen',
    });
  };

  const generateVideo = (prompt: string) => {
    generateMutation.mutate({
      prompt,
      type: 'video',
      aiModel: 'runway',
    });
  };

  const performSecurityScan = (code: string) => {
    generateMutation.mutate({
      prompt: "Perform comprehensive security analysis on the provided code",
      type: 'security',
      aiModel: 'gemini',
      options: { code },
    });
  };

  return {
    ...state,
    generateCode,
    generateImage,
    generateVideo,
    performSecurityScan,
    result: generateMutation.data,
    error: generateMutation.error,
  };
}
