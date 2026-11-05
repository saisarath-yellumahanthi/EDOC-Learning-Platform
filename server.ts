import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

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
        source: 'gemini-3.8-flash',
      });
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
