param(
    [switch]$KeepAlive
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$runtimeDir = Join-Path $projectRoot '.local'
$python = Join-Path $projectRoot '.venv/Scripts/python.exe'
& (Join-Path $PSScriptRoot 'setup-local.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Local database setup failed' }
Push-Location $projectRoot
try {
    & $python -m backend.app.cli init-db
    if ($LASTEXITCODE -ne 0) { throw 'Database initialization failed' }
    $apiReady = $false
    try { $apiReady = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8000/health' -TimeoutSec 3).StatusCode -eq 200 } catch {}
    if (-not $apiReady) {
        Start-Process -FilePath $python -ArgumentList '-X utf8 -m uvicorn backend.app.main:create_app --factory --host 127.0.0.1 --port 8000 --env-file backend/.env.local' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'api.log') -RedirectStandardError (Join-Path $runtimeDir 'api-error.log')
    }
    $existingWorker = Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $python -and $_.CommandLine -match 'backend.app.worker' }
    if (-not $existingWorker) {
        Start-Process -FilePath $python -ArgumentList '-X utf8 -m backend.app.worker' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'worker.log') -RedirectStandardError (Join-Path $runtimeDir 'worker-error.log')
    }
    $webReady = $false
    try { $webReady = (Invoke-WebRequest -UseBasicParsing 'http://localhost:3000' -TimeoutSec 3).StatusCode -eq 200 } catch {}
    if (-not $webReady) {
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/c npm.cmd run dev -- --hostname 127.0.0.1' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'web.log') -RedirectStandardError (Join-Path $runtimeDir 'web-error.log')
    }
    Write-Output 'Local services started: http://localhost:3000; scheduled refresh at 16:30 Vietnam time while worker runs.'
    if ($KeepAlive) {
        while ($true) { Start-Sleep -Seconds 2 }
    }
} finally { Pop-Location }
