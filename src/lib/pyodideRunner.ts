/**
 * Real in-browser Python 3 execution engine powered by Pyodide (WebAssembly).
 * - Lazily loaded from CDN on first Python run and cached in memory.
 * - Supports true inline interactive `input()` via an `inputQueue` replay mechanism
 *   using a custom BaseException (`_AwaitingInput`) — zero `window.prompt()`,
 *   zero `SharedArrayBuffer`, and zero fake regex simulation.
 */

export const PYODIDE_CDN_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
export const PYODIDE_SCRIPT_URL = `${PYODIDE_CDN_BASE}pyodide.js`;
export const PYODIDE_ENGINE_LABEL = 'Pyodide (Real Python 3)';

interface PyodideProxyLike {
  toJs?: (options?: Record<string, unknown>) => unknown;
  destroy?: () => void;
}

interface PyodideInstance {
  globals: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
    delete: (key: string) => void;
  };
  runPythonAsync: (code: string) => Promise<unknown>;
}

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<PyodideInstance>;
  }
}

export interface PyodideRunResult {
  status: 'completed' | 'awaiting_input' | 'error';
  /** Newly emitted stdout since the last replayed input prompt */
  newStdout: string;
  /** Full stdout produced across the entire script execution */
  fullStdout: string;
  /** Real Python stderr / traceback (filtered to user code frames) */
  stderr: string;
  /** Exact prompt text passed to input(prompt) when paused */
  prompt: string;
  exitCode: number;
  executionTimeMs: number;
}

let cachedPyodide: PyodideInstance | null = null;
let pyodideLoadPromise: Promise<PyodideInstance> | null = null;

export function isPyodideLoaded(): boolean {
  return cachedPyodide !== null;
}

function loadPyodideScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new Error('Pyodide can only run in a browser environment.')
    );
  }

  if (typeof window.loadPyodide === 'function') {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${PYODIDE_SCRIPT_URL}"]`
  );
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      if (typeof window.loadPyodide === 'function') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () =>
          reject(
            new Error(
              'Failed to load Pyodide Python 3 runtime from CDN. Check your internet connection and try again.'
            )
          ),
        { once: true }
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PYODIDE_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          'Failed to load Pyodide Python 3 runtime from CDN. Check your internet connection and try again.'
        )
      );
    document.head.appendChild(script);
  });
}

export async function getOrLoadPyodide(
  onLoadingRuntime?: () => void
): Promise<PyodideInstance> {
  if (cachedPyodide) {
    return cachedPyodide;
  }

  if (!pyodideLoadPromise) {
    onLoadingRuntime?.();
    pyodideLoadPromise = (async () => {
      await loadPyodideScript();
      if (typeof window.loadPyodide !== 'function') {
        throw new Error(
          'Pyodide script loaded but window.loadPyodide is unavailable.'
        );
      }
      const instance = await window.loadPyodide({
        indexURL: PYODIDE_CDN_BASE,
      });
      cachedPyodide = instance;
      return instance;
    })().catch((err) => {
      pyodideLoadPromise = null;
      throw err;
    });
  } else {
    onLoadingRuntime?.();
  }

  return pyodideLoadPromise;
}

/**
 * Python harness executed inside Pyodide.
 * Uses BaseException for `_AwaitingInput` so user `except Exception:` blocks
 * never accidentally swallow an interactive input pause.
 * Tracks `_input_index == _total_queued` so replayed stdout from earlier prompts
 * is never duplicated in the terminal UI.
 */
const PYODIDE_EXECUTION_HARNESS = `
import builtins
import io
import json
import sys
import traceback

class _AwaitingInput(BaseException):
    def __init__(self, prompt_text=""):
        super().__init__(prompt_text)
        self.prompt_text = prompt_text

def _edoc_run_user_code(user_code, input_queue_json):
    input_queue = json.loads(input_queue_json)
    total_queued = len(input_queue)
    state = {"idx": 0}

    full_stdout_parts = []
    new_stdout_parts = []
    stderr_parts = []

    class _StdoutCapture(io.TextIOBase):
        def write(self, s):
            if not isinstance(s, str):
                s = str(s)
            full_stdout_parts.append(s)
            if state["idx"] == total_queued:
                new_stdout_parts.append(s)
            return len(s)
        def flush(self):
            pass

    class _StderrCapture(io.TextIOBase):
        def write(self, s):
            if not isinstance(s, str):
                s = str(s)
            stderr_parts.append(s)
            return len(s)
        def flush(self):
            pass

    orig_stdout = sys.stdout
    orig_stderr = sys.stderr
    orig_stdin = sys.stdin
    orig_input = builtins.input

    def _custom_input(prompt=""):
        prompt_str = "" if prompt is None else str(prompt)
        if state["idx"] < total_queued:
            val = str(input_queue[state["idx"]])
            state["idx"] += 1
            return val
        raise _AwaitingInput(prompt_str)

    sys.stdout = _StdoutCapture()
    sys.stderr = _StderrCapture()
    sys.stdin = io.StringIO("\\n".join(str(x) for x in input_queue) + ("\\n" if input_queue else ""))
    builtins.input = _custom_input

    status = "completed"
    pending_prompt = ""
    exit_code = 0

    try:
        compiled = compile(user_code, "main.py", "exec")
        exec_globals = {
            "__name__": "__main__",
            "__file__": "main.py",
            "__builtins__": builtins,
        }
        exec(compiled, exec_globals, exec_globals)
    except _AwaitingInput as wait_exc:
        status = "awaiting_input"
        pending_prompt = wait_exc.prompt_text
        exit_code = 0
    except SystemExit as sys_exit:
        code = sys_exit.code
        if code is None or code == 0:
            status = "completed"
            exit_code = 0
        elif isinstance(code, int):
            status = "error"
            exit_code = code
            stderr_parts.append(f"SystemExit: {code}\\n")
        else:
            status = "error"
            exit_code = 1
            stderr_parts.append(f"{code}\\n")
    except SyntaxError as syn_err:
        status = "error"
        exit_code = 1
        formatted = "".join(traceback.format_exception(type(syn_err), syn_err, None))
        stderr_parts.append(formatted)
    except BaseException as exc:
        status = "error"
        exit_code = 1
        tb = exc.__traceback__
        # Skip internal harness frames so traceback starts cleanly at main.py
        while tb is not None and tb.tb_frame.f_code.co_filename != "main.py":
            tb = tb.tb_next
        formatted = "".join(traceback.format_exception(type(exc), exc, tb))
        stderr_parts.append(formatted)
    finally:
        sys.stdout = orig_stdout
        sys.stderr = orig_stderr
        sys.stdin = orig_stdin
        builtins.input = orig_input

    return json.dumps({
        "status": status,
        "newStdout": "".join(new_stdout_parts),
        "fullStdout": "".join(full_stdout_parts),
        "stderr": "".join(stderr_parts),
        "prompt": pending_prompt,
        "exitCode": exit_code,
    })
`;

let harnessInstalledOn: PyodideInstance | null = null;

export async function runPythonWithPyodide(params: {
  code: string;
  inputQueue: string[];
  onLoadingRuntime?: () => void;
}): Promise<PyodideRunResult> {
  const startTime = performance.now();

  if (!params.code.trim()) {
    return {
      status: 'error',
      newStdout: '',
      fullStdout: '',
      stderr: 'SyntaxError: Source code buffer is empty.',
      prompt: '',
      exitCode: 1,
      executionTimeMs: 1,
    };
  }

  try {
    const pyodide = await getOrLoadPyodide(params.onLoadingRuntime);
    if (harnessInstalledOn !== pyodide) {
      await pyodide.runPythonAsync(PYODIDE_EXECUTION_HARNESS);
      harnessInstalledOn = pyodide;
    }

    const execStart = performance.now();
    pyodide.globals.set('_edoc_tmp_code', params.code);
    pyodide.globals.set('_edoc_tmp_queue', JSON.stringify(params.inputQueue));

    let rawJson: unknown;
    try {
      rawJson = await pyodide.runPythonAsync(
        '_edoc_run_user_code(_edoc_tmp_code, _edoc_tmp_queue)'
      );
    } finally {
      try {
        pyodide.globals.delete('_edoc_tmp_code');
        pyodide.globals.delete('_edoc_tmp_queue');
      } catch {
        // ignore cleanup errors
      }
    }

    const jsonString =
      typeof rawJson === 'string'
        ? rawJson
        : typeof (rawJson as PyodideProxyLike)?.toJs === 'function'
        ? String((rawJson as PyodideProxyLike).toJs!())
        : String(rawJson ?? '{}');

    if (typeof (rawJson as PyodideProxyLike)?.destroy === 'function') {
      (rawJson as PyodideProxyLike).destroy!();
    }

    const parsed = JSON.parse(jsonString) as {
      status: 'completed' | 'awaiting_input' | 'error';
      newStdout: string;
      fullStdout: string;
      stderr: string;
      prompt: string;
      exitCode: number;
    };

    return {
      status: parsed.status,
      newStdout: parsed.newStdout ?? '',
      fullStdout: parsed.fullStdout ?? '',
      stderr: parsed.stderr ?? '',
      prompt: parsed.prompt ?? '',
      exitCode: Number(parsed.exitCode ?? 0),
      executionTimeMs: Math.max(1, Math.round(performance.now() - execStart)),
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unexpected error while running Python in Pyodide.';
    return {
      status: 'error',
      newStdout: '',
      fullStdout: '',
      stderr: `RuntimeError: ${message}`,
      prompt: '',
      exitCode: 1,
      executionTimeMs: Math.max(1, Math.round(performance.now() - startTime)),
    };
  }
}
