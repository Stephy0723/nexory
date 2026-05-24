# NEXORY Startup Script (Windows PowerShell)

Write-Host "╔═══════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         NEXORY  v1.0.0            ║" -ForegroundColor Cyan
Write-Host "║   Developer Command Center        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Backend setup
Write-Host "→ Setting up backend..." -ForegroundColor Yellow
Set-Location backend
npm install --silent
npx prisma generate
npx prisma db push --accept-data-loss
node src/utils/seed.js
Write-Host "✓ Backend ready" -ForegroundColor Green

# Start backend
$backend = Start-Process node -ArgumentList "src/app.js" -PassThru -NoNewWindow
Set-Location ..

# Frontend setup
Write-Host "→ Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install --silent
Write-Host "✓ Frontend ready" -ForegroundColor Green

Write-Host ""
Write-Host "✅ NEXORY is running!" -ForegroundColor Green
Write-Host "   Frontend → http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend  → http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Login    → demo@nexory.dev / nexory2024" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

# Start frontend (blocking)
npm run dev

$backend.Kill()
