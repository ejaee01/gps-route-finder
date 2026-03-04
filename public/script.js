/**
 * GPS Route Finder - Frontend JavaScript
 * Handles: Map rendering, GPS tracking, Route finding, Traffic visualization
 */

// Global variables
let map;
let userMarker;
let routeLayer;
let currentLocation = null;
let watchID = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Initialize the application
 */
function initializeApp() {
    // Initialize map
    initializeMap();
    
    // Start GPS tracking
    startGPSTracking();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ App initialized successfully');
}

/**
 * Initialize Leaflet map
 */
function initializeMap() {
    // Create map centered on user location (default to a global center)
    map = L.map('map').setView([20, 0], 3);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);
    
    console.log('🗺️ Map initialized');
}

/**
 * Start real-time GPS tracking
 */
function startGPSTracking() {
    if (!navigator.geolocation) {
        updateGPSStatus('error', 'Geolocation not supported');
        return;
    }
    
    // Get initial location
    navigator.geolocation.getCurrentPosition(
        (position) => {
            handleLocation(position);
            
            // Watch location changes
            watchID = navigator.geolocation.watchPosition(
                handleLocation,
                handleLocationError,
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        },
        handleLocationError
    );
}

/**
 * Handle location updates
 */
function handleLocation(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    currentLocation = { lat, lon };
    
    // Update map
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.circleMarker([lat, lon], {
            radius: 8,
            color: '#1a73e8',
            fillColor: '#1a73e8',
            fillOpacity: 1,
            weight: 3,
            stroke: true
        }).addTo(map);
        
        // Center map on user
        map.setView([lat, lon], 13);
    }
    
    // Add accuracy circle
    L.circle([lat, lon], accuracy, {
        color: 'rgba(26, 115, 232, 0.1)',
        fill: false,
        weight: 1
    }).addTo(map);
    
    // Update location display
    updateLocationDisplay(lat, lon, accuracy);
    
    // Update start location in input
    document.getElementById('start-location').value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    
    // Update GPS status
    updateGPSStatus('active', 'GPS Connected');
}

/**
 * Handle GPS errors
 */
function handleLocationError(error) {
    let message = 'Location error';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'GPS permission denied';
            updateGPSStatus('error', message);
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'GPS unavailable';
            updateGPSStatus('error', message);
            break;
        case error.TIMEOUT:
            message = 'GPS timeout';
            updateGPSStatus('error', message);
            break;
    }
    
    console.warn('⚠️ ' + message);
}

/**
 * Update location display in UI
 */
function updateLocationDisplay(lat, lon, accuracy) {
    const locationElement = document.getElementById('current-location');
    locationElement.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)} (±${accuracy.toFixed(0)}m)`;
}

/**
 * Update GPS status indicator
 */
function updateGPSStatus(status, text) {
    const statusElement = document.getElementById('gps-status');
    const statusText = document.getElementById('status-text');
    
    statusElement.className = 'gps-status ' + status;
    statusText.textContent = text;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    document.getElementById('get-route-btn').addEventListener('click', handleGetRoute);
    document.getElementById('clear-route-btn').addEventListener('click', clearRoute);
    document.getElementById('destination').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGetRoute();
    });
}

/**
 * Handle get route request
 */
async function handleGetRoute() {
    const destination = document.getElementById('destination').value.trim();
    
    if (!destination) {
        alert('Please enter a destination');
        return;
    }
    
    if (!currentLocation) {
        alert('Waiting for GPS location...');
        return;
    }
    
    // Parse destination (could be address or coordinates)
    let destLat, destLon;
    
    if (destination.includes(',')) {
        // Assume coordinates format: lat,lon
        const coords = destination.split(',').map(c => parseFloat(c.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            destLat = coords[0];
            destLon = coords[1];
        } else {
            alert('Invalid coordinates. Use format: latitude,longitude');
            return;
        }
    } else {
        // Try to geocode address using Nominatim (free service)
        const coords = await geocodeAddress(destination);
        if (!coords) {
            alert('Could not find destination. Try using coordinates (lat,lon)');
            return;
        }
        destLat = coords.lat;
        destLon = coords.lon;
    }
    
    // Get routes
    await getAndDisplayRoute(
        currentLocation.lat,
        currentLocation.lon,
        destLat,
        destLon
    );
}

/**
 * Geocode address using Nominatim
 */
async function geocodeAddress(address) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();
        
        if (data.length === 0) return null;
        
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Get route from backend
 */
async function getAndDisplayRoute(lat1, lon1, lat2, lon2) {
    try {
        // Clear previous route
        clearRoute();
        
        // Get route
        const response = await fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat1, lon1, lat2, lon2 })
        });
        
        if (!response.ok) {
            throw new Error('Route request failed');
        }
        
        const routeData = await response.json();
        
        if (!routeData.success) {
            alert('Error: ' + (routeData.error || 'Unknown error'));
            return;
        }
        
        // Get traffic estimate
        const trafficResponse = await fetch('/api/traffic-estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                duration: routeData.duration,
                distance: routeData.distance
            })
        });
        
        const trafficData = await trafficResponse.json();
        
        // Display route on map
        displayRoute(routeData, trafficData);
        
        // Show route info
        showRouteInfo(routeData, trafficData);
        
    } catch (error) {
        console.error('Error getting route:', error);
        alert('Could not calculate route. Make sure you have internet connection.');
    }
}

/**
 * Display route on map
 */
function displayRoute(routeData, trafficData) {
    const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    
    // Create route layer group if doesn't exist
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }
    
    routeLayer = L.featureGroup();
    
    // Add route line
    const routeLine = L.polyline(coordinates, {
        color: trafficData.color,
        weight: 5,
        opacity: 0.8,
        className: `route-line ${trafficData.traffic_level.toLowerCase()}`
    });
    
    routeLayer.addLayer(routeLine);
    
    // Add destination marker
    const destMarker = L.marker(coordinates[coordinates.length - 1], {
        title: 'Destination',
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        })
    }).bindPopup('📍 Destination');
    
    routeLayer.addLayer(destMarker);
    
    // Add to map
    routeLayer.addTo(map);
    
    // Fit map to route bounds
    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
}

/**
 * Show route information in UI
 */
function showRouteInfo(routeData, trafficData) {
    const routeInfo = document.getElementById('route-info');
    const trafficStatus = document.getElementById('traffic-status');
    const distance = document.getElementById('distance');
    const duration = document.getElementById('duration');
    const speed = document.getElementById('speed');
    
    // Update traffic status color and text
    const trafficClass = trafficData.traffic_level.toLowerCase().replace(' ', '-');
    trafficStatus.className = trafficClass;
    trafficStatus.innerHTML = `🚗 Traffic: <strong>${trafficData.traffic_level}</strong> (${trafficData.speed_kmh} km/h)`;
    
    // Update statistics
    distance.textContent = trafficData.distance_km + ' km';
    duration.textContent = trafficData.duration_minutes + ' min';
    speed.textContent = trafficData.speed_kmh + ' km/h';
    
    // Show route info section
    routeInfo.classList.remove('hidden');
}

/**
 * Clear route from map
 */
function clearRoute() {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
    
    document.getElementById('route-info').classList.add('hidden');
    document.getElementById('alternative-routes').classList.add('hidden');
    document.getElementById('destination').value = '';
}

/**
 * Stop GPS tracking (for cleanup)
 */
function stopGPSTracking() {
    if (watchID) {
        navigator.geolocation.clearWatch(watchID);
    }
}

// Clean up on page unload
window.addEventListener('unload', stopGPSTracking);

console.log('🚀 GPS Route Finder loaded and ready!');
