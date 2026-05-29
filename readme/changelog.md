# 忍豆風雲2單機版：變更紀錄與歷史接手資訊
此檔由 `readme/skill.md` 拆出，完整保留 2026-05-18 之後的近期結構紀錄、Vite/bridge/module 遷移紀錄，以及 2026-05-27 版本變更備忘。回到接手入口請看 [skill.md](./skill.md)。

---

## 19. 近期已確認的結構狀態

### 拆分後的細節文件

- 地圖、座標、素材、阻擋格、出生點與近期地圖微調：[`readme/maps.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/maps.md)
- 忍術資料層、編輯 UI、攻擊系、分身、錢鏢與近期忍術修正：[`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)
- 道具、商店、道具欄、神水、神酒與道具音效/動畫：[`readme/consumables.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/consumables.md)

### 2026-05-18 道具系統

- live code 已有 `backup3`（神水）、`sake4`（神酒）與 `magicWater`（魔水）。
- 道具採一件一格；同種道具多個時要分散到多個 `itemSlots`。
- 房間商店左側點擊已實作道具會直接加入 `state.roomItemSlots`，開戰時套到玩家戰鬥 HUD 的 `itemSlots`。

### 2026-05-22 灰組預設控制

- `game.js -> setupControlSelects()` 現在會把灰組空白控制選單預設成 `player`，藍組空白控制選單維持 `ai_red`。
- `game.js -> setupRoomSlots()` 也會讓新啟用的灰組卡片預設成 `player`，不再自動指定 `ai_red`。
- 房間玩家卡片已移除室長/準備狀態圖、段位與身份文字；不要再用 `.room-level`、`.room-owner`、`.room-ready` 回填卡片顯示。

### 2026-05-22 忍3模式移除

- 房間左上角規則模式目前只保留 `忍2原版` / `original` 與 `忍2修改` / `modified`。
- 舊 `n3` 規則入口已從 `index.html`、`game.js`、`scripts/data/locales.js`、`scripts/data/rule-modes.js`、`scripts/data/config.js` 與 `tests/rule-modes.test.js` 移除。
- 若外部狀態殘留 `ruleModeKey: "n3"`，`currentRuleModeKey()` 與 `setRuleMode()` 會回落到 `original`。

### 2026-05-23 `game.js` 拆分整理

- `scripts/systems/consumables.module.mjs` 承接道具背包、掉落、使用、連用與 `state.onRoomInventoryChanged` hook；`scripts/bootstrap/install-consumables-globals.module.mjs` 將 module helper 安裝到 global runtime；`scripts/bootstrap/install-hud-renderer-globals.module.mjs` 承接戰鬥 HUD 繪製；`scripts/bootstrap/install-room-ui-globals.module.mjs` 保留商店 DOM 與房間協調。
- `scripts/data/locales.js` 承接 `roomLocale()`、武器/控制/忍術/規則/絕命模式等 localized label helpers。
- `scripts/systems/grid.js` 承接方向/面向 helper、`shuffledCellsInArea()`；不再提供或使用 DOM event helper。
- `scripts/systems/state-helpers.js` 承接 `gainSoul()`、`cancelDragIfPressed()`、`teamAliveCount()` 等狀態 helper。
- `scripts/systems/audio.js` 承接 `syncBgm()`、`startBgm()`、`applyVolumeControls()`、`playSound()`、`playBreakSound()`。
- `scripts/systems/appearance.js` 承接 `lookDefinitionByKey()`、`baseLookDefinitionForTeam()`、`unitLookDefinition()`、`unitEyeFrontSprite()`、`unitEyeSideSprite()`。
- `scripts/bootstrap/install-ninjutsu-globals.module.mjs` 承接 `activeMoneyDartCast(unit)`；錢鏢施放/命中規則不要回塞 `game.js`。
- `scripts/data/config.js` 承接移動殘影 timing：`ARRIVE_FRAME_MS`、`ARRIVE_TOTAL`、`PREARRIVE_FRAME_MS`、`PREARRIVE_TOTAL`。

### 2026-05-22 太刀達人 AI

- 新控制模式 key：`ai_tachi_master`，顯示名稱是「太刀達人」，固定武器是 `weapon3`（忍太刀）。
- `ai_tachi_master` 是偏保守 AI：低血優先 `kakki`，沒有鋼鐵時先上 `steel`，有鋼鐵後才進攻。
- 魂量以固定時間累積：`30` 秒到魂一、`60` 秒到魂二，之後每 `30` 秒再升一段，最多魂四。
- 對應測試在 `tests/ai.test.js`。

### 2026-05-21 赤組 AI 與分身外觀

- 控制模式 key：`ai_red`，顯示名稱是「赤組」，固定武器 `weapon8`，固定套用 `lookDefinitions.red`。
- 赤組 AI 有專用定時器、斜角受擊反擊、九宮格武器攻擊、直線延遲衝撞與低血追擊判定。
- 分身動畫與殘影外觀細節已移到 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)。
- 對應測試在 `tests/ai.test.js`。

### 2026-05-21 趙活外觀

- 新外觀 key：`scripts/data/assets.js -> lookDefinitions.zhaohuo`，房間文案在 `scripts/data/locales.js -> zhaohuoLookOption`。
- 目前已接入 `assets/characters/ai/{idle,arrive,use_ninju,dart_shoot}/趙活_*`。
- `趙活_dart` 目前檔名還是 `1.webp ~ 4.webp`，方向未確認，所以 `moneyDartReadySet` 暫時回退到預設 `b`，不要自行猜方向。
- `趙活_prearrive` 目錄已存在，但這一輪未完成方向命名與引用；`moveSet` 暫時沿用預設 `blue` 的 prearrive，arrive 則使用 `趙活_arrive`。
- `趙活` 外觀不畫眼睛：`drawEyes: false`，`roomAvatarEyeSrc: null`。

### 2026-05-23 Vite / ES module 漸進導入

- Vite / ES module 遷移細節已拆到 [`readme/vite-skill.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/vite-skill.md)。
- 目前仍是過渡期：`index.html` 已收斂成單一 module entry，gameplay runtime 由 module bootstrap 安裝 `globalThis.Nindou*` globals；classic runtime manifest 目前為空。
- `scripts/load-classic-runtime.module.mjs` 保留相容入口，manifest 為空時 `loadMode` 是 `none`、`loadedScriptCount` 是 `0`。
- 已完成 Vite skeleton、data module mirrors、systems module installers、legacy `globalThis.Nindou*` bridges、同步測試與 browser probe。
- 所有 probe 應維持 `isSynced: true`。
- `啟動遊戲.cmd` 是目前雙擊啟動入口，會以自身所在資料夾為工作目錄，必要時先跑 `npm install`，再執行 `npm run dev`。
- 目前建議不要把所有 `.js` 無差別改名成 `.mjs`；只轉 runtime 仍在用、可測、能減少雙維護的邊界。
- 若之後要繼續 ES module 化，優先把仍被測試或 bridge 依賴的 classic `.js` 收斂成 generated bridge 或 module import，不要再新增 classic runtime script。
- 後續 Vite 相關變更請同步更新 `readme/vite-skill.md`，主 handoff 只保留此摘要。

---

---

## Vite / bridge / module 遷移細節紀錄
詳細 Vite 指南仍以 [vite-skill.md](./vite-skill.md) 為準；以下是原本保留在 `skill.md` 後半段的逐項歷史紀錄。

### 2026-05-24 Vite probe maintenance

- `scripts/main.module.js` keeps probe-only behavior.
- Probe domains are now defined in a single `probeSections` table (legacy source + summarize helper + warning text).
- Probe domain definitions are now extracted to `scripts/probe/module-probe-sections.module.mjs`, probe runtime is extracted to `scripts/probe/module-probe-runtime.module.mjs`, and `scripts/main.module.js` now focuses on entry wiring and legacy global bridges.
- `module-probe-sections.module.mjs` now exports `PROBE_SECTION_KEYS`; `main.module.js` checks this manifest against runtime keys and exposes `isNindouModuleProbeSectionManifestSynced`.
- `tests/module-probe-runtime.test.js` now directly verifies `buildModuleProbeRuntime()` report/meta/summary/warnings behavior and option switches.
- `tests/module-probe-sections.test.js` verifies section manifest order and section shape (`warning/legacy/summarize`) so probe domain changes cannot silently drift.
- `module-probe-global-bridge.module.mjs` now owns global compatibility wiring; `tests/module-probe-global-bridge.test.js` verifies exported globals and wrapper behavior.
- `module-probe-pipeline.module.mjs` now orchestrates sections/runtime/bridge wiring end-to-end; `tests/module-probe-pipeline.test.js` verifies pipeline install flow and manifest sync result.
- `module-probe-health.module.mjs` now evaluates consolidated probe health with machine-readable `statusCode` and `issues`; pipeline exposes this via `NindouModuleProbeHealth`, `getNindouModuleProbeHealth()`, and `NindouModuleProbeApi.getHealth()`.
- `module-probe-entry.module.mjs` now owns default probe startup wiring, and `main.module.js` only calls `runDefaultModuleProbe()` as a thin entrypoint.
- `module-probe-diagnostics.module.mjs` now provides snapshot output (`health + report + generatedAt`) and is exposed via `getNindouModuleProbeSnapshot(options)`.
- `module-probe-constants.module.mjs` now centralizes probe schema/version and health-message rules, shared by runtime/health to reduce drift.
- `module-probe-serialization.module.mjs` now provides stable JSON snapshot output and is exposed via `getNindouModuleProbeSnapshotJson(options)` / `NindouModuleProbeApi.getSnapshotJson(options)`.
- `module-probe-fingerprint.module.mjs` now provides deterministic snapshot fingerprinting; diagnostics snapshots include `fingerprint` for quick change detection.
- `globalThis.NindouModuleProbe` and warning checks are generated from `probeSections`, so new domains should be added there only.
- `scripts/main.module.js` now uses `globalThis.NindouModuleProbeApi` as the consolidated probe entrypoint (`getReport/getMeta/getSummary/getWarnings/getKeys/getSyncedKeys/getUnsyncedKeys/isSynced`).
- Legacy globals are kept as compatibility wrappers (`getNindouModuleProbeReport`, `getNindouModuleProbeMeta`, `isNindouModuleProbeSynced`, etc.) and now delegate to `NindouModuleProbeApi`.
- `scripts/main.module.js` now also exposes `globalThis.NindouModuleProbeSummary` (`generatedAt`, `total/synced/unsynced/syncedKeys/unsyncedKeys`) for quick browser-side sync checks.
- `syncedKeys` and `unsyncedKeys` are sorted in probe summary to keep diagnostics deterministic.
- `getNindouModuleProbeReport({ keysOnly: true })` follows the same sorted key order for stable plain-text diffs.
- `scripts/main.module.js` now also exposes `globalThis.isNindouModuleProbeSynced` as a quick boolean sync gate.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeMeta()` to return a copied probe meta object for read-only tooling access.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeReportVersion()` so tooling can gate parsing by report schema version.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeSummary()` to return a copied probe summary object for read-only diagnostics.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeWarnings()` to return copied warning entries for read-only diagnostics.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeKeys()` to return a copied ordered probe section key list.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeUnsyncedKeys()` to return a copied unsynced key list without mutating summary state.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeSyncedKeys()` to return a copied synced key list for positive-sync filtering.
- `scripts/main.module.js` also exposes `globalThis.NindouModuleProbeWarnings` for structured unsynced warning entries.
- `scripts/main.module.js` now also exposes `globalThis.NindouModuleProbeMeta` (`schema`, `version`, `sectionKeys`, `sectionCount`, `syncedCount`, `unsyncedCount`, `hasUnsynced`, `generatedAt`) for probe schema and diagnostics timestamp tracking.
- `scripts/main.module.js` now also exposes `globalThis.getNindouModuleProbeReport(options)` returning `reportVersion`, `optionsUsed`, and selected report fields; use `{ includeProbe: false }` for a lightweight report, `{ includeMeta: false }` to omit meta, `{ includeSummary: false }` to omit summary, `{ includeWarnings: false }` to omit warnings, `{ onlyUnsynced: true }` for unsynced sections only, or `{ keysOnly: true }` for probe keys only.
- `keysOnly` takes priority over `includeProbe: false` so key lists are always available when explicitly requested.

### 2026-05-24 data bridge 生成器整併

- 新增 `scripts/tools/classic-bridge-generator.mjs`，統一 `scripts/data/*.module.mjs -> scripts/data/*.js` 的 bridge 產生流程（banner、讀寫檔、輸出流程共用）。
- 下列產生器已改為使用共用底層：
  - `generate-weapons-classic.mjs`
  - `generate-locales-classic.mjs`
  - `generate-map-classic.mjs`
  - `generate-rule-modes-classic.mjs`
  - `generate-ninjutsu-definitions-classic.mjs`
- 新增 `npm run sync:bridges`（`scripts/tools/sync-data-bridges.mjs`）可一次同步五個資料 bridge；建議資料調整後先跑這個，再跑 `npm test` / `npm run build`。

### 2026-05-24 bridge manifest 流程

- 新增 `scripts/tools/bridge-manifest.mjs`，把五個資料 bridge 的來源檔、目標檔、轉換規則集中管理。
- 新增 `scripts/tools/run-bridge-sync.mjs`，提供 `runBridgeByKey()` 與 `runAllBridges()`。
- `scripts/tools/generate-*.mjs` 現在只保留相容入口（薄封裝），核心同步邏輯統一走 manifest，後續新增 bridge 不再需要複製腳本樣板。

### 2026-05-24 config bridge 併入單一同步管線

- `scripts/data/config.js` 的 marker patch（`NINDOU_CONFIG_BRIDGE_START/END`）已併入 `bridge-manifest.mjs`（key: `config-nindou`）。
- `scripts/tools/generate-config-nindou-bridge.mjs` 改為薄封裝，只呼叫 `runBridgeByKey("config-nindou")`。
- `npm run sync:bridges` 現在會一起同步 `config-nindou + weapons + ninjutsu-definitions + locales + map + rule-modes`。

### 2026-05-25 單一 CLI 同步入口

- 新增 `scripts/tools/sync-bridge.mjs` 作為唯一 CLI 入口，支援 `--key <bridge-key>` 與 `--key all`。
- `package.json` 的 `sync:*` 全部改走 `sync-bridge.mjs`，保留原 npm 指令名稱但不再依賴多支 wrapper。
- 移除 `generate-*.mjs` 與 `sync-data-bridges.mjs`，降低工具腳本分散維護成本。

### 2026-05-25 config bridge 規格化

- 新增 `scripts/tools/config-bridge-spec.mjs`，集中管理 config bridge 的 literal/scalar/export key 清單。
- 新增 `scripts/tools/config-bridge-generator.mjs`，專責產生與套用 `NINDOU_CONFIG_BRIDGE_START/END` 區塊。
- `scripts/tools/bridge-manifest.mjs` 不再內嵌大段 config bridge 字串，改以 `generateConfigBridgeSection` 接入，降低 manifest 維護噪音。

### 2026-05-25 bridge 定義模組化

- `scripts/tools/bridge-manifest.mjs` 改為薄聚合檔，只負責組合 bridge 順序與查詢。
- 各 bridge 定義拆到 `scripts/tools/bridge-definitions/*.mjs`，每個 bridge 一個檔案，避免單檔過大。
- 共用轉換 helper 抽到 `scripts/tools/bridge-definitions/bridge-transform-utils.mjs`。

### 2026-05-25 bridge 工廠化與 manifest 驗證

- 新增 `scripts/tools/bridge-definitions/bridge-definition-factory.mjs`，把 global bridge 改為宣告式設定生成。
- `weapons/locales/ninjutsu-definitions` 已改用工廠，降低重複 tail 字串維護。
- `scripts/tools/bridge-manifest.mjs` 新增 `validateBridgeManifest()`；`run-bridge-sync.mjs` 在執行前會先驗證 manifest 結構與 key 唯一性。

### 2026-05-25 sync-bridge CLI 強化

- `scripts/tools/sync-bridge.mjs` 新增 `--list`（列出 bridge keys）與 `--validate`（只驗證 manifest）。
- `scripts/tools/bridge-manifest.mjs` 新增 `BRIDGE_KEYS` 與 `listBridgeKeys()` 作為 key 單一來源。
- `package.json` 新增 `sync:bridges:list` 與 `sync:bridges:validate`。

### 2026-05-25 probe section 模組化

- 新增 `scripts/probe/module-probe-data-sections.module.mjs` 與 `scripts/probe/module-probe-system-sections.module.mjs`。
- `scripts/probe/module-probe-sections.module.mjs` 改為組裝層（data + system），避免單檔 section 定義持續膨脹。
- 新增 `tests/module-probe-data-sections.test.js` 與 `tests/module-probe-system-sections.test.js`，固定兩側 section manifest 順序與形狀。

### 2026-05-25 data domain 單一來源

- 新增 `scripts/shared/data-domain-manifest.module.mjs`，集中定義 data probe key、對應 bridge key 與 legacy global/path/fallback。
- `scripts/probe/module-probe-data-sections.module.mjs` 改為由 shared manifest 組裝，減少 probe 與 bridge 的雙重維護。
- `scripts/tools/bridge-manifest.mjs` 會檢查 `DATA_BRIDGE_KEYS` 是否完整覆蓋，避免 data bridge 遺漏。

### 2026-05-25 bridge registry 整併

- 新增 `scripts/tools/bridge-definitions/bridge-registry.mjs`，把 config/global/custom bridge 定義集中到單一 registry。
- `scripts/tools/bridge-manifest.mjs` 改由 registry + order 組裝，不再維護多個 definition 檔的 import 清單。
- 舊的 `scripts/tools/bridge-definitions/{config-nindou,weapons,ninjutsu-definitions,locales,map,rule-modes}.mjs` 已移除，降低分散維護成本。

### 2026-05-25 bridge dry-run 與順序對齊

- `scripts/tools/sync-bridge.mjs` 新增 `--dry-run`，可在不寫檔下先跑完整 bridge pipeline。
- `--dry-run --json` 會回傳每個 bridge 的 `changed` 狀態，方便先看哪些 classic bridge 將被改動。
- `scripts/tools/bridge-execution.mjs` 現在統一輸出 `dryRun`/`changed` metadata，便於後續 CI 或診斷工具接入。
- `tests/bridge-manifest.test.mjs` 改為直接比對 `DATA_BRIDGE_KEYS`，避免 manifest 順序雙重維護造成測試漂移。

### 2026-05-25 index entry 收斂為單一 module

- `index.html` 已移除多個 classic `<script>`，改為只載入 `scripts/main.module.js`。
- 新增 `scripts/classic-runtime-manifest.module.mjs`，集中管理 classic runtime 載入順序。
- 新增 `scripts/load-classic-runtime.module.mjs`，由 module entry 依 manifest 順序動態載入 classic scripts。
- `scripts/main.module.js` 現在流程為：先 `loadClassicRuntimeScripts()`，再 `runDefaultModuleProbe()`。

### 2026-05-25 runtime bootstrap 管線

- 新增 `scripts/runtime-bootstrap.module.mjs`，把 entry 層整併為單一 bootstrap API。
- bootstrap 會先判斷 runtime mode（`classic` / `module`），再決定是否載入 classic runtime scripts。
- bootstrap 會檢查必要 `Nindou*` globals 是否齊全，缺漏時輸出警告，最後才執行 module probe。
- `scripts/main.module.js` 改為只呼叫 `bootstrapRuntime()`，並把結果掛到 `globalThis.NindouRuntimeBootstrap` 供診斷與工具接線。

### 2026-05-25 classic 載入清單單一來源

- `scripts/classic-runtime-manifest.module.mjs` 集中管理 classic runtime script order 與 core/combat/ai 子集合。
- `tests/helpers/script-loader.js` 的 `loadCoreRules/loadCombatRules/loadAiRules` 對齊同一套子集合順序，避免 runtime 與測試順序分岐。

### 2026-05-25 Vite 端到端健康檢查

- 新增 `scripts/tools/verify-vite-runtime.mjs`：會自動啟動 `vite preview`、以 Playwright 打開 `index.html`、檢查 `NindouRuntimeBootstrap` 是否 ready、`NindouModuleProbe` 是否 synced，並檢查 page error/console error。
- `package.json` 新增 `npm run verify:vite`，作為 Vite 過渡期的快速 smoke 檢查入口。

### 2026-05-25 classic runtime bundle 載入

- 新增 `scripts/tools/build-classic-runtime-bundle.mjs`，把 classic runtime 多檔腳本整併成 `scripts/generated/classic-runtime.bundle.js`。
- `scripts/load-classic-runtime.module.mjs` 改為優先載入 bundle；若 bundle 不可用才 fallback 為逐檔載入。
- `scripts/runtime-bootstrap.module.mjs` 會回報 `loadMode`（`bundle` / `scripts` / `none`）與 `loadedScriptCount`，供 diagnostics 使用。

### 2026-05-25 classic runtime bundle-only 預設

- `scripts/load-classic-runtime.module.mjs` 現在預設只走 bundle 路徑；`scripts/generated/classic-runtime.bundle.js` 缺失或失敗時會直接拋錯。
- 逐檔 classic script fallback 仍保留，但只在明確傳入 `allowScriptFallback: true` 時啟用。
- `scripts/runtime-bootstrap.module.mjs` 預設 `allowScriptFallback = false`，避免隱性回退掩蓋 bundle 問題。

### 2026-05-25 module bootstrap 接管 app 啟動時機

- `scripts/systems/app-bootstrap.js` 不再在 classic runtime 載入尾端直接自動執行 `startGameApp()`。
- classic app 啟動改由 `scripts/runtime-bootstrap.module.mjs` 在 runtime 載入完成後，透過 `scripts/bootstrap/start-classic-app.module.mjs` 明確呼叫 `globalThis.NindouAppBootstrap.startGameApp`。
- 目的：把實際啟動權收斂回 `scripts/main.module.js -> bootstrapRuntime()`，讓 Vite/module entry 是真正入口，而不是外掛在 classic side effect 後面。

### 2026-05-25 locales runtime 改為 module 注入

- 新增 `scripts/bootstrap/install-locales-globals.module.mjs`，由 `scripts/data/locales.module.mjs` 安裝 `roomLocale*` 與 `localized*` 全域 helper。
- `scripts/runtime-bootstrap.module.mjs` 在 classic runtime 載入前，先執行 locale globals 安裝。
- `scripts/classic-runtime-manifest.module.mjs` 已移除 `scripts/data/locales.js` runtime 載入路徑，降低 classic/module 雙維護點。

### 2026-05-25 rule-modes runtime source switched to module install

- 新增 `scripts/bootstrap/install-rule-modes-globals.module.mjs`，由 `scripts/data/rule-modes.module.mjs` 安裝 rule-mode globals。
- `scripts/runtime-bootstrap.module.mjs` 在 classic runtime 載入前，先執行 rule-mode globals 安裝。
- `scripts/classic-runtime-manifest.module.mjs` 已移除 `scripts/data/rule-modes.js` runtime 載入路徑，降低 classic/module 雙維護點。

### 2026-05-25 ninjutsu runtime source switched to module install

- 新增 `scripts/bootstrap/install-ninjutsu-globals.module.mjs`，由 `scripts/data/ninjutsu-definitions.module.mjs` 安裝 `ninjuCatalog` / `ninjuByType` / `defaultNinjuLoadout` 等 globals。
- `scripts/runtime-bootstrap.module.mjs` 在 classic runtime 載入前，先執行 ninjutsu globals 安裝。
- `scripts/classic-runtime-manifest.module.mjs` 已移除 `scripts/data/ninjutsu-definitions.js` runtime 載入路徑，降低 classic/module 雙維護點。

### 2026-05-25 map runtime source switched to module install

- 新增 `scripts/bootstrap/install-map-globals.module.mjs`，由 `scripts/data/map.module.mjs` 安裝 `mapObjectBuilders` / `buildMapObjects` 等 map globals。
- `scripts/runtime-bootstrap.module.mjs` 在 classic runtime 載入前，先執行 map globals 安裝。
- `scripts/classic-runtime-manifest.module.mjs` 已移除 `scripts/data/map.js` runtime 載入路徑，降低 classic/module 雙維護點。

### 2026-05-25 weapons runtime source switched to module install

- 新增 `scripts/bootstrap/install-weapons-globals.module.mjs`，由 `scripts/data/weapons.module.mjs` 安裝 `weaponDefinitions` / `weaponFrames` 等 weapon globals。
- `scripts/runtime-bootstrap.module.mjs` 在 classic runtime 載入前，先執行 weapon globals 安裝。
- `scripts/classic-runtime-manifest.module.mjs` 已移除 `scripts/data/weapons.js` runtime 載入路徑，降低 classic/module 雙維護點。

### 2026-05-25 assets runtime source switched to module install

- 新增 `scripts/bootstrap/install-assets-globals.module.mjs`，由 `scripts/data/assets.module.mjs` 安裝 `images/sounds/lookDefinitions/*FrameSources/*Frames/attackNinjuConfigs` 等 asset globals。
- `scripts/runtime-bootstrap.module.mjs` 在 classic runtime 載入前，先執行 asset globals 安裝。
- `scripts/classic-runtime-manifest.module.mjs` 已移除 `scripts/data/assets.js` runtime 載入路徑，降低 classic/module 雙維護點。

### 2026-05-25 config runtime source switched to module install

- 新增 `scripts/bootstrap/install-config-globals.module.mjs`，由 `scripts/data/config.module.mjs` 安裝 `roomMapDefinitions/ninjutsuRuleProfiles/attackNinjuOutcomeTables` 等 config globals。
- `scripts/runtime-bootstrap.module.mjs` 先安裝 config globals，再安裝 assets globals，確保依賴順序正確。
- `scripts/classic-runtime-manifest.module.mjs` 已移除 `scripts/data/config.js` runtime 載入路徑，降低 classic/module 雙維護點。

### 2026-05-25 render-tuning runtime source switched to module install

- Added `scripts/data/render-tuning.module.mjs` as module source for render tuning constants and helpers.
- Added `scripts/bootstrap/install-render-tuning-globals.module.mjs` to install render tuning globals before classic runtime scripts.
- `scripts/runtime-bootstrap.module.mjs` now installs render tuning globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/data/render-tuning.js` in runtime path.

### 2026-05-25 appearance runtime source switched to module install

- Added `scripts/bootstrap/install-appearance-globals.module.mjs` to install appearance globals from `scripts/systems/appearance.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs appearance globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/appearance.js` in runtime path.

### 2026-05-25 state-helpers runtime source switched to module install

- Added `scripts/bootstrap/install-state-helpers-globals.module.mjs` to install state helper globals from `scripts/systems/state-helpers.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs state helper globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/state-helpers.js` in runtime path.

### 2026-05-25 grid runtime source switched to module install

- Added `scripts/bootstrap/install-grid-globals.module.mjs` to install grid globals from `scripts/systems/grid.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs grid globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/grid.js` in runtime path.

### 2026-05-25 audio runtime source switched to module install

- Added `scripts/bootstrap/install-audio-globals.module.mjs` to install audio globals from `scripts/systems/audio.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs audio globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/audio.js` in runtime path.

### 2026-05-25 match runtime source switched to module install

- Added `scripts/bootstrap/install-match-globals.module.mjs` to install match-flow globals from `scripts/systems/match.module.mjs`.
- `scripts/runtime-bootstrap.module.mjs` now installs match globals in classic runtime mode.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/match.js` in runtime path.

### 2026-05-25 State/grid runtime reverted to classic load

- `scripts/systems/state-helpers.js` and `scripts/systems/grid.js` are back in `CLASSIC_RUNTIME_SCRIPT_PATHS`, immediately after `asset-loader.js`.
- `scripts/runtime-bootstrap.module.mjs` no longer installs the state/grid runtime wrappers before the classic bundle.
- Reason: these helpers need the classic lexical `state` / `grid` values declared by `game.js`; top-level classic `const` values are not `globalThis` properties, so module-installed wrappers could not read them and battle startup could blank the canvas.
- Keep the `.module.mjs` mirrors and installer tests for probe/compatibility work, but do not make them the runtime source again until the runtime state boundary is explicitly exported.

### 2026-05-25 Runtime state bridge for module installers

- Added `scripts/bootstrap/runtime-state-access.module.mjs` to resolve runtime `state/grid` from either direct globals (`target.state/target.grid`) or `target.NindouRuntimeState` getters.
- `scripts/bootstrap/install-state-helpers-globals.module.mjs` and `scripts/bootstrap/install-grid-globals.module.mjs` now use this resolver instead of assuming direct `target.state`.
- `game.js` now exposes `globalThis.NindouRuntimeState.getState/getGrid` as a compatibility bridge for classic lexical runtime state.
- Added tests for getter-based fallback paths in `tests/install-state-helpers-globals.test.mjs` and `tests/install-grid-globals.test.mjs`.

### 2026-05-25 State/grid runtime switched back to module install (bridge-backed)

- `scripts/runtime-bootstrap.module.mjs` now installs `installStateHelpersGlobals()` and `installGridGlobals()` before loading classic runtime scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/state-helpers.js` and `scripts/systems/grid.js` in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- Runtime safety relies on `globalThis.NindouRuntimeState.getState/getGrid` from `game.js`, so module installers can read classic lexical runtime state without requiring direct `globalThis.state`.

### 2026-05-25 Audio/match runtime switched back to module install (bridge-backed)

- `scripts/runtime-bootstrap.module.mjs` now installs `installAudioGlobals()` and `installMatchGlobals()` before loading classic runtime scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes `scripts/systems/audio.js` and `scripts/systems/match.js` in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- `install-audio-globals.module.mjs` and `install-match-globals.module.mjs` now resolve runtime state via the shared runtime-state accessor, so they can run against classic lexical state through `NindouRuntimeState`.

### 2026-05-25 Rule-mode runtime state bridge

- `install-rule-modes-globals.module.mjs` now resolves rule mode via `NindouRuntimeState.getState()` through `runtime-state-access.module.mjs`.
- This fixes browser runtime original-mode values after Vite bootstrap: `moneyDartRule().damage` stays `100` in `忍2原版` and only returns `70` in `忍2修改`.
- `tests/install-rule-modes-globals.test.mjs` covers the bridge-backed original/modified switch.

### 2026-05-25 Asset loader runtime switched to module install

- `scripts/bootstrap/install-asset-loader-globals.module.mjs` now installs `loadImages()` and image/frame loader helpers before classic runtime scripts.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/asset-loader.js`; this note was later superseded as runtime scripts kept moving into module installers.
- `app-bootstrap.js -> startGameApp()` still calls global `loadImages()`, so `NindouAssetLoader` is a required bootstrap global.

### 2026-05-25 App bootstrap runtime switched to module install

- `scripts/bootstrap/install-app-bootstrap-globals.module.mjs` now installs `bindGameEvents()`, `setupRoomUi()`, and `startGameApp()` after classic bundle load.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/app-bootstrap.js`; the generated classic bundle now ends at `game.js`.
- The installer queries DOM nodes directly and uses `NindouRuntimeState.getState()` for state access, because `game.js` keeps DOM/state as lexical `const`.

### 2026-05-25 Battle runtime helpers switched to module install

- `scripts/bootstrap/install-battle-runtime-globals.module.mjs` now installs `updateCharging()`, `updateMatchState()`, `isMatchActive()`, and `useNinjuByType()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/battle-runtime.js`; those helpers read runtime state through `NindouRuntimeState.getState()`.
- The generated classic bundle dropped to 17 runtime scripts at this step after removing asset-loader, app-bootstrap, and battle-runtime from the bundle path.

### 2026-05-25 Game-flow runtime switched to module install

- `scripts/bootstrap/install-game-flow-globals.module.mjs` now installs `startBattleFromRoom()`, room-return helpers, restart-hold helpers, `setRuleMode()`, and `setRoomMap()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/game-flow.js`; the generated classic bundle dropped to 16 runtime scripts at this step.
- Restart-hold timer state now lives in the module installer closure, while game state still comes from `NindouRuntimeState.getState()`.

### 2026-05-25 Scene renderer runtime switched to module install

- `scripts/bootstrap/install-scene-renderer-globals.module.mjs` now installs `battleMapRect()`, backdrop/frame/map-mask helpers, and `drawBoard()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/scene-renderer.js`; the generated classic bundle dropped to 15 runtime scripts at this step.
- Scene drawing helpers query `#game` for canvas/context when called and use `NindouRuntimeState.getState()` for state-dependent board overlays.

### 2026-05-25 Overlay renderer runtime switched to module install

- `scripts/bootstrap/install-overlay-renderer-globals.module.mjs` now installs countdown/result overlay helpers.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/overlay-renderer.js`; the generated classic bundle dropped to 14 runtime scripts at this step.
- Overlay helpers query `#game` for canvas/context when called and use `NindouRuntimeState.getState()` for countdown/result state.

### 2026-05-25 Effects renderer runtime switched to module install

- `scripts/bootstrap/install-effects-renderer-globals.module.mjs` now installs ninjutsu/effect drawing helpers and `addNinjuDamageEffect()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/effects-renderer.js`; the generated classic bundle dropped to 13 runtime scripts at this step.
- Effect helpers query `#game` for canvas/context when called and use `NindouRuntimeState.getState()` for effect queues and unit state.

### 2026-05-25 Status UI runtime switched to module install

- `scripts/bootstrap/install-status-ui-globals.module.mjs` now installs `updatePanel()` and `setMessage()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/status-ui.js`; the generated classic bundle dropped to 12 runtime scripts at this step.
- Status helpers query `#unitInfo`, `#skillFill`, and `#status` when called and use `NindouRuntimeState.getState()` for message state.

### 2026-05-25 Battle setup runtime switched to module install

- `scripts/bootstrap/install-battle-setup-globals.module.mjs` now installs `resetGame()`, `makeUnit()`, and `buildStartingUnits()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/battle-setup.js`; the generated classic bundle now contains 11 runtime scripts.
- Battle setup reads active room cards from `.room-player-card` when called and uses `NindouRuntimeState.getState()` for runtime state.
- Do not read `target.roomSkillInputMax` directly in this installer; `roomSkillInputMax` is a `game.js` lexical `const`, so the installer uses a `9999` fallback to keep initial `skill/skillMax` finite and prevent free movement.

### 2026-05-25 Combat renderer runtime switched to module install

- `scripts/bootstrap/install-combat-renderer-globals.module.mjs` now installs map object drawing, slash/weapon attack drawing, old projectile cleanup, money-dart shoot animation drawing, and `moneyDartShootPlacement()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/combat-renderer.js`; the generated classic bundle now contains 10 runtime scripts.
- Combat renderer helpers query `#game` for canvas/context when called and read animation queues through `NindouRuntimeState.getState()`.

### 2026-05-25 Movement renderer runtime switched to module install

- `scripts/bootstrap/install-movement-renderer-globals.module.mjs` now installs move trails, smooth unit positions, drag arrows, move/use-ninjutsu sprite helpers, and pointer-facing updates.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/movement-renderer.js`; the generated classic bundle now contains 9 runtime scripts.
- Movement renderer helpers query `#game` for canvas/context when called and read unit/pointer state through `NindouRuntimeState.getState()`.

### 2026-05-25 HUD renderer runtime switched to module install

- `scripts/bootstrap/install-hud-renderer-globals.module.mjs` now installs battle HUD, soul bar, inventory/item slots, ninjutsu buttons, and HUD text helpers.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/hud-renderer.js`; the generated classic bundle now contains 8 runtime scripts.
- HUD renderer helpers query `#game` for canvas/context when called and read runtime state/loadout through `NindouRuntimeState.getState()` and `getSelectedNinjuLoadout()`.

### 2026-05-25 Unit renderer runtime switched to module install

- `scripts/bootstrap/install-unit-renderer-globals.module.mjs` now installs unit body drawing, clone decoys, HP/name labels, eyes, player pointer, buff aura outlines, held money dart, and money-dart shoot eye helpers.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/unit-renderer.js`; the generated classic bundle now contains 7 runtime scripts.
- Unit renderer helpers query `#game` for canvas/context when called and read unit/clone state through `NindouRuntimeState.getState()`.

### 2026-05-26 Battle input runtime switched to module install

- `scripts/bootstrap/install-battle-input-globals.module.mjs` now installs `pointerDown()`, `pointerMove()`, and `pointerUp()`.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/battle-input.js`; the generated classic bundle now contains 6 runtime scripts.
- Battle input queries `#game` for pointer coordinate conversion and reads/writes battle input state through `NindouRuntimeState.getState()`.

### 2026-05-26 Room UI runtime switched to module install

- `scripts/bootstrap/install-room-ui-globals.module.mjs` now installs room setup/select helpers, room map/rule/death UI sync, shop bag actions, and ninjutsu editor loadout helpers.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/room-ui.js`; the generated classic bundle now contains 5 runtime scripts.
- `game.js -> NindouRuntimeState` now exposes setters/getters for `selectedNinjuLoadout`, `editNinjuDraft`, and `editNinjuSlotIndex` so the module installer can preserve the classic room editor state flow.
- Added `tests/install-room-ui-globals.test.mjs`; `tests/classic-runtime-bundle.test.mjs` now asserts `room-ui.js` is absent from the generated classic bundle.

### 2026-05-26 Movement runtime switched to module install

- `scripts/bootstrap/install-movement-globals.module.mjs` now installs the full movement runtime: `skillMove()`, `moveUnit()`, collision/respawn helpers, drag target resolution, and path helpers.
- `scripts/runtime-bootstrap.module.mjs` installs movement globals before loading the remaining classic bundle.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/movement.js`; the generated classic bundle now contains 4 runtime scripts.
- Added side-effect tests in `tests/install-movement-globals.test.mjs`; `tests/classic-runtime-bundle.test.mjs` and `tests/ensure-classic-runtime-bundle.test.mjs` now assert `movement.js` is absent from runtime bundle/source tracking.
- Browser smoke verified module `skillMove()` in battle: player moved one cell, skill decreased, canvas stayed nonblank, and no page/console errors were raised.

### 2026-05-26 Combat runtime switched to module install

- `scripts/bootstrap/install-combat-globals.module.mjs` now installs the full combat runtime: `attack()`, `attackCell()`, `attackAimedWeapon()`, `damageUnit()`, object damage, slash records, weapon cooldown, damage helpers, and combat messages.
- `scripts/runtime-bootstrap.module.mjs` installs combat globals before loading the remaining classic bundle.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/combat.js`; the generated classic bundle now contains 3 runtime scripts.
- Added side-effect tests in `tests/install-combat-globals.test.mjs`; bundle tests now assert `combat.js` is absent.
- Browser smoke verified module combat in battle: `attackCell()` damaged an enemy from 300 to 250 HP, created one attack record, kept the canvas nonblank, and raised no page/console errors.

### 2026-05-26 Game runtime switched to module install

- Added `scripts/bootstrap/install-game-globals.module.mjs` to install DOM references, `state`, `NindouRuntimeState`, room ninjutsu editor state, `draw()`, and `NindouGame`.
- `scripts/runtime-bootstrap.module.mjs` installs game globals before render/data/system globals that need the runtime state bridge.
- `scripts/classic-runtime-manifest.module.mjs` now has an empty runtime script list; `loadClassicRuntime()` returns `mode: "none"` and classic bundle output is skipped.
- Added `tests/install-game-globals.test.mjs`; runtime/bootstrap/bundle tests now assert `game.js` is absent from the classic runtime path.
- Superseded on 2026-05-26 cleanup: `game.js` and the generated `scripts/generated/classic-runtime.bundle.js` file were removed from the checkout.
- Browser smoke verified room load, battle start, nonblank canvas, `loadedScriptCount: 0`, and `loadMode: "none"`.

### 2026-05-26 AI runtime switched to module install

- `scripts/bootstrap/install-ai-globals.module.mjs` now installs the full AI runtime: `updateAi()`, movement/chase helpers, red retaliation scheduling, money-dart line targeting, ninjutsu decisions, and breakout behavior.
- `scripts/runtime-bootstrap.module.mjs` installs AI globals before loading the remaining classic bundle.
- `scripts/classic-runtime-manifest.module.mjs` no longer loads `scripts/systems/ai.js`; the generated classic bundle now contains 2 runtime scripts.
- Added side-effect coverage in `tests/install-ai-globals.test.mjs`; bundle tests now assert `ai.js` is absent.
- Browser smoke verified module `updateAi()` in battle: an `ai_beginner` unit attacked an adjacent player from 300 to 250 HP, canvas stayed nonblank, and no page/console errors were raised.

### 2026-05-26 Ninjutsu runtime switched to module install

- `scripts/bootstrap/install-ninjutsu-globals.module.mjs` now installs the full ninjutsu runtime: `updateNinju()`, status ninjutsu, attack ninjutsu, money dart, clone, chain/gap helpers, and invincibility/status checks.
- `scripts/runtime-bootstrap.module.mjs` installs ninjutsu globals before loading the remaining classic bundle.
- At this step, `scripts/classic-runtime-manifest.module.mjs` no longer loaded `scripts/systems/ninjutsu.js`; this was later superseded by the game runtime installer, which leaves the manifest empty.
- Bundle tests now assert `ninjutsu.js` is absent; existing `tests/ninjutsu.test.js` still covers the behavior through the installed globals.
- Browser smoke verified module ninjutsu in battle: steel applied, money dart hit an enemy, clone created 2 decoys, canvas stayed nonblank, and no page/console errors were raised.

### 2026-05-25 Evil-castle BGM correction

- Room mode stays on the global room music `assets/sounds/bgm/忍2大廳.mp3`.
- `evil-castle-1` and `evil-castle-2` use `assets/sounds/bgm/忍2鬼島戰鬥.mp3` only for battle mode through `roomMapDefinitions[*].battleBgmSrc`.
- Do not set `roomMapDefinitions[*].roomBgmSrc` for evil castle; the original room/lobby music should remain the normal 忍2 lobby track.

### 2026-05-25 Consumables runtime switched to module install

- Added `scripts/bootstrap/install-consumables-globals.module.mjs` and wired it in `scripts/runtime-bootstrap.module.mjs`.
- `scripts/classic-runtime-manifest.module.mjs` no longer includes a legacy consumables script in `CLASSIC_RUNTIME_SCRIPT_PATHS`.
- Added `tests/install-consumables-globals.test.mjs`; bundle expectation in `tests/classic-runtime-bundle.test.mjs` now asserts no consumables classic script is bundled.

2026-05-27 [v2.1]更改內容：
獲得物品音效修改：get_item.ogg、get_item2.ogg
圖片修改：[成功]、[重撃]圖片己更改成原版N2
忍術召喚音效：[死神]已更改成原版N2
攻撃圖片：[小撃]、[中撃]、[重撃]、[成功]、[失敗]已調整合適位置
忍術攻撃：[閃光]、[野火]、[急凍]、[死神]已調整合適位置

忍術[急凍]音效修改：small_ice.ogg、small_ice_hit.ogg、icebreak.ogg
新增武器:貓手、修羅爪
打箱子、瓶：40%→100%出現道具
打草、桶、花、樹木100%不會出現道具
[閃光]可自定攻撃力
[野火]命中60％→命中30％(小撃)丨20%(中撃)
[急凍]顯示小撃→顯示成功
[死神]攻撃力9999→攻撃力99999

放攻忍已調整合適位置
攻忍x秒後才扣血
加入攻忍播放自定音效
Frames已調整合適播放速度

新增武器：抓癢不求人
忍術攻撃：[野火]已調整合適音效
魂條已調整合適位置
忍術[分身]已調整圖片合適位置
AI：自定AI死亡音效 (X)

{v2.6尚未完成}-忍術[七道] 音效(只做了音效)
