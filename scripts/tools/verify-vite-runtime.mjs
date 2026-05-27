import { chromium } from "playwright";
import { build, createServer, preview } from "vite";
import { buildClassicRuntimeBundle } from "./build-classic-runtime-bundle.mjs";

const VITE_HOST = "127.0.0.1";
const VITE_PORT = 4173;
const PREVIEW_PORT = 4273;

async function startViteServer() {
  const server = await createServer({
    server: {
      host: VITE_HOST,
      port: VITE_PORT,
      strictPort: false,
    },
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === "object" && address ? address.port : VITE_PORT;
  return {
    label: "dev",
    server,
    targetUrl: `http://${VITE_HOST}:${port}/index.html`,
  };
}

async function startPreviewServer() {
  await build();
  const server = await preview({
    preview: {
      host: VITE_HOST,
      port: PREVIEW_PORT,
      strictPort: false,
    },
  });
  const address = server.httpServer?.address();
  const port = typeof address === "object" && address ? address.port : PREVIEW_PORT;
  return {
    label: "preview",
    server,
    targetUrl: `http://${VITE_HOST}:${port}/index.html`,
  };
}

async function verifyPage(targetUrl) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    if (!response || !response.ok()) {
      throw new Error(`failed to open ${targetUrl}`);
    }
    const waitMs = 30000;
    const startedAt = Date.now();
    while (Date.now() - startedAt < waitMs) {
      const ready = await page.evaluate(() => {
        return Boolean(globalThis.NindouRuntimeBootstrap)
          && Boolean(globalThis.NindouModuleProbe)
          && Boolean(globalThis.NindouModuleProbeHealth);
      });
      if (ready) {
        break;
      }
      if (pageErrors.length > 0 || consoleErrors.length > 0) {
        break;
      }
      await page.waitForTimeout(200);
    }
    const bootstrapReady = await page.evaluate(() => {
      return Boolean(globalThis.NindouRuntimeBootstrap)
        && Boolean(globalThis.NindouModuleProbe)
        && Boolean(globalThis.NindouModuleProbeHealth);
    });
    if (!bootstrapReady) {
      const runtimeSnapshot = await page.evaluate(() => {
        const bootstrap = globalThis.NindouRuntimeBootstrap || null;
        const hasProbe = Boolean(globalThis.NindouModuleProbe);
        const hasHealth = Boolean(globalThis.NindouModuleProbeHealth);
        return { bootstrap, hasProbe, hasHealth };
      });
      throw new Error(`runtime bootstrap globals not ready: ${JSON.stringify({
        runtimeSnapshot,
        pageErrors,
        consoleErrors,
      })}`);
    }
    const report = await page.evaluate(() => {
      const bootstrap = globalThis.NindouRuntimeBootstrap || {};
      const health = globalThis.NindouModuleProbeHealth || {};
      return {
        runtimeMode: bootstrap.mode,
        runtimeReady: bootstrap.isReady,
        missingGlobals: Array.isArray(bootstrap.missingGlobals) ? bootstrap.missingGlobals : [],
        probeSynced: Boolean(globalThis.isNindouModuleProbeSynced),
        probeStatus: health.status || "",
        unsyncedKeys: Array.isArray(health.unsyncedKeys) ? health.unsyncedKeys : [],
      };
    });
    if (!report.runtimeReady) {
      throw new Error(`runtime bootstrap not ready, missing globals: ${report.missingGlobals.join(", ")}`);
    }
    if (!report.probeSynced) {
      throw new Error(`module probe not synced, unsynced keys: ${report.unsyncedKeys.join(", ")}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`page errors detected: ${pageErrors.join(" | ")}`);
    }
    if (consoleErrors.length > 0) {
      throw new Error(`console errors detected: ${consoleErrors.join(" | ")}`);
    }
    return report;
  } finally {
    await browser.close();
  }
}

async function main() {
  await buildClassicRuntimeBundle();
  const runtimes = [
    await startViteServer(),
    await startPreviewServer(),
  ];
  const reports = [];
  try {
    for (const runtime of runtimes) {
      const report = await verifyPage(runtime.targetUrl);
      reports.push({
        mode: runtime.label,
        url: runtime.targetUrl,
        ...report,
      });
    }
    console.log(JSON.stringify({ ok: true, reports }, null, 2));
  } finally {
    for (const runtime of runtimes) {
      await runtime.server.close();
    }
  }
}

await main();
