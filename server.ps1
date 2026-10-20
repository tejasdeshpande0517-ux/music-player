# Robust Native Static Web Server for Aura Melody Music Player
param(
    [int]$Port = 8080,
    [string]$Root = ""
)

if (-not $Root) {
    $Root = $PSScriptRoot
}
if (-not $Root) {
    $Root = (Get-Location).Path
}

$Root = [System.IO.Path]::GetFullPath($Root)
$ip = [System.Net.IPAddress]::Loopback
$listener = New-Object System.Net.Sockets.TcpListener($ip, $Port)

try {
    $listener.Start()
    Write-Output "=================================================="
    Write-Output " Aura Melody Local Web Server is LIVE!"
    Write-Output " URL: http://localhost:$Port"
    Write-Output " Root: $Root"
    Write-Output "=================================================="

    while ($true) {
        $client = $null
        try {
            $client = $listener.AcceptTcpClient()
            $client.ReceiveTimeout = 5000
            $client.SendTimeout = 5000

            $stream = $client.GetStream()
            $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::ASCII)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                $client.Close()
                continue
            }

            $parts = $requestLine.Split(' ')
            if ($parts.Length -lt 2) {
                $client.Close()
                continue
            }

            $method = $parts[0]
            $rawPath = $parts[1].Split('?')[0]
            $urlPath = [System.Uri]::UnescapeDataString($rawPath)

            if ($urlPath -eq '/' -or $urlPath -eq '') {
                $urlPath = '/index.html'
            }

            # Normalize path
            $relPath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $relPath))

            # Security check: within root directory
            if (-not $filePath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
                $body = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden")
                $header = "HTTP/1.1 403 Forbidden`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
                $hBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($hBytes, 0, $hBytes.Length)
                $stream.Write($body, 0, $body.Length)
                $stream.Flush()
                $client.Close()
                continue
            }

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = switch ($ext) {
                    '.html' { 'text/html; charset=utf-8' }
                    '.css'  { 'text/css; charset=utf-8' }
                    '.js'   { 'application/javascript; charset=utf-8' }
                    '.json' { 'application/json; charset=utf-8' }
                    '.jpg'  { 'image/jpeg' }
                    '.jpeg' { 'image/jpeg' }
                    '.png'  { 'image/png' }
                    '.svg'  { 'image/svg+xml' }
                    '.ico'  { 'image/x-icon' }
                    '.wav'  { 'audio/wav' }
                    '.mp3'  { 'audio/mpeg' }
                    '.ogg'  { 'audio/ogg' }
                    '.m4a'  { 'audio/mp4' }
                    default { 'application/octet-stream' }
                }

                $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                $header = "HTTP/1.1 200 OK`r`n" +
                          "Content-Type: $mime`r`n" +
                          "Content-Length: $($fileBytes.Length)`r`n" +
                          "Access-Control-Allow-Origin: *`r`n" +
                          "Cache-Control: no-cache`r`n" +
                          "Connection: close`r`n`r`n"
                $hBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($hBytes, 0, $hBytes.Length)
                $stream.Write($fileBytes, 0, $fileBytes.Length)
                $stream.Flush()
                Write-Output "[200 OK] $urlPath ($($fileBytes.Length) bytes)"
            } else {
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
                $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($msg.Length)`r`nConnection: close`r`n`r`n"
                $hBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($hBytes, 0, $hBytes.Length)
                $stream.Write($msg, 0, $msg.Length)
                $stream.Flush()
                Write-Output "[404 Not Found] $urlPath"
            }
        } catch {
            Write-Output "[Request Error] $_"
        } finally {
            if ($client -ne $null) {
                try { $client.Close() } catch {}
            }
        }
    }
} catch {
    Write-Output "[Fatal Server Error] $_"
} finally {
    try { $listener.Stop() } catch {}
}
