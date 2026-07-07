# ZEKiQ Tonino — إنهاء إعداد الكاشير (شغّل كمسؤول على Windows)
# Run: powershell -ExecutionPolicy Bypass -File cashier-finish.ps1

$ErrorActionPreference = "Continue"
$TargetIp = "192.168.1.25"
$Port = 3000
$Gateway = "192.168.1.1"
$TunnelHost = "tonino.zekiqmenu.com"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ZEKiQ — إعداد الكاشير + النفق" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1) Current IP
$adapter = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.Name -notmatch "vEthernet|Loopback" } | Select-Object -First 1
$currentIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $adapter.ifIndex -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch "^169\." } | Select-Object -First 1).IPAddress

Write-Host "[1] IP الحالي لهذا الجهاز: " -NoNewline
if ($currentIp) { Write-Host $currentIp -ForegroundColor Yellow } else { Write-Host "غير معروف" -ForegroundColor Red }

# 2) POS health
Write-Host "[2] فحص ZEKiQ POS على localhost:$Port ..."
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 3
    Write-Host "    OK — POS يعمل" -ForegroundColor Green
    if ($health.shop.shopName) { Write-Host "    المحل: $($health.shop.shopName)" }
} catch {
    Write-Host "    FAIL — شغّل ZEKiQ POS أولاً ثم أعد تشغيل هذا السكربت" -ForegroundColor Red
}

# 3) Optional static IP
Write-Host ""
Write-Host "[3] تعيين IP ثابت $TargetIp (نفس الكاشير القديم)؟"
Write-Host "    هذا يجعل الغارسون والمالك يعملون بدون تغيير."
$ans = Read-Host "    اكتب yes لتطبيق IP ثابت (أو Enter للتخطي)"

if ($ans -eq "yes" -and $adapter) {
    try {
        Remove-NetIPAddress -InterfaceIndex $adapter.ifIndex -Confirm:$false -ErrorAction SilentlyContinue
        New-NetIPAddress -InterfaceIndex $adapter.ifIndex -IPAddress $TargetIp -PrefixLength 24 -DefaultGateway $Gateway -ErrorAction Stop
        Set-DnsClientServerAddress -InterfaceIndex $adapter.ifIndex -ServerAddresses ("8.8.8.8", "1.1.1.1")
        Write-Host "    OK — IP أصبح $TargetIp" -ForegroundColor Green
        $currentIp = $TargetIp
    } catch {
        Write-Host "    FAIL — شغّل PowerShell كمسؤول (Run as Administrator)" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)"
    }
}

# 4) LAN health
$lanUrl = "http://${TargetIp}:$Port"
Write-Host ""
Write-Host "[4] فحص LAN $lanUrl ..."
try {
    Invoke-RestMethod -Uri "$lanUrl/api/health" -TimeoutSec 3 | Out-Null
    Write-Host "    OK — الشبكة المحلية تعمل" -ForegroundColor Green
} catch {
    Write-Host "    FAIL — تحقق من IP والراوتر" -ForegroundColor Yellow
}

# 5) Tunnel
Write-Host ""
Write-Host "[5] فحص النفق https://$TunnelHost ..."
try {
    Invoke-RestMethod -Uri "https://$TunnelHost/api/health" -TimeoutSec 8 | Out-Null
    Write-Host "    OK — النفق يعمل" -ForegroundColor Green
} catch {
    Write-Host "    FAIL — النفق متوقف" -ForegroundColor Red
    Write-Host ""
    Write-Host "    >>> افتح ZEKiQ POS على هذا الجهاز:" -ForegroundColor Yellow
    Write-Host "        الإعدادات -> QR / النفق / Cloudflare" -ForegroundColor Yellow
    Write-Host "        اضغط: إعادة النفق / تشغيل النفق" -ForegroundColor Yellow
    Write-Host "        انتظر حتى يظهر: متصل / Connected" -ForegroundColor Yellow
}

# 6) Open reconnect page
$reconnect = "https://ostaifskandar-lgtm.github.io/zekiq-site/reconnect-all.html"
Write-Host ""
Write-Host "[6] فتح صفحة ربط الأجهزة..."
Start-Process $reconnect

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IP للغارسون: ${TargetIp}:$Port" -ForegroundColor White
Write-Host "  النفق: https://$TunnelHost" -ForegroundColor White
Write-Host "  صفحة الربط: $reconnect" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "اضغط Enter للإغلاق"
