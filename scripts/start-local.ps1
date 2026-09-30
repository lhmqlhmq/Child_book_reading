$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Test-Path 'node_modules')) { npm ci }
$ip = (Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp | Where-Object {$_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $ip) { $ip = '电脑的局域网 IP' }
Write-Host "给孩子读书已启动" -ForegroundColor Green
Write-Host "手机请连接同一个家庭 Wi-Fi，然后打开：" -ForegroundColor Cyan
Write-Host "http://$ip`:5173/Child_book_reading/" -ForegroundColor Yellow
$tailscaleExe = 'C:\Program Files\Tailscale\tailscale.exe'
if (Test-Path $tailscaleExe) {
  $tailscaleIp = & $tailscaleExe ip -4
  if ($tailscaleIp) {
    Write-Host "如果手机打开 Tailscale，也可以使用：" -ForegroundColor Cyan
    Write-Host "http://$tailscaleIp`:5173/Child_book_reading/" -ForegroundColor Yellow
  }
}
Write-Host "保持此窗口打开即可。按 Ctrl+C 停止。"
npm run local
