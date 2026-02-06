#!/bin/bash

# HN Job Board - Quick Start Script

echo "🚀 HN Job Board Backend Setup"
echo "=============================="

# Check Python version
echo "Checking Python version..."
python3 --version

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
else
    echo "✅ .env file exists"
fi

echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials and API keys"
echo "2. Create PostgreSQL database: createdb hn_job_board"
echo "3. Run the application: python main.py"
echo ""
echo "Or use uvicorn: uvicorn main:application --reload"
echo ""
echo "API Documentation: http://localhost:8000/docs"
echo "=============================="
