@echo off
setlocal enabledelayedexpansion

set "registry_path=HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\usbflags\18D1D00D0100"
set "values_to_check=osvc SkipContainerIdQuery SkipBOSDescriptorQuery"
set "expected_values=0000 01000000 01000000"
set "all_values_correct=1"

for /f "tokens=1,2" %%a in ("%values_to_check% %expected_values%") do (
    set "value_name=%%a"
    set "expected_value=%%b"
    
    for /f "tokens=3" %%i in ('reg query "%registry_path%" /v "!value_name!" 2^>nul') do (
        set "actual_value=%%i"
        if not "!actual_value!"=="!expected_value!" (
            echo 值 !value_name! 不正确: 期望 !expected_value!, 实际 !actual_value!
            set "all_values_correct=0"
        ) else (
            echo 值 !value_name! 正确: !actual_value!
        )
    )
)

if !all_values_correct!==1 (
    echo 所有USB 3.0注册表值验证通过
    exit /b 0
) else (
    echo USB 3.0注册表值验证失败
    exit /b 1
)
