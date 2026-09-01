# EMBOS public demo launcher
# Starts MySQL (if not running), backend, frontend, and a free cloudflared tunnel.
# Prereqs: XAMPP MySQL, Java 17+, Node.js, cloudflared (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\demo.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendJar  = Join-Path $ProjectRoot "backend\target\embos-backend-0.0.1-SNAPSHOT.jar"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$MavenPath   = Join-Path $env:LOCALAPPDATA "Programs\apache-maven\apache-maven-3.9.16\bin\mvn.cmd"

# Optional email settings. Set RESEND_API_KEY to enable the approve/reject
# emails (Resend, https://resend.com). EMBOS_MAIL_FROM must be a verified
# sender in your Resend account (e.g. "EMBOS <onboarding@resend.dev>").
$env:RESEND_API_KEY = if ($env:RESEND_API_KEY) { $env:RESEND_API_KEY } else { "" }
$env:EMBOS_APP_BASE_URL = if ($env:EMBOS_APP_BASE_URL) { $env:EMBOS_APP_BASE_URL } else { "http://localhost:3000" }
$env:EMBOS_MAIL_FROM = if ($env:EMBOS_MAIL_FROM) { $env:EMBOS_MAIL_FROM } else { "EMBOS <onboarding@resend.dev>" }

function Test-Port($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

Write-Host "== EMBOS demo launcher =="

# 1. MySQL
if (-not (Test-Port 3306)) {
  Write-Host "Starting MySQL..."
  $mysqld = "C:\xampp\mysql\bin\mysqld.exe"
  if (-not (Test-Path $mysqld)) {
    Write-Warning "mysqld.exe not found at C:\xampp\mysql\bin. Start MySQL manually."
  } else {
    Start-Process $mysqld `
      -ArgumentList "--defaults-file=C:\xampp\mysql\bin\my.ini" `
      -WindowStyle Hidden
    Start-Sleep -Seconds 8
  }
}

# 2. Backend (jar must exist: run `mvn -q clean -DskipTests package` in backend/ first)
if (-not (Test-Port 8080)) {
  if (Test-Path $BackendJar) {
    Write-Host "Starting backend..."
    $backendLogFile = Join-Path $ProjectRoot "logs\backend-run.log"
    Start-Process java -ArgumentList "-jar", "`"$BackendJar`"" `
      -WorkingDirectory (Join-Path $ProjectRoot "backend") `
      -RedirectStandardOutput $backendLogFile `
      -RedirectStandardError "$backendLogFile.err" `
      -WindowStyle Hidden
    Start-Sleep -Seconds 35
  } else {
    Write-Warning "Backend jar missing. Build it first: cd backend; mvn -q clean -DskipTests package"
  }
}

# 3. Frontend dev server
if (-not (Test-Port 3000)) {
  Write-Host "Starting frontend dev server..."
  $nodeExe = "C:\Program Files\nodejs\node.exe"
  $nextBin = Join-Path $FrontendDir "node_modules\.bin\next"
  if (-not (Test-Path $nextBin)) {
    Write-Warning "Next.js binary not found. Run: cd frontend; npm install"
  } else {
    Start-Process $nodeExe -ArgumentList "`"$nextBin`"", "dev", "--turbopack" `
      -WorkingDirectory $FrontendDir `
      -WindowStyle Hidden
    Start-Sleep -Seconds 20
  }
}

Write-Host ""
Write-Host "Local URLs:"
Write-Host "  App:      http://localhost:3000"
Write-Host "  API:      http://localhost:8080/api"

# 4. Cloudflared tunnel (free public URL)
if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
  Write-Host ""
  Write-Host "Starting cloudflared tunnel (free public URL)..."
  Write-Host "  Run 'cloudflared tunnel --url http://localhost:3000' manually in another"
  Write-Host "  terminal to see the public URL, OR use ngrok free instead."
  Start-Process cloudflared -ArgumentList "tunnel", "--url", "http://localhost:3000" -WindowStyle Hidden
  Start-Sleep -Seconds 6
  Write-Host ""
  Write-Host ">> Open the app through the cloudflared URL, then copy registration links"
  Write-Host ">> from the event page - they'll be public automatically."
} else {
  Write-Warning "cloudflared not found. Get it free at https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
}

Write-Host ""
Write-Host "Demo tips:"
Write-Host "  - Guests: open the public URL -> /browse -> pick an event -> register (no login)."
Write-Host "  - Set RESEND_API_KEY before launching to send approve/reject emails to the guest's"
Write-Host "    inbox (check the API logs for the 'GuestStatusChangedEvent' on Approve/Reject)."
Write-Host "  - Approved guests receive their ticket link by email."
