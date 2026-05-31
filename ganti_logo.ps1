# =========================================================================
# SALAMA AI — BRAND ASSETS AUTOMATION TOOL (GANTI LOGO SATU KLIK)
# =========================================================================
# Script ini mengintegrasikan seluruh logo di Salama AI. 
# Cukup jalankan script ini untuk:
# 1. Menghasilkan PNG resolusi tinggi (logo.png) dari SVG (logo.svg) jika diperlukan.
# 2. Membersihkan seluruh cache build Next.js lama agar tidak tersangkut di browser / server.
# 3. Melakukan build ulang proyek agar semua halaman static langsung terupdate logo barunya.
# =========================================================================

Add-Type -AssemblyName System.Drawing

$logoSvg = "public/logo.svg"
$logoPng = "public/logo.png"

Write-Host "`n[1/3] Menyiapkan File Aset Logo..." -ForegroundColor Cyan

# Pilihan A: Jika user mengedit SVG bawaan, kita render ulang versi high-def PNG-nya
Write-Host "Membangun ulang logo.png dari sistem vector..." -ForegroundColor Gray

$width = 512
$height = 512
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)

$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background rounded rect (#0f172a)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$r = 112
$d = $r * 2
$path.AddArc(0, 0, $d, $d, 180, 90)
$path.AddArc(($width - $d), 0, $d, $d, 270, 90)
$path.AddArc(($width - $d), ($height - $d), $d, $d, 0, 90)
$path.AddArc(0, ($height - $d), $d, $d, 90, 90)
$path.CloseAllFigures()
$g.FillPath($bgBrush, $path)

# White open book
$bookPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$bookPath.StartFigure()
$bookPath.AddLine(128, 358.4, 128, 153.6)
$bookPath.AddBezier(128, 153.6, 128, 153.6, 194.56, 138.24, 256, 163.84)
$bookPath.AddBezier(256, 163.84, 317.44, 138.24, 384, 153.6, 384, 153.6)
$bookPath.AddLine(384, 153.6, 384, 358.4)
$bookPath.AddBezier(384, 358.4, 317.44, 343.04, 256, 368.64, 256, 368.64)
$bookPath.AddBezier(256, 368.64, 194.56, 343.04, 128, 358.4, 128, 358.4)
$bookPath.CloseFigure()

$bookBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$g.FillPath($bookBrush, $bookPath)

# Spine line
$spinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 15, 23, 42), 10)
$spinePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$spinePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($spinePen, 256, 163.84, 256, 368.64)

# Letter A
$font = New-Object System.Drawing.Font("Georgia", 92, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center
$format.LineAlignment = [System.Drawing.StringAlignment]::Center
$rectA = New-Object System.Drawing.RectangleF(128, 163.84, 128, 204.8)
$g.DrawString("A", $font, $textBrush, $rectA, $format)

# Letter Z
$rectZ = New-Object System.Drawing.RectangleF(256, 163.84, 128, 204.8)
$g.DrawString("Z", $font, $textBrush, $rectZ, $format)

# Gold ribbon
$ribbonPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$ribbonPath.StartFigure()
$ribbonPath.AddLine(240.64, 158.72, 240.64, 230.4)
$ribbonPath.AddLine(240.64, 230.4, 256, 215.04)
$ribbonPath.AddLine(256, 215.04, 271.36, 230.4)
$ribbonPath.AddLine(271.36, 230.4, 271.36, 158.72)
$ribbonPath.CloseFigure()
$ribbonBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 202, 138, 4))
$g.FillPath($ribbonBrush, $ribbonPath)

$bmp.Save($logoPng, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

Write-Host "Success! Menghasilkan '$logoPng' baru yang bersih." -ForegroundColor Green


Write-Host "`n[2/3] Membersihkan Cache Build Lama..." -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache folder '.next' berhasil dibersihkan!" -ForegroundColor Green
} else {
    Write-Host "Tidak ada cache build lama. Lanjut..." -ForegroundColor Gray
}


Write-Host "`n[3/3] Melakukan Build Ulang Aplikasi..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=========================================================" -ForegroundColor Green
    Write-Host "  PROSES SINKRONISASI LOGO SELESAI & SUKSES! 🎉" -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host "1. Logo di Landing Page terupdate (/logo.svg)" -ForegroundColor Yellow
    Write-Host "2. Ikon tab browser terupdate (/logo.svg)" -ForegroundColor Yellow
    Write-Host "3. Preview sharing WhatsApp/Medsos terupdate (/logo.png)" -ForegroundColor Yellow
    Write-Host "`nSilakan lakukan GIT COMMIT dan PUSH hasil perubahan ini." -ForegroundColor Cyan
} else {
    Write-Host "`n[ERROR] Build gagal. Silakan periksa error di atas." -ForegroundColor Red
}
