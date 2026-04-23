@echo off
title Hentikan Server Darussunnah
echo ====================================================
echo    MENGHENTIKAN SEMUA LAYANAN MONOREPO
echo ====================================================
echo.

echo [1/3] Menutup Backend (Golang)...
taskkill /F /IM darussunnah_api.exe >nul 2>&1
taskkill /F /IM main.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Darussunnah-Prod-Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Darussunnah-Go-Backend" >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do taskkill /F /PID %%P >nul 2>&1

echo.
echo [2/3] Menutup Frontend (Next.js)...
taskkill /F /FI "WINDOWTITLE eq Darussunnah-Prod-Frontend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Darussunnah-Next-Frontend" >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do taskkill /F /PID %%P >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3001 .*LISTENING"') do taskkill /F /PID %%P >nul 2>&1

echo.
echo [3/3] Membersihkan session tersembunyi...
echo.
echo ====================================================
echo [OK] Semua server Darussunnah telah berhasil ditutup.
echo ====================================================
