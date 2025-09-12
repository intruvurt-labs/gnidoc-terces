import React from 'react';
import { useAIStatus } from '@/hooks/use-ai-status';
import { usePreferences } from '@/hooks/use-preferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { data } = useAIStatus();
  const { preferences, setPreferences } = usePreferences();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-orbitron text-cyber-green">Settings</h1>
        <a href="/" className="cyber-border rounded-lg" data-testid="button-back-home">
          <div className="bg-dark-panel px-4 py-2 rounded-lg flex items-center space-x-2">
            <i className="fas fa-arrow-left text-cyber-cyan"></i>
            <span className="text-sm text-white">Back to Home</span>
          </div>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-dark-panel border-cyber-green/30">
          <CardHeader>
            <CardTitle className="text-cyber-green">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Theme</span>
              <Select value={preferences.general.theme} onValueChange={(v) => setPreferences(p => ({...p, general: {...p.general, theme: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-300">Telemetry</div>
                <div className="text-xs text-gray-500">Help improve the product anonymously</div>
              </div>
              <Switch checked={preferences.general.telemetry} onCheckedChange={(v) => setPreferences(p => ({...p, general: {...p.general, telemetry: v}}))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-300">Show advanced options</div>
                <div className="text-xs text-gray-500">Reveal power-user controls</div>
              </div>
              <Switch checked={preferences.general.showAdvanced} onCheckedChange={(v) => setPreferences(p => ({...p, general: {...p.general, showAdvanced: v}}))} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-panel border-cyber-cyan/30">
          <CardHeader>
            <CardTitle className="text-cyber-cyan">AI Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data ? (
              <ul className="text-sm divide-y divide-gray-800">
                {Object.entries(data.providers).map(([k, v]) => (
                  <li key={k} className="flex justify-between py-2">
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

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Default provider</span>
              <Select value={preferences.ai.defaultProvider} onValueChange={(v) => setPreferences(p => ({...p, ai: {...p.ai, defaultProvider: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-panel border-cyber-purple/30">
          <CardHeader>
            <CardTitle className="text-cyber-purple">Code Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Language</span>
              <Select value={preferences.ai.codeLanguage} onValueChange={(v) => setPreferences(p => ({...p, ai: {...p.ai, codeLanguage: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Best Mode (strict)</span>
              <Switch checked={preferences.ai.bestModeDefault} onCheckedChange={(v) => setPreferences(p => ({...p, ai: {...p.ai, bestModeDefault: v}}))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Default output</span>
              <Select value={preferences.ai.outputMode} onValueChange={(v) => setPreferences(p => ({...p, ai: {...p.ai, outputMode: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="files">Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Include tests by default</span>
              <Switch checked={preferences.ai.includeTests} onCheckedChange={(v) => setPreferences(p => ({...p, ai: {...p.ai, includeTests: v}}))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Auto-retry on errors</span>
              <Switch checked={preferences.ai.autoRetry} onCheckedChange={(v) => setPreferences(p => ({...p, ai: {...p.ai, autoRetry: v}}))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Max retries</span>
              <Input className="w-20 text-right" type="number" min={0} max={5} value={preferences.ai.maxRetries} onChange={(e) => setPreferences(p => ({...p, ai: {...p.ai, maxRetries: Math.max(0, Math.min(5, Number(e.target.value)||0))}}))} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-panel border-cyber-cyan/30">
          <CardHeader>
            <CardTitle className="text-cyber-cyan">Image Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Provider</span>
              <Select value={preferences.image.provider} onValueChange={(v) => setPreferences(p => ({...p, image: {...p.image, provider: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="runway">Runway</SelectItem>
                  <SelectItem value="imagen">Imagen</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Size</span>
              <Select value={preferences.image.size} onValueChange={(v) => setPreferences(p => ({...p, image: {...p.image, size: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="512x512">512 x 512</SelectItem>
                  <SelectItem value="768x768">768 x 768</SelectItem>
                  <SelectItem value="1024x1024">1024 x 1024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Quality</span>
              <Select value={preferences.image.quality} onValueChange={(v) => setPreferences(p => ({...p, image: {...p.image, quality: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Safety filter</span>
              <Switch checked={preferences.image.safetyFilter} onCheckedChange={(v) => setPreferences(p => ({...p, image: {...p.image, safetyFilter: v}}))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Guidance</span>
              <Input className="w-24 text-right" type="number" min={1} max={20} value={preferences.image.guidance} onChange={(e) => setPreferences(p => ({...p, image: {...p.image, guidance: Math.max(1, Math.min(20, Number(e.target.value)||1))}}))} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-panel border-cyber-red/30">
          <CardHeader>
            <CardTitle className="text-cyber-red">Video Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Resolution</span>
              <Select value={preferences.video.resolution} onValueChange={(v) => setPreferences(p => ({...p, video: {...p.video, resolution: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Duration (sec)</span>
              <Input className="w-24 text-right" type="number" min={1} max={60} value={preferences.video.durationSec} onChange={(e) => setPreferences(p => ({...p, video: {...p.video, durationSec: Math.max(1, Math.min(60, Number(e.target.value)||1))}}))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">FPS</span>
              <Select value={String(preferences.video.fps)} onValueChange={(v) => setPreferences(p => ({...p, video: {...p.video, fps: Number(v) as 24|30}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Quality</span>
              <Select value={preferences.video.quality} onValueChange={(v) => setPreferences(p => ({...p, video: {...p.video, quality: v as any}}))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-panel border-cyber-yellow/30">
          <CardHeader>
            <CardTitle className="text-cyber-yellow">Downloads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Auto-zip generated files</span>
              <Switch checked={preferences.downloads.autoZip} onCheckedChange={(v) => setPreferences(p => ({...p, downloads: {...p.downloads, autoZip: v}}))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Include README summary</span>
              <Switch checked={preferences.downloads.includeReadme} onCheckedChange={(v) => setPreferences(p => ({...p, downloads: {...p.downloads, includeReadme: v}}))} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-panel border-cyber-purple/30">
          <CardHeader>
            <CardTitle className="text-cyber-purple">Mobile Targets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Generate iOS project</span>
              <Switch checked={preferences.mobile.generateIOS} onCheckedChange={(v) => setPreferences(p => ({...p, mobile: {...p.mobile, generateIOS: v}}))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Generate Android project</span>
              <Switch checked={preferences.mobile.generateAndroid} onCheckedChange={(v) => setPreferences(p => ({...p, mobile: {...p.mobile, generateAndroid: v}}))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-2">
        <Button asChild>
          <a href="/">Done</a>
        </Button>
      </div>
    </div>
  );
}
