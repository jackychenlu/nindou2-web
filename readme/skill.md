# 忍豆風雲2單機版：接手入口

這份檔案只保留最高頻接手規則與索引；詳細資料已拆到同目錄文件。若本檔與 live code 不一致，先查 live code，再同步對應文件。

---

## 1. 基本工作規範

- 程式碼註解盡量用中文，避免為了躲亂碼直接改成英文。
- 路徑、函式、資料 key、參數名稱要寫明確。
- 如果文件或註解出現亂碼，優先修 UTF-8 讀寫方式，不要改寫成別的語言逃避問題。
- 新功能先放對位置：資料進 `scripts/data/*` 或 module 單一來源，行為進 `scripts/systems/*` 或 `scripts/bootstrap/install-*-globals.module.mjs`。
- 同一份規則不要在多個檔案維護兩套；模式差異統一經過 `scripts/data/rule-modes.js`。

---

## 2. Git 與操作習慣

- 功能做完一段就 commit，不要把很多無關變更混成一包。
- 新功能先開分支，不直接推 `main`。
- 工作樹可能本來就有使用者自己的修改，不要順手清掉。
- 預設可忽略不影響執行的檔案，例如 `readme/**`、`*.md`、`*.xlsx`、暫存筆記；除非使用者明確要求整理。
- 但只要有被程式實際引用，就不能當成「只是素材」忽略。像 `index.html`、`scripts/**`、`scripts/data/assets.js` 參照到的圖片、音效、動畫影格，都要一起處理。

---

## 3. 驗證最低標準

修改 JS 後至少先跑：

~~~powershell
npm run check
~~~

如果有碰規則、座標、戰鬥、武器、測試 scaffold，再跑：

~~~powershell
npm test
~~~

如果有碰 Vite、`.module.mjs`、legacy bridge、`scripts/main.module.js`、`index.html` 腳本載入或啟動檔，再跑：

~~~powershell
npm test
npm run build
~~~

並用 Vite 頁面確認 `globalThis.NindouModuleProbe` 內所有 `isSynced` 都是 `true`。

測試輸出不要浪費上下文：

- 小改先跑精準測試，例如 `node --test tests\install-room-ui-globals.test.mjs tests\appearance-module.test.js`。
- 交付前需要全量驗證時再跑 `npm test`；回報只寫 `194 passed` 這類摘要，不要貼完整 TAP。
- 如果要看全量但降低輸出，用 `npm test -- --test-reporter=dot` 或 `rtk npm test`。
- `npm test` 目前仍包含 legacy `.js` bridge / compatibility 測試；不要只因數量多就刪，先把對應區塊改成 module installer 測試後再移除舊測試。

---

## 4. 文件索引

- 架構、載入順序、module mirror、主迴圈、規則模式、房間 UI、戰鬥與測試入口：[readme/architecture.md](./architecture.md)
- Vite / ES module 遷移細節：[readme/vite-skill.md](./vite-skill.md)
- 地圖、座標、阻擋格、出生點、地圖素材與地圖微調：[readme/maps.md](./maps.md)
- 忍術資料層、忍術編輯 UI、攻擊系、分身、錢鏢與忍術修正：[readme/ninjutsu.md](./ninjutsu.md)
- 忍術數值整理表：[readme/ninjutsu-table.csv](./ninjutsu-table.csv)
- 武器資料、範圍、傷害、音效與新增武器同步項：[readme/weapons.md](./weapons.md)
- AI 類型、赤組、太刀達人、錢鏢 AI 與 AI 禁忌：[readme/ai.md](./ai.md)
- 道具、商店、背包、神水、神酒、魔水與道具音效/動畫：[readme/consumables.md](./consumables.md)
- 2026-05-18 之後的歷史接手紀錄與 2026-05-27 版本備忘：[readme/changelog.md](./changelog.md)

---

## 5. 專案目前狀態

這是用 `HTML + Canvas + JavaScript` 做的《忍豆風雲2》單機版瀏覽器原型，目前已加入 Vite 作為 dev/build 工具，並處於 classic script runtime + ES module mirror/probe 的過渡期。

目前重要架構狀態：

- 本機開發優先用 Vite：在 repo 內執行 `npm run dev` 後開 `http://127.0.0.1:5173/index.html`。
- 日常雙擊遊玩用 repo 根目錄的 `啟動遊戲.cmd`，它會在背景啟動 `http://127.0.0.1:5174/index.html` 的 `scripts/tools/serve-game.mjs` 輕量靜態 server，不走 Vite 冷啟動，正常啟動後只顯示瀏覽器遊戲頁。
- `index.html` 已收斂為單一 `type="module"` entry（`scripts/main.module.js`）。
- runtime 目前由 `scripts/runtime-bootstrap.module.mjs` 依序安裝 module globals；`scripts/classic-runtime-manifest.module.mjs` 的 runtime script 清單目前是空陣列。
- `scripts/load-classic-runtime.module.mjs` 保留相容入口；manifest 為空時回傳 `mode: "none"`，不再載入 classic bundle。
- Vite / ES module 遷移細節以 [readme/vite-skill.md](./vite-skill.md) 為準；只要改 Vite、module mirror、legacy bridge、`scripts/main.module.js`、Vite 測試或啟動方式，都要同步更新該文件。
- 目前建議暫停無目標地新增 mirror module；如果是新增模式、武器、地圖，優先照既有 runtime 開發，必要時同步補 module mirror 與 probe。

目前已知可用狀態：

- 房間畫面與戰鬥畫面可正常切換。
- 房間卡片可新增、刪除、設定 `HP / 控制模式 / 武器`。
- 預設啟用角色是 `blue1` 與 `grey1`。
- `slot 1` 不能刪除。
- 玩家可在房間編輯畫面自選 6 種忍術。
- 戰鬥中可移動、近戰、衝撞、施放忍術、丟錢鏢。
- 有 HP、技量、魂系統。
- 戰鬥結束後會進入結算，再回到房間。
- 回房間後保留開戰前的房間設定。
- 房間與戰鬥 HUD 目前只保留中文顯示。
- 已接入最小 consumable 系統，目前有 `backup3`（神水）、`sake4`（神酒）與 `magicWater`（魔水）。

---

## 6. 資料單一來源與同步

- 武器資料已改成 module 單一來源：只手改 `scripts/data/weapons.module.mjs`，再跑 `npm run sync:weapons` 產生 `scripts/data/weapons.js`。
- config 的忍術規則、道具常數、地圖設定、戰鬥常數、移動殘影、出生區等區段已改成 module 回填：改 `scripts/data/config.module.mjs` 後跑 `npm run sync:config-nindou`。
- ninjutsu-definitions 資料已改成 module 單一來源：改 `scripts/data/ninjutsu-definitions.module.mjs` 後跑 `npm run sync:ninjutsu-definitions`。
- locales 資料已改成 module 單一來源：改 `scripts/data/locales.module.mjs` 後跑 `npm run sync:locales`。
- map 資料已改成 module 單一來源：改 `scripts/data/map.module.mjs` 後跑 `npm run sync:map`。
- rule-modes 資料已改成 module 單一來源：改 `scripts/data/rule-modes.module.mjs` 後跑 `npm run sync:rule-modes`。
- 多個 bridge 可用 `npm run sync:bridges`；先看 `readme/architecture.md` 與 `readme/vite-skill.md` 確認 bridge 狀態。

---

## 7. 高頻入口

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

想改武器數值、範圍或音效：

- 先看 [readme/weapons.md](./weapons.md)
- `scripts/data/weapons.module.mjs`
- `scripts/data/rule-modes.module.mjs`
- `scripts/bootstrap/install-combat-globals.module.mjs`
- `scripts/data/assets.js`

想改忍術：

- 先看 [readme/ninjutsu.md](./ninjutsu.md)
- `scripts/data/config.module.mjs`
- `scripts/data/ninjutsu-definitions.module.mjs`
- `scripts/data/rule-modes.module.mjs`
- `scripts/bootstrap/install-ninjutsu-globals.module.mjs`
- `scripts/data/assets.js`

想改地圖：

- 先看 [readme/maps.md](./maps.md)
- `scripts/data/config.module.mjs -> roomMapDefinitions`
- `scripts/data/map.module.mjs`
- `tests/grid.test.js`

想改 AI：

- 先看 [readme/ai.md](./ai.md)
- `scripts/bootstrap/install-ai-globals.module.mjs`
- `scripts/systems/ai.module.mjs`
- `tests/ai.test.js`

想改道具：

- 先看 [readme/consumables.md](./consumables.md)
- `scripts/data/config.module.mjs`
- `scripts/data/assets.js`
- `scripts/systems/consumables.module.mjs`
- `scripts/bootstrap/install-consumables-globals.module.mjs`
- `scripts/bootstrap/install-room-ui-globals.module.mjs`

想改角色外觀：

- `scripts/data/assets.js -> lookDefinitions` / `baseTeamLookDefinitions`
- `scripts/data/locales.module.mjs -> look label`
- `scripts/systems/appearance.js -> unitLookDefinition()` / 眼睛素材選擇
- `scripts/bootstrap/install-room-ui-globals.module.mjs -> selectedLookKey()` / 房間外觀下拉 DOM

想改 BGM 或音效播放流程：

- `scripts/data/assets.js -> roomBgm` / `defaultBattleBgmSrc` / `soundSources`
- `scripts/data/config.module.mjs -> roomMapDefinitions[*].battleBgmSrc`
- `scripts/systems/audio.js -> syncBgm()` / `startBgm()` / `playSound()`
- `scripts/bootstrap/install-game-globals.module.mjs` 只提供音量 slider DOM reference；音效流程在 audio/app bootstrap installer

---

## 8. 高風險區與不要做的事

這些值是人工調好的，不要動，若使用者堅持要動，要先警告使用者：

- `scripts/data/render-tuning.js -> eyeOffsets`
- `scripts/data/render-tuning.js -> useNinjuSpriteOffset`
- `scripts/data/render-tuning.js -> moveEffectOffsets`
- `scripts/data/render-tuning.js -> moneyDartVisualOffsets`

不要做的事：
- 不要讓 `hotBlood` 影響衝撞或錢鏢。
- 不要讓 AI 播放玩家專用 `useNinju` 表現。
- 不要為了躲亂碼，把中文註解改成英文或 `\uXXXX`。
- 素材檔名若需要主觀判讀方向，先列辨識結果給使用者確認，再決定是否改名或接線。

---

## 9. 編碼與檔案寫入注意事項

- 中文可直接寫在 JS / HTML / Markdown，不要轉成 `\uXXXX`。
- Windows PowerShell 編輯含中文檔案時，優先使用不會破壞 UTF-8 的寫法。
- 這份 `readme/skill.md` 若再出現亂碼，先用 `Get-Content -Encoding UTF8` 重新確認，再 patch。
