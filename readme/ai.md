# 忍豆風雲2單機版：AI 系統說明

此檔由 `readme/skill.md` 拆出，保留 AI 類型、赤組、太刀達人、錢鏢 AI、AI 禁忌與測試位置。回到接手入口請看 [skill.md](./skill.md)。

---

## 13. AI 系統重點

主要位置：

- `scripts/bootstrap/install-ai-globals.module.mjs`
- `scripts/systems/ai.module.mjs -> aiProfiles`

目前 AI 類型：

| ID                       | 名稱     | 行為                                                                  |
| ------------------------ | -------- | --------------------------------------------------------------------- |
| `ai_beginner`          | 初心者   | 一般近戰 AI                                                           |
| `ai_red`               | 赤組     | 固定用 `weapon8` 與赤組外觀，不受技限制，依定時/受擊/九宮格規則行動 |
| `ai_tachi_master`      | 太刀達人 | 固定用 `weapon3` 忍太刀；低於 200 HP 用活氣；有鋼鐵才主動攻擊       |
| `ai_god`               | AI神人   | 反應快，會拿錢鏢與野火                                                |
| `ai_money_dart_master` | 錢鏢神人 | 偏重找直線丟錢鏢                                                      |
| `ai_dart_only_master`  | 尬鏢神人 | 幾乎只追線丟錢鏢                                                      |

錢鏢 AI 入口：

- `aiMoneyDartAimCell()`
- `aiCanStartMoneyDartAfterLineDelay()`
- `tryAiThrowMoneyDart()`
- `aiStepToMoneyDartLine()`

實作約束：

- `ai_red` 固定武器是 `weapon8`（伊賀溜溜球），房間武器下拉只作顯示，不影響實戰武器。
- `ai_red` 固定套用 `lookDefinitions.red` 赤組外觀；不管在藍隊或灰隊，`unitLookDefinition()` 都要讓赤組外觀優先於隊伍預設外觀。
- `ai_red` 建立角色時預設面向是 `down`。
- `ai_red` 定時忍術：`0~90` 秒隨機放 `clone`、`12~30` 秒隨機放 `steel`、`30~60` 秒隨機放 `wildfire` 或 `freeze`。
- `ai_red` 敵人在自身九宮格內時，優先使用 `weapon8` 攻擊。
- `ai_red` 被斜角攻擊時：`15%` 分身、`35%` 衝撞、`50%` 直接用溜溜球反擊。
- `ai_red` 被直線攻擊時：若攻擊者仍在同列/同行，固定在 `0.5` 秒後排入衝撞反擊，不要呆站到下一輪一般巡邏。
- `ai_red` 與玩家同列/同行時：`15%` 分身，否則排入延遲衝撞；距離 `1/2/3...` 格分別延遲 `0.5/0.6/0.7...` 秒。
- `ai_red` 平常不太移動；只有在敵方血量低於 `30%` 時，才有 `50%` 機率追擊。
- `ai_tachi_master` 固定武器是 `weapon3`（忍太刀），可用忍術是 `moneyDart`、`steel`、`kakki`、`flash`；HP 低於 `200` 且未滿血時優先施放 `kakki`。
- `ai_tachi_master` 的 `flash` 只有在 HP `150` 以下且已有至少魂一時才會施放。
- `ai_tachi_master` 沒有鋼鐵時不主動使用武器、衝撞、錢鏢或閃光攻擊；鋼鐵啟動後才會進攻。
- `ai_tachi_master` 的技量上限固定為 `18`，錢鏢準備/投擲機率是錢鏢神人的 `49%`，直線發標等待時間是 `900ms`；這些只影響 AI 何時發標，不能新增錢鏢飛行速度。
- `ai_tachi_master` 平常會盡量原地集技；只有最近 `0.5` 秒內受擊，或技量達自身上限 `90%` 以上時，才會比較積極移動換位。
- `ai_tachi_master` 的魂條改成時間累積：`30` 秒到魂一、`60` 秒到魂二，之後每 `30` 秒再升一段，最多到魂四。
- `ai_dart_only_master` 不近戰、不撞人、不用武器，只追線丟錢鏢。
- AI 不應播放玩家專用的 `useNinju` 音效。
- 不要讓錢鏢準備或投擲打斷玩家拖曳互動。

---
