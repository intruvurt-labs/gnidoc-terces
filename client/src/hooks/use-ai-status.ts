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
        throw err instanceof Error ? err : new Error("Failed to fetch AI status");
      }
    },
    refetchInterval: 5000,
    retry: 2,
  });

  return { data, error, isLoading, refetch };
}
