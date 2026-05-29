# 武器

## 入口

- 武器資料：`scripts/data/weapons.module.mjs`
- 規則模式傷害：`scripts/data/rule-modes.module.mjs`
- 武器範圍、冷卻、傷害流程：`scripts/bootstrap/install-combat-globals.module.mjs`
- 武器動畫、hand/attack offset：`scripts/bootstrap/install-combat-renderer-globals.module.mjs`
- 素材與音效來源：`scripts/data/assets.module.mjs`

## 修改流程

1. 在 `scripts/data/weapons.module.mjs` 新增或調整 weapon definition。
2. 需要模式差異時，同步調整 `scripts/data/rule-modes.module.mjs`。
3. 需要素材或音效時，更新 `scripts/data/assets.module.mjs`。
4. 跑 `pnpm sync:weapons`，再跑測試。

```powershell
node --test tests/install-weapons-globals.test.mjs tests/install-combat-globals.test.mjs tests/install-combat-renderer-globals.test.mjs
```

## 注意

- 武器 key、素材資料夾、音效 key 要一致。
- 不要在 renderer 裡硬寫新武器規則；renderer 只處理視覺位置與影格。
- 模式差異統一放在 rule mode 資料，不要散到 combat helper。
