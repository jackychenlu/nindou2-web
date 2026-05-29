# 忍豆風雲2 單機版

本專案是《忍豆風雲2》單機版瀏覽器原型，採用 Vite + ES 模組開發，整合舊版 classic runtime 與現代模組化 bootstrap 入口。

## 主要目標

- 以瀏覽器可執行的單機版遊戲形式呈現《忍豆風雲2》。
- 透過 `scripts/bootstrap` 及 `scripts/data` 組織遊戲邏輯、資料、UI、渲染與音效。
- 支援本機開發、Vite 即時預覽與靜態伺服器啟動。
- 保留 legacy classic runtime 相容入口，並以 module bootstrap 作為現代化主線。

## 目前狀態

- `index.html` 作為單一 entry，載入 `scripts/main.module.js`。
- 遊戲啟動流程由 `scripts/runtime-bootstrap.module.mjs` 依序安裝各項 globals。
- `scripts/load-classic-runtime.module.mjs` 仍保留相容用法，但若 manifest 為空則回傳 `mode: "none"`。
- 支援房間編輯、隊伍設定、武器選擇、忍術編輯、戰鬥啟動、AI 控制、道具與 HUD 顯示。
- 目前遊戲介面以中文為主。

## 快速開始

### 安裝

使用 pnpm 安裝套件：

```bash
pnpm install
```

### 開發伺服器

```bash
pnpm dev
```

預設會啟動 Vite，開啟瀏覽器後可直接測試遊戲畫面。

### 直接啟動遊戲

可執行專案根目錄的 `啟動遊戲.cmd`，它會啟動本機靜態伺服器並開啟遊戲頁面。

### 建置

```bash
pnpm build
```

### 本機預覽

```bash
pnpm preview
```

### 驗證

```bash
pnpm test
```

或針對特定模組測試：

```bash
node --test tests/install-room-ui-globals.test.mjs
```

## 常用指令

- `pnpm dev`：啟動 Vite 開發環境
- `pnpm build`：建立生產內容
- `pnpm preview`：預覽 build 結果
- `pnpm test`：執行測試
- `pnpm check`：檢查 bootstrap module 語法
- `pnpm sync:bridges`：同步 bridge 資料
- `pnpm sync:weapons`、`pnpm sync:map`、`pnpm sync:ninjutsu-definitions`、`pnpm sync:locales`、`pnpm sync:rule-modes`：各種資料同步
- `pnpm images:convert`：圖片轉換工具

## 核心目錄

### 入口與 bootstrap

- `index.html`：主頁面與 CSS 引入。
- `scripts/main.module.js`：遊戲入口。
- `scripts/runtime-bootstrap.module.mjs`：現代化 bootstrap，安裝全域模組。
- `scripts/load-classic-runtime.module.mjs`：classic runtime 相容層。
- `scripts/bootstrap/install-*-globals.module.mjs`：遊戲行為、UI、渲染、音效、AI 的安裝入口。

### 遊戲資料

- `scripts/data/config.module.mjs`：遊戲規則、地圖設定、忍術規則與道具常數。
- `scripts/data/weapons.module.mjs`：武器資料。
- `scripts/data/ninjutsu-definitions.module.mjs`：忍術定義與編輯表。
- `scripts/data/map.module.mjs`：地圖資料。
- `scripts/data/locales.module.mjs`：文字與多語內容。
- `scripts/data/rule-modes.module.mjs`：遊戲模式與規則。
- `scripts/data/assets.module.mjs`：素材與音效來源。
- `scripts/data/render-tuning.module.mjs`：渲染微調參數。

### 系統實作

- `scripts/systems/`：各種遊戲系統實作，包含 AI、戰鬥、消耗品、外觀、音效、格子運算等。
- `scripts/tools/`：開發工具腳本，例如 bridge 同步、圖片轉換、靜態伺服器、驗證工具。

### 測試

- `tests/`：單元測試與整合測試入口。

### 資產

- `assets/`：圖片、音效、UI、地圖、角色素材等遊戲資源。

## 重要參考文件

專案內已拆出多份說明文件：

- `readme/architecture.md`：架構、啟動流程與 bootstrap 入口。
- `readme/vite-skill.md`：Vite / ES module 遷移細節。
- `readme/maps.md`：地圖、格子、碰撞與地圖資料。
- `readme/weapons.md`：武器資料與戰鬥設計。
- `readme/consumables.md`：道具、商店與消耗品系統。
- `readme/ai.md`：AI 設計與行為模式。
- `readme/changelog.md`：開發歷史與版本備忘。
- `readme/ninjutsu-table.csv`：忍術資料表與編輯資料。

## 開發建議

- 小改版先跑精準測試；大改版再跑 `pnpm test`。
- 修改 Vite、`scripts/main.module.js`、bootstrap 安裝流程或舊版 bridge 時，務必同步更新 `readme/vite-skill.md`。
- 新資料或新模式先放入 `scripts/data/*`，行為邏輯放入 `scripts/systems/*` 或 `scripts/bootstrap/install-*-globals.module.mjs`。
- 若需要新增資料同步，請使用對應 `pnpm sync:*` 指令。

## 問題排查

- 若遊戲無法啟動，先檢查 `pnpm dev` 日誌是否有模組載入錯誤。
- 若 UI 或房間畫面顯示異常，先檢查 `scripts/bootstrap/install-room-ui-globals.module.mjs` 與 `style.css`。
- 若武器、忍術或地圖資料錯亂，先檢查 `scripts/data/*` 與 `readme/*` 對應資料描述。

## 授權

本專案目前未在 `package.json` 中指定專案作者與專案描述。請根據實際需求補上 `author`、`description` 與 `license`。
