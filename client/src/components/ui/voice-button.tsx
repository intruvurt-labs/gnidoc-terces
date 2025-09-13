import React from 'react';
import { Button } from './button';
import { useVoicePrompt } from '@/hooks/use-voice';

export function VoiceButton({ onAppend }: { onAppend: (text: string) => void }) {
  const { listening, error, start, stop } = useVoicePrompt();
  return (
    <div className="inline-flex items-center gap-2">
      <Button size="sm" variant={listening ? 'default' : 'outline'} className="h-7 px-2 text-xs" onClick={() => (listening ? stop() : start(onAppend))}>
        <i className={`fas fa-microphone${listening ? '' : '-slash'} ${listening ? 'text-cyber-red' : ''}`}></i>
      </Button>
      {error && <span className="text-xs text-cyber-yellow">{error}</span>}
    </div>
  );
}
