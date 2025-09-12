import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey.join("/") as string;
      console.log(`Fetching: ${url}`); // Debug logging

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null as unknown as T;
        }

        await throwIfResNotOk(res);
        const data = await res.json();
        console.log(`Success: ${url}`, data);
        return data;
      } finally {
        clearTimeout(timeout);
      }

    } catch (error) {
      const key = queryKey.join("/") as string;
      console.warn(`Fetch error for ${key}:`, error);
      // Try cache first
      const cached = queryClient.getQueryData<any>(queryKey as any);
      if (cached !== undefined) return cached as T;
      // Sensible fallbacks by endpoint to avoid UI crashes
      if (key.startsWith("/api/projects")) return ([] as unknown) as T;
      if (key.startsWith("/api/downloads")) return ([] as unknown) as T;
      if (key.includes("/files")) return ([] as unknown) as T;
      if (key === "/api/ai/status") {
        const fallback = {
          timestamp: new Date().toISOString(),
          providers: {
            gemini: { configured: false },
            openai: { configured: false },
            anthropic: { configured: false },
            vision: { configured: false },
            runway: { configured: false },
          },
        };
        return (fallback as unknown) as T;
      }
      // Final fallback: null
      return (null as unknown) as T;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408 (timeout)
        if (error && typeof error === 'object' && 'message' in error) {
          const message = error.message as string;
          if (message.includes('4') && !message.includes('408')) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Retry mutations only on network errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = error.message as string;
          if (message.includes('fetch')) {
            return failureCount < 2;
          }
        }
        return false;
      },
    },
  },
});
