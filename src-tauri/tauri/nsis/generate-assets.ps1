# Generates light-themed NSIS brand bitmaps for the ME-Frp XL Client installer at 16x density.
# Output: assets/sidebar.bmp (2624x5024, welcome/finish) and assets/header.bmp (2400x912).
# Re-run after brand/color changes. Colors follow the app light theme (src/config/theme.ts).

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $here 'assets'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$configPath = Join-Path $here '..\..\tauri.conf.json'
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$version = $config.version
$productName = $config.productName

# Brand palette (RGB) — light theme, matches src/config/theme.ts
$bgColor  = [System.Drawing.Color]::FromArgb(0xFF, 0xFF, 0xFF)  # body
$primary  = [System.Drawing.Color]::FromArgb(0x20, 0x80, 0xF0)  # primary #2080F0
$dark     = [System.Drawing.Color]::FromArgb(0x1A, 0x1A, 0x1A)  # text base
$muted    = [System.Drawing.Color]::FromArgb(0x6A, 0x6A, 0x6A)  # text3
$border   = [System.Drawing.Color]::FromArgb(0xE0, 0xE0, 0xE6)  # border

$scale = [float]16.0

# Load the custom brand font for Chinese text
$fontPath = Join-Path $here '..\..\assets\fonts\YeZiGongChangGuaiJiaoHei-2.ttf'
$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile($fontPath)
$brandFontFamily = $pfc.Families[0]

function New-Canvas([int]$w, [int]$h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return $bmp, $g
}

function Save-Bmp($bmp, $path) {
  $clone = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($clone)
  $g.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
  $g.Dispose()
  $clone.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
  $clone.Dispose()
  $bmp.Dispose()
}

# ---------- sidebar.bmp 164x314 @16x => 2624x5024 ----------
$sW = [int](164 * $scale)
$sH = [int](314 * $scale)
$sBmp, $sg = New-Canvas $sW $sH
$sg.Clear($bgColor)

# primary accent bar
$accent = New-Object System.Drawing.Rectangle([int](20 * $scale), [int](28 * $scale), [int](40 * $scale), [int](4 * $scale))
$sg.FillRectangle((New-Object System.Drawing.SolidBrush($primary)), $accent)

# product name (system font)
$fsLarge = [int](20 * $scale)
$fsSmall = [int](10 * $scale)
$fsMini  = [int](9 * $scale)

$yaheiFont = New-Object System.Drawing.Font('Microsoft YaHei', $fsLarge, [System.Drawing.FontStyle]::Bold)
$sg.DrawString('ME-Frp',  $yaheiFont, (New-Object System.Drawing.SolidBrush($dark)),    [int](20 * $scale), [int](48 * $scale))
$sg.DrawString('XL Client', $yaheiFont, (New-Object System.Drawing.SolidBrush($primary)), [int](20 * $scale), [int](80 * $scale))

# divider
$sg.DrawLine((New-Object System.Drawing.Pen($border, $scale)), [int](20 * $scale), [int](132 * $scale), $sW - [int](20 * $scale), [int](132 * $scale))

# tagline — uses the custom brand font
$tagline = -join @(
  [char]0x684C, [char]0x9762, [char]0x5185, [char]0x7F51,
  [char]0x7A7F, [char]0x900F, [char]0x5BA2, [char]0x6237, [char]0x7AEF
)
$tagFont = New-Object System.Drawing.Font($brandFontFamily, $fsSmall, [System.Drawing.FontStyle]::Regular)
$sg.DrawString($tagline, $tagFont, (New-Object System.Drawing.SolidBrush($muted)), [int](20 * $scale), [int](146 * $scale))

# version
$verFont = New-Object System.Drawing.Font('Segoe UI', $fsMini)
$sg.DrawString("v$version", $verFont, (New-Object System.Drawing.SolidBrush($muted)), [int](20 * $scale), $sH - [int](28 * $scale))

Save-Bmp $sBmp (Join-Path $outDir 'sidebar.bmp')

# ---------- header.bmp 150x57 @16x => 2400x912 ----------
$hW = [int](150 * $scale)
$hH = [int](57 * $scale)
$hBmp, $hg = New-Canvas $hW $hH
$hg.Clear($bgColor)

# primary accent vertical bar
$hg.FillRectangle((New-Object System.Drawing.SolidBrush($primary)), [int](8 * $scale), [int](14 * $scale), [int](3 * $scale), [int](29 * $scale))

# product name
$hFont = New-Object System.Drawing.Font('Microsoft YaHei', $fsSmall, [System.Drawing.FontStyle]::Bold)
$hg.DrawString($productName, $hFont, (New-Object System.Drawing.SolidBrush($dark)), [int](18 * $scale), [int](20 * $scale))

Save-Bmp $hBmp (Join-Path $outDir 'header.bmp')

Write-Host "Generated sidebar.bmp ($sW x $sH) and header.bmp ($hW x $hH) at 16x density in $outDir"
Write-Host "Tagline rendered with: $($brandFontFamily.Name)"
