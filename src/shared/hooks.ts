import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { subscribeDataChanged } from '../lib/db/changeBus'

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  reload: () => void
}

export function useDbQuery<T>(loader: () => Promise<T>, deps: DependencyList): QueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [version, setVersion] = useState(0)
  const activeRef = useRef(true)

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  useEffect(() => subscribeDataChanged(reload), [reload])

  useEffect(() => {
    activeRef.current = true
    setLoading(true)
    setError(null)
    loader()
      .then((value) => {
        if (activeRef.current) setData(value)
      })
      .catch((reason: unknown) => {
        if (activeRef.current) setError(reason instanceof Error ? reason : new Error(String(reason)))
      })
      .finally(() => {
        if (activeRef.current) setLoading(false)
      })
    return () => {
      activeRef.current = false
    }
    // Loader is intentionally provided by callers as useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, version, ...deps])

  return { data, loading, error, reload }
}

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [blob])

  return url
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
