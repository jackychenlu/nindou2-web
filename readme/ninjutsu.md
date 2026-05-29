# 忍豆風雲2單機版：忍術系統說明

這份文件集中記錄忍術資料入口、編輯 UI、施放流程、特殊行為與近期修正。`readme/skill.md` 只保留入口摘要。

---

## 1. 主要入口

- 數值：`scripts/data/config.js -> ninjutsuRuleProfiles`
- 攻擊系結果表：`scripts/data/config.js -> attackNinjuOutcomeTables`
- 定義與編輯排序：`scripts/data/ninjutsu-definitions.js -> ninjuCatalog`、`ninjuEditorCatalog`、`defaultNinjuLoadout`
- 素材與特效：`scripts/data/assets.js -> attackNinjuConfigs`、`specialNinjuConfigs`
- 規則查詢：`scripts/data/rule-modes.js`
- 施放流程：`scripts/bootstrap/install-ninjutsu-globals.module.mjs`
- HUD 按鈕：`scripts/bootstrap/install-hud-renderer-globals.module.mjs -> drawNinjuSlot()`、`currentNinjuButtonList()`
- 編輯 UI：`scripts/bootstrap/install-room-ui-globals.module.mjs -> renderNinjuEditor()`、`style.css`
- 整理表：`readme/ninjutsu-table.csv`

---

## 2. 忍術編輯 UI

- 玩家可自選 6 種忍術。
- 點上排已裝忍術會卸下。
- 點下排可選忍術會裝到第一個空格。
- 「重來」會清空上排。
- 上排順序就是戰鬥中的忍術列順序。

目前 editor 分類順序：

- 回復系：`genki`、`kakki`、`shinki`
- 輔助系：`steel`、`hotBlood`
- 攻擊系：`flash`、`wildfire`、`death`、`freeze`、`angel`、`mouryo`
- 特殊系：`moneyDart`、`seven`、`clone`
- 變身系：目前沒有啟用項目

目前 editor 與上排已選忍術框圖規則：

- 攻擊系統一用 `assets/ninju/buttons/1.webp`
- 輔助系統一用 `assets/ninju/buttons/2.webp`
- 特殊系統一用 `assets/ninju/buttons/3.webp`
- 回復系統一用 `assets/ninju/buttons/4.webp`
- 變身系統一用 `assets/ninju/buttons/5.webp`
- 上排 `ninju-slot-choice` 與下排 `ninju-option` 都跟著 `editorRow` 套同一套框，不要再只對個別忍術寫死。

---

## 3. Live Code 行為要點

- `steel`、`hotBlood`、`genki`、`kakki`、`shinki` 走一般狀態/回復忍術流程。
- `deathModeKey` 目前分 `death_command` / `death_heal`，房間預設是 `death_heal`。
- `death_heal` 會額外放開 `genki`、`kakki`、`shinki`。
- `death_command` 禁用 `genki`、`kakki`、`shinki`；沒有 `忍2修改 + genki` 例外。
- `moneyDart` 走獨立準備與直線即時命中流程，規則看 `moneyDartRule()`；它沒有飛行速度設定，丟出當下若敵人在同列/同行且中間無阻擋就直接命中。
- `activeMoneyDartCast(unit)` 在 `scripts/bootstrap/install-ninjutsu-globals.module.mjs`，供 combat / HUD / 繪圖查詢角色是否仍在錢鏢出手動畫中。
- 攻擊系忍術走 `attackNinjuConfigs` + `attackNinjuRule(type)`；施放門檻主要是魂，不是技量。
- `moneyDart` 目前仍會檢查並扣除 `rule.cost`。
- `moneyDart` 在忍術施放中或 chain gap 排程時，只有第一次成功排入才扣 `rule.cost`；已經 queued 時重按不能再扣技。
- 所有忍術進入 active 施放階段時都會取得 `ninjuFollowupMoveAllowance`，目前是中間 3 段移動；`shinki` 的施放開始僵直不得擋掉施放者這 3 段移動。
- `buffAuraType` 會影響最後顯示的 buff 外圈。

目前攻擊系忍術：

- `flash`
- `wildfire`
- `death`
- `freeze`
- `angel`
- `mouryo`

---

## 4. 分身與特效

- `clone` 走 `triggerCloneNinju()`，會把施放者傳到一個非原位可走格，並建立兩個可穿越分身殘影。
- `clone` 施法動畫依施放者分流：赤組外觀用 `assets/characters/ai/clone/a1_clone/`，灰組用 `assets/characters/g_clone/`，其他藍方維持 `assets/characters/b_clone/`。
- `clone` 成功建立分身後 `1.5` 秒播放 `assets/sounds/ninja/clone.ogg`；所有角色使用分身都會播放。
- 分身殘影會顯示和本體相同的血條與名稱，並透過 `casterId` 即時同步本體目前的 `steel` / `hotBlood` 外觀。
- `cloneOpenCells()` 不要硬寫舊地圖邊界；它應掃全地圖，再交給 `isBlockedCell()` 排除各地圖自己的不可走範圍、封鎖格與物件。
- `shinki` 是全隊回復：施放開始時，施放者和同隊存活隊友要同時出現補血動畫並僵直 `1.5` 秒；`refreshStatusNinju()` 到結算點只補血，不要再補發動畫，否則隊友動畫會晚一拍。

特效與素材注意：

- `wildfire` 要用 `assets/ninju/status/small_fire/F/`。
- `death` 要維持獨立，不要覆蓋 `wildfire`。
- 錢鏢視覺偏移在 `scripts/data/render-tuning.js -> moneyDartVisualOffsets`。

---

## 5. 近期紀錄

### 2026-05-18 忍術資料層整理

- 忍術主要數值集中在 `scripts/data/config.js -> ninjutsuRuleProfiles`。
- 攻擊系忍術結果表集中在 `scripts/data/config.js -> attackNinjuOutcomeTables`。
- `scripts/data/assets.js -> attackNinjuConfigs` 主要管素材、音效、特效對應，不是第一優先的數值入口。
- `scripts/data/rule-modes.js` 主要負責依模式回傳對應規則，不應再把數值拆散回流程檔。

### 2026-05-18 忍術 UI 外觀規則

- 新增忍術時，除了資料與流程，還要同步改 `style.css` 的 editor 外觀。
- 攻擊系忍術用紅框按鈕。
- 特殊系忍術用藍框按鈕。
- 回復系與輔助系沿用既有樣式。
- 變身系目前沒有啟用忍術；如果之後恢復變身列，選單位置可用 `style.css` 內對應變數微調。

### 2026-05-21 忍術行為修正

- `scripts/systems/ninjutsu.js -> useMoneyDart()` 已避免重複排程錢鏢時重複扣技。
- 排程前若 `pendingMoneyDart` 或 `nextType === "moneyDart"` 已存在，直接回報 already queued。
- `scripts/systems/ninjutsu.js` 的忍術 queue 會保留點擊順序；道具中點忍術會排到道具動畫之後，忍術中點道具會排到所有已排忍術動畫之後，避免兩套 1.5 秒動畫互相插播。
- `scripts/systems/ninjutsu.js -> cloneOpenCells()` 已改成掃全地圖後交給 `isBlockedCell()` 判斷，避免 `極惡城之一` 這類自訂 `playableInternalYMax` 的地圖漏掉合法底排。
- `shinki` 的補血動畫與僵直時機已由 `tests/ninjutsu.test.js` 覆蓋：動畫與 `disabledUntil` 必須在施放開始時同步套到同隊存活角色，結算時只補 HP。

---

## 6. 驗證

- 忍術資料或流程改動後至少跑 `npm run check`。
- 涉及忍術規則、分身、錢鏢、回血時，跑 `node --test .\tests\ninjutsu.test.js`。
- 能跑完整回歸時，跑 `npm test`。
