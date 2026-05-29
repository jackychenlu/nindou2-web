# 道具

## 入口

- 道具 runtime：`scripts/systems/consumables.module.mjs`
- 道具全域安裝與角色動作：`scripts/bootstrap/install-consumables-globals.module.mjs`
- 掉落設定：`scripts/data/config.module.mjs`
- 道具素材與特效影格：`scripts/data/assets.module.mjs`
- 商店與背包 UI：`scripts/bootstrap/install-room-ui-globals.module.mjs`
- 戰鬥 HUD：`scripts/bootstrap/install-hud-renderer-globals.module.mjs`
- 道具特效繪製：`scripts/bootstrap/install-effects-renderer-globals.module.mjs`

## 目前接入的道具

- `backup3`：神水，回復技。
- `sake4`：神酒，回復技，短時間移動不耗技。
- `magicWater`：魔水，回復技，短時間移動不耗技，攻擊與防禦加成。

## 行為重點

- 道具使用有 1.5 秒施放時間。
- 道具施放中可排隊忍術或錢鏢，結束後依序執行。
- 忍術施放中可排隊道具，避免兩套 1.5 秒動畫互相插隊。
- 房間商店維護 `state.roomItemSlots`，開戰時轉成角色 `itemSlots`。

## 測試

```powershell
node --test tests/install-consumables-globals.test.mjs tests/consumables-module.test.js tests/install-effects-renderer-globals.test.mjs
```
