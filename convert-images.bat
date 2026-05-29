@echo off
chcp 65001 >nul
echo === 圖片轉換工具 ===
node scripts/tools/convert-images.mjs %*
pause
