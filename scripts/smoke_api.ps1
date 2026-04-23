$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080/api"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "smoke_$timestamp@test.local"
$password = "12345678"

Write-Output "[SMOKE] Health check..."
$health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 10
Write-Output "[SMOKE] /health => $($health.StatusCode)"

Write-Output "[SMOKE] Register user..."
$registerBody = @{
  email = $email
  password = $password
  name = "Smoke User $timestamp"
} | ConvertTo-Json

$register = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -ContentType "application/json" -Body $registerBody
Write-Output "[SMOKE] /register => success=$($register.success)"

Write-Output "[SMOKE] Login user..."
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -ContentType "application/json" -Body $loginBody -WebSession $session
Write-Output "[SMOKE] /login => success=$($login.success)"

Write-Output "[SMOKE] Get current user (/me)..."
$me = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -WebSession $session
Write-Output "[SMOKE] /me => success=$($me.success) email=$($me.user.email)"

Write-Output "[SMOKE] Logout..."
$logout = Invoke-RestMethod -Uri "$baseUrl/logout" -Method Post -WebSession $session
Write-Output "[SMOKE] /logout => success=$($logout.success)"

Write-Output "[SMOKE] DONE"
