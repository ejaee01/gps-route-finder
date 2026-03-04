"""
GPS Route Finder with Live Traffic & Location Tracking
Uses OSRM (Open Source Routing Machine) for routing
Uses Browser's Geolocation API for real-time location tracking
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import requests
import math

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# OSRM API endpoints (free, no API key required)
OSRM_ROUTE = "https://router.project-osrm.org/route/v1/driving/"
OSRM_MATCH = "https://router.project-osrm.org/match/v1/driving/"

@app.route('/')
def index():
    """Serve the main HTML page"""
    return app.send_static_file('index.html')

@app.route('/api/route', methods=['POST'])
def get_route():
    """
    Get route from start to destination
    Params: lat1, lon1, lat2, lon2
    Returns: route geometry, distance, duration, etc.
    """
    try:
        data = request.json
        lat1, lon1 = data.get('lat1'), data.get('lon1')
        lat2, lon2 = data.get('lat2'), data.get('lon2')
        
        if not all([lat1, lon1, lat2, lon2]):
            return jsonify({'error': 'Missing coordinates'}), 400
        
        # Build OSRM request (lon,lat format)
        url = f"{OSRM_ROUTE}{lon1},{lat1};{lon2},{lat2}"
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'steps': 'true',
            'annotations': 'duration,distance'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') != 'Ok':
            return jsonify({'error': f"Routing error: {data.get('code')}"}), 400
        
        route = data['routes'][0]
        
        return jsonify({
            'geometry': route['geometry'],
            'distance': route['distance'],  # meters
            'duration': route['duration'],   # seconds
            'legs': route['legs'],
            'success': True
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/traffic-estimate', methods=['POST'])
def traffic_estimate():
    """
    Estimate travel time based on OSRM with detailed ETA breakdown
    Returns: traffic level, speed, arrival time, and time breakdown
    """
    try:
        data = request.json
        duration = data.get('duration', 0)  # in seconds
        distance = data.get('distance', 0)  # in meters
        departure_time = data.get('departure_time')  # optional: unix timestamp
        
        if distance == 0:
            return jsonify({'error': 'Invalid distance'}), 400
        
        # Calculate speed
        speed_ms = distance / duration if duration > 0 else 0
        speed_kmh = speed_ms * 3.6
        
        # Traffic categorization
        if speed_kmh > 80:
            traffic_level = "Light"
            color = "green"
            icon = "🟢"
        elif speed_kmh > 50:
            traffic_level = "Moderate"
            color = "yellow"
            icon = "🟡"
        elif speed_kmh > 20:
            traffic_level = "Heavy"
            color = "orange"
            icon = "🟠"
        else:
            traffic_level = "Very Heavy"
            color = "red"
            icon = "🔴"
        
        # Calculate arrival time
        import time as time_module
        now = departure_time if departure_time else time_module.time()
        arrival_time = now + duration
        
        # Format time breakdown (HH:MM:SS)
        hours = int(duration // 3600)
        minutes = int((duration % 3600) // 60)
        seconds = int(duration % 60)
        
        return jsonify({
            'traffic_level': traffic_level,
            'color': color,
            'icon': icon,
            'speed_kmh': round(speed_kmh, 1),
            'duration_seconds': int(duration),
            'duration_minutes': round(duration / 60, 1),
            'duration_formatted': f"{hours}h {minutes}m {seconds}s" if hours > 0 else f"{minutes}m {seconds}s",
            'distance_km': round(distance / 1000, 2),
            'arrival_time': int(arrival_time),
            'speed_category': 'Very Heavy' if speed_kmh < 20 else 'Heavy' if speed_kmh < 50 else 'Moderate' if speed_kmh < 80 else 'Light'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/nearby-routes', methods=['POST'])
def nearby_routes():
    """
    Find multiple route options
    Returns 3 route alternatives
    """
    try:
        data = request.json
        lat1, lon1 = data.get('lat1'), data.get('lon1')
        lat2, lon2 = data.get('lat2'), data.get('lon2')
        
        if not all([lat1, lon1, lat2, lon2]):
            return jsonify({'error': 'Missing coordinates'}), 400
        
        # OSRM can return alternatives with alternatives=2
        url = f"{OSRM_ROUTE}{lon1},{lat1};{lon2},{lat2}"
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'alternatives': 'true'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') != 'Ok':
            return jsonify({'error': f"Routing error: {data.get('code')}"}), 400
        
        routes = []
        for route in data['routes'][:3]:  # Max 3 routes
            routes.append({
                'geometry': route['geometry'],
                'distance': route['distance'],
                'duration': route['duration'],
            })
        
        return jsonify({
            'routes': routes,
            'success': True
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    import os
    
    # Production vs Development settings
    is_production = os.environ.get('RENDER') is not None or os.environ.get('HEROKU') is not None
    debug_mode = not is_production
    port = int(os.environ.get('PORT', 5000))
    
    print("GPS Route Finder starting...")
    print(f"Environment: {'Production' if is_production else 'Development'}")
    print(f"Port: {port}")
    print("Uses OSRM (free, open-source routing)")
    
    if debug_mode:
        print("Debug mode: ON")
    
    app.run(
        host='0.0.0.0',  # Listen on all interfaces
        port=port,
        debug=debug_mode,
        use_reloader=debug_mode
    )
