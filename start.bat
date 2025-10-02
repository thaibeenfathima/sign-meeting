@echo off
echo 🚀 Starting Multilingual Video Call App
echo.

echo 📋 Checking Node.js version...
node --version
echo.

echo 📦 Installing dependencies...
call npm run install:all
echo.

echo 🗄️ Starting MongoDB (if needed)...
echo Please ensure MongoDB is running on localhost:27017
echo Or update MONGODB_URI in backend/.env to use MongoDB Atlas
echo.

echo 🔑 Configuration Check...
if not exist "backend\.env" (
    echo ⚠️  Creating backend/.env from example...
    copy "backend\env.example" "backend\.env" >nul 2>&1
    echo ✅ Created backend/.env - Please add your API keys!
) else (
    echo ✅ Backend .env file exists
)

if not exist "frontend\.env" (
    echo ⚠️  Creating frontend/.env from example...
    copy "frontend\env.example" "frontend\.env" >nul 2>&1
    echo ✅ Created frontend/.env
) else (
    echo ✅ Frontend .env file exists
)

echo.
echo 🧪 Running demo test...
call npm run demo
echo.

echo 🌐 Starting development servers...
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:5000
echo.

echo Press Ctrl+C to stop the servers
call npm run dev
