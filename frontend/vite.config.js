import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load .env from the project root (one level up from frontend/)
  const env = loadEnv(mode, process.cwd() + "/..", "");

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: "http://backend:3001",
          changeOrigin: true,
        },
      },
    },
    define: {
      "process.env.CLOUD_ONLY": JSON.stringify(env.CLOUD_ONLY || process.env.CLOUD_ONLY || "false"),
    },
  };
});
