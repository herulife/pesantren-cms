@echo off
setlocal ENABLEDELAYEDEXPANSION
title Darussunnah Monorepo Starter
echo ====================================================
echo    D A R U S S U N N A H   M O N O R E P O
echo           (Go Backend + Next.js Frontend)
echo ====================================================
echo.

echo [0/2] Membersihkan proses lama...
taskkill /F /IM main.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Darussunnah-Go-Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Darussunnah-Next-Frontend" >nul 2>&1

echo.
echo [1/2] Menjalankan Backend (Golang) di port 8080...
cd /d "%~dp0apps\backend"
start "Darussunnah-Go-Backend" cmd /k "go run cmd/api/main.go"

echo.
echo Menunggu backend siap...
set "BACKEND_READY="
for /L %%I in (1,1,20) do (
  powershell -NoProfile -Command "try { $resp = Invoke-WebRequest -Uri 'http://localhost:8080/api/health' -UseBasicParsing -TimeoutSec 2; if ($resp.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    set "BACKEND_READY=1"
    goto :backend_ready
  )
  timeout /t 1 >nul
)

:backend_ready
if not defined BACKEND_READY (
  echo [ERROR] Backend belum merespons di http://localhost:8080/api/health
  echo [INFO] Cek jendela "Darussunnah-Go-Backend" untuk melihat error compile/runtime.
  echo [INFO] Frontend tidak dijalankan agar error backend lebih mudah diperiksa.
  goto :end
)
echo [OK] Backend aktif.

set "FRONTEND_PORT=3000"
for /f %%P in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
  set "FRONTEND_PORT=3001"
)
if "!FRONTEND_PORT!"=="3001" (
  echo.
  echo [INFO] Port 3000 sedang dipakai proses lain.
  echo [INFO] Frontend dialihkan ke port 3001.
)

echo.
echo [2/2] Menjalankan Frontend (Next.js) di port !FRONTEND_PORT!...
cd /d "%~dp0apps\frontend"
start "Darussunnah-Next-Frontend" cmd /k "call npm.cmd run dev -- -p !FRONTEND_PORT!"

echo.
echo Menunggu frontend siap...
set "FRONTEND_READY="
for /L %%I in (1,1,25) do (
  powershell -NoProfile -Command "try { $resp = Invoke-WebRequest -Uri 'http://localhost:!FRONTEND_PORT!' -UseBasicParsing -TimeoutSec 2; if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    set "FRONTEND_READY=1"
    goto :frontend_ready
  )
  timeout /t 1 >nul
)

:frontend_ready
if not defined FRONTEND_READY (
  echo [ERROR] Frontend belum merespons di http://localhost:!FRONTEND_PORT!
  echo [INFO] Cek jendela "Darussunnah-Next-Frontend" untuk melihat error Next.js.
  echo [INFO] Jika muncul "spawn EPERM", berarti masalahnya ada di permission/environment Windows, bukan di file batch ini.
  echo [INFO] Coba jalankan terminal sebagai Administrator atau whitelist node.exe dan folder project di Windows Security.
  goto :end
)

echo.
echo ====================================================
echo [OK] Sistem Monorepo Berhasil Dijalankan
echo.
echo Backend : http://localhost:8080
echo Frontend: http://localhost:!FRONTEND_PORT!
echo Admin PSB: http://localhost:!FRONTEND_PORT!/admin/psb
echo ====================================================

:end
