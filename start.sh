#!/bin/bash
set -e

echo "╔═══════════════════════════════════╗"
echo "║         NEXORY  v1.0.0            ║"
echo "║   Developer Command Center        ║"
echo "╚═══════════════════════════════════╝"
echo ""

# Backend
echo "→ Setting up backend..."
cd backend
npm install --silent
npx prisma generate
npx prisma db push        # pushes schema to Supabase
node src/utils/seed.js
echo "✓ Backend ready"

# Start backend
npm run dev &
BACKEND_PID=$!
cd ..

# Frontend
echo "→ Setting up frontend..."
cd frontend
npm install --silent
echo "✓ Frontend ready"

echo ""
echo "✅ NEXORY is running!"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:3001"
echo "   Login    → demo@nexory.dev / nexory2024"
echo ""

npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'NEXORY stopped.'; exit" SIGINT SIGTERM

wait
