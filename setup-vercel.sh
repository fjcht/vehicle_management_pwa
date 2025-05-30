
#!/bin/bash

# Vehicle Management PWA - Vercel Setup Script
# This script helps prepare the project for Vercel deployment

echo "🚗 Vehicle Management PWA - Vercel Setup"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the project root directory."
    exit 1
fi

# Create .env file in app directory if it doesn't exist
if [ ! -f "app/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example app/.env
    echo "✅ Created app/.env file"
    echo "⚠️  Please edit app/.env and fill in your actual values:"
    echo "   - DATABASE_URL: Your PostgreSQL connection string"
    echo "   - NEXTAUTH_SECRET: Generate with: openssl rand -base64 32"
    echo "   - NEXTAUTH_URL: Your application URL (http://localhost:3000 for local dev)"
else
    echo "ℹ️  app/.env file already exists"
fi

# Navigate to app directory
cd app

# Install dependencies
echo "📦 Installing dependencies..."
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check if database is accessible (optional)
echo "🔍 Checking database connection..."
if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "⚠️  Database connection failed. Please check your DATABASE_URL in app/.env"
    echo "   This is normal if you haven't set up your database yet."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit app/.env with your actual database and auth configuration"
echo "2. For local development: cd app && yarn dev"
echo "3. For Vercel deployment: Follow the README_DEPLOYMENT_VERCEL.md guide"
echo ""
echo "📚 Documentation:"
echo "   - Deployment Guide: README_DEPLOYMENT_VERCEL.md"
echo "   - Environment Variables: .env.example"
echo ""
