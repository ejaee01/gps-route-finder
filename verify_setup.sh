#!/bin/bash

# GPS Route Finder - Setup Verification Script
# Run this to verify everything is set up correctly

echo "🔍 GPS Route Finder - Setup Verification"
echo "========================================"
echo ""

# Check Python
echo "✓ Checking Python..."
if python3 --version &> /dev/null; then
    echo "  ✅ Python $(python3 --version)"
else
    echo "  ❌ Python not found"
    exit 1
fi

# Check virtual environment
echo ""
echo "✓ Checking virtual environment..."
if [ -d "venv" ]; then
    echo "  ✅ Virtual environment exists"
else
    echo "  ❌ Virtual environment not found"
    echo "  Run: python3 -m venv venv"
    exit 1
fi

# Check dependencies
echo ""
echo "✓ Checking dependencies..."
source venv/bin/activate

for package in flask flask_cors requests; do
    if python -c "import $package" 2>/dev/null; then
        echo "  ✅ $package installed"
    else
        echo "  ❌ $package not installed"
        echo "  Run: pip install Flask Flask-CORS requests"
        exit 1
    fi
done

# Check files
echo ""
echo "✓ Checking project files..."
files=("app.py" "public/index.html" "public/script.js" "public/style.css" "requirements.txt" "README.md")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file missing"
    fi
done

# Test Flask
echo ""
echo "✓ Testing Flask app..."
# Start Flask in background
python app.py &
APP_PID=$!
sleep 2

if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "  ✅ Flask server responding"
    kill $APP_PID 2>/dev/null
else
    echo "  ❌ Flask server not responding"
    kill $APP_PID 2>/dev/null
    exit 1
fi

echo ""
echo "========================================"
echo "✅ All checks passed!"
echo ""
echo "🚀 To start the app, run:"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "📍 Then open: http://localhost:5000"
echo ""
