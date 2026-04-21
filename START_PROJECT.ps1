Write-Host "Starting Projects..." -ForegroundColor Cyan

# 1. Start Backend (NestJS)
Write-Host "Starting Backend (NestJS) on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"

# 2. Start Admin Dashboard (backend-react)
Write-Host "Starting Admin Dashboard (React) on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend-react; npm run dev"

# 3. Start Frontend (Next.js)
Write-Host "Starting Frontend (Next.js) on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll services are starting!" -ForegroundColor Green
Write-Host "Backend (API/Docs): http://localhost:3001/api/docs"
Write-Host "Admin Dashboard:    http://localhost:5173"
Write-Host "Frontend:           http://localhost:3000"
