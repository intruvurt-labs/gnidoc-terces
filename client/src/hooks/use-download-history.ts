import { useQuery } from "@tanstack/react-query";

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
      const res = await fetch(`/api/downloads?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch downloads");
      return res.json();
    },
    refetchInterval: 8000,
    retry: 2,
  });
}
