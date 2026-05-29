# 忍豆風雲2單機版：地圖與座標說明

這份文件集中記錄地圖、座標、阻擋格、地圖物件、出生點與地圖測試。`readme/skill.md` 只保留入口摘要。

---

## 座標系

- 玩家座標 `[1,1]` 是左下角第一格。
- 往右是 `[2,1]`。
- 往上是 `[1,2]`。
- `internalCellCoord()` / `displayCellCoord()` 負責玩家座標與內部座標互轉。
- `buildMapObjects()` 內：
- `add()` 用玩家視角座標。
- `addInternal()` 用內部陣列座標。

---

## 地圖系統入口

主要位置：

- 地圖選單：`index.html -> #roomMapSelect`
- 地圖定義：`scripts/data/config.js -> roomMapDefinitions`
- 固定出生點：`scripts/data/config.js -> startingDisplayCellsBySlot`
- 地圖素材：`scripts/data/assets.js -> imageSources`
- 地圖物件：`scripts/data/map.js -> buildMapObjects()`
- 座標/阻擋：`scripts/systems/grid.js -> currentRoomMapDefinition()`、`isPermanentObstacle()`
- 圖層順序：`scripts/bootstrap/install-game-globals.module.mjs -> draw()`、`drawBackdrop()`、`drawMapMaskOverlay()`、`drawMapObjects()`

目前地圖：

- `極惡城之一` -> `evil-castle-1`。
- `極惡城之二` -> `evil-castle-2`，目前已拆成獨立物件配置。
- `鄉野之十` -> `country-10`，目前預設地圖。

---

## 極惡城之一

素材 key：

- 地板：`assets/map/極惡城/1/1.webp`，key 是 `evilCastleGround`。
- 遮罩：`assets/map/極惡城/1/2.webp`，key 是 `evilCastleMask`。
- 033 障礙物(藍色大火堆，占地六格)：`assets/map/極惡城/1/033-01.webp`，key 是 `evilCastleBlock033`。
- 035 障礙物(骨頭)：`assets/map/極惡城/1/035-01.webp`，key 是 `evilCastleBlock035`。
- 036 障礙物(紅藍柱)：`assets/map/極惡城/1/036-01.webp`，key 是 `evilCastleBlock036`。
- door1 障礙物：`assets/map/map/極惡城1/door-overlay.webp`，key 是 `evilCastleDoor1`。

圖層與座標：

- 圖層順序是地板最底層、遮罩次之、玩家/攻擊/特效在遮罩上方。
- `coordinateBottomInternalY: 11`，所以極惡城的玩家座標比舊地圖往下偏移一格。
- 可走內部列是 `playableInternalYMin: 2` 到 `playableInternalYMax: 11`。
- 額外不可走玩家座標：`[1,1]`、`[18,1]`、`[1,10]`、`[18,10]`、`[1,18]`。

固定出生點：

- `blue1 [9,3]`
- `blue2 [8,1]`
- `blue3 [9,1]`
- `blue4 [10,1]`
- `grey1 [6,9]`
- `grey2 [8,8]`
- `grey3 [11,8]`
- `grey4 [13,9]`

障礙物：

- 033 障礙物只擋路、不破壞、不掉落道具。
- 033 左側擋路範圍：`[3,3]` 到 `[5,4]`，共 6 格。
- 033 右側擋路範圍：`[14,3]` 到 `[16,4]`，共 6 格。
- 035 障礙物只擋路、不破壞、不掉落道具；每個物件佔 1 格，位置是 `[2,5]`、`[17,5]`、`[5,2]`、`[14,2]`、`[3,7]`、`[16,7]`。
- 036 障礙物只擋路、不破壞、不掉落道具；每個物件佔 1 格，位置是 `[7,8]`、`[7,9]`、`[7,10]`、`[12,8]`、`[12,9]`、`[12,10]`。
- door1 障礙物只擋路、不破壞、不掉落道具；佔 8 格，區間是 `[8,12]` 到 `[11,11]`，也就是 x=8..11、y=11..12。

視覺調整：

- 033 顯示大小與偏移在 `scripts/data/map.js -> evilCastleBlock033DrawOptions` 內：`drawWidthCells`、`drawHeightCells`、`drawOffsetX`、`drawOffsetY`、`drawAnchorY`。
- 033 的視覺 scale / offset 是人工校準值，不要用碰撞格去推圖片大小。
- 目前 033 顯示值：`drawWidthCells: 4.5`、`drawHeightCells: 4`、`drawOffsetX: 10`、`drawOffsetY: -80`、`drawAnchorY: 0.5`。

---

## 極惡城之二

素材 key：

- 地板：`assets/map/極惡城/2/1.webp`，key 是 `evilCastle2Ground`。
- 遮罩：`assets/map/極惡城/2/2.webp`，key 是 `evilCastle2Mask`。

目前規則：

- 這一版先只換地板與遮罩素材。
- `roomMapDefinitions["evil-castle-2"].objectLayout` 已獨立指向 `evil-castle-2`。
- 目前 `033 / 035 / 036 / door1` 的初始位置與 offset 是從 `極惡城之一` 複製過來，但後續應只改 `evil-castle-2` 自己那組。
- `033-01.webp` 覆蓋格已針對第二張改成左側 `[3,5]` 到 `[5,4]`、右側 `[14,5]` 到 `[16,4]`。
- 另一個 `035` 已針對第二張從 `[5,2]` 移到 `[7,6]`。
- `035` 另有一格已針對第二張從 `[14,2]` 移到 `[12,6]`。

---

## 近期紀錄

### 2026-05-21 極惡城地圖

- 房間地圖下拉選單已接到實際地圖切換，預設是 `極惡城之一`。
- 極惡城用 `assets/map/極惡城/1/1.webp` 當地板、`assets/map/極惡城/1/2.webp` 當遮罩。
- 極惡城的遮罩在地板之上、玩家之下；不要再把遮罩畫到玩家/攻擊/特效上方。
- 極惡城座標系比舊圖往下偏移一格：舊底部那列顯示成 y=2，新的最底列是 y=1。
- 極惡城 033 障礙物用 `assets/map/極惡城/1/033-01.webp`，目前兩個物件各擋 6 格：`[3,3]` 到 `[5,4]`、`[14,3]` 到 `[16,4]`。
- 極惡城 035 障礙物用 `assets/map/極惡城/1/035-01.webp`，目前 6 個單格物件：`[2,5]`、`[17,5]`、`[5,2]`、`[14,2]`、`[3,7]`、`[16,7]`。
- 極惡城 036 障礙物用 `assets/map/極惡城/1/036-01.webp`，目前 6 個單格物件：`[7,8]`、`[7,9]`、`[7,10]`、`[12,8]`、`[12,9]`、`[12,10]`。

### 2026-05-22 極惡城之二 033/035 微調

- `033-01.webp` 的覆蓋格已改成左側 `[3,5]` 到 `[5,4]`、右側 `[14,5]` 到 `[16,4]`。
- `035` 其中一格已從 `[5,2]` 移到 `[7,6]`。
- `035` 另一格已從 `[14,2]` 移到 `[12,6]`。
- 這次只改 `極惡城之二`；`極惡城之一` 維持原配置。
- 極惡城 036 障礙物用 `assets/map/極惡城/1/036-01.webp`，目前 6 個單格物件：`[7,8]`、`[7,9]`、`[7,10]`、`[12,8]`、`[12,9]`、`[12,10]`。

### 2026-05-22 極惡城之一物件還原

- `極惡城之一` 的 035 已還原為新增 `極惡城之二` 前的位置：`[2,5]`、`[17,5]`、`[5,2]`、`[14,2]`、`[3,7]`、`[16,7]`。
- `極惡城之一` 的 036 已還原為新增 `極惡城之二` 前的 6 格：`[7,8]`、`[7,9]`、`[7,10]`、`[12,8]`、`[12,9]`、`[12,10]`。
- `033-01.webp` 的視覺 offset 已拆到各自 map layout 內；`極惡城之一` 和 `極惡城之二` 之後要分開調。
- `evil-castle-2` 已不再共用 `evil-castle-1` 的 `objectLayout`；後續兩張地圖的位置可獨立修改。
- 極惡城 door1 障礙物用 `assets/map/map/極惡城1/door-overlay.webp`，目前佔 8 格：`[8,12]` 到 `[11,11]`。
- 極惡城固定出生點：`blue1 [9,3]`、`blue2 [8,1]`、`blue3 [9,1]`、`blue4 [10,1]`、`grey1 [6,9]`、`grey2 [8,8]`、`grey3 [11,8]`、`grey4 [13,9]`。
- 極惡城地圖規則有測試覆蓋在 `tests/grid.test.js`；改座標、阻擋、物件佔格後至少跑 `node --test .\tests\grid.test.js` 和 `npm test`。

### 2026-05-22 極惡城之二

- 新增 `極惡城之二`，key 是 `evil-castle-2`。
- 目前地板指向 `assets/map/極惡城/2/1.webp`，遮罩指向 `assets/map/極惡城/2/2.webp`。
- 預設地圖已切回 `鄉野之十`。
- `objectLayout` 已獨立為 `evil-castle-2`；目前先用從 `極惡城之一` 複製過來的初始版位，之後可單獨調整。
- 目前第二張已獨立把 `035` 改到 `[2,4]`、`[17,4]`、`[7,6]`、`[12,6]`，不再跟第一張同步。
