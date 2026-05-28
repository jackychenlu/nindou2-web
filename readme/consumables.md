# 忍豆風雲2單機版：道具系統（Consumables）

這份文件集中記錄 consumable 的命名、素材、流程、預設效果與後續擴充規則。`readme/skill.md` 只保留入口摘要。

---

## 1. 目前狀態

- 目前 live code 有 3 種 consumable。
- `backup3` 對應「神水」。
- `sake4` 對應「神酒」。
- `magicWater` 對應「魔水」。
- 神水效果：補滿技
- 神酒效果：補滿技，並在 15 秒內讓移動不消耗技。

---

## 2. 主要素材

### 神水圖示

- 圖示檔：[`assets/consumables/3.webp`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/consumables/3.webp)
- 這份圖示目前應視為神水的主 icon。

### 神酒圖示

- 圖示檔：[`assets/consumables/4.webp`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/consumables/4.webp)
- 這份圖示目前應視為神酒的主 icon。

### 道具使用音效

- 所有道具使用成功時都要播放共通音效：[`assets/sounds/in_game/click_item.ogg`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/sounds/in_game/click_item.ogg)。
- 神水、神酒使用成功時還要額外播放專用音效：[`assets/sounds/ninja/status/sp_up.ogg`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/sounds/ninja/status/sp_up.ogg)。
- 不要使用忍術音效代替道具音效。

### 神水、神酒使用動畫

- 動畫資料夾：[`assets/consumables/regen_sp`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/consumables/regen_sp)
- 目前內容是 `01.webp` 到 `16.webp` 共 16 張序列。
- 神水與神酒使用時會播放這組動畫，live code 以 `consumableRegenSpFrameSources` / `consumableRegenSpFrames` 載入，並由 `startConsumableUseEffect()` 建立 1.5 秒效果。
- 魔水使用時會同時播兩組 `assets/consumables/magic_water` 動畫：保留 `1.webp` 到 `40.webp`，並疊加 `effect__1.webp` 到 `effect__40.webp`。live code 以 `consumableMagicWaterFrameSources` / `consumableMagicWaterFrames` 與 `consumableMagicWaterEffectFrameSources` / `consumableMagicWaterEffectFrames` 載入。
- `regen_sp` 不是所有 consumable 的預設使用動畫。

### 其他可見相關素材

- 點擊/啟用感：[`assets/consumables/consumables_item_click`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/consumables/consumables_item_click)
- 取得道具提示：[`assets/consumables/consumables_target_get_item`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/consumables/consumables_target_get_item)

這兩組目前先記錄為可用素材來源；若之後正式接進 live code，再補實際播放點與時序。

---

## 3. 目前 live code 接線點

主要位置：

- 掉落設定：[`scripts/data/config.js`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/scripts/data/config.js)
  `mapItemDropChance`、`mapItemDropTypes`、`mapGoldDropTypes`
- 單位資料：[`scripts/bootstrap/install-battle-setup-globals.module.mjs`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/scripts/bootstrap/install-battle-setup-globals.module.mjs)
  `items`、`itemSlots`、`gold`
- HUD：[`scripts/bootstrap/install-hud-renderer-globals.module.mjs`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/scripts/bootstrap/install-hud-renderer-globals.module.mjs)
  `drawInventoryHud()`、`drawInventoryItemHud()`、`itemIconByType()`
- 道具流程：[`scripts/systems/consumables.module.mjs`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/scripts/systems/consumables.module.mjs)
  `useItemSlot(index)`、`addInventoryItem()`、`removeInventoryItem()`、`updateConsumables()`、`requestConsumableUse()`、`executeConsumableItem()`
- 掉落流程：`scripts/bootstrap/install-combat-globals.module.mjs -> damageObject()` 內呼叫由 `scripts/bootstrap/install-consumables-globals.module.mjs` 安裝的 `maybeGrantMapItem(object, attacker)`
- 房間商店：`scripts/bootstrap/install-room-ui-globals.module.mjs -> purchaseShopItem(itemEl)` 會把已實作商品直接加入 `state.roomItemSlots`
- 房間商店重畫：`scripts/systems/consumables.module.mjs -> notifyRoomInventoryChanged()` 只觸發 `state.onRoomInventoryChanged` hook；實際 DOM 重畫由 `scripts/bootstrap/install-room-ui-globals.module.mjs -> renderRoomShopBag()` 負責。
- 使用動畫：`scripts/systems/consumables.module.mjs -> startConsumableUseEffect(stateLike, unit, now)` 建立 `state.consumableEffects`，`scripts/bootstrap/install-effects-renderer-globals.module.mjs -> drawConsumableEffects(now)` 繪製對應道具特效。
- 神水目前實際效果入口：`scripts/bootstrap/install-consumables-globals.module.mjs -> useBackupItem()`
- 神酒目前實際效果入口：`scripts/bootstrap/install-consumables-globals.module.mjs -> useSakeItem()`
- 移動免耗判定：`scripts/systems/movement.js -> skillMove()`

---

## 4. 背包規則

- 道具欄目前最多 10 格。
- 每拿到 1 個 consumable，就實際佔用 1 個 `itemSlots`。
- 同一格不能再堆疊同種道具。
- 同種道具有多個時，必須分散到多個格子。
- 戰鬥中的道具格位置固定；使用某格道具後只清空該格，不把後面的道具往前壓縮。
- `items[type]` 目前仍保留數量統計用途，但 UI 與使用邏輯以 `itemSlots` 的單格占用為主。
- 房間商店購買會先存到 `state.roomItemSlots`，開戰重建角色時再套到玩家的 `itemSlots`，因此買到的道具會顯示在戰鬥 HUD 的道具欄。
- 道具連點會像忍術連段一樣排入 `unit.consumableUse.queue`；每個道具實際觸發時各自僵直 `1.5` 秒，active 使用期間可中間移動 3 段，兩次觸發中間仍使用和忍術連段相同的 `ninjuChainMaxGap` 走路空檔。
- 道具 active 階段可點忍術，但忍術會進 `unit.consumableUse.pendingNinjutsu`，必須等道具 1.5 秒動作結束後才開始；忍術輸入會先扣技，等神水、神酒、魔水使用滿 1.5 秒時才補滿技，不等後面的忍術動畫跑完。道具的動畫、`click_item.ogg` 與 `sp_up.ogg` 仍在道具啟動時先觸發。
- 反過來忍術中點道具會進 `unit.ninju.pendingConsumables`，等所有已排忍術動畫結束後才播道具動畫。

---

## 5. 房間商店規則

- 商店沒有「購買」按鈕。
- 點左側商品就是直接購買。
- 目前已實作商品有 `backup3`（神水）、`sake4`（神酒）與 `magicWater`（魔水）。
- 未接入的備用商品維持可顯示，但點擊後不播音、不改道具欄、不產生效果。
- 右側 10 格目前只顯示已買道具預覽；實際戰鬥顯示以玩家 `itemSlots` 為準。

---

## 6. 神水規格

### 命名

- 內部 key：`backup3`
- 使用者名稱：`神水`

### 目前效果

- 神水目前效果以 live code 為準。
- 現況是使用動畫與音效先觸發，實際補技在使用滿 1.5 秒時套用；若接忍術，忍術會先扣技，時間到 1.5 秒才補滿。
- 即使目前技量已滿，點擊神水仍會照常使用並消耗神水。
- 神水使用後播放 `assets/consumables/regen_sp` 動畫。
- 神水套用 consumable 預設：使用後僵直 `1.5` 秒，同時無敵 `1.5` 秒。
- 使用一次消耗 1 格神水。
- 連點多個神水時，後續神水會排隊，等前一個道具 1.5 秒僵直結束並經過可移動空檔後才觸發。
- 火蛙變身中或變身狀態不能使用。
- 神水使用成功時播放共通 `click_item.ogg`，並額外播放專用 [`assets/sounds/ninja/status/sp_up.ogg`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/sounds/ninja/status/sp_up.ogg)。

### 掉落

- 目前可破壞地圖物件掉 consumable 時，仍只會在神水與神酒之間隨機取 1 種；魔水目前已可在房間商店購買。

---

## 7. 神酒規格

### 命名

- 內部 key：`sake4`
- 使用者名稱：`神酒`

### 目前效果

- 使用動畫與音效先觸發，實際補技與神酒 BUFF 在使用滿 1.5 秒時套用；若接忍術，忍術會先扣技，時間到 1.5 秒才補滿並套用 BUFF。
- 神酒 BUFF 生效後 15 秒內，移動不消耗技。
- 使用後 15 秒內，角色會套用類似鋼鐵的角色輪廓罩光，但顏色是金黃色；點擊後等待道具 1.5 秒生效時顯示。live code 以 `buffAuraType: "sake4"`、`moveSkillFreeUntil`、`buffAuraVisibleAt` 控制顯示。
- 神酒使用後播放 `assets/consumables/regen_sp` 動畫。
- 使用一次消耗 1 格神酒。
- 連點多個神酒或和神水混用時，後續道具會排隊，等前一個道具 1.5 秒僵直結束並經過可移動空檔後才觸發。
- 神酒套用 consumable 預設：使用後僵直 `1.5` 秒，同時無敵 `1.5` 秒。
- 神酒使用成功時播放共通 `click_item.ogg`，並額外播放專用 [`assets/sounds/ninja/status/sp_up.ogg`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/sounds/ninja/status/sp_up.ogg)。

## 8. 魔水規格

- 內部 key：`magicWater`
- 使用者名稱：`魔水`
- 圖示檔：[`assets/consumables/10.webp`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/consumables/10.webp)
- 使用動畫：[`assets/consumables/magic_water`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/consumables/magic_water)，同時疊加 `1.webp` 到 `40.webp` 與 `effect__1.webp` 到 `effect__40.webp`。
- 效果和神酒一樣：補滿技，並在 15 秒內讓移動不消耗技；實際補技與 BUFF 在使用滿 1.5 秒時套用，若接忍術，忍術會先扣技，時間到 1.5 秒才補滿並套用 BUFF。
- 額外效果：同一個 15 秒期間內，攻擊與防禦都變為 2 倍；不會和熱血、鋼鐵疊乘，所以攻防倍率最多仍是 2 倍。外層紫色光圈會在點擊後等待道具 1.5 秒生效時顯示。live code 實作為 `magicWaterUntil` 生效時與熱血/鋼鐵取最大倍率。
- 魔水使用後同樣套用 consumable 預設：使用後僵直 `1.5` 秒，同時無敵 `1.5` 秒。
- 魔水使用成功時播放共通 `click_item.ogg`，並額外播放專用 [`assets/sounds/ninja/status/sp_up.ogg`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/assets/sounds/ninja/status/sp_up.ogg)。

---

## 8. 大部分道具的預設使用效果

這條要視為 consumable 的預設規則，之後新增大部分道具時，若沒有特別例外，就照這條走：

- 使用後會僵直 `1.5` 秒。
- 使用期間角色呈無敵狀態。
- 連點多個道具時，不會一次吞掉所有僵直；每個道具都要獨立觸發一次 `1.5` 秒僵直，中間 gap 可以移動。

建議接線方式：

- `disabledUntil = now + 1500`
- `invincibleUntil = now + 1500`

如果某個 consumable 不吃這套預設，文件要直接寫「此道具是例外」，不要靠猜。

---

## 9. 後續新增 consumable 的最低同步項

新增 1 個新道具時，至少同步這些地方：

- 素材圖示與動畫檔路徑
- 使用者名稱
- 內部 key
- HUD icon 對應
- `useItemSlot(index)` 分支
- 實際效果函式
- 是否沿用「僵直 1.5 秒 + 無敵 1.5 秒」這套預設
- 掉落來源與限制
- 如果行為特殊，補測試

---

## 10. 文件維護規則

- consumable 規格優先寫在這份文件，不要再把大量細節塞回 `readme/skill.md`。
- 如果之後真的指定某個 consumable 要播哪組動畫，要逐項寫明，不要把單一素材誤記成全體預設。
- 如果之後把 `backup3` 正式改名到程式碼，也要同步更新這份文件，並註明「舊 key / 新 key」。
- 如果之後真的接入某組 consumable 動畫播放邏輯，要在這份文件補上實際函式與播放時機，不要只留素材路徑。
