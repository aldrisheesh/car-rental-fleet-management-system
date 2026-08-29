$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

git pull --ff-only
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run deploy:vercel
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
