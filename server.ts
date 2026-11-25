import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  PRIMARY_SERVER_GEMINI_MODEL,
  ServerGeminiError,
  generateServerGeminiContent,
  isServerGeminiConfigured,
  validateGeminiGeneratePayload,
} from './server/gemini.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Lightweight status endpoint (returns boolean only; never exposes any key)
  app.get('/api/gemini/status', (_req, res) => {
    res.json({
      serverConfigured: isServerGeminiConfigured(),
      model: PRIMARY_SERVER_GEMINI_MODEL,
    });
  });

  // Unified server-side Gemini generation endpoint used by AI Tutor, Quiz, DSA, and Terminal tools
  app.post('/api/gemini/generate', async (req, res) => {
    const validation = validateGeminiGeneratePayload(req.body);
    if (!validation.ok) {
      res.status(400).json({
        error: validation.error,
        code: 'INVALID_REQUEST',
      });
      return;
    }

    const rawUserKeyHeader = req.header('x-user-gemini-key');
    const overrideKey =
      typeof rawUserKeyHeader === 'string' && rawUserKeyHeader.trim().length <= 512
        ? rawUserKeyHeader.trim()
        : undefined;

    try {
      const result = await generateServerGeminiContent(validation.data, overrideKey);
      res.json(result);
    } catch (err: unknown) {
      if (err instanceof ServerGeminiError) {
        console.error(
          `[Gemini API] status=${err.status} code=${err.code} message=${err.message}`
        );
        res.status(err.status).json({
          error: err.message,
          code: err.code,
          status: err.status,
        });
        return;
      }

      const message =
        err instanceof Error ? err.message : 'Unexpected server error calling Gemini.';
      console.error(`[Gemini API] status=500 message=${message}`);
      res.status(500).json({
        error: message,
        code: 'API_ERROR',
        status: 500,
      });
    }
  });

  // Compatibility alias for POST /api/tutor
  app.post('/api/tutor', async (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const normalizedBody =
      !('contents' in body) && Array.isArray((body as { messages?: unknown }).messages)
        ? {
            contents: (
              body as { messages: Array<{ role?: string; content?: string }> }
            ).messages.map((m) => ({
              role: m?.role === 'assistant' || m?.role === 'model' ? 'model' : 'user',
              parts: [{ text: typeof m?.content === 'string' ? m.content : '' }],
            })),
            systemInstruction:
              typeof (body as { systemInstruction?: unknown }).systemInstruction === 'string'
                ? (body as { systemInstruction: string }).systemInstruction
                : undefined,
          }
        : body;

    const validation = validateGeminiGeneratePayload(normalizedBody);
    if (!validation.ok) {
      res.status(400).json({
        error: validation.error,
        code: 'INVALID_REQUEST',
      });
      return;
    }

    const rawUserKeyHeader = req.header('x-user-gemini-key');
    const overrideKey =
      typeof rawUserKeyHeader === 'string' && rawUserKeyHeader.trim().length <= 512
        ? rawUserKeyHeader.trim()
        : undefined;

    try {
      const result = await generateServerGeminiContent(validation.data, overrideKey);
      res.json({
        reply: result.text,
        text: result.text,
        model: result.model,
      });
    } catch (err: unknown) {
      if (err instanceof ServerGeminiError) {
        console.error(
          `[Gemini Tutor API] status=${err.status} code=${err.code} message=${err.message}`
        );
        res.status(err.status).json({
          error: err.message,
          code: err.code,
          status: err.status,
        });
        return;
      }

      const message =
        err instanceof Error ? err.message : 'Unexpected server error calling Gemini.';
      console.error(`[Gemini Tutor API] status=500 message=${message}`);
      res.status(500).json({
        error: message,
        code: 'API_ERROR',
        status: 500,
      });
    }
  });

  // Return JSON 404 for unknown API routes instead of SPA index.html
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Serve sql.js WebAssembly binaries (both sql-wasm.wasm and sql-wasm-browser.wasm for sql.js v1.15+)
  app.get(['/sql-wasm.wasm', '/sql-wasm-browser.wasm'], (req, res) => {
    const filename = path.basename(req.path);
    const wasmPath = path.resolve(__dirname, 'node_modules/sql.js/dist', filename);
    if (fs.existsSync(wasmPath)) {
      res.setHeader('Content-Type', 'application/wasm');
      res.sendFile(wasmPath);
    } else {
      res.status(404).send(`${filename} not found`);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EDOC server listening on http://localhost:${PORT}`);
  });
}

startServer();
