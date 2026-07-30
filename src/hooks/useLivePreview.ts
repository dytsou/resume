import { useEffect, useRef, useState } from 'react';

interface CompileResult {
  success: boolean;
  html?: string;
  error?: string | null;
  log?: string;
}

interface LivePreviewState {
  html: string | null;
  error: string | null;
  log: string | null;
  compiling: boolean;
  compileOk: boolean;
}

const DEBOUNCE_MS = 650;

export function useLivePreview(
  source: string,
  filename: string,
  id: string
): LivePreviewState {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compileOk, setCompileOk] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setCompiling(true);

      try {
        const res = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source, filename, id }),
          signal: controller.signal,
        });
        const result = (await res.json()) as CompileResult;
        if (controller.signal.aborted) return;

        if (result.success && result.html) {
          setHtml(result.html);
          setError(null);
          setLog(result.log ?? null);
          setCompileOk(true);
        } else {
          setError(result.error ?? 'Compile failed');
          setLog(result.log ?? null);
          setCompileOk(false);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Compile request failed');
        setCompileOk(false);
      } finally {
        if (!controller.signal.aborted) setCompiling(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [source, filename, id]);

  return { html, error, log, compiling, compileOk };
}
