@echo off
title ZEKiQ Cashier Setup
echo.
echo  ZEKiQ - تشغيل اعداد الكاشير
echo  Run as Administrator if IP change fails
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cashier-finish.ps1"
pause
