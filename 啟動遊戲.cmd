@echo off
setlocal
cd /d "%~dp0"

if /i not "%~1"=="--hidden" (
  wscript.exe //nologo "%~dp0scripts\tools\launch-hidden.vbs" "%~f0"
  exit /b
)

if exist "%~dp0portable-node\node.exe" (
  set "NODE_EXE=%~dp0portable-node\node.exe"
) else (
  where node >nul 2>nul
  if errorlevel 1 (
    set "NINDOU_LAUNCH_ERROR=找不到 Node.js。請將 node.exe 放入 portable-node 資料夾，或安裝 Node.js 後再試一次。"
    goto show_error
  )
  set "NODE_EXE=node"
)

set "GAME_URL=http://127.0.0.1:5174/index.html"
set "GAME_SERVER=scripts\tools\serve-game.mjs"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri $env:GAME_URL -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } } catch { exit 1 }"
if errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%NODE_EXE%' -ArgumentList @($env:GAME_SERVER, '--host', '127.0.0.1', '--port', '5174') -WorkingDirectory (Get-Location).Path -WindowStyle Hidden"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(15); do { try { $r = Invoke-WebRequest -UseBasicParsing -Uri $env:GAME_URL -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 100 } while ((Get-Date) -lt $deadline); exit 1"
  if errorlevel 1 (
    set "NINDOU_LAUNCH_ERROR=Timed out waiting for the local server."
    goto show_error
  )
)

start "" "%GAME_URL%"
exit /b 0

:show_error
powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($env:NINDOU_LAUNCH_ERROR, 'Nindou2 launcher') | Out-Null"
exit /b 1
