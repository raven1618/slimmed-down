/**
 * Production server: serves the built client from dist/ and the /api routes.
 * Run `npm run build` first, then `npm start`.
 */
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiMiddleware, engineMode } from "./api";
import { MODEL } from "./agent";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const PORT = Number(process.env.PORT) || 8787;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

async function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  let urlPath: string;
  try {
    urlPath = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  let file = path.join(ROOT, urlPath);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
  } catch {
    file = path.join(ROOT, "index.html"); // single-page app fallback
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found. Did you run `npm run build`?");
  }
}

http
  .createServer((req, res) => {
    void apiMiddleware(req, res, () => void serveStatic(req, res));
  })
  .listen(PORT, () => {
    console.log(`De Lorean running on http://localhost:${PORT} (${engineMode()} mode, model ${MODEL})`);
  });
