@ECHO OFF

NET SESSION >nul 2>&1
if %errorLevel% neq 0 (
    echo 正在以管理员身份运行脚本...
    echo 脚本打开后可以关闭此窗口
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

mode con cols=70 lines=40
setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
title 修复USB3端口不识别连接设备脚本_v1 by领创工作室
::Copyright ? 2025 领创工作室. All Rights Reserved.

:menu
cls
echo=============================================================
echo.
echo. 修复USB3端口不识别连接设备 - 领创工作室 官网:领创.top
echo. 
echo. 0.退出 1.修复不识别问题 2.移除之前所执行操作
echo.
echo=============================================================
set /p choice="请输入选项并回车: "
if "%choice%"=="1" call :modifyRegistry "add"
if "%choice%"=="2" call :modifyRegistry "delete"
if "%choice%"=="0" exit
goto invalid_choice

:modifyRegistry
set "action=%~1"
set "key=HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100"
set "regOptions=/f"

if /i "%action%"=="add" (
    reg add "%key%" /v "osvc" /t REG_BINARY /d "0000" %regOptions% || echo 添加失败
    reg add "%key%" /v "SkipContainerIdQuery" /t REG_BINARY /d "01000000" %regOptions% || echo 添加失败
    reg add "%key%" /v "SkipBOSDescriptorQuery" /t REG_BINARY /d "01000000" %regOptions% || echo 添加失败
    echo 修复完成，重启计算机后生效
) else if /i "%action%"=="delete" (
    reg delete "%key%" /v "osvc" %regOptions% || echo 删除失败
    reg delete "%key%" /v "SkipContainerIdQuery" %regOptions% || echo 删除失败
    reg delete "%key%" /v "SkipBOSDescriptorQuery" %regOptions% || echo 删除失败
    echo 移除完成，重启计算机后生效
) else (
    echo 操作无效
    exit /b 1
)

timeout /t 1 /nobreak >nul
goto reboot

:invalid_choice
echo. 输入无效，请输入有效的选项
timeout /t 1 /nobreak >nul
goto menu

:reboot
cls
echo=============================================================
echo.
echo 修复完成，重启计算机后生效
echo 1.立即重启计算机
echo 0.退出
echo.
echo=============================================================
set /p choice="请输入选项并回车: "
if "%choice%"=="1" shutdown /r /t 0 /c "修复USB3端口不识别连接设备脚本_v1 by领创工作室"
if "%choice%"=="0" exit
goto invalid_choice
