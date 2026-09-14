import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal data-fetching hook: runs `fn` on mount and whenever `deps` change,
 * exposing `{ data, loading, error, refetch }`. Stale results are discarded so
 * fast filter changes don't clobber newer responses.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  opts: { enabled?: boolean } = {},
) {
  const enabled = opts.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      setData(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((result) => alive && setData(result))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { data, loading, error, refetch: run, setData };
}
