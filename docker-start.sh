#!/bin/bash

# Premier ERP System Docker Startup Script

set -e

echo "🚀 Starting Premier ERP System with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing."
    echo "   At minimum, set a secure POSTGRES_PASSWORD."
    read -p "Press Enter to continue after editing .env file..."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p backups

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Show logs for the first few seconds
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Premier ERP System is starting up!"
echo "🌐 Application will be available at: http://localhost:5000"
echo "🗄️  Database is available at: localhost:5432"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo "🧹 To clean up: docker-compose down -v"