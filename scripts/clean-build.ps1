# 清理构建脚本 - 用于解决Tauri构建时的文件锁定问题

Write-Host "开始清理构建环境..." -ForegroundColor Cyan

# 1. 尝试关闭可能占用文件的进程
Write-Host "正在检查并关闭可能占用文件的进程..." -ForegroundColor Yellow

$processesToCheck = @("node", "cargo", "rustc", "tauri", "npm")
foreach ($proc in $processesToCheck) {
    $processes = Get-Process -Name $proc -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "发现 $proc 进程，尝试关闭..." -ForegroundColor Yellow
        $processes | ForEach-Object {
            Write-Host "  - 关闭进程: $($_.Id) $($_.ProcessName)" -ForegroundColor Gray
            try {
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            } catch {
                Write-Host "    无法关闭进程: $($_.Id) $($_.ProcessName)" -ForegroundColor Red
            }
        }
    }
}

# 2. 等待一段时间确保进程完全关闭
Write-Host "等待进程完全关闭..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 3. 手动删除target目录
Write-Host "尝试手动删除target目录..." -ForegroundColor Yellow
$targetDir = ".\src-tauri\target"
$distDir = ".\dist"

if (Test-Path $targetDir) {
    try {
        Remove-Item -Path $targetDir -Recurse -Force -ErrorAction Stop
        Write-Host "成功删除 $targetDir" -ForegroundColor Green
    } catch {
        Write-Host "无法删除 $targetDir: $_" -ForegroundColor Red
        Write-Host "尝试使用robocopy清空目录..." -ForegroundColor Yellow
        
        # 使用robocopy清空目录的技巧
        $emptyDir = New-Item -ItemType Directory -Path ".\empty_dir" -Force
        robocopy $emptyDir.FullName $targetDir /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
        Remove-Item -Path $emptyDir -Recurse -Force
        
        # 再次尝试删除
        if (Test-Path $targetDir) {
            try {
                Remove-Item -Path $targetDir -Recurse -Force -ErrorAction Stop
                Write-Host "成功删除 $targetDir" -ForegroundColor Green
            } catch {
                Write-Host "仍然无法删除 $targetDir，请手动删除或重启电脑后再试" -ForegroundColor Red
            }
        }
    }
}

# 4. 删除dist目录
if (Test-Path $distDir) {
    try {
        Remove-Item -Path $distDir -Recurse -Force -ErrorAction Stop
        Write-Host "成功删除 $distDir" -ForegroundColor Green
    } catch {
        Write-Host "无法删除 $distDir: $_" -ForegroundColor Red
    }
}

Write-Host "清理完成，现在可以尝试重新构建项目" -ForegroundColor Cyan
Write-Host "运行命令: npm run tauri build" -ForegroundColor Green