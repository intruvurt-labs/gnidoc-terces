import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export interface ProviderStatus {
  configured: boolean;
}

export interface AIStatusResponse {
  timestamp: string;
  providers: {
    gemini: ProviderStatus;
    openai: ProviderStatus;
    anthropic: ProviderStatus;
    vision: ProviderStatus;
    runway: ProviderStatus;
  };
}

const DEFAULT_AI_STATUS: AIStatusResponse = {
  timestamp: new Date().toISOString(),
  providers: {
    gemini: { configured: false },
    openai: { configured: false },
    anthropic: { configured: false },
    vision: { configured: false },
    runway: { configured: false },
  },
};

export function useAIStatus() {
  const { data, error, isLoading, refetch } = useQuery<AIStatusResponse>({
    queryKey: ["/api/ai/status"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/ai/status", { credentials: "include" });
        if (!res.ok) throw new Error("Bad status");
        return res.json();
      } catch (err) {
        const cached = queryClient.getQueryData<AIStatusResponse>(["/api/ai/status"]);
        if (cached) return cached;
        return DEFAULT_AI_STATUS;
      }
    },
    refetchInterval: 5000,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  return { data, error, isLoading, refetch };
}
