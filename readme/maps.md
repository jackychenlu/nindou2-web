# 地圖與格子

## 入口

- 房間地圖選單：`index.html` 的 `#roomMapSelect`
- 地圖定義與出生點：`scripts/data/config.module.mjs`
- 地圖物件 builder：`scripts/data/map.module.mjs`
- 素材 key 與圖片來源：`scripts/data/assets.module.mjs`
- 座標、阻擋、物件查詢：`scripts/bootstrap/install-grid-globals.module.mjs`
- 場景繪製：`scripts/bootstrap/install-scene-renderer-globals.module.mjs`
- 地圖物件繪製：`scripts/bootstrap/install-combat-renderer-globals.module.mjs`

## 座標

玩家看到的是 display cell，runtime 內部使用 internal cell。新增地圖或調整出生點時，優先使用既有的 `displayCellCoord()` / `internalCellCoord()` helper，不要在 UI 或資料中各自硬算。

## 目前地圖

- `evil-castle-1`
- `evil-castle-2`
- `country-10`

## 修改流程

1. 在 `scripts/data/config.module.mjs` 調整 `roomMapDefinitions`、出生點或 BGM。
2. 在 `scripts/data/map.module.mjs` 調整物件位置、佔格、尺寸與偏移。
3. 在 `scripts/data/assets.module.mjs` 補素材來源。
4. 跑 `pnpm test`。若只改地圖，可先跑：

```powershell
node --test tests/install-grid-globals.test.mjs tests/install-map-globals.test.mjs tests/install-scene-renderer-globals.test.mjs tests/install-combat-renderer-globals.test.mjs
```
