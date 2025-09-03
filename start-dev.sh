#!/bin/bash

# Web Scraper Dashboard Development Startup Script

echo "🚀 Starting Web Scraper Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if concurrently is installed
if ! npm list concurrently &> /dev/null; then
    echo "📦 Installing concurrently..."
    npm install --save-dev concurrently
fi

echo "✅ Starting development servers..."
echo "🌐 Next.js app will be available at: http://localhost:3000"
echo "🔌 Socket.IO server will be available at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers using concurrently
npm run dev:full
