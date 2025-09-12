import { useState } from "react";

interface RefactorResponse {
  status: string;
  applied: number;
  actions: any[];
  updated: number;
}

export function useRefactor() {
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [result, setResult] = useState<RefactorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runRefactor = async (projectId: string, prompt: string) => {
    setIsRefactoring(true);
    setError(null);
    try {
      const res = await fetch('/api/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId, prompt })
      });
      if (!res.ok) throw new Error(await res.text());
      const data: RefactorResponse = await res.json();
      setResult(data);
      return data;
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Refactor failed');
      throw e;
    } finally {
      setIsRefactoring(false);
    }
  };

  return { isRefactoring, result, error, runRefactor };
}
