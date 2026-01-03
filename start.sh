#!/bin/bash

# Quick Start Script for Visa Evaluation Tool
# This script sets up and runs both backend and frontend

echo "🚀 Starting Visa Evaluation Tool..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18 or higher from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"

# Backend setup
echo ""
echo -e "${BLUE}📦 Setting up backend...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env created. Please edit backend/.env with your MongoDB URI and Gemini API key${NC}"
fi

# Frontend setup
echo ""
echo -e "${BLUE}📦 Setting up frontend...${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

# Start servers
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Starting servers..."
echo ""
echo -e "${BLUE}Backend:${NC}  http://localhost:4000"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

cd ../backend
npm run dev &
BACKEND_PID=$!

cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
