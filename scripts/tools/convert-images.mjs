/**
 * convert-images.mjs
 *
 * 圖片轉換三步驟：
 *   1. pngquant  — 對所有 PNG 做有損壓縮（in-place）
 *   2. sharp     — map/ 資料夾有損 WebP（quality 85）
 *   3. sharp     — 其他素材資料夾無損 WebP
 *
 * 執行方式：
 *   npm run images:convert
 *   node scripts/tools/convert-images.mjs
 *
 * 選項：
 *   --dry-run   只列出待處理檔案，不實際轉換
 *   --force     即使已有 .webp 也重新轉換
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../");
const ASSETS_DIR = join(ROOT, "assets");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

// map/ → 有損 WebP
const LOSSY_FOLDERS = ["map"];
const LOSSY_QUALITY = 85;

// 其他素材 → 無損 WebP
const LOSSLESS_FOLDERS = [
  "_candidates",
  "characters",
  "consumables",
  "ninju",
  "room",
  "ui",
  "weapon",
];

// ─── 工具函式 ────────────────────────────────────────────────────────────────

function getAllFiles(dir, ext) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, ext));
    } else if (extname(entry.name).toLowerCase() === ext) {
      results.push(fullPath);
    }
  }
  return results;
}

function fileSizeKB(filePath) {
  try {
    return (statSync(filePath).size / 1024).toFixed(1);
  } catch {
    return "?";
  }
}

function formatElapsed(ms) {
  return ms >= 60000
    ? `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
    : `${(ms / 1000).toFixed(1)}s`;
}

// ─── Step 1：pngquant ────────────────────────────────────────────────────────

async function runPngquant() {
  console.log("\n── Step 1：pngquant 壓縮所有 PNG ──────────────────────────");

  const allFolders = [...LOSSY_FOLDERS, ...LOSSLESS_FOLDERS];
  const pngFiles = allFolders.flatMap((f) =>
    getAllFiles(join(ASSETS_DIR, f), ".png")
  );

  if (pngFiles.length === 0) {
    console.log("  找不到任何 PNG 檔案，跳過。");
    return;
  }

  console.log(`  找到 ${pngFiles.length} 個 PNG 檔案`);
  if (DRY_RUN) {
    pngFiles.forEach((f) => console.log(`  [dry] ${f}`));
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;
  let savedKB = 0;

  for (const file of pngFiles) {
    const beforeKB = parseFloat(fileSizeKB(file));
    const result = spawnSync("pngquant", [
      "--force",
      "--ext", ".png",
      "--quality=65-85",
      "--",
      file,
    ]);
    if (result.status === 0) {
      const afterKB = parseFloat(fileSizeKB(file));
      savedKB += Math.max(0, beforeKB - afterKB);
      success++;
    } else if (result.status === 98 || result.status === 99) {
      // 98 = 品質達標不需壓縮；99 = 已壓縮過
      skipped++;
    } else {
      console.warn(`  ⚠ pngquant 失敗 (exit ${result.status}): ${file}`);
      failed++;
    }
  }

  console.log(
    `  結果：壓縮 ${success}、跳過 ${skipped}、失敗 ${failed}` +
      (savedKB > 0 ? `，節省約 ${savedKB.toFixed(0)} KB` : "")
  );
}

// ─── Step 2：有損 WebP（map/）───────────────────────────────────────────────

async function convertLossyWebP() {
  console.log(
    `\n── Step 2：有損 WebP 轉換（map/，quality=${LOSSY_QUALITY}）──────────────`
  );

  const pngFiles = LOSSY_FOLDERS.flatMap((f) =>
    getAllFiles(join(ASSETS_DIR, f), ".png")
  );

  if (pngFiles.length === 0) {
    console.log("  找不到任何 PNG 檔案，跳過。");
    return;
  }

  let converted = 0;
  let skipped = 0;
  let failed = 0;
  const convertedFiles = [];

  for (const file of pngFiles) {
    const outFile = file.replace(/\.png$/i, ".webp");
    if (!FORCE && existsSync(outFile)) {
      skipped++;
      convertedFiles.push(file); // 已有 .webp，原檔同樣可刪
      continue;
    }
    if (DRY_RUN) {
      console.log(`  [dry] ${file} → ${outFile}`);
      converted++;
      convertedFiles.push(file);
      continue;
    }
    try {
      await sharp(file).webp({ quality: LOSSY_QUALITY }).toFile(outFile);
      converted++;
      convertedFiles.push(file);
    } catch (err) {
      console.warn(`  ⚠ 轉換失敗 ${file}: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `  結果：轉換 ${converted}、已存在跳過 ${skipped}、失敗 ${failed}`
  );
  return convertedFiles;
}

// ─── Step 3：無損 WebP（其他資料夾）─────────────────────────────────────────

async function convertLosslessWebP() {
  console.log("\n── Step 3：無損 WebP 轉換（其他資料夾）───────────────────────");

  const pngFiles = LOSSLESS_FOLDERS.flatMap((f) =>
    getAllFiles(join(ASSETS_DIR, f), ".png")
  );

  if (pngFiles.length === 0) {
    console.log("  找不到任何 PNG 檔案，跳過。");
    return;
  }

  let converted = 0;
  let skipped = 0;
  let failed = 0;
  const convertedFiles = [];

  for (const file of pngFiles) {
    const outFile = file.replace(/\.png$/i, ".webp");
    if (!FORCE && existsSync(outFile)) {
      skipped++;
      convertedFiles.push(file); // 已有 .webp，原檔同樣可刪
      continue;
    }
    if (DRY_RUN) {
      console.log(`  [dry] ${file} → ${outFile}`);
      converted++;
      convertedFiles.push(file);
      continue;
    }
    try {
      await sharp(file).webp({ lossless: true }).toFile(outFile);
      converted++;
      convertedFiles.push(file);
    } catch (err) {
      console.warn(`  ⚠ 轉換失敗 ${file}: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `  結果：轉換 ${converted}、已存在跳過 ${skipped}、失敗 ${failed}`
  );
  return convertedFiles;
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

// ─── Step 4：刪除已轉換的原始 PNG ────────────────────────────────────────────

function deleteOriginalPngs(files) {
  console.log("\n── Step 4：刪除原始 PNG ────────────────────────────────────────");

  if (files.length === 0) {
    console.log("  沒有可刪除的原始 PNG。");
    return;
  }

  let deleted = 0;
  let failed = 0;

  for (const file of files) {
    if (DRY_RUN) {
      console.log(`  [dry] 刪除 ${file}`);
      deleted++;
      continue;
    }
    try {
      unlinkSync(file);
      deleted++;
    } catch (err) {
      console.warn(`  ⚠ 刪除失敗 ${file}: ${err.message}`);
      failed++;
    }
  }

  console.log(`  結果：刪除 ${deleted}、失敗 ${failed}`);
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== 圖片轉換工具" + (DRY_RUN ? "（dry-run 模式）" : "") + " ===");
  const startTime = Date.now();

  await runPngquant();
  const lossyConverted = await convertLossyWebP();
  const losslessConverted = await convertLosslessWebP();

  const allConverted = [...(lossyConverted ?? []), ...(losslessConverted ?? [])];
  deleteOriginalPngs(allConverted);

  console.log(`\n完成，耗時 ${formatElapsed(Date.now() - startTime)}`);
}

main().catch((err) => {
  console.error("執行失敗:", err);
  process.exit(1);
});
