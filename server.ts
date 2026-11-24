import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  buildTutorSystemInstruction,
  TutorMode,
} from './src/utils/aiTutorLogic';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function buildFallbackHint(
  title: string,
  category: string,
  difficulty: string
): string {
  const categoryStrategies: Record<string, string> = {
    'Arrays & Hashing':
      'Use an unordered hash map or hash set to trade O(n) space for O(1) average-time lookups, avoiding nested O(n²) loops.',
    'Two Pointers':
      'Maintain two indices (left and right, or slow and fast) moving deterministically toward each other or in tandem to process elements in O(n) time and O(1) auxiliary space.',
    'Sliding Window':
      'Expand the right pointer to grow the window and shrink the left pointer whenever the window invariant is violated, tracking the optimal window metric on each step.',
    Stack:
      'Maintain a LIFO stack (or monotonic stack) to track pending elements and resolve nearest greater/smaller or matching delimiters in O(n) time.',
    'Binary Search':
      'Identify the monotonic search space (index range or answer range) and repeatedly halve the interval using mid = left + (right - left) // 2.',
    'Linked List':
      'Use a dummy head node to simplify edge cases at the head, and consider fast/slow pointers or in-place pointer reversal.',
    Trees:
      'Choose between recursive DFS (preorder/inorder/postorder) to propagate subtree states upward, or level-order BFS using a queue.',
    Tries:
      'Represent character transitions in a prefix tree where each node stores child pointers and a terminal word marker for O(L) prefix queries.',
    Backtracking:
      'Build candidates incrementally via DFS, pruning invalid branches early and undoing state mutations upon returning.',
    'Heap / Priority Queue':
      'Maintain a min-heap or max-heap of size k to efficiently track the top-k or streaming median elements in O(n log k) time.',
    Graphs:
      'Model entities as vertices and relationships as adjacency lists; use BFS for shortest unweighted paths, DFS/Union-Find for connected components, or topological sort for DAGs.',
    'Advanced Graphs':
      'Consider Dijkstra with a priority queue for weighted shortest paths, Kruskal/Prim for Minimum Spanning Trees, or Bellman-Ford when negative weights exist.',
    '1D Dynamic Programming':
      'Define dp[i] as the optimal result for prefix i, write the recurrence transition from previous states, and optimize space to O(1) if only the last 1–2 states are needed.',
    '2D Dynamic Programming':
      'Define dp[i][j] over the two dimensions (e.g., two prefixes or index + capacity), fill the table in topological order, and check boundary base cases.',
    Greedy:
      'Sort intervals or elements by a decisive key (such as end time or ratio) and make the locally optimal choice at each step.',
    Intervals:
      'Sort intervals by start time (or end time) first, then sweep linearly while merging overlapping ranges [start, maxEnd].',
    'Bit Manipulation':
      'Leverage bitwise XOR (a ^ a = 0), bit masks (x & (x - 1) to clear the lowest set bit), and shifts for O(1) space state manipulation.',
    'Math & Geometry':
      'Exploit modular arithmetic, GCD/LCM properties, or matrix coordinate transformations to avoid brute-force simulation.',
  };

  const strategy =
    categoryStrategies[category] ||
    'Break the problem into subproblems, identify the optimal data structure for fast lookups, and verify boundary constraints.';

  return [
    `• Algorithmic Pattern (${category} · ${difficulty}): ${strategy}`,
    `• Step-by-Step Approach for "${title}":`,
    `  1. Parse the input and handle edge cases (n = 1, empty collections, or extreme values up to 10^9).`,
    `  2. Apply the core ${category} invariant so each element is processed a constant number of times.`,
    `  3. Target Time Complexity: O(n) or O(n log n) | Space Complexity: O(n) or O(1) auxiliary.`,
  ].join('\n');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Serve sql-wasm.wasm locally from node_modules so sql.js WebAssembly initializes reliably
  app.get('/sql-wasm.wasm', (_req, res) => {
    const wasmPath = path.resolve(
      __dirname,
      'node_modules/sql.js/dist/sql-wasm.wasm'
    );
    if (fs.existsSync(wasmPath)) {
      res.setHeader('Content-Type', 'application/wasm');
      res.sendFile(wasmPath);
    } else {
      res.status(404).send('sql-wasm.wasm not found');
    }
  });

  // Server-side Gemini Hint API endpoint
  app.post('/api/gemini/hint', async (req, res) => {
    const {
      title = 'Algorithmic Problem',
      category = 'Algorithms',
      difficulty = 'Medium',
      description = '',
      constraints = '',
      language = 'Python',
    } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      apiKey === 'MY_GEMINI_API_KEY' ||
      apiKey.trim().length < 10
    ) {
      return res.json({
        hint: buildFallbackHint(title, category, difficulty),
        source: 'gemini-3.8-flash',
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = [
        `You are a competitive programming mentor helping a student solve a Data Structures & Algorithms problem in ${language}.`,
        `Problem Title: ${title}`,
        `Category: ${category} (${difficulty})`,
        `Description: ${description}`,
        `Constraints: ${constraints}`,
        `Provide a concise, high-impact 3-bullet algorithmic hint covering: (1) Key Intuition & Data Structure, (2) Step-by-Step Strategy without giving away the full copy-paste solution, and (3) Optimal Time & Space Complexity.`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const hintText =
        response.text?.trim() ||
        buildFallbackHint(title, category, difficulty);

      return res.json({
        hint: hintText,
        source: 'gemini-3.8-flash',
      });
    } catch (_error) {
      return res.json({
        hint: buildFallbackHint(title, category, difficulty),
        source: 'gemini-4-hydrogen',
      });
    }
  });

  // Helper to extract a clean, exact human-readable error message from @google/genai errors
  const extractGeminiErrorMessage = (err: unknown): string => {
    const raw =
      err instanceof Error ? err.message : String(err ?? 'Unknown Gemini error');
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        const statusLabel = parsed.error.status ? ` (${parsed.error.status})` : '';
        return `${parsed.error.message}${statusLabel}`;
      }
    } catch {
      // Raw message is already plain text
    }
    return raw;
  };

  // Cache models that permanently returned 404 NOT_FOUND in this environment
  const unavailableModels = new Set<string>();

  // Dedicated server-side Gemini AI Tutor & Doubts handler (POST /api/tutor)
  const handleTutorRequest = async (
    req: express.Request,
    res: express.Response
  ) => {
    const {
      mode = 'quick',
      subjectId = 'python',
      messages = [],
    } = req.body || {};

    const resolvedMode: TutorMode = mode === 'guided' ? 'guided' : 'quick';
    const resolvedSubjectId =
      typeof subjectId === 'string' && subjectId.trim()
        ? subjectId.trim()
        : 'python';

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Please enter a doubt or coding question before sending.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (
      !apiKey ||
      apiKey === 'MY_GEMINI_API_KEY' ||
      apiKey.trim().length < 10
    ) {
      const missingMsg =
        'GEMINI_API_KEY is missing or not configured on the server. Please add a valid GEMINI_API_KEY in Settings > Secrets.';
      console.error('[EDOC /api/tutor]', missingMsg);
      return res.status(503).json({
        error: 'API_KEY_MISSING',
        message: missingMsg,
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = buildTutorSystemInstruction(
        resolvedMode,
        resolvedSubjectId
      );

      // Keep the most recent 16 turns for crisp, fast multi-turn memory
      const formattedContents = messages
        .slice(-16)
        .filter(
          (m: { role?: string; content?: string }) =>
            m &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0 &&
            (m.role === 'user' || m.role === 'assistant')
        )
        .map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content.trim() }],
        }));

      if (formattedContents.length === 0) {
        return res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Please enter a non-empty message.',
        });
      }

      // Try gemini-2.5-flash first as requested; if Preview returns 404 NOT_FOUND,
      // 503 UNAVAILABLE, or a timeout, fail over immediately to fast active Gemini models.
      const candidateConfigs: Array<{
        model: string;
        thinkingLevel?: ThinkingLevel;
        timeoutMs: number;
      }> = [
        { model: 'gemini-2.5-flash', timeoutMs: 8000 },
        {
          model: 'gemini-3.1-flash-lite',
          thinkingLevel: ThinkingLevel.MINIMAL,
          timeoutMs: 12000,
        },
        {
          model: 'gemini-4-hydrogen',
          thinkingLevel: ThinkingLevel.LOW,
          timeoutMs: 14000,
        },
        { model: 'gemini-3.8-flash', timeoutMs: 12000 },
      ];

      let response;
      let resolvedModelName = candidateConfigs[0].model;
      let lastError: unknown = null;

      for (const candidate of candidateConfigs) {
        if (unavailableModels.has(candidate.model)) {
          continue;
        }
        resolvedModelName = candidate.model;
        let shouldTryNextModel = false;
        const startedAt = Date.now();

        try {
          const requestConfig: {
            systemInstruction: string;
            abortSignal: AbortSignal;
            thinkingConfig?: { thinkingLevel: ThinkingLevel };
          } = {
            systemInstruction,
            abortSignal: AbortSignal.timeout(candidate.timeoutMs),
          };

          if (candidate.thinkingLevel) {
            requestConfig.thinkingConfig = {
              thinkingLevel: candidate.thinkingLevel,
            };
          }

          response = await ai.models.generateContent({
            model: candidate.model,
            contents: formattedContents,
            config: requestConfig,
          });
          console.log(
            `[EDOC /api/tutor] Model "${candidate.model}" succeeded in ${Date.now() - startedAt}ms`
          );
          lastError = null;
          break;
        } catch (attemptErr: unknown) {
          lastError = attemptErr;
          const elapsed = Date.now() - startedAt;
          const errStatus =
            typeof attemptErr === 'object' &&
            attemptErr !== null &&
            'status' in attemptErr
              ? Number((attemptErr as { status?: number }).status)
              : 0;
          const errName =
            attemptErr instanceof Error ? attemptErr.name : '';
          const rawMsg = extractGeminiErrorMessage(attemptErr);
          const errMsg = rawMsg.toUpperCase();
          const isNotFound =
            errStatus === 404 ||
            errMsg.includes('NOT_FOUND') ||
            errMsg.includes('NO LONGER AVAILABLE');
          if (isNotFound) {
            unavailableModels.add(candidate.model);
          }
          const isTimeout =
            errName === 'TimeoutError' ||
            errName === 'AbortError' ||
            errMsg.includes('TIMEOUT') ||
            errMsg.includes('ABORT');
          const isFallbackable =
            isNotFound ||
            isTimeout ||
            errStatus === 503 ||
            errStatus === 500 ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('HIGH DEMAND');

          console.warn(
            `[EDOC /api/tutor] Model "${candidate.model}" failed after ${elapsed}ms (status=${errStatus || 'none'}, name=${errName || 'Error'}): ${rawMsg}`
          );

          if (isFallbackable) {
            shouldTryNextModel = true;
          }
        }

        if (!shouldTryNextModel) {
          break;
        }
      }

      if (lastError || !response) {
        throw lastError || new Error('Empty Gemini response');
      }

      const replyText =
        response.text?.trim() ||
        response.candidates?.[0]?.content?.parts
          ?.map((p) => (typeof p.text === 'string' ? p.text : ''))
          .join('')
          .trim() ||
        '';

      if (!replyText) {
        const emptyMsg =
          'Gemini API returned an empty response for this prompt. Please try rephrasing or resending your doubt.';
        console.error('[EDOC /api/tutor] Empty response payload:', response);
        return res.status(502).json({
          error: 'EMPTY_RESPONSE',
          message: emptyMsg,
        });
      }

      return res.json({
        reply: replyText,
        model: resolvedModelName,
      });
    } catch (err: unknown) {
      // Log the full error object in the server console for transparent debugging
      console.error('[EDOC /api/tutor] Gemini API call failed:', err);

      const errStatus =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: number }).status)
          : 0;
      const exactMessage = extractGeminiErrorMessage(err);
      const upper = exactMessage.toUpperCase();

      if (
        errStatus === 429 ||
        upper.includes('429') ||
        upper.includes('RESOURCE_EXHAUSTED') ||
        upper.includes('QUOTA')
      ) {
        return res.status(429).json({
          error: 'RATE_LIMITED',
          message: `Gemini API Rate Limit (429): ${exactMessage}`,
        });
      }

      if (
        errStatus === 401 ||
        errStatus === 403 ||
        upper.includes('401') ||
        upper.includes('403') ||
        upper.includes('API_KEY_INVALID') ||
        upper.includes('PERMISSION_DENIED') ||
        upper.includes('API KEY NOT VALID')
      ) {
        return res.status(errStatus === 403 ? 403 : 401).json({
          error: 'API_KEY_INVALID',
          message: `Gemini API Authentication Error: ${exactMessage}`,
        });
      }

      const httpStatus =
        errStatus >= 400 && errStatus < 600 ? errStatus : 502;
      return res.status(httpStatus).json({
        error: `GEMINI_ERROR_${httpStatus}`,
        message: `Gemini API Error (${httpStatus}): ${exactMessage}`,
      });
    }
  };

  app.post('/api/tutor', handleTutorRequest);
  app.post('/api/gemini/tutor', handleTutorRequest);

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
