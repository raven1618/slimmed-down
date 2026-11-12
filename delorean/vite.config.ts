import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { apiMiddleware } from "./server/api";

// The crew API runs inside the Vite dev server, so `npm run dev` is all you need.
export default defineConfig({
  plugins: [
    react(),
    {
      name: "delorean-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => void apiMiddleware(req, res, next));
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => void apiMiddleware(req, res, next));
      },
    },
  ],
});
