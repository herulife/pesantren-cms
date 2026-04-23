@echo off
setlocal ENABLEDELAYEDEXPANSION

set "ROOT=%~dp0.."
set "DB_PATH=%ROOT%\apps\backend\darussunnah.db"
set "BACKUP_DIR=%ROOT%\backups\db"

if not exist "%DB_PATH%" (
  echo [ERROR] Database tidak ditemukan: %DB_PATH%
  exit /b 1
)

if not exist "%BACKUP_DIR%" (
  mkdir "%BACKUP_DIR%"
)

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set TS=%%i
set "BACKUP_FILE=%BACKUP_DIR%\darussunnah_%TS%.db"

copy /Y "%DB_PATH%" "%BACKUP_FILE%" >nul
if errorlevel 1 (
  echo [ERROR] Gagal membuat backup database.
  exit /b 1
)

echo [OK] Backup database berhasil dibuat:
echo %BACKUP_FILE%
exit /b 0
