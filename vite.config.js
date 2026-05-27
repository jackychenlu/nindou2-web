import { defineConfig } from "vite";
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { ensureClassicRuntimeBundle } from "./scripts/tools/ensure-classic-runtime-bundle.mjs";

function copyLegacyRuntime() {
  const root = process.cwd();
  const outDir = resolve(root, "dist");

  async function copyFileWithRetry(source, target, attempts = 6) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await copyFile(source, target);
        return;
      } catch (error) {
        const isBusy = error && (error.code === "EBUSY" || error.code === "EPERM");
        if (!isBusy || attempt === attempts) {
          throw error;
        }
        await new Promise((resolveWait) => setTimeout(resolveWait, 30 * attempt));
      }
    }
  }

  async function copyEntry(source, target) {
    const stats = await stat(source);
    if (stats.isDirectory()) {
      await mkdir(target, { recursive: true });
      for (const child of await readdir(source)) {
        await copyEntry(resolve(source, child), resolve(target, child));
      }
      return;
    }
    await mkdir(resolve(target, ".."), { recursive: true });
    await copyFileWithRetry(source, target);
  }

  return {
    name: "copy-legacy-runtime",
    async buildStart() {
      await ensureClassicRuntimeBundle({ quiet: true });
    },
    async closeBundle() {
      await mkdir(outDir, { recursive: true });
      for (const entry of ["assets", "scripts", "index.html", "style.css"]) {
        const target = resolve(outDir, entry);
        await copyEntry(resolve(root, entry), target);
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyLegacyRuntime()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "scripts/main.module.js"),
    },
  },
  server: {
    host: "127.0.0.1",
  },
  preview: {
    host: "127.0.0.1",
  },
});
