import { useCallback, useRef } from "react";

export function usePendingWrites() {
  const pending = useRef(new Set<Promise<unknown>>());
  const tail = useRef<Promise<unknown> | undefined>(undefined);

  const run = useCallback(async <T>(write: () => Promise<T>): Promise<T> => {
    const promise = tail.current ? tail.current.then(write, write) : write();
    tail.current = promise;
    pending.current.add(promise);
    try {
      return await promise;
    } finally {
      pending.current.delete(promise);
      if (tail.current === promise) tail.current = undefined;
    }
  }, []);

  const waitForPending = useCallback(async () => {
    while (pending.current.size > 0) {
      await Promise.all([...pending.current]);
    }
  }, []);

  const hasPending = useCallback(() => pending.current.size > 0, []);
  return { run, waitForPending, hasPending };
}
