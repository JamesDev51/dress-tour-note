import appStyles from "./styles/index.css?inline";

const reactDevToolsEnabled =
  import.meta.env.DEV && import.meta.env.VITE_DISABLE_REACT_DEVTOOLS !== "1";

if (reactDevToolsEnabled) {
  void import("react-grab");
  void import("react-scan");
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { setupPwa } from "./pwa";

const styleElement = document.createElement("style");
styleElement.id = "dress-note-styles";
styleElement.textContent = appStyles;
document.head.append(styleElement);

setupPwa();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
