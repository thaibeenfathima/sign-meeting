#!/bin/bash

echo "🚀 Starting Multilingual Video Call App"
echo ""

echo "📋 Checking Node.js version..."
node --version
echo ""

echo "📦 Installing dependencies..."
npm run install:all
echo ""

echo "🗄️ Starting MongoDB (if needed)..."
echo "Please ensure MongoDB is running on localhost:27017"
echo "Or update MONGODB_URI in backend/.env to use MongoDB Atlas"
echo ""

echo "🔑 Configuration Check..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Creating backend/.env from example..."
    cp "backend/env.example" "backend/.env" 2>/dev/null || echo "Please create backend/.env manually"
    echo "✅ Created backend/.env - Please add your API keys!"
else
    echo "✅ Backend .env file exists"
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Creating frontend/.env from example..."
    cp "frontend/env.example" "frontend/.env" 2>/dev/null || echo "Please create frontend/.env manually"
    echo "✅ Created frontend/.env"
else
    echo "✅ Frontend .env file exists"
fi

echo ""
echo "🧪 Running demo test..."
npm run demo
echo ""

echo "🌐 Starting development servers..."
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API will be available at: http://localhost:5000"
echo ""

echo "Press Ctrl+C to stop the servers"
npm run dev
