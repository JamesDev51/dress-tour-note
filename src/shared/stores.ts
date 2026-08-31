import { create } from 'zustand'
import type { SaveState } from '../domain/types'

interface SaveStore {
  state: SaveState
  lastSavedAt: string | null
  errorMessage: string | null
  setSaving: () => void
  setSaved: () => void
  setError: (message: string, quota?: boolean) => void
}

export const useSaveStore = create<SaveStore>((set) => ({
  state: 'saved',
  lastSavedAt: null,
  errorMessage: null,
  setSaving: () => set({ state: 'saving', errorMessage: null }),
  setSaved: () => set({ state: 'saved', lastSavedAt: new Date().toISOString(), errorMessage: null }),
  setError: (message, quota = false) =>
    set({ state: quota ? 'quotaExceeded' : 'error', errorMessage: message }),
}))

export type ToastKind = 'info' | 'success' | 'error'

interface ToastState {
  message: string
  kind: ToastKind
  visible: boolean
  show: (message: string, kind?: ToastKind) => void
  hide: () => void
}

let toastTimer: number | undefined

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  kind: 'info',
  visible: false,
  show: (message, kind = 'info') => {
    if (toastTimer) window.clearTimeout(toastTimer)
    set({ message, kind, visible: true })
    toastTimer = window.setTimeout(() => set({ visible: false }), 3200)
  },
  hide: () => set({ visible: false }),
}))

interface UndoState {
  message: string
  visible: boolean
  undoAction: (() => Promise<void> | void) | null
  offer: (message: string, action: () => Promise<void> | void) => void
  undo: () => Promise<void>
  dismiss: () => void
}

let undoTimer: number | undefined

export const useUndoStore = create<UndoState>((set, get) => ({
  message: '',
  visible: false,
  undoAction: null,
  offer: (message, action) => {
    if (undoTimer) window.clearTimeout(undoTimer)
    set({ message, visible: true, undoAction: action })
    undoTimer = window.setTimeout(() => set({ visible: false, undoAction: null }), 5000)
  },
  undo: async () => {
    if (undoTimer) window.clearTimeout(undoTimer)
    const action = get().undoAction
    set({ visible: false, undoAction: null })
    if (action) await action()
  },
  dismiss: () => {
    if (undoTimer) window.clearTimeout(undoTimer)
    set({ visible: false, undoAction: null })
  },
}))
