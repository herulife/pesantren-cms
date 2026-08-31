@echo off
title Hentikan Server Al-Maa
echo ====================================================
echo    MENGHENTIKAN SEMUA LAYANAN MONOREPO
echo ====================================================
echo.

echo [1/3] Menutup Backend (Golang)...
taskkill /F /IM almaparung_api.exe >nul 2>&1
taskkill /F /IM main.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Alma-Prod-Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Alma-Go-Backend" >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do taskkill /F /PID %%P >nul 2>&1

echo.
echo [2/3] Menutup Frontend (Next.js)...
taskkill /F /FI "WINDOWTITLE eq Alma-Prod-Frontend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Alma-Next-Frontend" >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do taskkill /F /PID %%P >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3001 .*LISTENING"') do taskkill /F /PID %%P >nul 2>&1

echo.
echo [3/3] Membersihkan session tersembunyi...
echo.
echo ====================================================
echo [OK] Semua server Al-Maa telah berhasil ditutup.
echo ====================================================

