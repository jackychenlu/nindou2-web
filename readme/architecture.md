# 專案架構

本專案目前以 Vite module entry 啟動，`index.html` 只載入 `scripts/main.module.js`。遊戲 runtime 由 `scripts/runtime-bootstrap.module.mjs` 依序安裝各個 `install-*-globals.module.mjs`，舊 classic runtime manifest 目前是空陣列。

## 啟動流程

1. `index.html`
2. `scripts/main.module.js`
3. `scripts/runtime-bootstrap.module.mjs`
4. `scripts/bootstrap/install-*-globals.module.mjs`
5. `scripts/bootstrap/start-classic-app.module.mjs`

`scripts/load-classic-runtime.module.mjs` 仍保留相容入口；當 `CLASSIC_RUNTIME_SCRIPT_PATHS` 為空時會回傳 `mode: "none"`，不載入 classic bundle。

## 主要資料來源

- 全域設定與規則常數：`scripts/data/config.module.mjs`
- 武器：`scripts/data/weapons.module.mjs`
- 忍術定義與編輯器清單：`scripts/data/ninjutsu-definitions.module.mjs`
- 地圖物件：`scripts/data/map.module.mjs`
- 地圖、出生點、掉落設定：`scripts/data/config.module.mjs`
- 多語/房間文字：`scripts/data/locales.module.mjs`
- 素材、音效、影格來源：`scripts/data/assets.module.mjs`
- 規則模式：`scripts/data/rule-modes.module.mjs`
- 視覺微調：`scripts/data/render-tuning.module.mjs`

資料 bridge 仍由 `scripts/tools/sync-bridge.mjs` 管理。改資料後使用對應的 `pnpm sync:*` 指令，再跑測試。

## Runtime 模組

- App/房間啟動：`scripts/bootstrap/install-app-bootstrap-globals.module.mjs`
- 房間 UI、商店、忍術編輯器：`scripts/bootstrap/install-room-ui-globals.module.mjs`
- 開局與角色建立：`scripts/bootstrap/install-battle-setup-globals.module.mjs`
- 主迴圈與 DOM refs：`scripts/bootstrap/install-game-globals.module.mjs`
- 戰鬥流程與回房：`scripts/bootstrap/install-game-flow-globals.module.mjs`
- 格子、座標、阻擋判斷：`scripts/bootstrap/install-grid-globals.module.mjs`
- 狀態 helper：`scripts/bootstrap/install-state-helpers-globals.module.mjs`
- 移動規則：`scripts/bootstrap/install-movement-globals.module.mjs`
- 近戰、傷害、物件破壞：`scripts/bootstrap/install-combat-globals.module.mjs`
- 忍術、分身、錢鏢：`scripts/bootstrap/install-ninjutsu-globals.module.mjs`
- AI：`scripts/bootstrap/install-ai-globals.module.mjs`
- 道具：`scripts/bootstrap/install-consumables-globals.module.mjs`
- 音效/BGM：`scripts/bootstrap/install-audio-globals.module.mjs`

## Renderer 模組

- 場景、背景、格線：`scripts/bootstrap/install-scene-renderer-globals.module.mjs`
- 單位、血條、名字、眼睛、buff 外框：`scripts/bootstrap/install-unit-renderer-globals.module.mjs`
- 移動拖影與拖曳箭頭：`scripts/bootstrap/install-movement-renderer-globals.module.mjs`
- 地圖物件、武器動畫、錢鏢射出：`scripts/bootstrap/install-combat-renderer-globals.module.mjs`
- 忍術與道具特效：`scripts/bootstrap/install-effects-renderer-globals.module.mjs`
- HUD：`scripts/bootstrap/install-hud-renderer-globals.module.mjs`
- 倒數與結算 overlay：`scripts/bootstrap/install-overlay-renderer-globals.module.mjs`
- Pixi opt-in renderer：`scripts/bootstrap/install-pixi-renderer-globals.module.mjs`、`scripts/rendering/pixi-battle-renderer.module.mjs`

## 常用測試

- 全部測試：`pnpm test`
- Build：`pnpm build`
- 房間 UI：`node --test tests/install-room-ui-globals.test.mjs`
- 地圖/格子：`node --test tests/install-grid-globals.test.mjs tests/install-map-globals.test.mjs`
- 武器/戰鬥：`node --test tests/install-weapons-globals.test.mjs tests/install-combat-globals.test.mjs`
- 忍術：`node --test tests/install-ninjutsu-globals.test.mjs`
- 道具：`node --test tests/install-consumables-globals.test.mjs tests/consumables-module.test.js`
- AI：`node --test tests/install-ai-globals.test.mjs`
