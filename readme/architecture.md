# 忍豆風雲2單機版：架構與流程說明
此檔由 `readme/skill.md` 拆出，保留載入順序、module mirror、主要流程、房間/規則/戰鬥與測試入口等結構性資訊。回到接手入口請看 [skill.md](./skill.md)。

---

## 5. 載入順序與檔案職責

### `index.html` classic runtime 載入順序、各檔案職責

```text
scripts/data/config.js                 -> 共用常數、移動動畫 timing、忍術數值、掉落設定、道具欄位置
scripts/data/weapons.js                -> 由 module 產生的 classic bridge（勿手改）
scripts/tools/generate-weapons-classic.mjs -> 由 weapons.module.mjs 產生 weapons.js 的工具
scripts/data/ninjutsu-definitions.js   -> ninjuCatalog、editor 分類排序、defaultNinjuLoadout
scripts/data/locales.js                -> 由 module 產生的 classic bridge（勿手改）
scripts/tools/generate-locales-classic.mjs -> 由 locales.module.mjs 產生 locales.js 的工具
scripts/data/map.js                    -> 由 module 產生的 classic bridge（勿手改）
scripts/tools/generate-map-classic.mjs -> 由 map.module.mjs 產生 map.js 的工具
scripts/data/assets.js                 -> 圖片、音效、動畫影格來源、attackNinjuConfigs
scripts/data/render-tuning.js          -> Canvas 視覺微調資料：眼睛、錢鏢、移動殘影與施術 sprite offset
scripts/data/rule-modes.js             -> original / modified 規則查詢入口
scripts/systems/appearance.js          -> 外觀定義查詢、角色外觀解析、眼睛素材選擇
scripts/bootstrap/install-asset-loader-globals.module.mjs -> 圖片與動畫影格載入
scripts/data/map.js                    -> 地圖物件初始資料
scripts/systems/grid.js                -> 格子、座標轉換、出生格洗牌、方向判定與面向更新
scripts/systems/state-helpers.js       -> 共用狀態工具、選取角色、拖曳狀態、傷害/時間格式、隊伍存活數、魂量累積
scripts/systems/audio.js               -> BGM 切換、音量套用、短音效播放入口
scripts/bootstrap/install-ninjutsu-globals.module.mjs -> 忍術施放、chain、錢鏢、分身與狀態忍術（Vite bootstrap 安裝）
scripts/systems/consumables.module.mjs -> 道具背包、掉落、使用、連用流程
scripts/bootstrap/install-combat-globals.module.mjs -> 近戰攻擊、範圍、命中、傷害、物件破壞（Vite bootstrap 安裝）
scripts/bootstrap/install-movement-globals.module.mjs -> 移動、消耗技量、衝撞（Vite bootstrap 安裝）
scripts/bootstrap/install-movement-renderer-globals.module.mjs -> 移動殘影、平滑座標、拖曳箭頭與角色移動/施術 sprite 繪製 helper（Vite bootstrap 安裝）
scripts/bootstrap/install-battle-runtime-globals.module.mjs -> 集技、開場倒數、對戰 active 與忍術 dispatch helper
scripts/bootstrap/install-battle-input-globals.module.mjs -> 戰鬥滑鼠輸入、拖曳與戰鬥中點擊判定（Vite bootstrap 安裝）
scripts/bootstrap/install-ai-globals.module.mjs -> AI profile、追擊、近戰、忍術、錢鏢與紅豆反擊（Vite bootstrap 安裝）
scripts/systems/match.js               -> 勝負判定、結算
scripts/bootstrap/install-room-ui-globals.module.mjs -> 房間文案套用、外觀卡、規則/地圖選單、忍術編輯器、商店、房間卡數值/下拉 DOM helper（Vite bootstrap 安裝）
scripts/bootstrap/install-battle-setup-globals.module.mjs -> 開局建立角色、起始位置與整局 reset helper
scripts/bootstrap/install-game-flow-globals.module.mjs -> 開戰/回房、重開長按、模式切換與房間流程協調
scripts/bootstrap/install-scene-renderer-globals.module.mjs -> 戰鬥背景、地圖遮罩、外框與格子提示繪製
scripts/bootstrap/install-status-ui-globals.module.mjs -> 狀態訊息與側邊資訊面板更新
scripts/bootstrap/install-unit-renderer-globals.module.mjs -> 角色本體、分身、血條、名字、眼睛與 buff 外圈繪製（Vite bootstrap 安裝）
scripts/bootstrap/install-combat-renderer-globals.module.mjs -> 地圖物件、武器揮砍、錢鏢射出與近戰攻擊視覺繪製
scripts/bootstrap/install-effects-renderer-globals.module.mjs -> 忍術施放、命中與道具使用的 Canvas 特效繪製
scripts/bootstrap/install-hud-renderer-globals.module.mjs -> 戰鬥 HUD、魂條、道具列、忍術按鈕與 HUD 文字繪製（Vite bootstrap 安裝）
scripts/bootstrap/install-overlay-renderer-globals.module.mjs -> 倒數與結算 Canvas 覆蓋層繪製
scripts/bootstrap/install-app-bootstrap-globals.module.mjs -> 啟動流程、DOM 事件綁定與房間初始化
scripts/bootstrap/install-game-globals.module.mjs -> DOM 參考、runtime state、主迴圈（Vite bootstrap 安裝）

```

`index.html` 目前入口：

```text
scripts/main.module.js                 -> Vite / ES module runtime bootstrap + module probe entry

```

目前 `NindouModuleProbe` 會檢查：

```text
config, weapons, ninjutsu, locales, ruleModes, maps, assets,
appearance, stateHelpers, grid, audio, match, consumables,
movement, ai, combat

```

### ES module mirror 對照

下列 `.module.mjs` 是目前 Vite 過渡期的新寫法。改到已 mirror 的資料或 helper 時，要同步維護 classic script、module mirror、legacy bridge、`scripts/main.module.js` probe 與對應 `tests/*-module.test.js`。

```text
scripts/data/config.js                 -> scripts/data/config.module.mjs
scripts/data/weapons.js                -> scripts/data/weapons.module.mjs（generated bridge，來源是 module）
scripts/data/ninjutsu-definitions.js   -> scripts/data/ninjutsu-definitions.module.mjs
scripts/data/locales.js                -> scripts/data/locales.module.mjs（generated bridge，來源是 module）
scripts/data/assets.js                 -> scripts/data/assets.module.mjs
scripts/data/rule-modes.js             -> scripts/data/rule-modes.module.mjs
scripts/data/map.js                    -> scripts/data/map.module.mjs（generated bridge，來源是 module）
scripts/systems/appearance.js          -> scripts/systems/appearance.module.mjs
scripts/systems/grid.js                -> scripts/systems/grid.module.mjs
scripts/systems/state-helpers.js       -> scripts/systems/state-helpers.module.mjs
scripts/systems/audio.js               -> scripts/systems/audio.module.mjs
scripts/systems/consumables.module.mjs -> 道具系統唯一邏輯來源，由 install-consumables-globals.module.mjs 安裝 global runtime 入口
scripts/systems/combat.js              -> scripts/systems/combat.module.mjs
scripts/systems/movement.js            -> scripts/systems/movement.module.mjs
scripts/systems/ai.js                  -> scripts/systems/ai.module.mjs
scripts/systems/match.js               -> scripts/systems/match.module.mjs

```

尚未正式 mirror / 接管：

```text
scripts/bootstrap/install-ninjutsu-globals.module.mjs -> 忍術施放流程已由 Vite bootstrap 安裝；資料仍由 scripts/data/ninjutsu-definitions.module.mjs 提供
scripts/bootstrap/install-game-globals.module.mjs -> runtime state、DOM refs、draw 主迴圈已由 Vite bootstrap 安裝

```

### 新功能放置原則

- 資料先放 `scripts/data/*` 或對應 `.module.mjs` 單一來源，不要把表、數值、素材 key 散塞進 bootstrap。
- 行為先放 `scripts/systems/*` 或對應 `scripts/bootstrap/install-*-globals.module.mjs`，不要把流程全部堆回單一檔。
- 如果對應 `.module.mjs` 已存在，新增或調整純資料/純 helper 時要同步考慮 module mirror、legacy `globalThis.Nindou*` bridge、`scripts/main.module.js` probe 與 `tests/*-module.test.js`。
- 武器資料調整後固定流程：改 `scripts/data/weapons.module.mjs` -> 跑 `npm run sync:weapons` -> 跑 `npm test`。
- config 規則檔調整後固定流程：改 `scripts/data/config.module.mjs` -> 跑 `npm run sync:config-nindou` -> 跑 `npm test`。
- ninjutsu-definitions 資料調整後固定流程：改 `scripts/data/ninjutsu-definitions.module.mjs` -> 跑 `npm run sync:ninjutsu-definitions` -> 跑 `npm test`。
- locales 資料調整後固定流程：改 `scripts/data/locales.module.mjs` -> 跑 `npm run sync:locales` -> 跑 `npm test`。
- map 資料調整後固定流程：改 `scripts/data/map.module.mjs` -> 跑 `npm run sync:map` -> 跑 `npm test`。
- rule-modes 資料調整後固定流程：改 `scripts/data/rule-modes.module.mjs` -> 跑 `npm run sync:rule-modes` -> 跑 `npm test`。
- 不要新增依賴 classic `<script>` 載入順序的全新 helper；新 helper 優先寫成可注入依賴、可被 ES module import 測試的形式。
- 只有直接碰主迴圈與 runtime state 時，才進 `scripts/bootstrap/install-game-globals.module.mjs`；啟動流程、DOM 事件綁定與房間初始化先看 `scripts/bootstrap/install-app-bootstrap-globals.module.mjs`，房間外觀卡、忍術編輯器、商店背包與規則/地圖選單先看 `scripts/bootstrap/install-room-ui-globals.module.mjs`，開局建立角色、起始位置與整局 reset 先看 `scripts/bootstrap/install-battle-setup-globals.module.mjs`，集技、開場倒數、對戰 active 與忍術 dispatch 先看 `scripts/bootstrap/install-battle-runtime-globals.module.mjs`，戰鬥滑鼠輸入、拖曳與戰鬥中點擊判定先看 `scripts/bootstrap/install-battle-input-globals.module.mjs`，開戰/回房、重開長按、模式切換與房間流程協調先看 `scripts/bootstrap/install-game-flow-globals.module.mjs`，戰鬥背景與格子提示先看 `scripts/bootstrap/install-scene-renderer-globals.module.mjs`，狀態訊息與側邊資訊面板先看 `scripts/bootstrap/install-status-ui-globals.module.mjs`，角色本體、分身、血條、名字、眼睛與 buff 外圈先看 `scripts/bootstrap/install-unit-renderer-globals.module.mjs`，地圖物件、武器揮砍、錢鏢射出與近戰攻擊視覺先看 `scripts/bootstrap/install-combat-renderer-globals.module.mjs`，移動殘影、平滑座標、拖曳箭頭與角色移動/施術 sprite helper 先看 `scripts/bootstrap/install-movement-renderer-globals.module.mjs`，忍術/道具特效先看 `scripts/bootstrap/install-effects-renderer-globals.module.mjs`，戰鬥 HUD 先看 `scripts/bootstrap/install-hud-renderer-globals.module.mjs`，倒數/結算覆蓋層先看 `scripts/bootstrap/install-overlay-renderer-globals.module.mjs`。
- 外觀解析、BGM/音效入口、道具流程、出生格洗牌、隊伍存活數都已拆到 module installer 或 `scripts/systems/*`；改這些功能先找對應檔案。
- `scripts/systems/grid.js` 不處理 DOM event；滑鼠事件先由 battle input installer 換成 `state.pointer` / `pointToCell()` 結果。
- 同一份規則不要在多個檔案維護兩套；例如模式差異統一經過 `scripts/data/rule-modes.js`。

---

---

## 6. 主迴圈與遊戲流程

### `scripts/bootstrap/install-game-globals.module.mjs -> draw()` 每幀大致順序

1. `updateMatchState`
2. `updateCharging` / `updateNinju` / `updateAi` / `updateProjectiles`（只清舊版殘留 projectile）
3. 繪製 `backdrop -> board -> drag -> mapObjects -> moveTrails -> units -> ninjuEffects -> moneyDartShoot -> attacks -> gameHud -> ninjuBar`
4. 覆蓋層 `countdownOverlay -> resultOverlay`

### 遊戲流程

房間畫面 -> `startBattleFromRoom()` -> 戰鬥 -> `checkVictory()` -> `finishMatch()` -> 結算 -> `returnToRoomFromResult()`

---

---

## 8. 規則模式（Rule Mode）

房間左上角現在是下拉選單，不是 checkbox。

模式對應：

- `忍2原版` -> `original`
- `忍2修改` -> `modified`

目前 live code 行為：

- `original` 走原版 profile。
- `modified` 走修改版 profile。

模式查詢入口在 `scripts/data/rule-modes.js`，常用函式：

- `currentRuleModeKey()`
- `weaponDamageForMode()`
- `steelRule()`
- `hotBloodRule()`
- `healNinjuRule()`
- `specialNinjuRule()`
- `moneyDartRule()`
- `attackNinjuRule()`

不要直接跳過這層去讀 fallback 常數。
Vite/module runtime 安裝 rule-mode globals 時，也不要直接讀 `target.state`；請透過 `globalThis.NindouRuntimeState.getState()` 解析目前 runtime state，否則原版模式可能退回修改版數值，例如錢標變成 `70` 而不是 `100`。

---

---

## 9. 房間畫面與忍術編輯

主要位置：

- `index.html`
- `style.css`
- `scripts/bootstrap/install-room-ui-globals.module.mjs`
- `scripts/bootstrap/install-room-ui-globals.module.mjs -> renderNinjuEditor()`

房間畫面規則：

- 每張卡可設定 `HP / 控制模式 / 武器`。
- 8 張房間卡片都可設定外觀；藍隊預設是 `lookDefinitions.default`，灰隊預設經由 `selectedLookKey() -> "__team_default__"` 回到 `baseLookDefinitionForTeam("grey")`，外觀資料集中在 `scripts/data/assets.js -> lookDefinitions`。
- 左上角規則模式用下拉選單。
- 房間卡片的 `体` 框設定開戰最大 HP；`技` 框設定開戰初始技量與該角色本局技量上限，預設 `18`，可手動提高到 `9999`。
- 房間文字按鈕共用 `style.css -> .room-text-button`。

外觀新增規則：

- 新外觀先在 `lookDefinitions` 增加一個 key，設定 `labelKey / roomAvatarSrc / roomAvatarEyeSrc / eyeFrontImageKey / eyeSideImageKey / spriteSet / moveSet / useNinjuSet / moneyDartReadySet / moneyDartShootSet`。
- 新外觀的眼睛圖先加到 `imageSources`，再用 `eyeFrontImageKey / eyeSideImageKey` 指過去；不要在 `game.js` 針對單一路徑寫 `if`。
- 選單會由 `lookDefinitions` 自動產生；新增外觀只要在 `scripts/data/locales.js` 補對應 `labelKey` 文案。
- `assets/characters/ai` 這類 `a1 / a2 / a3 / a4` 結構優先用 `aiIdleImageSources()`、`aiPrearriveFrameSources()`、`aiArriveFrameSources()`、`aiUseNinjuFrameSources()`、`aiMoneyDartReadyFrameSources()`、`aiMoneyDartShootFrameSources()` 產生路徑。
- idle / move / use_ninju / dart / dart_shoot 影格仍由 `imageSources`、`movePrearriveFrameSources`、`moveArriveFrameSources`、`useNinjuFrameSources`、`moneyDartReadyFrameSources`、`moneyDartShootFrameSources` 對應到同一組資料 key。
- 如果新外觀只有部分素材，缺的先回退到預設外觀，不要為了接線硬猜方向或硬補不存在的圖。
- 如果某套素材檔名本身看不出方向，先列出辨識結果給使用者確認，再決定要不要改名或接進對應 frame set。
- 若角色本來就不需要眼睛，直接在 `lookDefinitions[*]` 設 `drawEyes: false`，房間頭像則把 `roomAvatarEyeSrc` 設成 `null`。

忍術編輯規則：

- 玩家可自選 6 種忍術，上排順序就是戰鬥中的忍術列順序。
- 編輯 UI、分類、排序、框圖規則已移到 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)。
- 主要資料入口仍是 `scripts/data/ninjutsu-definitions.js -> ninjuCatalog` / `ninjuEditorCatalog` / `defaultNinjuLoadout`。

---

---

## 10. 戰鬥規則與魂系統

### 戰鬥畫面規則

- 玩家主要用拖曳移動。
- 移動、攻擊、忍術都受技量與狀態限制。
- 戰鬥中長按 `R` 3 秒可中止回房間。
- 結算畫面要等 2 秒後點滑鼠才回房間。
- 回房間後保留開戰前設定。

### 魂系統

- 移動會累積魂。
- 攻擊命中、被攻擊、撞人、死亡也會加魂。
- 魂最高 4 級。
- 攻擊系忍術至少需要魂 1。
- 攻擊系忍術目前消耗魂，不消耗技。

目前魂量效果：

- 魂 1 打 1 人
- 魂 2 打 2 人
- 魂 3 打 3 人
- 魂 4 打 4 人
- 攻擊系忍術使用後魂歸零

---

---

## 15. 素材與命名規則

正式素材資料夾：

- `assets/characters`
- `assets/ninju`
- `assets/weapon`
- `assets/map`
- `assets/ui`
- `assets/sounds`

候選素材資料夾：

- `assets/_candidates`

命名慣例：

| 類型        | 路徑                                                         |
| ----------- | ------------------------------------------------------------ |
| 角色 sprite | `assets/characters/{idle,move,charge,use-ninju,parts}/`    |
| 武器動畫    | `assets/weapon/{folder}/{direction}_{hand\|attack}/{n}.webp` |
| 忍術動畫    | `assets/ninju/`                                            |
| 音效        | `assets/sounds/sfx/`                                       |
| 房間 UI     | `assets/room/`                                             |

武器音效規則：

```text
weaponX -> assets/sounds/weapon/X.ogg

```

例如：

```text
weapon8 -> assets/sounds/weapon/8.ogg

```

素材改名補充規則：

- 如果素材檔名本身無法直接看出方向，例如只剩流水號、`Symbol xxxx.webp`、或要靠排序/尺寸/資料夾結構推斷 `left/right/up/down`，不要直接批次改名。
- 先把目前辨識結果明確列給使用者確認；確認後才能動手改。
- 只有方向非常明確、且不需要主觀判讀時，才可直接改名。

不要把 BGM 改回系統絕對路徑：

- 房間 BGM：`scripts/data/assets.js -> roomBgm`，目前固定是 `assets/sounds/bgm/忍2大廳.mp3`。
- 預設戰鬥 BGM：`scripts/data/assets.js -> defaultBattleBgmSrc`，目前是 `assets/sounds/bgm/忍3鄉野.mp3`。
- 地圖專屬戰鬥 BGM：`scripts/data/config.js -> roomMapDefinitions[*].battleBgmSrc`，例如極惡城是 `assets/sounds/bgm/忍2鬼島戰鬥.mp3`。
- BGM 切換、音量套用與 `playSound()` / `playBreakSound()` 在 `scripts/systems/audio.js`；音量 slider DOM 由 `scripts/bootstrap/install-game-globals.module.mjs` 安裝，互動啟動事件由 app bootstrap installer 綁定。

---

---

## 17. 如果要改某一塊，先看哪裡

想改畫面：

- `scripts/bootstrap/install-scene-renderer-globals.module.mjs`
- `scripts/bootstrap/install-unit-renderer-globals.module.mjs`
- `scripts/bootstrap/install-combat-renderer-globals.module.mjs`
- `scripts/bootstrap/install-effects-renderer-globals.module.mjs`
- `scripts/bootstrap/install-hud-renderer-globals.module.mjs`
- `style.css`
- `assets/`

想改房間或編輯介面：

- `index.html`
- `style.css`
- `scripts/bootstrap/install-room-ui-globals.module.mjs`

想改武器數值或範圍：

- `scripts/data/weapons.js`
- `scripts/data/rule-modes.js`
- `scripts/bootstrap/install-combat-globals.module.mjs`

想改忍術數值：

- 先看 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)
- `scripts/data/config.js -> ninjutsuRuleProfiles`
- `scripts/data/config.js -> attackNinjuOutcomeTables`
- `scripts/data/rule-modes.js`
- `scripts/bootstrap/install-ninjutsu-globals.module.mjs`
- `scripts/data/assets.js`

想改忍術清單或 editor 排序：

- 先看 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)
- `scripts/data/ninjutsu-definitions.js`
- `style.css`
- `scripts/bootstrap/install-room-ui-globals.module.mjs -> renderNinjuEditor()`

想改地圖：

- 先看 [`readme/maps.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/maps.md)
- `scripts/data/config.js -> roomMapDefinitions`
- `scripts/data/map.js`
- `tests/grid.test.js`

想改 AI：

- `scripts/bootstrap/install-ai-globals.module.mjs`

想改道具：

- `scripts/data/config.js`
- `scripts/data/assets.js`
- `scripts/systems/consumables.module.mjs`
- `scripts/bootstrap/install-combat-globals.module.mjs`
- `scripts/bootstrap/install-room-ui-globals.module.mjs`

想改角色外觀：

- `scripts/data/assets.js -> lookDefinitions` / `baseTeamLookDefinitions`
- `scripts/data/locales.js -> look label`
- `scripts/systems/appearance.js -> unitLookDefinition()` / 眼睛素材選擇
- `scripts/bootstrap/install-room-ui-globals.module.mjs -> selectedLookKey()` / 房間外觀下拉 DOM

想改 BGM 或音效播放流程：

- `scripts/data/assets.js -> roomBgm` / `defaultBattleBgmSrc` / `soundSources`
- `scripts/data/config.js -> roomMapDefinitions[*].battleBgmSrc`
- `scripts/systems/audio.js -> syncBgm()` / `startBgm()` / `playSound()`
- `scripts/bootstrap/install-game-globals.module.mjs` 只提供音量 slider DOM reference；音效流程在 audio/app bootstrap installer

想改素材或音效：

- `assets/`
- `assets/sounds/`
- `scripts/data/assets.js`

---

---

## 18. 測試與 PowerShell

如果 PowerShell 擋住 `npm.ps1`，可用：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

```

`package.json` 目前常用 scripts：

```json
{
  "scripts": {
    "check": "node --check scripts/bootstrap/install-game-globals.module.mjs",
    "test": "node --test",
    "dev": "vite --host 127.0.0.1",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1"
  }
}

```

目前測試重點：

- `tests/helpers/script-loader.js`
- `tests/helpers/script-loader.js -> contextValue(context, expression)` 用來讀 VM lexical scope 裡的 `const`，例如 `ARRIVE_TOTAL`；不要再為了測試把這類常數硬塞成 `context.ARRIVE_TOTAL` stub。
- `tests/rule-modes.test.js`
- `tests/grid.test.js`
- `tests/combat.test.js`
- `tests/ninjutsu.test.js`
- `tests/ai.test.js`
- `tests/assets.test.js`
- `tests/weapon-animation-timing.test.js`
- `tests/movement.test.js`

目前已修正：

- `modified / original` 規則切換
- 座標與障礙
- 武器傷害與範圍
- 神酒移動不耗技、一般移動耗技、忍術/道具施放使用中間三段移動
- 攻擊忍術魂量門檻、攻擊忍術消耗魂、分身施放、分身血條/名稱/外觀資料、地圖可走格候選、死亡清理、錢鏢重複排程不重複扣技
- `scripts/data/assets.js` 靜態素材、BGM、音效、武器動畫影格、地圖圖片 key、外觀 sprite/frame set、`index.html` 與 `style.css` 直接引用路徑是否存在
- 武器揮砍動畫時長是否等於 `cooldownMs`
- `赤組` 的無技施法、斜角反擊、九宮格武器攻擊、直線延遲衝撞

---

---

## 20. 編碼與檔案寫入注意事項

- 中文可直接寫在 JS / HTML / Markdown，不要轉成 `\uXXXX`。
- Windows PowerShell 編輯含中文檔案時，優先使用不會破壞 UTF-8 的寫法。
- 這份 `readme/skill.md` 若再出現亂碼，先用 `Get-Content -Encoding UTF8` 重新確認，再 patch。

---
