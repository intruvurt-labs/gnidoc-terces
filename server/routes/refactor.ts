import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const ai = new GoogleGenAI({
  apiKey:
    process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
});

const planSchema = z.object({
  actions: z.array(z.union([
    z.object({ type: z.literal('rename_file'), from: z.string(), to: z.string() }),
    z.object({ type: z.literal('move_to_dir'), pattern: z.string(), dir: z.string() }),
    z.object({ type: z.literal('update_package_json'), merge: z.record(z.any()) }),
    z.object({ type: z.literal('convert_js_to_ts'), include: z.array(z.string()).optional() })
  ])).max(50)
});

const requestSchema = z.object({
  projectId: z.string().min(1),
  prompt: z.string().min(1)
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId, prompt } = requestSchema.parse(req.body);

    // Load file list (names only) — DO NOT send content to AI
    const files = await storage.getFilesByProject(projectId);
    const fileNames = files.map(f => f.fileName);

    // Build strict system prompt to avoid exfiltration
    const systemInstruction = [
      'You are a refactor planner. Output ONLY a minimal JSON plan of actions.',
      'NEVER include source code, secrets, or any file contents.',
      'Allowed actions: rename_file {from,to}; move_to_dir {pattern,dir}; update_package_json {merge}; convert_js_to_ts {include?}.',
      'Prefer high-signal, low-risk changes. Keep under 50 actions.'
    ].join('\n');

    let plan = { actions: [] as any[] };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        config: { systemInstruction, responseMimeType: 'application/json' },
        // Provide ONLY prompt and file name list (no contents)
        contents: JSON.stringify({ prompt, files: fileNames })
      });
      const text = response.text || '{}';
      const parsed = planSchema.safeParse(JSON.parse(text));
      if (parsed.success) plan = parsed.data;
    } catch {}

    // Execute plan locally (no network)
    const updatedFiles = new Map<string, typeof files[number]>();
    const getOrClone = (f: typeof files[number]) =>
      updatedFiles.get(f.id) || (updatedFiles.set(f.id, { ...f }), updatedFiles.get(f.id)!);

    for (const action of plan.actions) {
      switch (action.type) {
        case 'rename_file': {
          const file = files.find(f => f.fileName === action.from);
          if (file) {
            const u = getOrClone(file);
            u.fileName = action.to;
          }
          break;
        }
        case 'move_to_dir': {
          const matched = files.filter(f => f.fileName.includes(action.pattern));
          for (const file of matched) {
            const u = getOrClone(file);
            const base = u.fileName.split('/').pop() || u.fileName;
            u.fileName = `${action.dir.replace(/\/$/, '')}/${base}`;
          }
          break;
        }
        case 'update_package_json': {
          const pkg = files.find(f => f.fileName === 'package.json');
          if (pkg && pkg.content) {
            try {
              const pkgJson = JSON.parse(pkg.content);
              const merged = deepMerge(pkgJson, action.merge || {});
              const u = getOrClone(pkg);
              u.content = JSON.stringify(merged, null, 2);
              u.size = u.content.length;
            } catch {}
          }
          break;
        }
        case 'convert_js_to_ts': {
          const includes = new Set(action.include || []);
          const candidates = files.filter(f => f.fileName.endsWith('.js') || f.fileName.endsWith('.jsx'))
            .filter(f => includes.size === 0 || includes.has(f.fileName));
          for (const file of candidates) {
            const u = getOrClone(file);
            // Heuristic: rename extension only; leave content untouched to avoid breakage
            u.fileName = u.fileName.replace(/\.jsx?$/, m => (m === '.jsx' ? '.tsx' : '.ts'));
          }
          break;
        }
      }
    }

    // Persist changes
    const toUpdate = Array.from(updatedFiles.values());
    for (const f of toUpdate) {
      await storage.updateFile(f.id, {
        fileName: f.fileName,
        content: f.content ?? null,
        size: f.content ? f.content.length : f.size
      } as any);
    }

    res.json({ status: 'ok', applied: plan.actions.length, actions: plan.actions, updated: toUpdate.length });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Invalid request' });
  }
});

function isObject(x: any) { return x && typeof x === 'object' && !Array.isArray(x); }
function deepMerge(a: any, b: any): any {
  if (!isObject(b)) return b;
  const out: any = Array.isArray(a) ? [...a] : { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (isObject(v) && isObject(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = v;
  }
  return out;
}

export const refactorRoutes = router;
