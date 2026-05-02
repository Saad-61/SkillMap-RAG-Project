import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load .env variables so we can use them in the config itself
  const env = loadEnv(mode, process.cwd(), "VITE_");

  const backendPort = env.VITE_BACKEND_PORT ?? "8010";
  const frontendPort = parseInt(env.VITE_PORT ?? "5173", 10);

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});

