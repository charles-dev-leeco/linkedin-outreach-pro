#!/bin/bash

echo "🚀 Installing LinkedIn Outreach Pro..."
echo ""

# Check Node.js version
required_version="18.0.0"
current_version=$(node -v | sed 's/v//')

if [ "$(printf '%s\n' "$required_version" "$current_version" | sort -V | head -n1)" != "$required_version" ]; then 
    echo "❌ Node.js version $required_version or higher is required"
    echo "Current version: $current_version"
    exit 1
fi

echo "✅ Node.js version check passed"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo ""

# Install API dependencies
echo "📦 Installing API dependencies..."
cd apps/api
npm install
cd ../..
echo ""

# Install Web dependencies
echo "📦 Installing Web dependencies..."
cd apps/web
npm install
cd ../..
echo ""

# Install Extension dependencies
echo "📦 Installing Extension dependencies..."
cd apps/extension
npm install
cd ../..
echo ""

echo "✅ All dependencies installed!"
echo ""

# Check for .env file
if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env"
    echo "⚠️  Please update it with your Azure OpenAI and Google Sheets credentials"
    echo ""
fi

# Build extension
echo "🔨 Building Chrome extension..."
cd apps/extension
npm run build
cd ../..
echo ""

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Update apps/api/.env with your credentials"
echo "2. Setup Google Sheets (see QUICKSTART.md)"
echo "3. Run 'npm run api' in one terminal"
echo "4. Run 'npm run web' in another terminal"
echo "5. Load the extension from apps/extension/dist"
echo ""
echo "📖 See QUICKSTART.md for detailed setup instructions"
