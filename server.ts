import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API health route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Starting in production mode serving static assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running successfully at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("[SERVER] Startup failed:", error);
  process.exit(1);
});
