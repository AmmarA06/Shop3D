@echo off
echo ===================================
echo 3D Store Visualizer - Quick Start
echo ===================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    (
        echo VITE_SHOPIFY_API_KEY=test_key_12345
        echo VITE_API_URL=http://localhost:5000
    ) > .env
    echo .env file created!
    echo.
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting development server...
echo.
echo Once the server starts, click "Test 3D Viewer" button!
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
