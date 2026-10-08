param(
    [int]$DatabasePort = 55432,
    [string]$UniversePath = (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads/CNF_Phan_nganh_Co_phieu_2026-09-04.xlsx')
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$runtimeDir = Join-Path $projectRoot '.local'
$postgresBin = Join-Path $runtimeDir 'pgsql/bin'
$dataDir = Join-Path $runtimeDir 'pgdata'
$backendEnv = Join-Path $projectRoot 'backend/.env.local'
$frontendEnv = Join-Path $projectRoot '.env.local'
$passwordFile = Join-Path $runtimeDir 'pg-password'
$encoding = New-Object System.Text.UTF8Encoding($false)
function New-LocalSecret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return [Convert]::ToBase64String($bytes).Replace('+','-').Replace('/','_').TrimEnd('=')
}
if (-not (Test-Path $backendEnv)) {
    $databasePassword = New-LocalSecret
    $serviceToken = New-LocalSecret
    [IO.File]::WriteAllText($passwordFile, $databasePassword, $encoding)
    $candidatePaths = @(
        $UniversePath,
        (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads/CNF_Phan_nganh_Co_phieu_2026-09-04.xlsx'),
        (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads/CNF_Phan_nganh_Co_phieu.xlsx'),
        (Join-Path $projectRoot 'CNF_Phan_nganh_Co_phieu.xlsx')
    )
    $foundUniverse = $candidatePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($foundUniverse) {
        $universePath = (Resolve-Path -LiteralPath $foundUniverse).Path.Replace('\', '/')
    } else {
        $universePath = (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'Downloads/CNF_Phan_nganh_Co_phieu.xlsx').Replace('\', '/')
        Write-Warning "File phân loại ngành chưa có tại: $universePath. Vui lòng đặt file CNF_Phan_nganh_Co_phieu.xlsx vào thư mục Downloads."
    }
    [IO.File]::WriteAllText($backendEnv, "DATABASE_URL=postgresql+psycopg://cnf:$databasePassword@127.0.0.1:$DatabasePort/cnf`nSERVICE_TOKEN=$serviceToken`nUNIVERSE_PATH=$universePath`nVNSTOCK_SOURCE=VCI`nAPP_TIMEZONE=Asia/Ho_Chi_Minh`nREFRESH_HOUR=16`nREFRESH_MINUTE=30`nHISTORY_COUNT=700`n", $encoding)
} else {
    $tokenLine = Get-Content -LiteralPath $backendEnv | Where-Object { $_ -match '^SERVICE_TOKEN=' }
    $serviceToken = $tokenLine.Substring('SERVICE_TOKEN='.Length)
}
if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) {
    & (Join-Path $postgresBin 'initdb.exe') -D $dataDir -U cnf --auth=scram-sha-256 --pwfile=$passwordFile --encoding=UTF8 --locale=C
    if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
}
& (Join-Path $postgresBin 'pg_ctl.exe') -D $dataDir status *> $null
if ($LASTEXITCODE -ne 0) {
    & (Join-Path $postgresBin 'pg_ctl.exe') -D $dataDir -l (Join-Path $runtimeDir 'postgres.log') -o "-p $DatabasePort -h 127.0.0.1" -w start
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL startup failed' }
}
$env:PGPASSWORD = [IO.File]::ReadAllText($passwordFile)
try {
    $existingDatabase = & (Join-Path $postgresBin 'psql.exe') -h 127.0.0.1 -p $DatabasePort -U cnf -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='cnf'"
    if ($existingDatabase -ne '1') {
        & (Join-Path $postgresBin 'createdb.exe') -h 127.0.0.1 -p $DatabasePort -U cnf cnf
        if ($LASTEXITCODE -ne 0) { throw 'createdb failed' }
    }
} finally { Remove-Item Env:PGPASSWORD }
$content = if (Test-Path $frontendEnv) { [IO.File]::ReadAllText($frontendEnv) } else { '' }
$content = $content -replace '(?m)^BACKEND_API_URL=.*\r?\n?', '' -replace '(?m)^BACKEND_SERVICE_TOKEN=.*\r?\n?', ''
[IO.File]::WriteAllText($frontendEnv, $content.TrimEnd() + "`nBACKEND_API_URL=http://127.0.0.1:8000`nBACKEND_SERVICE_TOKEN=$serviceToken`n", $encoding)
Write-Output 'Local PostgreSQL and environment configuration ready; secrets not printed.'
