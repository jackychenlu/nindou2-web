import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureClassicRuntimeBundle } from "./ensure-classic-runtime-bundle.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".wav": "audio/wav",
};

function argValue(name, fallback) {
  const prefix = `${name}=`;
  const token = process.argv.slice(2).find((value) => value === name || value.startsWith(prefix));
  if (!token) return fallback;
  if (token === name) {
    const index = process.argv.indexOf(name);
    return process.argv[index + 1] || fallback;
  }
  return token.slice(prefix.length) || fallback;
}

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const relativePath = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const absolutePath = path.resolve(repoRoot, relativePath);
  if (!absolutePath.startsWith(repoRoot + path.sep) && absolutePath !== repoRoot) {
    return null;
  }
  return absolutePath;
}

const host = argValue("--host", "127.0.0.1");
const port = Number(argValue("--port", "5173"));

const server = createServer(async (request, response) => {
  const filePath = resolveRequestPath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Length": info.size,
      "Content-Type": type,
      "Cache-Control": "no-cache",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

await ensureClassicRuntimeBundle({ quiet: true });

server.listen(port, host, () => {
  console.log(`Nindou2 local server: http://${host}:${port}/index.html`);
});
