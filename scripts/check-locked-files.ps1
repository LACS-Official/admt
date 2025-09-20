# 检测文件锁定脚本

Write-Host "开始检测文件锁定情况..." -ForegroundColor Cyan

# 定义要检查的目录
$targetDir = ".\src-tauri\target"

# 检查目录是否存在
if (-not (Test-Path $targetDir)) {
    Write-Host "目录 $targetDir 不存在" -ForegroundColor Yellow
    exit
}

# 获取所有DLL和PDB文件
$filesToCheck = Get-ChildItem -Path $targetDir -Include "*.dll", "*.pdb", "*.exe" -Recurse

Write-Host "找到 $($filesToCheck.Count) 个文件需要检查" -ForegroundColor Yellow

# 创建测试目录
$testDir = ".\test_lock"
if (-not (Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir -Force | Out-Null
}

# 检查每个文件是否被锁定
$lockedFiles = @()
$count = 0
$total = $filesToCheck.Count

foreach ($file in $filesToCheck) {
    $count++
    Write-Progress -Activity "检查文件锁定" -Status "检查文件 $count / $total" -PercentComplete (($count / $total) * 100)
    
    $testPath = Join-Path -Path $testDir -ChildPath $file.Name
    
    try {
        # 尝试复制文件 - 如果文件被锁定，这将失败
        Copy-Item -Path $file.FullName -Destination $testPath -Force -ErrorAction Stop
        Remove-Item -Path $testPath -Force -ErrorAction SilentlyContinue
    } catch {
        $lockedFiles += $file.FullName
    }
}

# 清理测试目录
if (Test-Path $testDir) {
    Remove-Item -Path $testDir -Recurse -Force -ErrorAction SilentlyContinue
}

# 显示结果
Write-Host "`n检测完成!" -ForegroundColor Cyan
Write-Host "发现 $($lockedFiles.Count) 个被锁定的文件:" -ForegroundColor Yellow

if ($lockedFiles.Count -gt 0) {
    foreach ($file in $lockedFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    
    # 尝试查找锁定这些文件的进程
    Write-Host "`n尝试查找锁定这些文件的进程..." -ForegroundColor Yellow
    
    # 注意：这需要管理员权限，并且可能需要安装Handle工具
    # 这里只是一个示例，实际使用可能需要调整
    Write-Host "请使用管理员权限运行以下命令来查找锁定进程:" -ForegroundColor Cyan
    Write-Host "handle.exe -a `"$targetDir`"" -ForegroundColor Gray
    
    Write-Host "`n建议操作:" -ForegroundColor Green
    Write-Host "1. 关闭所有相关的开发工具和终端" -ForegroundColor White
    Write-Host "2. 使用任务管理器结束相关进程" -ForegroundColor White
    Write-Host "3. 如果问题仍然存在，尝试重启电脑" -ForegroundColor White
} else {
    Write-Host "没有发现被锁定的文件，但可能存在其他锁定问题" -ForegroundColor Green
}