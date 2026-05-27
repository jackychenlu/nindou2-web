@echo off
setlocal
cd /d "%~dp0"

set "GAME_HOST=127.0.0.1"
set "GAME_PORT=5174"
set "GAME_URL=http://%GAME_HOST%:%GAME_PORT%/"
set "GAME_SERVER=scripts\tools\serve-game.mjs"
set "NODE_EXE=%~dp0portable-node\node.exe"

if not exist "%NODE_EXE%" (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js runtime was not found.
    echo Please keep portable-node\node.exe next to this launcher, then run it again.
    pause
    exit /b 1
  )
  set "NODE_EXE=node"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri $env:GAME_URL -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } } catch { exit 1 }"
if errorlevel 1 (
  start "Nindou2 Local Server" cmd /k "cd /d ""%~dp0"" && ""%NODE_EXE%"" ""%GAME_SERVER%"" --host %GAME_HOST% --port %GAME_PORT%"
  echo Starting local server...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(15); do { try { $r = Invoke-WebRequest -UseBasicParsing -Uri $env:GAME_URL -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } } catch {}; Start-Sleep -Milliseconds 100 } while ((Get-Date) -lt $deadline); exit 1"
  if errorlevel 1 (
    echo Timed out waiting for local server.
    pause
    exit /b 1
  )
)

start "" "%GAME_URL%"
