import { useCallback, useRef } from "react";

export function usePendingWrites() {
  const pending = useRef(new Set<Promise<unknown>>());

  const run = useCallback(async <T>(write: () => Promise<T>): Promise<T> => {
    const promise = write();
    pending.current.add(promise);
    try {
      return await promise;
    } finally {
      pending.current.delete(promise);
    }
  }, []);

  const waitForPending = useCallback(async () => {
    while (pending.current.size > 0) {
      await Promise.all([...pending.current]);
    }
  }, []);

  return { run, waitForPending };
}
