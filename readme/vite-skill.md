# Vite / Module Runtime

## 現況

- `index.html` 只載入 `scripts/main.module.js`。
- `scripts/runtime-bootstrap.module.mjs` 是啟動核心。
- gameplay runtime 由 `scripts/bootstrap/install-*-globals.module.mjs` 安裝。
- `scripts/classic-runtime-manifest.module.mjs` 的 runtime script 清單目前是空的。
- `scripts/load-classic-runtime.module.mjs` 保留相容入口；manifest 為空時回傳 `mode: "none"`。

## 常用指令

```powershell
pnpm dev
pnpm build
pnpm test
pnpm verify:vite
```

雙擊遊玩使用 repo 根目錄的 `啟動遊戲.cmd`，它會啟動 `scripts/tools/serve-game.mjs`。

## 資料同步

資料以 `.module.mjs` 為主要來源。需要產生 bridge 時使用：

```powershell
pnpm sync:weapons
pnpm sync:config-nindou
pnpm sync:ninjutsu-definitions
pnpm sync:locales
pnpm sync:map
pnpm sync:rule-modes
pnpm sync:bridges
```

## 模組邊界

- Data：`scripts/data/*.module.mjs`
- Runtime installers：`scripts/bootstrap/install-*-globals.module.mjs`
- Importable system helpers：`scripts/systems/*.module.mjs`
- Probe：`scripts/probe/*.module.mjs`
- Bridge tooling：`scripts/tools/sync-bridge.mjs` 與 `scripts/tools/bridge-definitions/*`

## 原則

- 不新增 classic runtime manifest entry。
- 不新增只為相容舊 `<script>` 順序存在的檔案。
- 新功能優先接到 module data 或 installer。
- 改資料後跑對應 `pnpm sync:*`，再跑 `pnpm test`。
