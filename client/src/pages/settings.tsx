import React from 'react';
import { useAIStatus } from '@/hooks/use-ai-status';

export default function SettingsPage() {
  const { data } = useAIStatus();
  return (
    <div className="glass-morph rounded-xl p-6">
      <h1 className="text-2xl font-orbitron text-cyber-green mb-4">Settings</h1>
      <div className="space-y-2">
        <div className="text-sm text-gray-400">AI Providers</div>
        {data ? (
          <ul className="text-sm">
            {Object.entries(data.providers).map(([k, v]) => (
              <li key={k} className="flex justify-between border-b border-gray-700 py-2">
                <span className="capitalize">{k}</span>
                <span className={v.configured ? 'text-cyber-green' : 'text-cyber-red'}>
                  {v.configured ? 'Configured' : 'Missing'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-gray-500">Loading…</div>
        )}
      </div>
    </div>
  );
}
