$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

$env:npm_config_cache = Join-Path (Split-Path $repoRoot -Parent) ".npm-cache"
$env:ComSpec = Join-Path $env:SystemRoot "System32\cmd.exe"
$system32 = Join-Path $env:SystemRoot "System32"
if (($env:Path -split ";") -notcontains $system32) {
  $env:Path = "$system32;$env:Path"
}

vercel pull --yes --environment production
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:VERCEL = "1"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

vercel deploy --prebuilt --prod --yes --no-wait
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
