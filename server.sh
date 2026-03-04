#!/bin/bash
# GPS Route Finder - Start/Stop Server Script

if [ "$1" = "start" ]; then
    echo "🚀 Starting GPS Route Finder..."
    cd "$(dirname "$0")"
    source venv/bin/activate
    python app.py
    
elif [ "$1" = "stop" ]; then
    echo "🛑 Stopping GPS Route Finder..."
    pkill -f "python app.py"
    echo "✅ Server stopped"
    
elif [ "$1" = "restart" ]; then
    echo "🔄 Restarting GPS Route Finder..."
    pkill -f "python app.py"
    sleep 1
    cd "$(dirname "$0")"
    source venv/bin/activate
    python app.py &
    sleep 2
    echo "✅ Server restarted at http://localhost:5000"
    
elif [ "$1" = "status" ]; then
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo "✅ Server is running at http://localhost:5000"
    else
        echo "❌ Server is not running"
    fi
    
else
    echo "GPS Route Finder - Server Manager"
    echo "=================================="
    echo ""
    echo "Usage: ./server.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start the server"
    echo "  stop        - Stop the server"
    echo "  restart     - Restart the server"
    echo "  status      - Check if server is running"
    echo ""
    echo "Examples:"
    echo "  ./server.sh start"
    echo "  ./server.sh stop"
    echo "  ./server.sh status"
    echo ""
fi
