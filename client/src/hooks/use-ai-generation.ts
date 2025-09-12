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
      setState({ isGenerating: true, progress: 5, status: "Initializing AI..." });

      // Realistic progress updates with smoother animation
      let currentProgress = 5;
      const progressInterval = setInterval(() => {
        setState(prev => {
          const increment = Math.random() * 8 + 2; // 2-10% increments
          currentProgress = Math.min(prev.progress + increment, 85);

          let newStatus = prev.status;
          if (currentProgress < 20) newStatus = "Connecting to AI models...";
          else if (currentProgress < 40) newStatus = "Analyzing prompt...";
          else if (currentProgress < 65) newStatus = "Processing with AI...";
          else newStatus = "Generating output...";

          return {
            ...prev,
            progress: currentProgress,
            status: newStatus,
          };
        });
      }, 300); // Faster updates for smoother animation

      try {
        const response = await apiRequest("POST", "/api/generate", request);
        clearInterval(progressInterval);

        // Animate to completion
        setState(prev => ({ ...prev, progress: 95, status: "Finalizing..." }));

        const result = await response.json();

        if (result.status === 'error') {
          throw new Error(result.error || "Generation failed");
        }

        // Complete animation
        setTimeout(() => {
          setState({ isGenerating: false, progress: 100, status: "Completed!" });
        }, 200);

        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setState({ isGenerating: false, progress: 0, status: "Error occurred" });
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.startsWith('429')) {
          toast({
            title: 'Rate limit hit',
            description: 'You have reached the generation limit. Please wait a minute and try again.',
            variant: 'destructive',
          });
        }
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
