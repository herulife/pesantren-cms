@echo off
setlocal

if "%~1"=="" (
  echo Usage: restore_db.bat ^<path_backup_db^>
  exit /b 1
)

set "ROOT=%~dp0.."
set "DB_PATH=%ROOT%\apps\backend\darussunnah.db"
set "BACKUP_INPUT=%~1"

if not exist "%BACKUP_INPUT%" (
  echo [ERROR] File backup tidak ditemukan: %BACKUP_INPUT%
  exit /b 1
)

copy /Y "%BACKUP_INPUT%" "%DB_PATH%" >nul
if errorlevel 1 (
  echo [ERROR] Gagal restore database.
  exit /b 1
)

echo [OK] Restore database berhasil ke:
echo %DB_PATH%
exit /b 0
