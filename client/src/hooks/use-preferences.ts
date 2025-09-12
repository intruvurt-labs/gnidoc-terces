import { useEffect, useState } from "react";

export type ProviderOption = "auto" | "gemini" | "openai" | "anthropic";
export type OutputMode = "code" | "preview" | "files";

export interface Preferences {
  general: {
    theme: "system" | "dark" | "light";
    telemetry: boolean;
    showAdvanced: boolean;
  };
  ai: {
    defaultProvider: ProviderOption;
    codeLanguage: "typescript" | "javascript";
    framework: "react";
    bestModeDefault: boolean;
    outputMode: OutputMode;
    includeTests: boolean;
    autoRetry: boolean;
    maxRetries: number; // 0-5
  };
  image: {
    provider: "runway" | "imagen" | "gemini";
    size: "512x512" | "768x768" | "1024x1024";
    quality: "standard" | "high";
    safetyFilter: boolean;
    guidance: number; // 1-20
  };
  video: {
    provider: "runway";
    resolution: "720p" | "1080p";
    durationSec: number; // 1-60
    fps: 24 | 30;
    quality: "standard" | "high";
  };
  downloads: {
    autoZip: boolean;
    includeReadme: boolean;
  };
  mobile: {
    generateIOS: boolean;
    generateAndroid: boolean;
  };
}

const DEFAULT_PREFERENCES: Preferences = {
  general: { theme: "dark", telemetry: false, showAdvanced: false },
  ai: {
    defaultProvider: "auto",
    codeLanguage: "typescript",
    framework: "react",
    bestModeDefault: true,
    outputMode: "code",
    includeTests: false,
    autoRetry: true,
    maxRetries: 2,
  },
  image: {
    provider: "runway",
    size: "1024x1024",
    quality: "high",
    safetyFilter: true,
    guidance: 14,
  },
  video: {
    provider: "runway",
    resolution: "1080p",
    durationSec: 10,
    fps: 24,
    quality: "standard",
  },
  downloads: { autoZip: true, includeReadme: true },
  mobile: { generateIOS: true, generateAndroid: true },
};

const STORAGE_KEY = "preferences";

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {}
  }, [preferences]);

  return { preferences, setPreferences };
}
