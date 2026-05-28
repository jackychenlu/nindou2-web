# Vite / ES module 遷移指南

這份文件只記 Vite 與 ES module 遷移。遊戲規則、地圖、忍術、道具細節仍以 `readme/skill.md` 和各拆分文件為主。改 Vite 相關內容後，優先更新本文件。

---

## 1. 遷移目標

最終目標是讓遊戲用 Vite 作為 dev/build 工具，並逐步把 classic script runtime 收斂成 ES module runtime。

大方向：

1. 先加 Vite 作為 dev/build 工具，但保持行為不變。
2. 從低風險資料檔開始轉 ES module，例如 `weapons.js`、`config.js`、`map.js`。
3. 系統檔逐步改成 `import` / `export`，不要再依賴 `<script>` 載入順序。
4. 最後把 `index.html` 底部的多個 classic `<script>` 收斂成一個 `type="module"` entry。
5. 測試要同步改；目前 `npm test` 很多測試仍靠 `tests/helpers/script-loader.js` 模擬舊 script 順序，轉 module 後要逐步改成直接 `import` 測試。

---

## 2. 目前狀態

目前是過渡期，不是把所有 `.js` 都改名成 `.mjs`：

- 目前建議先暫停繼續拆 helper。Vite 骨架與 module mirror 已足夠支援後續開發；短期如果要做幾十種模式、武器、地圖，優先回到玩法內容。
- 已加入 Vite skeleton：`npm run dev`、`npm run build`、`npm run preview`。
- `index.html` 已收斂成單一 `type="module"` entry（`scripts/main.module.js`）。
- runtime 目前由 `scripts/runtime-bootstrap.module.mjs` 依序安裝 module globals；`scripts/classic-runtime-manifest.module.mjs` 的 runtime script 清單目前是空陣列。
- `scripts/load-classic-runtime.module.mjs` 保留相容入口；manifest 為空時回傳 `mode: "none"`，不載入 classic bundle。
- `vite.config.js` 目前只打包 module entry，並複製 `assets/`、`scripts/`、`index.html`、`style.css` 到 `dist/`。
- 目前 production build 會轉換 18 個 modules。
- 想用本機快速遊玩，可雙擊 repo 根目錄的 `啟動遊戲.cmd`。launcher 會用背景 server 開 `http://127.0.0.1:5174/index.html`，正常啟動後只顯示瀏覽器遊戲頁。
- `weapons` 已切成單一來源：只手改 `scripts/data/weapons.module.mjs`，再跑 `npm run sync:weapons` 產生 `scripts/data/weapons.js`。
- `config` 已先切一段單一來源：`ninjutsuRuleProfiles + attackNinjuOutcomeTables + 六顆忍術按鈕 rect + itemSlot/defaultConsumable 常數 + mapItemDrop 常數 + countdown 常數 + soul/ninjuChain 常數 + 核心戰鬥常數(weapon/maxSkill/objectHp/maxHp/collision) + 開局/重生常數(hold/charge/respawn/unit) + 移動殘影常數(ARRIVE/PREARRIVE) + 版面/出生區常數(ui/startingAreas) + 地圖設定常數(grid/drawInset/roomMapDefinitions) + NindouConfig` 段落由 `scripts/data/config.module.mjs` 回填，改完要跑 `npm run sync:config-nindou`。
- `ninjutsu-definitions` 已切成單一來源：只手改 `scripts/data/ninjutsu-definitions.module.mjs`，再跑 `npm run sync:ninjutsu-definitions` 產生 `scripts/data/ninjutsu-definitions.js`。
- `locales` 已切成單一來源：只手改 `scripts/data/locales.module.mjs`，再跑 `npm run sync:locales` 產生 `scripts/data/locales.js`。
- `map` 已切成單一來源：只手改 `scripts/data/map.module.mjs`，再跑 `npm run sync:map` 產生 `scripts/data/map.js`。
- `rule-modes` 已切成單一來源：只手改 `scripts/data/rule-modes.module.mjs`，再跑 `npm run sync:rule-modes` 產生 `scripts/data/rule-modes.js`。

目前頁面 probe 檢查：

- `config`
- `weapons`
- `ninjutsu`
- `locales`
- `ruleModes`
- `maps`
- `assets`
- `appearance`
- `stateHelpers`
- `grid`
- `audio`
- `match`
- `consumables`
- `movement`
- `ai`
- `combat`

上述 probe 目前都應該是 `isSynced: true`。

---

## 3. 已完成

### Vite skeleton

- `package.json`：新增 `dev`、`build`、`preview` scripts，加入 `vite`。
- `vite.config.js`：設定 `base: "./"`，build entry 指向 `scripts/main.module.js`，並用 copy plugin 複製 classic runtime 需要的檔案。
- `index.html`：只保留 `scripts/main.module.js` 一個 module entry。
- `啟動遊戲.cmd`：雙擊後以隱藏背景流程啟動輕量 server，並開 `http://127.0.0.1:5174/index.html`；使用自身所在資料夾作為工作目錄，搬到其他電腦路徑不同也可用。若第一次沒有 `node_modules`，會先執行 `npm install`。

### Data modules

- `scripts/data/config.module.mjs`
- `scripts/data/weapons.module.mjs`
- `scripts/data/ninjutsu-definitions.module.mjs`
- `scripts/data/locales.module.mjs`
- `scripts/data/rule-modes.module.mjs`
- `scripts/data/map.module.mjs`
- `scripts/data/assets.module.mjs`

### Systems modules

- `scripts/systems/appearance.module.mjs`
- `scripts/systems/state-helpers.module.mjs`
- `scripts/systems/grid.module.mjs`
- `scripts/systems/audio.module.mjs`
- `scripts/systems/match.module.mjs`
- `scripts/systems/consumables.module.mjs`
- `scripts/systems/movement.module.mjs`：移動 helper 的 importable module；實際 runtime 由 `scripts/bootstrap/install-movement-globals.module.mjs` 安裝。
- `scripts/systems/ai.module.mjs`：AI profile/helper 的 importable module；實際 runtime 由 `scripts/bootstrap/install-ai-globals.module.mjs` 安裝。
- `scripts/systems/combat.module.mjs`：武器傷害、範圍、命中 helper 的 importable module；實際 runtime 由 `scripts/bootstrap/install-combat-globals.module.mjs` 安裝。

### Legacy bridges

Classic scripts 暫時會暴露 bridge 供 module probe 比對：

- `scripts/data/config.js -> globalThis.NindouConfig`
- `scripts/data/weapons.js -> globalThis.NindouWeapons`（由 `npm run sync:weapons` 產生，勿手改）
- `scripts/data/locales.js -> globalThis.NindouLocales`（由 `npm run sync:locales` 產生，勿手改）
- `scripts/data/ninjutsu-definitions.js -> globalThis.NindouNinjutsu`
- `scripts/data/rule-modes.js -> globalThis.NindouRuleModes`
- `scripts/data/map.js -> globalThis.NindouMaps`（由 `npm run sync:map` 產生，勿手改）
- `scripts/data/assets.js -> globalThis.NindouAssets`
- `scripts/systems/appearance.js -> globalThis.NindouAppearance`
- `scripts/systems/state-helpers.js -> globalThis.NindouStateHelpers`
- `scripts/systems/grid.js -> globalThis.NindouGrid`
- `scripts/systems/audio.js -> globalThis.NindouAudio`
- `scripts/systems/match.js -> globalThis.NindouMatch`
- `scripts/systems/consumables.module.mjs -> install-consumables-globals.module.mjs -> globalThis.NindouConsumables`
- `scripts/systems/movement.js -> globalThis.NindouMovement`
- `scripts/bootstrap/install-ai-globals.module.mjs -> globalThis.NindouAi`
- `scripts/bootstrap/install-combat-globals.module.mjs -> globalThis.NindouCombat`

---

## 4. 測試狀態

目前同步測試：

- `tests/config-module.test.js`
- `tests/weapon-module.test.js`
- `tests/ninjutsu-module.test.js`
- `tests/locales-module.test.js`
- `tests/rule-modes-module.test.js`
- `tests/map-module.test.js`
- `tests/assets-module.test.js`
- `tests/appearance-module.test.js`
- `tests/state-helpers-module.test.js`
- `tests/grid-module.test.js`
- `tests/audio-module.test.js`
- `tests/match-module.test.js`
- `tests/consumables-module.test.js`
- `tests/movement-module.test.js`
- `tests/ai-module.test.js`
- `tests/combat-module.test.js`
- `tests/module-probe-runtime.test.js`
- `tests/module-probe-sections.test.js`
- `tests/module-probe-global-bridge.test.js`
- `tests/module-probe-pipeline.test.js`
- `tests/module-probe-health.test.js`
- `tests/module-probe-entry.test.js`
- `tests/module-probe-diagnostics.test.js`
- `tests/module-probe-constants.test.js`
- `tests/module-probe-serialization.test.js`
- `tests/module-probe-fingerprint.test.js`

目前驗證基準：

```powershell
npm test
npm run build
npm run verify:vite
npm run check
npm audit --omit=optional
```

Bridge 同步檢查（不寫檔）：

```powershell
npm run sync:bridges:validate
npm run sync:bridges:list
node scripts/tools/sync-bridge.mjs --key all --dry-run --json
npm run sync:bridges:dry-run
```

前端確認：

1. 啟動 Vite：`npm run dev`，或雙擊 `啟動遊戲.cmd`。
2. 開 `http://127.0.0.1:5173/index.html`。
3. 確認沒有 page error。
4. 確認 `globalThis.NindouModuleProbe` 內所有 `isSynced` 都是 `true`。

---

## 5. 下一步

目前建議先停在這個邊界：

1. 不再為了轉換而無差別改名所有 `.js`。
2. 保留 Vite dev/build、module installer、legacy bridge、同步測試，作為後續安全網。
3. 如果短期目標是新增模式、武器、地圖，優先改 module 單一來源或現有 installer；不要新增 classic runtime script。
4. 如果之後要正式推進 ES module 化，優先把仍被測試或 bridge 依賴的 classic `.js` 改成 generated bridge 或 importable module。
5. `skillMove()`、`updateAi()`、`attack()`、`attackCell()`、`ninjutsu`、`draw()` 都是高副作用流程；目前已由 module installer 接管。
6. 測試逐步從 `script-loader.js` 改成直接 import module；同時保留少量 legacy sync 測試，直到 classic bridge 可以移除。
7. 已完成：`index.html` 的 classic scripts 已收斂成單一 module entry，classic runtime manifest 目前為空。

武器資料日常流程：

1. 只改 `scripts/data/weapons.module.mjs`。
2. 跑 `npm run sync:weapons` 產生 classic bridge `scripts/data/weapons.js`。
3. 跑 `npm test` 與 `npm run build`，確認 probe / mirror 同步。

locales 資料日常流程：

1. 只改 `scripts/data/locales.module.mjs`。
2. 跑 `npm run sync:locales` 產生 classic bridge `scripts/data/locales.js`。
3. 跑 `npm test` 與 `npm run build`，確認 probe / mirror 同步。

map 資料日常流程：

1. 只改 `scripts/data/map.module.mjs`。
2. 跑 `npm run sync:map` 產生 classic bridge `scripts/data/map.js`。
3. 跑 `npm test` 與 `npm run build`，確認 probe / mirror 同步。

暫時不要做：

- 不要再把 `game.js` 當 runtime 入口；runtime state 與 `draw()` 現在在 `scripts/bootstrap/install-game-globals.module.mjs`。
- 不要繼續無目標地新增 mirror module。
- 不要新增 classic runtime manifest entry。
- 不要刪 bridge，除非對應 runtime 已正式改用 import。
- 不要讓 module import 時建立 `Audio`、讀 DOM、啟動主迴圈或修改全域 `state`。

---

## 6. 轉換原則

- module 版優先使用依賴注入：`stateLike`、`gridLike`、`mapDefinition`、`imageMap`、callbacks。
- classic script 保持目前遊戲行為，只補 `globalThis.Nindou*` bridge。
- `scripts/main.module.js` 先載入 classic runtime manifest，再執行 probe，不直接改動 gameplay 流程本身。
- `scripts/runtime-bootstrap.module.mjs` 現在是 module entry 的統一啟動層：可解析 runtime mode（classic/module）、執行 classic runtime 載入、檢查必要 globals、再跑 probe。
- `globalThis.NindouRuntimeBootstrap` 會保留啟動診斷（`mode`、`loadedScriptCount`、`missingGlobals`、`isReady`）。
- classic runtime script order 目前集中在 `scripts/classic-runtime-manifest.module.mjs`；Node 測試端使用相同子集合定義（core/combat/ai）避免流程漂移。
- Historical: `scripts/tools/build-classic-runtime-bundle.mjs` originally produced `scripts/generated/classic-runtime.bundle.js` for the classic runtime. With an empty runtime manifest, this tool now removes/skips the generated bundle output.
- `scripts/tools/verify-vite-runtime.mjs` 提供 Vite 端到端健康檢查：同時驗證 `vite dev` 與 `vite preview`（含 build），檢查 `NindouRuntimeBootstrap`/`NindouModuleProbe`/console error，再自動關閉 server。
- `verify:vite` 會先自動重建 classic runtime bundle，再做 dev/preview 雙路徑檢查。
- `scripts/main.module.js` 的 probe 改為單一 `probeSections` 定義：每個 domain 同時定義 `legacy` 來源、`summarize` 函式、`warning` 文字；`globalThis.NindouModuleProbe` 與 warning 迴圈都由這張表產生。
- `probeSections` 已抽到 `scripts/probe/module-probe-sections.module.mjs`，`probe runtime` 已抽到 `scripts/probe/module-probe-runtime.module.mjs`，`scripts/main.module.js` 只保留入口掛載與 legacy global bridge。
- `legacy global bridge` 也已抽到 `scripts/probe/module-probe-global-bridge.module.mjs`，`scripts/main.module.js` 只負責把 sections/runtime/bridge 串起來。
- `scripts/probe/module-probe-pipeline.module.mjs` 進一步集中 `sections -> runtime -> global bridge` 串接；`scripts/main.module.js` 現在只負責呼叫 pipeline 入口。
- `scripts/probe/module-probe-entry.module.mjs` 提供 default probe 啟動入口（內建 sections + manifest），`scripts/main.module.js` 現在只呼叫 `runDefaultModuleProbe()`。
- `scripts/probe/module-probe-health.module.mjs` 提供 probe 健康度統整（`status/statusCode/issues/message/isProbeSynced/isManifestSynced/unsyncedCount`）；pipeline 會把結果輸出到 `NindouModuleProbeHealth`、`getNindouModuleProbeHealth()` 與 `NindouModuleProbeApi.getHealth()`。
- `scripts/probe/module-probe-diagnostics.module.mjs` 提供快照輸出；可用 `getNindouModuleProbeSnapshot(options)` 一次取得 `health + report + generatedAt`。
- `scripts/probe/module-probe-serialization.module.mjs` 提供穩定 JSON 輸出，`getNindouModuleProbeSnapshotJson(options)` 可直接取得 snapshot 字串。
- `scripts/probe/module-probe-fingerprint.module.mjs` 提供 snapshot 指紋；`getNindouModuleProbeSnapshot(options)` 會附帶 `fingerprint`，便於快速比對內容是否變更。
- `scripts/probe/module-probe-constants.module.mjs` 統一管理 schema/version 與 health message 規則，供 runtime/health 共用，避免多點字串漂移。
- `scripts/probe/module-probe-sections.module.mjs` 另外輸出 `PROBE_SECTION_KEYS` manifest，`scripts/main.module.js` 會檢查 manifest 與 runtime keys 是否一致，並輸出 `isNindouModuleProbeSectionManifestSynced`。
- 新增或移除 probe domain 時，只改 `probeSections` 一處，不要再分開維護多份 key 清單。
- `scripts/main.module.js` 現在以 `globalThis.NindouModuleProbeApi` 作為單一入口，集中提供 `getReport/getMeta/getSummary/getWarnings/getKeys/getSyncedKeys/getUnsyncedKeys/isSynced`，避免 probe 介面持續分散。
- 舊的全域 helper（如 `getNindouModuleProbeReport()`、`getNindouModuleProbeMeta()`、`isNindouModuleProbeSynced`）仍保留做相容層，內部改由 `NindouModuleProbeApi` 轉接。
- `scripts/main.module.js` 也會輸出 `globalThis.NindouModuleProbeSummary`，含 `generatedAt`、`total/synced/unsynced/syncedKeys/unsyncedKeys`，可在 browser console 快速判斷是否全部同步。
- `scripts/main.module.js` 會對 `syncedKeys/unsyncedKeys` 做排序，確保報表順序穩定、便於比對。
- `globalThis.getNindouModuleProbeReport({ keysOnly: true })` 取得的 key 陣列也會沿用同樣排序規則，方便直接做文字 diff。
- `scripts/main.module.js` 也會輸出 `globalThis.isNindouModuleProbeSynced`（boolean），可直接做流程 gating。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeMeta()`，回傳 meta 複本，方便外部讀取而不直接改寫原物件。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeReportVersion()`，可先檢查 report schema 版本再做自動化解析。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeSummary()`，回傳 summary 複本，方便外部安全讀取摘要欄位。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeWarnings()`，回傳 warnings 複本，避免外部直接改動 warning 清單。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeKeys()`，回傳 probe section key 複本，方便做固定順序巡覽。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeUnsyncedKeys()`，可直接取得 `unsyncedKeys` 複本，避免外部直接改動 summary 內容。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeSyncedKeys()`，可直接取得 `syncedKeys` 複本，便於只看已同步區段。
- `scripts/main.module.js` 也會輸出 `globalThis.NindouModuleProbeWarnings`（array），每筆含 `key` 與 `warning`，可直接給工具或自動化讀取，不必解析 console 文字。
- `scripts/main.module.js` 也會輸出 `globalThis.NindouModuleProbeMeta`，目前含 `schema`、`version`、`sectionKeys`、`sectionCount`、`syncedCount`、`unsyncedCount`、`hasUnsynced`、`generatedAt`，供後續 probe schema 演進與診斷時間點判斷。
- `scripts/main.module.js` 也會輸出 `globalThis.getNindouModuleProbeReport(options)`；預設回傳 `{ reportVersion, optionsUsed, meta, summary, warnings, probe }`，傳 `{ includeProbe: false }` 可拿精簡報表（不含 `probe` 大物件），傳 `{ includeMeta: false }` 可省略 meta，傳 `{ includeSummary: false }` 可省略 summary，傳 `{ includeWarnings: false }` 可省略 warnings，傳 `{ onlyUnsynced: true }` 可只回傳不同步的 `probe` 區塊，傳 `{ keysOnly: true }` 可只回傳 probe key 陣列。
- 若傳 `{ keysOnly: true }`，即使同時傳 `{ includeProbe: false }` 仍會輸出 key 陣列（`keysOnly` 優先）。
- 每個 module 都要有 `summarize*()` helper，供 browser probe 和 Node test 比對。
- 如果 browser probe 和 Node test 不一致，優先相信 browser probe，因為 browser 裡 top-level `const` / `let` 不一定掛在 `globalThis`。
---

## 2026-05-24 Bridge generator consolidation

- Added `scripts/tools/classic-bridge-generator.mjs` as shared generator base for:
  - `generate-weapons-classic.mjs`
  - `generate-locales-classic.mjs`
  - `generate-map-classic.mjs`
  - `generate-rule-modes-classic.mjs`
  - `generate-ninjutsu-definitions-classic.mjs`
- Added `npm run sync:bridges` (`scripts/tools/sync-data-bridges.mjs`) to sync all data bridges in one command.
- Goal: reduce duplicated generator maintenance and make module->classic bridge sync a single routine step during Vite migration.

## 2026-05-24 Bridge manifest pipeline

- Added `scripts/tools/bridge-manifest.mjs` as single declarative source for data bridge targets (`weapons`, `ninjutsu-definitions`, `locales`, `map`, `rule-modes`).
- Added `scripts/tools/run-bridge-sync.mjs` to run either one bridge (`runBridgeByKey`) or all (`runAllBridges`).
- `generate-*.mjs` scripts are now thin compatibility wrappers only, so existing `npm run sync:*` commands keep working while maintenance moves to manifest entries.

## 2026-05-24 Config bridge merged into manifest

- `config` bridge (marker patch in `scripts/data/config.js`) is now also managed by `bridge-manifest.mjs` under key `config-nindou`.
- `scripts/tools/generate-config-nindou-bridge.mjs` is now a thin wrapper that calls `runBridgeByKey("config-nindou")`.
- `npm run sync:bridges` now runs `config-nindou + 5 data bridges` through one unified runner.

## 2026-05-25 Single CLI sync entry

- Added `scripts/tools/sync-bridge.mjs` as the only CLI entry for bridge syncing.
- `package.json` `sync:*` scripts now all route to this file with `--key <bridge-key>`; `sync:bridges` uses `--key all`.
- Removed obsolete thin wrapper scripts (`generate-*.mjs` and `sync-data-bridges.mjs`) to reduce script sprawl.

## 2026-05-25 Config bridge spec/generator split

- Added `scripts/tools/config-bridge-spec.mjs` as declarative key lists for config bridge generation.
- Added `scripts/tools/config-bridge-generator.mjs` to own marker patch generation (`buildConfigBridgeBlock` + `generateConfigBridgeSection`).
- `bridge-manifest.mjs` now references config bridge via imported generator instead of embedding the full config patch body inline.

## 2026-05-25 Bridge definition modules

- `bridge-manifest.mjs` is now a thin aggregator only.
- Each bridge now has its own definition module under `scripts/tools/bridge-definitions/` (`config-nindou`, `weapons`, `ninjutsu-definitions`, `locales`, `map`, `rule-modes`).
- Shared transform helper now lives in `scripts/tools/bridge-definitions/bridge-transform-utils.mjs`.

## 2026-05-25 Bridge definition factory + manifest validation

- Added `scripts/tools/bridge-definitions/bridge-definition-factory.mjs` for declarative global-bridge definitions.
- `weapons/locales/ninjutsu-definitions` bridge definitions now use the shared factory instead of custom per-file tail assembly.
- Added `validateBridgeManifest()` in `scripts/tools/bridge-manifest.mjs`; `run-bridge-sync.mjs` validates manifest at startup.

## 2026-05-25 sync-bridge CLI enhancements

- `sync-bridge.mjs` now supports `--list` (print manifest bridge keys) and `--validate` (manifest sanity check only).
- `bridge-manifest.mjs` now exports `BRIDGE_KEYS` and `listBridgeKeys()` as single-source key outputs.
- Added npm helpers: `sync:bridges:list` and `sync:bridges:validate`.

## 2026-05-25 Probe section modular split

- Added `scripts/probe/module-probe-data-sections.module.mjs` and `scripts/probe/module-probe-system-sections.module.mjs`.
- `module-probe-sections.module.mjs` is now a thin composition layer (`data + system`) instead of one large inline section table.
- Added section-manifest tests for both modules to reduce drift risk in probe domain wiring.

## 2026-05-25 Shared data domain manifest

- Added `scripts/shared/data-domain-manifest.module.mjs` as shared single-source mapping for:
  - probe data keys
  - related bridge keys
  - legacy global/path/fallback metadata
- `module-probe-data-sections.module.mjs` now builds data probe sections from this shared manifest.
- `bridge-manifest.mjs` now validates required data bridge coverage against `DATA_BRIDGE_KEYS`.

## 2026-05-25 Classic runtime bundle-only loading

- Historical: `scripts/load-classic-runtime.module.mjs` previously treated `scripts/generated/classic-runtime.bundle.js` as the primary runtime artifact. With an empty runtime manifest, it returns `mode: "none"`.
- Default behavior is now bundle-only loading; missing bundle fails fast with an explicit error.
- Legacy multi-script loading is still available only when `allowScriptFallback: true` is explicitly passed to `loadClassicRuntime()`.
- `scripts/runtime-bootstrap.module.mjs` now defaults to `allowScriptFallback = false`, so runtime drift cannot be hidden by implicit script fallback.

## 2026-05-25 Launcher readiness wait

- `啟動遊戲.cmd` starts the local server before opening the browser.
- The launcher polls `http://127.0.0.1:5173/index.html` and opens the browser only after the local server responds.
- The first version used direct Vite startup; the current fast-play path uses `scripts/tools/serve-game.mjs` instead.

## 2026-05-25 Fast play launcher

- Added `scripts/tools/serve-game.mjs`, a thin static HTTP server for playing the game without Vite dev-server cold start.
- `啟動遊戲.cmd` now starts `serve-game.mjs` on `127.0.0.1:5174`, waits for `/index.html`, then opens the browser.
- Port `5174` is intentionally separate from Vite dev's `5173`, so an already-running Vite server does not make the launcher reuse the slow path.
- Keep `npm run dev` for Vite development work; use `啟動遊戲.cmd` for fast double-click play.

## 2026-05-25 Locales runtime source switched to module install

- Added `scripts/bootstrap/install-locales-globals.module.mjs` to install locale globals from `scripts/data/locales.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs locales globals before loading classic scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/locales.js` in runtime path.
- Result: runtime locale source is now module-first, while legacy `scripts/data/locales.js` remains for bridge/probe compatibility.

## 2026-05-25 Rule-modes runtime source switched to module install

- Added `scripts/bootstrap/install-rule-modes-globals.module.mjs` to install rule-mode globals from `scripts/data/rule-modes.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs rule-mode globals before loading classic scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/rule-modes.js` in runtime path.
- Result: runtime rule-mode source is now module-first, while legacy `scripts/data/rule-modes.js` remains for bridge/probe compatibility.

## 2026-05-25 Ninjutsu data globals switched to module install

- Added `scripts/bootstrap/install-ninjutsu-globals.module.mjs` to install `ninjuCatalog` and related globals from `scripts/data/ninjutsu-definitions.module.mjs`.
- Superseded on 2026-05-26: the same installer now owns the full side-effecting ninjutsu runtime.
- `scripts/runtime-bootstrap.module.mjs` now installs ninjutsu globals before loading classic scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/ninjutsu-definitions.js` in runtime path.
- Result: runtime ninjutsu source is now module-first, while legacy `scripts/data/ninjutsu-definitions.js` remains for bridge/probe compatibility.

## 2026-05-25 Map runtime source switched to module install

- Added `scripts/bootstrap/install-map-globals.module.mjs` to install map globals from `scripts/data/map.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs map globals before loading classic scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/map.js` in runtime path.
- Result: runtime map source is now module-first, while legacy `scripts/data/map.js` remains for bridge/probe compatibility.

## 2026-05-25 Weapons runtime source switched to module install

- Added `scripts/bootstrap/install-weapons-globals.module.mjs` to install weapon globals from `scripts/data/weapons.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs weapon globals before loading classic scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/weapons.js` in runtime path.
- Result: runtime weapon source is now module-first, while legacy `scripts/data/weapons.js` remains for bridge/probe compatibility.

## 2026-05-25 Assets runtime source switched to module install

- Added `scripts/bootstrap/install-assets-globals.module.mjs` to install asset globals from `scripts/data/assets.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs asset globals before loading classic scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/assets.js` in runtime path.
- Result: runtime asset source is now module-first, while legacy `scripts/data/assets.js` remains for bridge/probe compatibility.

## 2026-05-25 Config runtime source switched to module install

- Added `scripts/bootstrap/install-config-globals.module.mjs` to install config globals from `scripts/data/config.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs config globals before assets so dependent globals are ready.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/config.js` in runtime path.
- Result: runtime config source is now module-first, while legacy `scripts/data/config.js` remains for bridge/probe compatibility.

## 2026-05-25 Render tuning runtime source switched to module install

- Added `scripts/data/render-tuning.module.mjs` as module source for render tuning constants and helpers.
- Added `scripts/bootstrap/install-render-tuning-globals.module.mjs` to install render tuning globals before classic runtime scripts.
- `scripts/runtime-bootstrap.module.mjs` now installs render tuning globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/render-tuning.js` in runtime path.
- Result: runtime render tuning source is now module-first, while legacy `scripts/data/render-tuning.js` remains for compatibility and fallback tooling.

## 2026-05-25 Appearance runtime source switched to module install

- Added `scripts/bootstrap/install-appearance-globals.module.mjs` to install appearance globals from `scripts/systems/appearance.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs appearance globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/appearance.js` in runtime path.
- Result: runtime appearance source is now module-first, while legacy `scripts/systems/appearance.js` remains for compatibility and probe sync.

## 2026-05-25 State helpers runtime source switched to module install

- Added `scripts/bootstrap/install-state-helpers-globals.module.mjs` to install state helper globals from `scripts/systems/state-helpers.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs state helper globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/state-helpers.js` in runtime path.
- Result: runtime state helper source is now module-first, while legacy `scripts/systems/state-helpers.js` remains for compatibility and probe sync.

## 2026-05-25 Grid runtime source switched to module install

- Added `scripts/bootstrap/install-grid-globals.module.mjs` to install grid globals from `scripts/systems/grid.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs grid globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/grid.js` in runtime path.
- Result: runtime grid source is now module-first, while legacy `scripts/systems/grid.js` remains for compatibility and probe sync.

## 2026-05-25 Audio runtime source switched to module install

- Added `scripts/bootstrap/install-audio-globals.module.mjs` to install audio globals from `scripts/systems/audio.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs audio globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/audio.js` in runtime path.
- Result: runtime audio source is now module-first, while legacy `scripts/systems/audio.js` remains for compatibility and probe sync.

## 2026-05-25 Match runtime source switched to module install

- Added `scripts/bootstrap/install-match-globals.module.mjs` to install match-flow globals from `scripts/systems/match.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs match globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/match.js` in runtime path.
- Result: runtime match source is now module-first, while legacy `scripts/systems/match.js` remains for compatibility and probe sync.

## 2026-05-25 State/grid runtime reverted to classic load

- `scripts/systems/state-helpers.js` and `scripts/systems/grid.js` are back in `CLASSIC_RUNTIME_SCRIPT_PATHS`, immediately after `asset-loader.js`.
- `scripts/runtime-bootstrap.module.mjs` no longer installs the state/grid runtime wrappers before the classic bundle.
- Reason: these helpers need the classic lexical `state` / `grid` values declared by `game.js`; top-level classic `const` values are not `globalThis` properties, so module-installed wrappers could not read them and battle startup could blank the canvas.
- Keep the `.module.mjs` mirrors and installer tests for probe/compatibility work, but do not make them the runtime source again until the runtime state boundary is explicitly exported.

## 2026-05-25 Runtime state bridge for module installers

- Added `scripts/bootstrap/runtime-state-access.module.mjs` to resolve runtime `state/grid` from either direct globals (`target.state/target.grid`) or `target.NindouRuntimeState` getters.
- `scripts/bootstrap/install-state-helpers-globals.module.mjs` and `scripts/bootstrap/install-grid-globals.module.mjs` now use this resolver instead of assuming direct `target.state`.
- `game.js` now exposes `globalThis.NindouRuntimeState.getState/getGrid` as a compatibility bridge for classic lexical runtime state.
- Added tests for getter-based fallback paths in `tests/install-state-helpers-globals.test.mjs` and `tests/install-grid-globals.test.mjs`.

## 2026-05-25 State/grid runtime switched back to module install (bridge-backed)

- `scripts/runtime-bootstrap.module.mjs` now installs `installStateHelpersGlobals()` and `installGridGlobals()` before loading classic runtime scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/state-helpers.js` and `scripts/systems/grid.js` in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- Runtime safety relies on `globalThis.NindouRuntimeState.getState/getGrid` from `game.js`, so module installers can read classic lexical runtime state without requiring direct `globalThis.state`.

## 2026-05-25 Audio/match runtime switched back to module install (bridge-backed)

- `scripts/runtime-bootstrap.module.mjs` now installs `installAudioGlobals()` and `installMatchGlobals()` before loading classic runtime scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/audio.js` and `scripts/systems/match.js` in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- `install-audio-globals.module.mjs` and `install-match-globals.module.mjs` now resolve runtime state via the shared runtime-state accessor, so they can run against classic lexical state through `NindouRuntimeState`.

## 2026-05-25 Rule-mode runtime state bridge

- `install-rule-modes-globals.module.mjs` must resolve rule mode from `NindouRuntimeState.getState()` instead of assuming `target.state` exists.
- This keeps the browser runtime on `忍2原版` after Vite/module bootstrap. Without the bridge, helper calls fall back to `{}` and `currentRuleModeKey({})` reads as `modified`, causing original-mode values such as `moneyDartRule().damage` to return `70` instead of `100`.
- `tests/install-rule-modes-globals.test.mjs` covers the bridge path: original money dart damage is `100`, then switching the runtime state to `modified` returns `70`.

## 2026-05-25 Evil-castle BGM correction

- Room mode stays on global `roomBgm` (`assets/sounds/bgm/忍2大廳.mp3`).
- `evil-castle-1` and `evil-castle-2` use `assets/sounds/bgm/忍2鬼島戰鬥.mp3` only for battle mode through `roomMapDefinitions[*].battleBgmSrc`.
- Do not add `roomMapDefinitions[*].roomBgmSrc` for evil castle; that incorrectly replaces the lobby/room music.

## 2026-05-25 Asset loader runtime switched to module install

- Added `scripts/bootstrap/install-asset-loader-globals.module.mjs` to install `loadImages()` and frame/image loader helpers before classic runtime scripts load.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/asset-loader.js`; this note was later superseded as runtime scripts kept moving into module installers.
- `NindouAssetLoader` is now a required classic global from module bootstrap, because `app-bootstrap.js -> startGameApp()` still calls global `loadImages()`.

## 2026-05-25 App bootstrap runtime switched to module install

- Added `scripts/bootstrap/install-app-bootstrap-globals.module.mjs` to install `bindGameEvents()`, `setupRoomUi()`, and `startGameApp()` after the classic bundle loads.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/app-bootstrap.js`; the generated bundle now ends at `game.js`.
- The installer queries DOM nodes directly and reads `state` through `NindouRuntimeState.getState()`, because `game.js` keeps DOM/state variables as lexical `const`.

## 2026-05-25 Battle runtime helpers switched to module install

- Added `scripts/bootstrap/install-battle-runtime-globals.module.mjs` to install `updateCharging()`, `updateMatchState()`, `isMatchActive()`, and `useNinjuByType()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/battle-runtime.js`; these helpers now read runtime state through `NindouRuntimeState.getState()`.
- The classic bundle dropped to 17 runtime scripts at this step after removing asset-loader, app-bootstrap, and battle-runtime from the bundle path.

## 2026-05-25 Game-flow runtime switched to module install

- Added `scripts/bootstrap/install-game-flow-globals.module.mjs` to install `startBattleFromRoom()`, room-return helpers, restart-hold helpers, `setRuleMode()`, and `setRoomMap()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/game-flow.js`; the generated classic bundle dropped to 16 runtime scripts at this step.
- The installer keeps restart-hold timer state in module closure and reads game state through `NindouRuntimeState.getState()`.

## 2026-05-25 Scene renderer runtime switched to module install

- Added `scripts/bootstrap/install-scene-renderer-globals.module.mjs` to install `battleMapRect()`, backdrop/frame/map-mask helpers, and `drawBoard()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/scene-renderer.js`; the generated classic bundle dropped to 15 runtime scripts at this step.
- The installer queries `#game` for canvas/context inside the installed draw helpers and reads game state through `NindouRuntimeState.getState()`, avoiding dependency on classic global lexical `canvas`, `ctx`, or `state`.

## 2026-05-25 Overlay renderer runtime switched to module install

- Added `scripts/bootstrap/install-overlay-renderer-globals.module.mjs` to install countdown/result overlay helpers.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/overlay-renderer.js`; the generated classic bundle dropped to 14 runtime scripts at this step.
- The installer queries `#game` for canvas/context at draw time and reads state through `NindouRuntimeState.getState()`.

## 2026-05-25 Effects renderer runtime switched to module install

- Added `scripts/bootstrap/install-effects-renderer-globals.module.mjs` to install ninjutsu/effect drawing helpers and `addNinjuDamageEffect()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/effects-renderer.js`; the generated classic bundle dropped to 13 runtime scripts at this step.
- The installer queries `#game` for canvas/context at draw time and reads state through `NindouRuntimeState.getState()`.

## 2026-05-25 Status UI runtime switched to module install

- Added `scripts/bootstrap/install-status-ui-globals.module.mjs` to install `updatePanel()` and `setMessage()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/status-ui.js`; the generated classic bundle dropped to 12 runtime scripts at this step.
- The installer queries `#unitInfo`, `#skillFill`, and `#status` at call time and uses `NindouRuntimeState.getState()` for message state.

## 2026-05-25 Battle setup runtime switched to module install

- Added `scripts/bootstrap/install-battle-setup-globals.module.mjs` to install `resetGame()`, `makeUnit()`, and `buildStartingUnits()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/battle-setup.js`; the generated classic bundle now contains 11 runtime scripts.
- The installer reads active room cards from `.room-player-card` at call time and reads/writes game state through `NindouRuntimeState.getState()`.
- `roomSkillInputMax` is a lexical `const` in `game.js`, not a `globalThis` property; the module installer must use its own `9999` fallback so initial skill stays finite and movement still spends skill normally.

## 2026-05-25 Combat renderer runtime switched to module install

- Added `scripts/bootstrap/install-combat-renderer-globals.module.mjs` to install map object drawing, slash/weapon attack drawing, old projectile cleanup, money-dart shoot animation drawing, and `moneyDartShootPlacement()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/combat-renderer.js`; the generated classic bundle now contains 10 runtime scripts.
- The installer queries `#game` for canvas/context at draw time and reads combat animation queues through `NindouRuntimeState.getState()`.

## 2026-05-25 Movement renderer runtime switched to module install

- Added `scripts/bootstrap/install-movement-renderer-globals.module.mjs` to install move trails, smooth unit positions, drag arrows, move/use-ninjutsu sprite helpers, and pointer-facing updates.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/movement-renderer.js`; the generated classic bundle now contains 9 runtime scripts.
- The installer queries `#game` for canvas/context at draw time and reads unit/pointer state through `NindouRuntimeState.getState()`.

## 2026-05-25 HUD renderer runtime switched to module install

- Added `scripts/bootstrap/install-hud-renderer-globals.module.mjs` to install battle HUD, soul bar, inventory/item slots, ninjutsu buttons, and HUD text helpers.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/hud-renderer.js`; the generated classic bundle now contains 8 runtime scripts.
- The installer queries `#game` for canvas/context at draw time and reads runtime state/loadout through `NindouRuntimeState.getState()` and `getSelectedNinjuLoadout()`.

## 2026-05-25 Unit renderer runtime switched to module install

- Added `scripts/bootstrap/install-unit-renderer-globals.module.mjs` to install unit body drawing, clone decoys, HP/name labels, eyes, player pointer, buff aura outlines, held money dart, and money-dart shoot eye helpers.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/unit-renderer.js`; the generated classic bundle now contains 7 runtime scripts.
- The installer queries `#game` for canvas/context at draw time and reads unit/clone state through `NindouRuntimeState.getState()`.

## 2026-05-26 Battle input runtime switched to module install

- Added `scripts/bootstrap/install-battle-input-globals.module.mjs` to install `pointerDown()`, `pointerMove()`, and `pointerUp()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/battle-input.js`; the generated classic bundle now contains 6 runtime scripts.
- The installer queries `#game` for pointer coordinate conversion and reads/writes battle input state through `NindouRuntimeState.getState()`.

## 2026-05-26 Room UI runtime switched to module install

- Added `scripts/bootstrap/install-room-ui-globals.module.mjs` to install room setup/select helpers, room map/rule/death UI sync, shop bag actions, and ninjutsu editor loadout helpers.
- `scripts/runtime-bootstrap.module.mjs` now installs room UI globals before loading `game.js`, so `loadSavedNinjuLoadout()` is available during game initialization.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/room-ui.js`; the generated classic bundle now contains 5 runtime scripts.
- `game.js -> NindouRuntimeState` exposes setters/getters for room ninjutsu editor state so module room UI can update the same loadout state used by HUD/battle startup.
- Added `tests/install-room-ui-globals.test.mjs`; `tests/classic-runtime-bundle.test.mjs` now asserts `room-ui.js` is absent from the generated classic bundle.

## 2026-05-26 Movement runtime switched to module install

- Expanded `scripts/bootstrap/install-movement-globals.module.mjs` from helper-only install to full movement runtime install: `skillMove()`, `moveUnit()`, `collideWithEnemy()`, `respawnUnit()`, `randomOpenCell()`, `dragMoveTargetCell()`, and path helpers.
- `scripts/runtime-bootstrap.module.mjs` now installs movement globals before loading the remaining classic bundle.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/movement.js`; the generated classic bundle now contains 4 runtime scripts.
- `tests/install-movement-globals.test.mjs` now covers skill spending/move side effects and collision kill behavior; bundle tests now assert `movement.js` is absent.
- Browser smoke verified battle movement through module `skillMove()`: player moved one cell, skill decreased, canvas remained nonblank, and there were no page/console errors.

## 2026-05-26 Combat runtime switched to module install

- Expanded `scripts/bootstrap/install-combat-globals.module.mjs` from helper-only install to full combat runtime install: `attack()`, `attackCell()`, `attackAimedWeapon()`, `damageUnit()`, object damage, slash records, weapon cooldown, damage helpers, and combat messages.
- `scripts/runtime-bootstrap.module.mjs` now installs combat globals before loading the remaining classic bundle.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/combat.js`; the generated classic bundle now contains 3 runtime scripts.
- `tests/install-combat-globals.test.mjs` now covers combat side effects; bundle tests now assert `combat.js` is absent.
- Browser smoke verified battle combat through module `attackCell()`: an enemy HP changed from 300 to 250, one attack record was created, canvas remained nonblank, and there were no page/console errors.

## 2026-05-26 AI runtime switched to module install

- Expanded `scripts/bootstrap/install-ai-globals.module.mjs` from helper-only install to full AI runtime install: `updateAi()`, movement/chase helpers, red retaliation scheduling, money-dart line targeting, ninjutsu decisions, and breakout behavior.
- `scripts/runtime-bootstrap.module.mjs` now installs AI globals before loading the remaining classic bundle.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/ai.js`; the generated classic bundle now contains 2 runtime scripts.
- `tests/install-ai-globals.test.mjs` now covers AI side effects; bundle tests now assert `ai.js` is absent.
- Browser smoke verified battle AI through module `updateAi()`: an `ai_beginner` unit attacked an adjacent player from 300 to 250 HP, canvas remained nonblank, and there were no page/console errors.

## 2026-05-26 Game runtime switched to module install

- Added `scripts/bootstrap/install-game-globals.module.mjs` for DOM references, runtime `state`, `NindouRuntimeState`, room ninjutsu editor state, `draw()`, and `NindouGame`.
- `scripts/runtime-bootstrap.module.mjs` installs game globals before the remaining bootstrap installers.
- `scripts/classic-runtime-manifest.module.mjs` now has an empty runtime script list; `loadClassicRuntime()` returns `mode: "none"`.
- Classic bundle output is skipped when the manifest is empty; stale `scripts/generated/classic-runtime.bundle.js` is removed instead of keeping a zero-entry wrapper.
- Added `tests/install-game-globals.test.mjs`; bundle/manifest/load tests now assert `game.js` is absent from runtime loading.
- Superseded on 2026-05-26 cleanup: `game.js` and generated `scripts/generated/classic-runtime.bundle.js` were removed from the checkout.
- Verified with `npm test`, `npm run verify:vite`, and browser smoke: room loads, battle starts, canvas is nonblank, `loadedScriptCount` is `0`, and `loadMode` is `none`.

## 2026-05-26 Ninjutsu runtime switched to module install

- Expanded `scripts/bootstrap/install-ninjutsu-globals.module.mjs` from data-only install to full ninjutsu runtime install: `updateNinju()`, status ninjutsu, attack ninjutsu, money dart, clone, chain/gap helpers, and invincibility/status checks.
- `scripts/runtime-bootstrap.module.mjs` now installs ninjutsu globals before loading the remaining classic bundle.
- At this step, `scripts/classic-runtime-manifest.module.mjs` no longer included `scripts/systems/ninjutsu.js`; it was later superseded by the 2026-05-26 game runtime install, which leaves the manifest empty.
- Bundle tests now assert `ninjutsu.js` is absent; existing `tests/ninjutsu.test.js` continues to cover the installed global behavior.
- Browser smoke verified battle ninjutsu through module globals: steel applied, money dart hit an enemy, clone created 2 decoys, canvas remained nonblank, and there were no page/console errors.

## 2026-05-25 Consumables runtime switched to module install

- Added `scripts/bootstrap/install-consumables-globals.module.mjs` and wired it in `scripts/runtime-bootstrap.module.mjs`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes a legacy consumables script in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- Added `tests/install-consumables-globals.test.mjs`; bundle expectation in `tests/classic-runtime-bundle.test.mjs` now asserts no consumables classic script is bundled.

## 2026-05-25 Movement/AI/Combat installer groundwork

- Added installer groundwork:
  - `scripts/bootstrap/install-movement-globals.module.mjs`
  - `scripts/bootstrap/install-ai-globals.module.mjs`
  - `scripts/bootstrap/install-combat-globals.module.mjs`
- `install-movement-globals.module.mjs` was expanded into full runtime on 2026-05-26 and `scripts/systems/movement.js` is no longer in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- `install-combat-globals.module.mjs` was expanded into full runtime on 2026-05-26 and `scripts/systems/combat.js` is no longer in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- `install-ai-globals.module.mjs` was expanded into full runtime on 2026-05-26 and `scripts/systems/ai.js` is no longer in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- Added installer tests:
  - `tests/install-movement-globals.test.mjs`
  - `tests/install-ai-globals.test.mjs`
  - `tests/install-combat-globals.test.mjs`

## 2026-05-25 Ninjutsu runtime rollback note

- Attempting to remove `scripts/systems/ninjutsu.js` from `CLASSIC_RUNTIME_SCRIPT_PATHS` caused battle-start gray screen in real browser play.
- Root cause: `installNinjutsuGlobals` only provides data/global compatibility (`NindouNinjutsu`), while battle runtime still depends on executable ninjutsu system functions from classic `scripts/systems/ninjutsu.js`.
- Superseded on 2026-05-26: `installNinjutsuGlobals` now installs the full executable ninjutsu runtime, and `scripts/systems/ninjutsu.js` is no longer in `CLASSIC_RUNTIME_SCRIPT_PATHS`.

## 2026-05-25 Movement runtime rollback note

- Attempting to remove `scripts/systems/movement.js` from `CLASSIC_RUNTIME_SCRIPT_PATHS` made real battle movement stop working.
- Root cause: the movement installer exposes helper functions, but the current battle input/runtime still relies on the classic executable movement flow for skill spending, trails, collision side effects, and drag completion.
- Superseded on 2026-05-26: the installer now includes the full side-effecting movement flow and `movement.js` is no longer in the runtime bundle.
- After changing runtime manifest entries, run `npm run verify:vite`; with an empty manifest the bundle output is skipped.

## 2026-05-25 AI/Combat runtime rollback note

- Attempting to remove `scripts/systems/ai.js` caused repeated `updateAi is not defined` / `updateAi is not a function` errors from `game.js -> draw()`.
- Attempting to remove `scripts/systems/combat.js` caused `attackAimedWeapon is not defined` from battle pointer input.
- Superseded on 2026-05-26: AI and combat now both have full side-effecting module installers.

## 2026-05-25 Runtime bootstrap boundary cleanup

- Historical note: `scripts/runtime-bootstrap.module.mjs` temporarily stopped installing `installAiGlobals()` before classic runtime load while AI was still classic-execution source of truth.
- Superseded on 2026-05-26: runtime bootstrap now installs `installAiGlobals()` and `installCombatGlobals()` before classic runtime load because both domains are module-first.

## 2026-05-25 Bundle-first runtime loading

- Historical: classic runtime loading went through `scripts/generated/classic-runtime.bundle.js` by default.
- Superseded on 2026-05-26: empty manifest returns `mode: "none"`; explicit per-script loading remains only as a compatibility helper.
- `tests/load-classic-runtime.test.mjs` now pins empty-manifest behavior and explicit legacy script loading.

## 2026-05-25 Module bootstrap owns app start

- `scripts/systems/app-bootstrap.js` no longer auto-runs `startGameApp()` as a classic side effect.
- It now exposes `globalThis.NindouAppBootstrap.startGameApp`, and `scripts/runtime-bootstrap.module.mjs` explicitly starts the classic app after runtime load via `scripts/bootstrap/start-classic-app.module.mjs`.
- Result: `scripts/main.module.js` is now the real startup owner for both runtime loading and app launch timing, while classic runtime remains execution-compatible.

## 2026-05-25 Automatic classic bundle refresh

- Added `scripts/tools/ensure-classic-runtime-bundle.mjs`; with an empty manifest it skips/removes classic bundle output.
- `serve-game.mjs` now runs this bundle freshness check before starting the lightweight local server.
- `vite.config.js` now runs the same check at build start, and `package.json` `dev/build/preview` scripts also call it before invoking Vite.
- Added `tests/ensure-classic-runtime-bundle.test.mjs` to pin the stale-check source list and timestamp logic.
