@ECHO OFF
chcp 65001 >nul

mode con cols=70 lines=40
setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
::Copyright (C) 2025 领创工作室. All Rights Reserved.

cls
echo =============================================================
echo. USB3.0fix _By LACS                   
echo.
echo =============================================================
echo.

call :modifyRegistry "add"
call :showRebootNotice
exit /b

:modifyRegistry
set "action=%~1"
set "key=HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100"
set "regOptions=/f"

echo.
if /i "%action%"=="add" (
    echo 正在应用USB3修复...
    reg add "%key%" /v "osvc" /t REG_BINARY /d "0000" %regOptions% >nul 2>&1
    if !errorlevel! equ 0 (
        reg add "%key%" /v "SkipContainerIdQuery" /t REG_BINARY /d "01000000" %regOptions% >nul 2>&1
    )
    if !errorlevel! equ 0 (
        reg add "%key%" /v "SkipBOSDescriptorQuery" /t REG_BINARY /d "01000000" %regOptions% >nul 2>&1
    )
    if !errorlevel! equ 0 (
        echo USB3修复已成功应用!
    ) else (
        echo USB3修复应用失败，请以管理员权限运行此程序!
    )
) else if /i "%action%"=="delete" (
    echo 正在撤销USB3修复...
    reg delete "%key%" /v "osvc" %regOptions% >nul 2>&1
    if !errorlevel! equ 0 (
        reg delete "%key%" /v "SkipContainerIdQuery" %regOptions% >nul 2>&1
    )
    if !errorlevel! equ 0 (
        reg delete "%key%" /v "SkipBOSDescriptorQuery" %regOptions% >nul 2>&1
    )
    if !errorlevel! equ 0 (
        echo USB3修复已成功撤销!
    ) else (
        echo USB3修复撤销失败，请以管理员权限运行此程序!
    )
) else (
    echo 无效操作
    exit /b 1
)
exit /b

:showRebootNotice
echo.
echo =============================================================
echo.
echo USB3修复已完成
echo.
echo 请重启电脑使更改生效
echo.
echo =============================================================
echo.
exit /b