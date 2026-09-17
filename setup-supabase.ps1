# Supabase Setup Script for Library Kiosk System
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Library Kiosk - Supabase Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read current .env
$envPath = ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env first." -ForegroundColor Yellow
    exit 1
}

$envContent = Get-Content $envPath -Raw
Write-Host "Current .env contents:" -ForegroundColor Yellow
Write-Host $envContent
Write-Host ""

# Get Supabase credentials from user
Write-Host "Please enter your Supabase credentials:" -ForegroundColor Green
Write-Host "(Get these from https://supabase.com -> Project Settings -> API)" -ForegroundColor Gray
Write-Host ""

$supabaseUrl = Read-Host "Supabase URL (e.g., https://your-project.supabase.co)"
$anonKey = Read-Host "Supabase ANON Key"
$serviceKey = Read-Host "Supabase SERVICE_KEY"

# Update .env
$envContent = $envContent -replace "SUPABASE_URL=https://your-project.supabase.co", "SUPABASE_URL=$supabaseUrl"
$envContent = $envContent -replace "SUPABASE_ANON_KEY=your-anon-key-here", "SUPABASE_ANON_KEY=$anonKey"
$envContent = $envContent -replace "SUPABASE_SERVICE_KEY=your-service-key-here", "SUPABASE_SERVICE_KEY=$serviceKey"

$envContent | Set-Content $envPath -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  .env updated successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a new Supabase project at https://supabase.com" -ForegroundColor White
Write-Host "2. Go to Project Settings -> API to get your keys" -ForegroundColor White
Write-Host "3. Run database migrations in Supabase SQL Editor:" -ForegroundColor White
Write-Host "   - Copy contents of database/migrations/001_create_tables.sql" -ForegroundColor White
Write-Host "   - Copy contents of database/migrations/002_seed_data.sql" -ForegroundColor White
Write-Host "4. Deploy to production (Render, Railway, or Vercel)" -ForegroundColor White
Write-Host ""
Write-Host "See DEPLOYMENT.md for detailed instructions." -ForegroundColor Yellow
Write-Host ""
