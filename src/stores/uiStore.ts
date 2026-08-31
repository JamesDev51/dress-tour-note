import { create } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved" | "error";
interface UIState {
  saveStatus: SaveStatus;
  toast?: string;
  pwaUpdateAvailable: boolean;
  updateSW?: () => Promise<void>;
  setSaveStatus: (status: SaveStatus) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  setPwaUpdate: (available: boolean, updateSW?: () => Promise<void>) => void;
}
export const useUIStore = create<UIState>((set) => ({
  saveStatus: "idle",
  pwaUpdateAvailable: false,
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  showToast: (toast) => {
    set({ toast });
    window.setTimeout(() => set({ toast: undefined }), 2200);
  },
  clearToast: () => set({ toast: undefined }),
  setPwaUpdate: (pwaUpdateAvailable, updateSW) =>
    set({ pwaUpdateAvailable, updateSW }),
}));
