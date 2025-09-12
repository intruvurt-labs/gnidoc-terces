import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export interface DownloadItem {
  id: string;
  fileId: string;
  projectId: string;
  fileName: string;
  size: number;
  downloadUrl: string | null;
  downloadedAt: string;
}

export function useDownloadHistory(limit = 20) {
  return useQuery<DownloadItem[]>({
    queryKey: ["/api/downloads", limit],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/downloads?limit=${limit}`, { credentials: "include" });
        if (!res.ok) throw new Error("Bad status");
        return res.json();
      } catch (err) {
        const cached = queryClient.getQueryData<DownloadItem[]>(["/api/downloads", limit]);
        if (cached) return cached;
        throw err instanceof Error ? err : new Error("Failed to fetch downloads");
      }
    },
    refetchInterval: 8000,
    retry: 2,
  });
}
