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
let routeUpdateInterval = null;
let currentRoute = null;  // Store current route for live updates

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing app...');
    
    // Initialize map FIRST (don't wait for GPS)
    initializeMap();
    console.log('Map initialized');
    
    // Set up event listeners
    setupEventListeners();
    console.log('Event listeners set up');
    
    // Start GPS tracking in background (non-blocking)
    startGPSTracking();
    
    // Timeout: If no GPS after 5 seconds, allow manual entry
    setTimeout(() => {
        if (!currentLocation) {
            console.warn('GPS not available after 5 seconds');
            updateGPSStatus('error', 'GPS not available - Enter coordinates manually');
            enableManualLocation();
        }
    }, 5000);
    
    console.log('App initialized successfully');
}

/**
 * Initialize Leaflet map
 */
function initializeMap() {
    // Create map centered on user location (default to a global center)
    map = L.map('map').setView([20, 0], 3);
    
    // Add English-only CartoDB map tiles (better language support)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/positron/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB, © OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 2,
        language: 'en'
    }).addTo(map);
    
    console.log('🗺️ Map initialized');
}

/**
 * Start real-time GPS tracking
 */
function startGPSTracking() {
    if (!navigator.geolocation) {
        console.warn('Geolocation not available');
        enableManualLocation();
        return;
    }
    
    console.log('Requesting GPS location...');
    updateGPSStatus('error', 'Requesting GPS permission...');
    
    // Get initial location with timeout handling
    const gpsOptions = {
        enableHighAccuracy: false,  // Faster on many devices
        timeout: 8000,              // 8 second timeout
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('GPS location obtained:', position.coords.latitude, position.coords.longitude);
            handleLocation(position);
            updateGPSStatus('active', 'GPS Connected - Getting live updates');
            
            // Watch location changes
            watchID = navigator.geolocation.watchPosition(
                handleLocation,
                (error) => {
                    console.warn('Watch position error:', error);
                    handleLocationError(error);
                },
                gpsOptions
            );
        },
        (error) => {
            console.warn('GPS error on getCurrentPosition:', error.code, error.message);
            handleLocationError(error);
            enableManualLocation();
        },
        gpsOptions
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
    let details = '';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'GPS Permission Denied';
            details = 'Please enable location access in browser settings';
            updateGPSStatus('error', message);
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'GPS Unavailable';
            details = 'Location services not available. Try entering coordinates manually';
            updateGPSStatus('error', message);
            break;
        case error.TIMEOUT:
            message = 'GPS Timeout';
            details = 'Took too long to get location. Try again or enter coordinates';
            updateGPSStatus('error', message);
            break;
    }
    
    console.warn('GPS Error: ' + message + ' - ' + details);
}

/**
 * Update location display in UI
 */
function updateLocationDisplay(lat, lon, accuracy) {
    const locationElement = document.getElementById('current-location');
    const accuracyLevel = accuracy < 10 ? 'Very Good' : accuracy < 50 ? 'Good' : 'Fair';
    locationElement.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}\nAccuracy: ${accuracy.toFixed(0)} meters (${accuracyLevel})`;
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
function handleGetRoute() {
    const destination = document.getElementById('destination').value.trim();
    const startInput = document.getElementById('start-location').value.trim();
    
    if (!destination) {
        alert('Please enter a destination');
        return;
    }
    
    // Use current location or parse manual entry
    let lat1, lon1;
    
    if (currentLocation) {
        lat1 = currentLocation.lat;
        lon1 = currentLocation.lon;
    } else if (startInput) {
        // Parse manual location entry
        if (startInput.includes(',')) {
            const coords = startInput.split(',').map(c => parseFloat(c.trim()));
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                lat1 = coords[0];
                lon1 = coords[1];
            } else {
                alert('Invalid start location format. Use: latitude,longitude');
                return;
            }
        } else {
            alert('Start location not available. Allow GPS or enter coordinates.');
            return;
        }
    } else {
        alert('Waiting for GPS location or enter start location manually');
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
        
        // Get traffic estimate with current time for accurate arrival calculation
        const trafficResponse = await fetch('/api/traffic-estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                duration: routeData.duration,
                distance: routeData.distance,
                departure_time: Math.floor(Date.now() / 1000)
            })
        });
        
        const trafficData = await trafficResponse.json();
        
        // Store route for live updates
        currentRoute = routeData;
        
        // Display route on map
        displayRoute(routeData, trafficData);
        
        // Show route info
        showRouteInfo(routeData, trafficData);
        
        // Start live traffic updates every 10 seconds
        startLiveUpdates();
        
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
        }).bindPopup('Destination Location');

/**
 * Show route information in UI
 */
function showRouteInfo(routeData, trafficData) {
    const routeInfo = document.getElementById('route-info');
    const trafficStatus = document.getElementById('traffic-status');
    const distance = document.getElementById('distance');
    const duration = document.getElementById('duration');
    const speed = document.getElementById('speed');
    
    // Calculate and format arrival time
    const now = new Date();
    const arrivalMs = now.getTime() + (trafficData.duration_seconds * 1000);
    const arrivalTime = new Date(arrivalMs);
    const arrivalFormatted = arrivalTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Update traffic status color and text
    const trafficClass = trafficData.traffic_level.toLowerCase().replace(' ', '-');
    trafficStatus.className = trafficClass;
    trafficStatus.innerHTML = `${trafficData.icon} Traffic: <strong>${trafficData.traffic_level}</strong><br>Speed: ${trafficData.speed_kmh} km/h<br>Arrive by: <strong>${arrivalFormatted}</strong>`;
    
    // Update statistics with better formatting
    distance.textContent = trafficData.distance_km + ' km';
    duration.textContent = trafficData.duration_formatted;
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
    
    // Stop live updates
    if (routeUpdateInterval) {
        clearInterval(routeUpdateInterval);
        routeUpdateInterval = null;
    }
    
    currentRoute = null;
    document.getElementById('route-info').classList.add('hidden');
    document.getElementById('alternative-routes').classList.add('hidden');
    document.getElementById('destination').value = '';
}

/**
 * Update traffic and ETA every 10 seconds
 */
function startLiveUpdates() {
    // Clear any existing interval
    if (routeUpdateInterval) {
        clearInterval(routeUpdateInterval);
    }
    
    // Update every 10 seconds
    routeUpdateInterval = setInterval(async () => {
        if (!currentRoute) return;
        
        try {
            const trafficResponse = await fetch('/api/traffic-estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration: currentRoute.duration,
                    distance: currentRoute.distance,
                    departure_time: Math.floor(Date.now() / 1000)
                })
            });
            
            const trafficData = await trafficResponse.json();
            
            // Update the display without recalculating route
            updateTrafficDisplay(trafficData);
            
        } catch (error) {
            console.warn('Live update error:', error);
        }
    }, 10000);  // 10 seconds
}

/**
 * Update traffic display (without recalculating route)
 */
function updateTrafficDisplay(trafficData) {
    const trafficStatus = document.getElementById('traffic-status');
    const duration = document.getElementById('duration');
    
    if (!trafficStatus) return;
    
    // Calculate arrival time
    const now = new Date();
    const arrivalMs = now.getTime() + (trafficData.duration_seconds * 1000);
    const arrivalTime = new Date(arrivalMs);
    const arrivalFormatted = arrivalTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Update traffic status with new arrival time
    const trafficClass = trafficData.traffic_level.toLowerCase().replace(' ', '-');
    trafficStatus.className = trafficClass;
    trafficStatus.innerHTML = `${trafficData.icon} Traffic: <strong>${trafficData.traffic_level}</strong><br>Speed: ${trafficData.speed_kmh} km/h<br>Arrive by: <strong>${arrivalFormatted}</strong>`;
    
    // Update duration
    duration.textContent = trafficData.duration_formatted;
}

/**
 * Allow manual location entry when GPS fails
 */
function enableManualLocation() {
    const startLocation = document.getElementById('start-location');
    if (startLocation) {
        startLocation.readOnly = false;
        startLocation.placeholder = 'Enter your location (lat,lon) or address';
        startLocation.value = '';
    }
}

// Clean up on page unload
window.addEventListener('unload', () => {
    stopGPSTracking();
    if (routeUpdateInterval) clearInterval(routeUpdateInterval);
});

console.log('GPS Route Finder loaded and ready!');
console.log('Live traffic updates: Every 10 seconds');
