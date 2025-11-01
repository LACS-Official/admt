# Clean build script - used to solve file locking issues during Tauri build

Write-Host "Starting to clean build environment..." -ForegroundColor Cyan

# 1. Try to close processes that might be holding files
Write-Host "Checking and closing processes that might be holding files..." -ForegroundColor Yellow

$processesToCheck = @("node", "cargo", "rustc", "tauri", "npm")
foreach ($proc in $processesToCheck) {
    $processes = Get-Process -Name $proc -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "Found $proc processes, trying to close..." -ForegroundColor Yellow
        $processes | ForEach-Object {
            Write-Host "  - Closing process: $($_.Id) $($_.ProcessName)" -ForegroundColor Gray
            try {
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            } catch {
                Write-Host "    Unable to close process: $($_.Id) $($_.ProcessName)" -ForegroundColor Red
            }
        }
    }
}

# 2. Wait for processes to fully close
Write-Host "Waiting for processes to fully close..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 3. Manually delete target directory
Write-Host "Trying to manually delete target directory..." -ForegroundColor Yellow
$targetDir = ".\src-tauri\target"
$distDir = ".\dist"

if (Test-Path $targetDir) {
    try {
        Remove-Item -Path $targetDir -Recurse -Force -ErrorAction Stop
        Write-Host "Successfully deleted $targetDir" -ForegroundColor Green
    } catch {
        Write-Host "Unable to delete ${targetDir}: $_" -ForegroundColor Red
        Write-Host "Trying to empty directory using robocopy..." -ForegroundColor Yellow
        
        # Technique to empty directory using robocopy
        $emptyDir = New-Item -ItemType Directory -Path ".\empty_dir" -Force
        robocopy $emptyDir.FullName $targetDir /MIR /NFL /NDL /NJH /NJS /NC /NS /NP
        Remove-Item -Path $emptyDir -Recurse -Force
        
        # Try to delete again
        if (Test-Path $targetDir) {
            try {
                Remove-Item -Path $targetDir -Recurse -Force -ErrorAction Stop
                Write-Host "Successfully deleted $targetDir" -ForegroundColor Green
            } catch {
                Write-Host "Still unable to delete ${targetDir}, please delete manually or restart computer and try again" -ForegroundColor Red
            }
        }
    }
}

# 4. Delete dist directory
if (Test-Path $distDir) {
    try {
        Remove-Item -Path $distDir -Recurse -Force -ErrorAction Stop
        Write-Host "Successfully deleted $distDir" -ForegroundColor Green
    } catch {
        Write-Host "Unable to delete ${distDir}: $_" -ForegroundColor Red
    }
}

Write-Host "Cleanup completed, now you can try to rebuild the project" -ForegroundColor Cyan
Write-Host "Run command: npm run tauri build" -ForegroundColor Green