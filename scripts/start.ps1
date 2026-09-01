# EMBOS supervisor - starts both servers and auto-restarts on crash.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\start.ps1
# Ctrl+C cleanly stops both servers.

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendJar  = Join-Path $ProjectRoot "backend\target\embos-backend-0.0.1-SNAPSHOT.jar"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$LogsDir     = Join-Path $ProjectRoot "logs"
if (-not (Test-Path $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }

$BackendLogFile  = Join-Path $LogsDir "backend.log"
$FrontendLogFile = Join-Path $LogsDir "frontend.log"

$MavenPath = Join-Path $env:LOCALAPPDATA "Programs\apache-maven\apache-maven-3.9.16\bin\mvn.cmd"
$NpmExe    = "C:\Program Files\nodejs\npm.cmd"

function Test-Port($p) {
    return [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue)
}

function Stop-Kids($parentId) {
    Get-CimInstance Win32_Process -Filter "ParentProcessId = $parentId" -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Stop-Process -Id $parentId -Force -ErrorAction SilentlyContinue
}

function Wait-Port($port, $timeoutSec) {
    for ($i = 0; $i -lt $timeoutSec; $i += 2) {
        if (Test-Port $port) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Start-Backend {
    if (-not (Test-Path $BackendJar)) {
        Write-Host "[backend] jar not found, building..." -ForegroundColor Yellow
        if (Test-Path $MavenPath) {
            & $MavenPath clean package -q 2>&1 | Out-Null
        } else {
            Write-Host "[backend] mvn not found - run mvn clean package manually" -ForegroundColor Red
            return 0
        }
        if (-not (Test-Path $BackendJar)) {
            Write-Host "[backend] build failed" -ForegroundColor Red
            return 0
        }
    }
    if (Test-Port 8080) {
        Write-Host "[backend] port 8080 already in use" -ForegroundColor Yellow
        return 0
    }
    Write-Host "[backend] starting..." -ForegroundColor Cyan
    $p = Start-Process java -ArgumentList "-jar", "`"$BackendJar`"" `
        -WorkingDirectory (Join-Path $ProjectRoot "backend") `
        -RedirectStandardOutput $BackendLogFile `
        -RedirectStandardError "$BackendLogFile.err" `
        -WindowStyle Hidden -PassThru
    if (Wait-Port 8080 40) {
        Write-Host "[backend] ready on port 8080" -ForegroundColor Green
    } else {
        Write-Host "[backend] port 8080 not ready after 40s, continuing anyway" -ForegroundColor Yellow
    }
    return $p.Id
}

function Start-Frontend {
    if (Test-Port 3000) {
        Write-Host "[frontend] port 3000 already in use" -ForegroundColor Yellow
        return 0
    }
    Write-Host "[frontend] clearing cache and starting..." -ForegroundColor Cyan
    Remove-Item -LiteralPath (Join-Path $FrontendDir ".next") -Recurse -Force -ErrorAction SilentlyContinue
    $p = Start-Process $NpmExe -ArgumentList "run", "dev:clean" `
        -WorkingDirectory $FrontendDir `
        -RedirectStandardOutput $FrontendLogFile `
        -RedirectStandardError "$FrontendLogFile.err" `
        -WindowStyle Hidden -PassThru
    if (Wait-Port 3000 30) {
        Write-Host "[frontend] ready on port 3000" -ForegroundColor Green
    } else {
        Write-Host "[frontend] port 3000 not ready after 30s, continuing anyway" -ForegroundColor Yellow
    }
    return $p.Id
}

function Do-Cleanup($beId, $feId) {
    Write-Host "`n[shutdown] stopping servers..." -ForegroundColor Yellow
    if ($feId -gt 0) { Stop-Kids $feId }
    if ($beId -gt 0) { Stop-Kids $beId }
    Write-Host "[shutdown] done." -ForegroundColor Green
}

# --- MySQL ---
if (-not (Test-Port 3306)) {
    $mysqld = "C:\xampp\mysql\bin\mysqld.exe"
    if (Test-Path $mysqld) {
        Write-Host "[mysql] starting..." -ForegroundColor Cyan
        Start-Process $mysqld -ArgumentList "--defaults-file=C:\xampp\mysql\bin\my.ini" -WindowStyle Hidden
        Start-Sleep -Seconds 6
    }
}

# --- Launch ---
$beId = Start-Backend
$feId = Start-Frontend

if ($beId -gt 0)  { Write-Host ("[backend]  PID " + $beId) -ForegroundColor Green }
if ($feId -gt 0)  { Write-Host ("[frontend] PID " + $feId) -ForegroundColor Green }

Write-Host ""
Write-Host "  App: http://localhost:3000"
Write-Host "  API: http://localhost:8080/api"
Write-Host "  Logs: " + $LogsDir
Write-Host "  Ctrl+C to stop"
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 10

        # --- Backend check ---
        if ($beId -gt 0 -and -not (Test-Port 8080)) {
            $procAlive = Get-Process -Id $beId -ErrorAction SilentlyContinue
            if (-not $procAlive) {
                Write-Host "[backend] process dead, restarting..." -ForegroundColor Yellow
                $beId = Start-Backend
                if ($beId -gt 0) { Write-Host ("[backend]  PID " + $beId) -ForegroundColor Green }
            }
        }

        # --- Frontend check ---
        if ($feId -gt 0 -and -not (Test-Port 3000)) {
            $procAlive = Get-Process -Id $feId -ErrorAction SilentlyContinue
            if (-not $procAlive) {
                Write-Host "[frontend] process dead, restarting..." -ForegroundColor Yellow
                $feId = Start-Frontend
                if ($feId -gt 0) { Write-Host ("[frontend] PID " + $feId) -ForegroundColor Green }
            }
        }
    }
} finally {
    Do-Cleanup $beId $feId
}
