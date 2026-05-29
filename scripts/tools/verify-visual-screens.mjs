import { mkdir } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const host = process.env.VISUAL_HOST || "127.0.0.1";
const port = Number(process.env.VISUAL_PORT || 4182);
const baseUrl = process.env.VISUAL_URL || `http://${host}:${port}/index.html`;
const outputDir = path.resolve(repoRoot, process.env.VISUAL_OUTPUT_DIR || "artifacts/visual");

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for visual server at ${url}${lastError ? `: ${lastError.message}` : ""}`);
}

function startServer() {
  if (process.env.VISUAL_URL) return null;
  const isWindows = process.platform === "win32";
  const command = isWindows ? (process.env.ComSpec || "cmd.exe") : "pnpm";
  const args = isWindows
    ? ["/d", "/s", "/c", `pnpm exec vite --host ${host} --port ${port}`]
    : ["exec", "vite", "--host", host, "--port", String(port)];
  const child = spawn(command, args, {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  child.stdout?.on("data", () => {});
  child.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function stopServer(child) {
  if (!child) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
  await Promise.race([
    once(child, "exit"),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true });
}

async function run() {
  await mkdir(outputDir, { recursive: true });
  const server = startServer();
  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);
    await screenshot(page, "room");

    await page.evaluate(() => document.querySelector("#teamEditBtn")?.click());
    await page.waitForTimeout(500);
    await screenshot(page, "ninju-editor");

    await page.evaluate(() => {
      const editor = document.querySelector("#ninjuEditor");
      if (editor) editor.hidden = true;
      document.querySelector("#battleStartBtn")?.click();
    });
    await page.waitForTimeout(1200);
    await screenshot(page, "battle-canvas");

    await page.evaluate(() => document.querySelector("#rendererToggle")?.click());
    await page.waitForTimeout(1200);
    await screenshot(page, "battle-pixi");

    await browser.close();
    console.log(`Visual screenshots written to ${path.relative(repoRoot, outputDir)}`);
  } finally {
    await stopServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
