#!/bin/bash

echo "==================================="
echo "3D Store Visualizer - Quick Start"
echo "==================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
VITE_SHOPIFY_API_KEY=test_key_12345
VITE_API_URL=http://localhost:5000
EOF
    echo ".env file created!"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting development server..."
echo ""
echo "Once the server starts, click 'Test 3D Viewer' button!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
