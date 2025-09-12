import { useCallback, useEffect, useRef, useState } from 'react';

export function useVoicePrompt() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;
  }, []);

  const start = useCallback((onText: (text: string) => void) => {
    const rec = recognitionRef.current;
    if (!rec) return;
    setError(null);
    try {
      rec.onresult = (e: any) => {
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
        }
        if (final) onText(final);
      };
      rec.onend = () => setListening(false);
      rec.onerror = (ev: any) => setError(String(ev.error || 'voice error'));
      rec.start();
      setListening(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to start');
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec && listening) rec.stop();
    setListening(false);
  }, [listening]);

  return { listening, error, start, stop };
}
