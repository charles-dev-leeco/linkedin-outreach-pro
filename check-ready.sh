#!/bin/bash

echo "🔍 LinkedIn Outreach Pro - Readiness Check"
echo "=========================================="
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node -v) installed"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run from project root"
    exit 1
fi

# Check dependencies
if [ -d "node_modules" ]; then
    echo "✅ Root dependencies installed"
else
    echo "❌ Root dependencies missing - run: npm install"
fi

if [ -d "apps/api/node_modules" ]; then
    echo "✅ API dependencies installed"
else
    echo "❌ API dependencies missing"
fi

if [ -d "apps/web/node_modules" ]; then
    echo "✅ Web dependencies installed"
else
    echo "❌ Web dependencies missing"
fi

if [ -d "apps/extension/node_modules" ]; then
    echo "✅ Extension dependencies installed"
else
    echo "❌ Extension dependencies missing"
fi

# Check extension build
if [ -f "apps/extension/dist/manifest.json" ]; then
    echo "✅ Extension built"
else
    echo "❌ Extension not built - run: cd apps/extension && npm run build"
fi

echo ""
echo "📋 Configuration Check:"
echo "----------------------"

# Check .env file
if [ -f "apps/api/.env" ]; then
    echo "✅ .env file exists"
    
    if grep -q "GOOGLE_AI_API_KEY=your" apps/api/.env; then
        echo "⚠️  Google AI API key needs to be added"
    elif grep -q "GOOGLE_AI_API_KEY=" apps/api/.env; then
        echo "✅ Google AI API key configured"
    else
        echo "⚠️  Google AI API key missing"
    fi
    
    if grep -q "GOOGLE_SHEETS_MASTER_SHEET_ID=" apps/api/.env; then
        echo "✅ Google Sheets ID configured"
    else
        echo "⚠️  Google Sheets ID missing"
    fi
else
    echo "❌ .env file missing - copy from .env.example"
fi

# Check credentials
if [ -f "apps/api/credentials.json" ]; then
    echo "✅ Google Sheets credentials found"
else
    echo "⚠️  Google Sheets credentials missing"
    echo "   Get from: https://console.cloud.google.com/"
fi

echo ""
echo "📊 Summary:"
echo "----------"

READY=true

if [ ! -f "apps/api/.env" ]; then
    echo "❌ Need: .env file"
    READY=false
fi

if grep -q "GOOGLE_AI_API_KEY=your" apps/api/.env 2>/dev/null || ! grep -q "GOOGLE_AI_API_KEY=" apps/api/.env 2>/dev/null; then
    echo "❌ Need: Google AI API Key"
    READY=false
fi

if [ ! -f "apps/api/credentials.json" ]; then
    echo "❌ Need: Google Sheets credentials"
    READY=false
fi

if [ "$READY" = true ]; then
    echo ""
    echo "✅ ✅ ✅ READY TO LAUNCH! ✅ ✅ ✅"
    echo ""
    echo "Run these commands:"
    echo "  Terminal 1: npm run api"
    echo "  Terminal 2: npm run web"
    echo "  Chrome: Load apps/extension/dist/"
    echo ""
else
    echo ""
    echo "⚠️  Almost ready! See STATUS.md for next steps"
    echo ""
fi
