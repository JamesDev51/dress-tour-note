import { connect } from "node:net";
import { fileURLToPath } from "node:url";
import { preview, type PreviewServer } from "vite";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));

function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port });
    const finish = (connected: boolean) => {
      socket.destroy();
      resolve(connected);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(2000, () => finish(false));
  });
}

/** A private production origin; closing it cannot stop the shared E2E server. */
export async function createIsolatedPreview() {
  const start = (port: number) =>
    preview({
      configFile: false,
      root: projectRoot,
      logLevel: "silent",
      build: { outDir: process.env.PW_PREVIEW_OUT_DIR ?? "dist" },
      preview: { host: "127.0.0.1", port, strictPort: true },
    });
  let server: PreviewServer | undefined = await start(0);
  const address = server.httpServer.address();
  if (!address || typeof address === "string") {
    await server.close();
    throw new Error("Isolated preview did not expose a TCP address.");
  }
  const port = address.port;
  const origin = `http://127.0.0.1:${port}`;

  return {
    origin,
    async stop() {
      if (!server) return;
      await server.close();
      server = undefined;
      if (await canConnect(port)) {
        throw new Error("The isolated preview is still reachable after stop.");
      }
    },
    async restart() {
      if (server) return;
      server = await start(port);
      if (!(await canConnect(port))) {
        throw new Error("The isolated preview did not restart.");
      }
    },
    async close() {
      await server?.close();
      server = undefined;
    },
  };
}

export type IsolatedPreview = Awaited<ReturnType<typeof createIsolatedPreview>>;
