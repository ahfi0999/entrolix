$ErrorActionPreference = 'Stop'
Start-Transcript -Path 'E:\Shashi\entrolix-website\postgres-setup.log' -Force

$pgRoot = 'C:\Program Files\PostgreSQL\18'
$pgHba = Join-Path $pgRoot 'data\pg_hba.conf'
$pgHbaBackup = Join-Path $env:TEMP 'entrolix-pg_hba.conf.backup'
$psql = Join-Path $pgRoot 'bin\psql.exe'
$serviceName = 'postgresql-x64-18'

if (-not (Test-Path -LiteralPath $psql)) {
    throw "PostgreSQL psql was not found at $psql"
}

Copy-Item -LiteralPath $pgHba -Destination $pgHbaBackup -Force

try {
    $original = Get-Content -LiteralPath $pgHba -Raw
    $temporaryRules = @"
# Temporary Entrolix setup access (restored automatically)
host    all    postgres    127.0.0.1/32    trust
host    all    postgres    ::1/128         trust
"@
    # PostgreSQL rejects the BOM written by Windows PowerShell's utf8 encoding.
    Set-Content -LiteralPath $pgHba -Value ($temporaryRules + $original) -Encoding ascii
    Restart-Service -Name $serviceName

    $roleExists = & $psql -h 127.0.0.1 -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='entrolix_user'"
    if ([string]$roleExists -ne '1') {
        & $psql -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE entrolix_user WITH LOGIN PASSWORD 'entrolix_local_password';"
    } else {
        & $psql -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER ROLE entrolix_user WITH LOGIN PASSWORD 'entrolix_local_password';"
    }

    $databaseExists = & $psql -h 127.0.0.1 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='entrolix'"
    if ([string]$databaseExists -ne '1') {
        & $psql -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE entrolix OWNER entrolix_user;"
    }
}
finally {
    Copy-Item -LiteralPath $pgHbaBackup -Destination $pgHba -Force
    Restart-Service -Name $serviceName
    Remove-Item -LiteralPath $pgHbaBackup -Force -ErrorAction SilentlyContinue
}

& $psql 'postgresql://entrolix_user:entrolix_local_password@127.0.0.1:5432/entrolix' -c "SELECT current_database(), current_user;"
Stop-Transcript
