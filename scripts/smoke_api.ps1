$ErrorActionPreference = "Stop"

# Smoke test API Darussunnah.
#
# Pendaftaran mandiri dimatikan di backend (POST /api/register sudah di-comment),
# jadi skrip ini tidak lagi membuat akun. Ia memakai akun yang sudah ada:
#
#   $env:SMOKE_EMAIL = "admin@contoh.sch.id"
#   $env:SMOKE_PASSWORD = "..."
#   .\scripts\smoke_api.ps1
#
# Password tidak pernah ditulis di file ini. Kalau env var tidak diisi, skrip
# hanya menjalankan cek yang tidak butuh autentikasi lalu berhenti.

$baseUrl = if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://localhost:8080/api" }
$email = $env:SMOKE_EMAIL
$password = $env:SMOKE_PASSWORD

Write-Output "[SMOKE] Health check..."
$health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 10
Write-Output "[SMOKE] /health => $($health.StatusCode)"

Write-Output "[SMOKE] Endpoint privat harus menolak tanpa token..."
foreach ($path in @("/me", "/upload/document", "/documents/1/x.png")) {
  try {
    Invoke-WebRequest -Uri "$baseUrl$path" -UseBasicParsing -TimeoutSec 10 | Out-Null
    Write-Output "[SMOKE] $path => TIDAK DILINDUNGI (diharapkan 401)"
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    Write-Output "[SMOKE] $path => $code"
    if ($code -ne 401) { throw "$path menolak dengan $code, diharapkan 401" }
  }
}

if (-not $email -or -not $password) {
  Write-Output "[SMOKE] SMOKE_EMAIL / SMOKE_PASSWORD belum di-set, cek autentikasi dilewati."
  Write-Output "[SMOKE] DONE"
  exit 0
}

Write-Output "[SMOKE] Login ($email)..."
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType "application/json" -Body $loginBody -WebSession $session
Write-Output "[SMOKE] /login => success=$($login.success)"

Write-Output "[SMOKE] Get current user (/me)..."
$me = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -WebSession $session
Write-Output "[SMOKE] /me => success=$($me.success) email=$($me.user.email) role=$($me.user.role)"

Write-Output "[SMOKE] Logout..."
$logout = Invoke-RestMethod -Uri "$baseUrl/logout" -Method Post -WebSession $session
Write-Output "[SMOKE] /logout => success=$($logout.success)"

Write-Output "[SMOKE] DONE"