import { registerSW } from "virtual:pwa-register";
import { useUIStore } from "./stores/uiStore";
export function setupPwa() {
  const update = registerSW({
    immediate: true,
    onNeedRefresh() {
      useUIStore.getState().setPwaUpdate(true, async () => {
        await update(true);
        useUIStore.getState().setPwaUpdate(false);
      });
    },
    onOfflineReady() {
      const ui = useUIStore.getState();
      if (!ui.toast) ui.showToast("오프라인에서도 사용할 준비가 됐어요.");
    },
  });
}
