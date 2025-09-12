import { useQuery } from "@tanstack/react-query";

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

export function useAIStatus() {
  const { data, error, isLoading, refetch } = useQuery<AIStatusResponse>({
    queryKey: ["/api/ai/status"],
    queryFn: async () => {
      const res = await fetch("/api/ai/status");
      if (!res.ok) throw new Error("Failed to fetch AI status");
      return res.json();
    },
    refetchInterval: 5000,
    retry: 2,
  });

  return { data, error, isLoading, refetch };
}
