# 安全构建脚本 - 避免文件锁定问题

Write-Host "开始安全构建流程..." -ForegroundColor Cyan

# 1. 确保没有相关进程在运行
$processesToCheck = @("node", "cargo", "rustc", "tauri", "npm")
$processesFound = $false

foreach ($proc in $processesToCheck) {
    $processes = Get-Process -Name $proc -ErrorAction SilentlyContinue
    if ($processes) {
        $processesFound = $true
        Write-Host "警告: 发现 $proc 进程正在运行" -ForegroundColor Yellow
        $processes | ForEach-Object {
            Write-Host "  - 进程: $($_.Id) $($_.ProcessName)" -ForegroundColor Gray
        }
    }
}

if ($processesFound) {
    $confirmation = Read-Host "检测到相关进程正在运行，是否继续并尝试关闭这些进程? (Y/N)"
    if ($confirmation -ne "Y" -and $confirmation -ne "y") {
        Write-Host "构建已取消。请手动关闭相关进程后再试。" -ForegroundColor Red
        exit
    }
    
    # 尝试关闭进程
    foreach ($proc in $processesToCheck) {
        $processes = Get-Process -Name $proc -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Host "正在关闭 $proc 进程..." -ForegroundColor Yellow
            $processes | ForEach-Object {
                try {
                    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
                    Write-Host "  - 已关闭: $($_.Id) $($_.ProcessName)" -ForegroundColor Gray
                } catch {
                    Write-Host "  - 无法关闭: $($_.Id) $($_.ProcessName)" -ForegroundColor Red
                }
            }
        }
    }
    
    # 等待进程完全关闭
    Write-Host "等待进程完全关闭..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# 2. 安全清理目录
Write-Host "正在安全清理构建目录..." -ForegroundColor Yellow

$targetDir = ".\src-tauri\target"
$distDir = ".\dist"

# 清理dist目录
if (Test-Path $distDir) {
    Write-Host "清理 $distDir..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $distDir -Recurse -Force -ErrorAction Stop
        Write-Host "成功清理 $distDir" -ForegroundColor Green
    } catch {
        Write-Host "无法清理 $distDir: $_" -ForegroundColor Red
        Write-Host "尝试使用robocopy清空目录..." -ForegroundColor Yellow
        
        $emptyDir = New-Item -ItemType Directory -Path ".\empty_dist" -Force
        robocopy $emptyDir.FullName $distDir /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
        Remove-Item -Path $emptyDir -Recurse -Force
    }
}

# 清理target目录
if (Test-Path $targetDir) {
    Write-Host "清理 $targetDir..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $targetDir -Recurse -Force -ErrorAction Stop
        Write-Host "成功清理 $targetDir" -ForegroundColor Green
    } catch {
        Write-Host "无法直接删除 $targetDir，尝试逐个删除子目录..." -ForegroundColor Yellow
        
        # 尝试逐个删除子目录
        Get-ChildItem -Path $targetDir -Directory | ForEach-Object {
            try {
                Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  - 已删除: $($_.Name)" -ForegroundColor Gray
            } catch {
                Write-Host "  - 无法删除: $($_.Name)" -ForegroundColor Red
            }
        }
        
        # 使用robocopy清空目录
        Write-Host "尝试使用robocopy清空目录..." -ForegroundColor Yellow
        $emptyDir = New-Item -ItemType Directory -Path ".\empty_target" -Force
        robocopy $emptyDir.FullName $targetDir /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
        Remove-Item -Path $emptyDir -Recurse -Force
    }
}

# 3. 执行构建
Write-Host "开始执行构建..." -ForegroundColor Cyan
npm run tauri build

# 4. 检查构建结果
if ($LASTEXITCODE -eq 0) {
    Write-Host "构建成功完成!" -ForegroundColor Green
} else {
    Write-Host "构建失败，退出代码: $LASTEXITCODE" -ForegroundColor Red
}