$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$port = 5173
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener) { exit 0 }

$node = (Get-Command node.exe).Source
$stdout = Join-Path $root 'local-reader.log'
$stderr = Join-Path $root 'local-reader-error.log'

Start-Process `
  -FilePath $node `
  -ArgumentList @('server/local-server.mjs') `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr
