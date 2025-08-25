@ECHO OFF


mode con cols=70 lines=40
setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
title USB3修复_v1 by领创工作室
::Copyright ? 2025 领创工作室. All Rights Reserved.

:menu
cls
echo=============================================================
echo.
echo. USB3修复_v1 by领创工作室
echo. 
echo. 0.退出 1.修复 2.取消
echo.
echo=============================================================
set /p choice="请选择: "
if "%choice%"=="1" call :modifyRegistry "add"
if "%choice%"=="2" call :modifyRegistry "delete"
if "%choice%"=="0" exit
goto invalid_choice

:modifyRegistry
set "action=%~1"
set "key=HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100"
set "regOptions=/f"

if /i "%action%"=="add" (
    reg add "%key%" /v "osvc" /t REG_BINARY /d "0000" %regOptions% || echo 修复失败
    reg add "%key%" /v "SkipContainerIdQuery" /t REG_BINARY /d "01000000" %regOptions% || echo 修复失败
    reg add "%key%" /v "SkipBOSDescriptorQuery" /t REG_BINARY /d "01000000" %regOptions% || echo 修复失败
    echo 修复成功
) else if /i "%action%"=="delete" (
    reg delete "%key%" /v "osvc" %regOptions% || echo 修复失败
    reg delete "%key%" /v "SkipContainerIdQuery" %regOptions% || echo 修复失败
    reg delete "%key%" /v "SkipBOSDescriptorQuery" %regOptions% || echo 修复失败
    echo 修复成功
) else (
    echo 无效选择
    exit /b 1
)

:invalid_choice
echo. 无效选择
timeout /t 1 /nobreak >nul
goto menu

:reboot
cls
echo=============================================================
echo.
echo 修复成功
echo 请选择重启
echo 1.重启
echo 0.返回
echo.
echo=============================================================
set /p choice="请选择: "
if "%choice%"=="1" shutdown /r /t 0 /c "修复USB3修复_v1 by领创工作室"
if "%choice%"=="0" exit
goto invalid_choice
