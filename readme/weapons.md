# 忍豆風雲2單機版：武器系統說明
此檔由 `readme/skill.md` 拆出，保留武器資料入口、範圍、傷害、音效規則、目前武器表與新增武器同步項。回到接手入口請看 [skill.md](./skill.md)。

---

## 12. 武器系統重點

主要位置：

- 武器資料：`scripts/data/weapons.js -> weaponDefinitions`
- 模式傷害：`scripts/data/rule-modes.js -> weaponDamageForMode()`
- 攻擊範圍：`scripts/bootstrap/install-combat-globals.module.mjs -> weaponAreaCells()`
- 攻擊音效：`scripts/bootstrap/install-combat-globals.module.mjs -> slashSoundKeyForWeapon()`
- 素材與音效來源：`scripts/data/assets.js`
- attack / hand 畫面比例：`scripts/data/weapons.js -> weaponVisuals`
- attack offset：`scripts/bootstrap/install-combat-renderer-globals.module.mjs -> drawKunaiAttackFrame()`
- hand offset：`scripts/bootstrap/install-combat-renderer-globals.module.mjs -> drawKunaiHandAttackFrame()`

常改欄位：

- 攻速：`cooldownMs`
- 基礎傷害：`damage`
- 模式覆蓋：`modeRuleProfiles`
- 範圍：`weaponAreaCells()`

目前已接入武器：

| ID            | 名稱       | area        | 備註                       |
| ------------- | ---------- | ----------- | -------------------------- |
| `weapon1`   | 苦無       | `single`  | 預設武器                   |
| `weapon3`   | 忍太刀     | `nodachi` | 使用既有 fallback 範圍     |
| `weapon4`   | 伊賀密刀   | `line2`   | modified 有覆蓋傷害        |
| `weapon6`   | 鐵扇不知火 | `fan`     | modified 有覆蓋傷害        |
| `weapon7`   | 極冰鬼切丸 | `line2`   | 已接 1 秒揮砍動畫          |
| `weapon8`   | 伊賀溜溜球 | `ring8`   | original / modified 有差異 |
| `weapon10`  | 風魔手裏劍 | `line6`   | 正前方 6 格                |
| `weapon44`  | 滅魂之劍   | `NinjaS`  | 前方橫列 3 格              |
| `weapon106` | 光劍       | `NinjaS`  | 前方橫列 3 格              |

新增武器至少要同步：

- `scripts/data/weapons.js` 新增 `weaponDefinitions`
- `scripts/bootstrap/install-combat-globals.module.mjs -> weaponAreaCells()` 補 `area`
- `assets/weapon/...` 補動畫素材
- `assets/sounds/weapon/<編號>.ogg` 補音效

高風險提醒：

- `drawKunaiAttackFrame()` 與 `drawKunaiHandAttackFrame()` 的 offset 多半是人工校準，除非使用者明確要求，不要順手改。

---
