$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = "http://127.0.0.1:8088/"
$l = [System.Net.HttpListener]::new()
$l.Prefixes.Add($prefix)
$l.Start()
Start-Process ($prefix + "index.html")
Write-Host "ZEKiQ Receive: $prefix"
while ($l.IsListening) {
  $c = $l.GetContext()
  $rel = [Uri]::UnescapeDataString($c.Request.Url.LocalPath.TrimStart('/'))
  if (-not $rel) { $rel = "index.html" }
  $f = Join-Path $root $rel
  if (-not (Test-Path -LiteralPath $f) -or (Get-Item -LiteralPath $f).PSIsContainer) {
    $c.Response.StatusCode = 404
    $c.Response.Close()
    continue
  }
  $bytes = [IO.File]::ReadAllBytes($f)
  $ext = [IO.Path]::GetExtension($f).ToLowerInvariant()
  $c.Response.ContentType = switch ($ext) {
    ".css" { "text/css; charset=utf-8" }
    ".js" { "text/javascript; charset=utf-8" }
    ".mjs" { "text/javascript; charset=utf-8" }
    ".svg" { "image/svg+xml" }
    ".png" { "image/png" }
    ".json" { "application/json" }
    ".woff2" { "font/woff2" }
    default { "text/html; charset=utf-8" }
  }
  $c.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $c.Response.Close()
}
