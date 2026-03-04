# 🗺️ GPS Route Finder - Real-time Traffic & Location Tracking

A fully functional, free GPS routing application that finds the fastest route including real-time traffic analysis and your live location tracking.

## ✨ Features

✅ **Real GPS Tracking** - Uses your device's geolocation for real-time location updates
✅ **Smart Route Finding** - Uses OSRM (Open Source Routing Machine) for optimal routes
✅ **Traffic Analysis** - Estimates traffic conditions based on travel speed
✅ **Live Updates** - Continuous GPS location monitoring with accuracy display
✅ **Alternative Routes** - Shows multiple route options
✅ **Beautiful Map** - Interactive Leaflet.js map with multiple providers
✅ **Completely Free** - No API keys needed, all services are open source
✅ **Works Anywhere** - Supports coordinates (lat,lon) and address search

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the App

```bash
python app.py
```

The app will start at `http://localhost:5000`

### 3. Open in Browser

Open your browser and navigate to:
```
http://localhost:5000
```

You'll need to grant GPS permissions when prompted.

## 📍 How to Use

1. **Allow GPS Access**: Click "Allow" when the browser asks for location permission
2. **See Your Location**: Your current GPS position appears with accuracy circle
3. **Enter Destination**: 
   - Type an address (e.g., "Eiffel Tower, Paris")
   - Or use coordinates (e.g., "48.8584, 2.2945")
4. **Get Route**: Click the "Get Route" button
5. **View Details**:
   - Distance in km
   - Estimated time
   - Average speed
   - Traffic color code (Green = Light, Yellow = Moderate, Orange = Heavy, Red = Very Heavy)
6. **Track Movement**: Your location updates in real-time as you move

## 🔑 Technology Stack

**Backend:**
- Python Flask - Web server
- OSRM API - Route calculation (free, open source)
- Nominatim API - Address geocoding (free)

**Frontend:**
- Leaflet.js - Interactive mapping
- OpenStreetMap - Map tiles
- Browser Geolocation API - Real GPS tracking

## 📊 Route Information

The app provides:
- **Distance**: Total route distance in kilometers
- **Duration**: Estimated travel time in minutes
- **Speed**: Average speed along the route in km/h
- **Traffic Level**: Real-time assessment based on routing data
- **Color Coding**:
  - 🟢 **Green**: Light traffic (>80 km/h)
  - 🟡 **Yellow**: Moderate traffic (50-80 km/h)
  - 🟠 **Orange**: Heavy traffic (20-50 km/h)
  - 🔴 **Red**: Very heavy traffic (<20 km/h)

## 🌍 Testing Coordinates

Try these coordinates:

**New York to Boston:**
- Start: 40.7128, -74.0060
- End: 42.3601, -71.0589

**London to Paris:**
- Start: 51.5074, -0.1278
- End: 48.8566, 2.3522

**San Francisco to Los Angeles:**
- Start: 37.7749, -122.4194
- End: 34.0522, -118.2437

## 🛡️ Privacy & Security

- ✅ No data is collected or stored
- ✅ GPS data only used locally in your browser
- ✅ All APIs are public and free
- ✅ No authentication required
- ✅ Can run completely offline (after first load) if you have cached map tiles

## ⚙️ Configuration

Modify in `app.py`:
- OSRM endpoint (default: public instance)
- Map zoom level
- Route calculation parameters

Modify in `public/script.js`:
- GPS accuracy settings
- Map tile provider
- Default map center

## 🐛 Troubleshooting

**GPS not working?**
- Check browser location permissions
- Make sure you're using HTTPS or localhost
- Try refreshing the page
- Use demo coordinates instead

**Route not found?**
- Ensure coordinates are valid (lat between -90 to 90, lon between -180 to 180)
- Try with different coordinates
- Check internet connection

**Map not loading?**
- Clear browser cache
- Try a different browser
- Check internet connection

## 📚 API Documentation

### GET /

Serves the main HTML page.

### POST /api/route

Get a route between two points.

**Request:**
```json
{
  "lat1": 40.7128,
  "lon1": -74.0060,
  "lat2": 42.3601,
  "lon2": -71.0589
}
```

**Response:**
```json
{
  "geometry": { ... },
  "distance": 306000,
  "duration": 13200,
  "success": true
}
```

### POST /api/traffic-estimate

Estimate traffic conditions for a route.

**Request:**
```json
{
  "duration": 13200,
  "distance": 306000
}
```

**Response:**
```json
{
  "traffic_level": "Light",
  "color": "green",
  "speed_kmh": 83.5,
  "duration_minutes": 220.0,
  "distance_km": 306.0
}
```

## 🚀 Deployment

To deploy to a server:

1. Install Python and dependencies
2. Update Flask debug to False in app.py
3. Use a production WSGI server (gunicorn, uWSGI)
4. Set up a reverse proxy (nginx, Apache)
5. Enable HTTPS (required for Geolocation API in production)

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## 📄 License

Open source and free to use, modify, and distribute.

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest features
- Submit improvements
- Share feedback

## ❓ FAQ

**Q: Does this work offline?**
A: The map will work after first load, but route calculation requires internet.

**Q: Can I use this as a navigation app?**
A: Yes! It shows distance, time, and traffic. For turn-by-turn directions, integrate with additional services.

**Q: What's the accuracy of traffic estimates?**
A: Based on routing data speeds. More accurate with historical traffic patterns.

**Q: Can I save routes?**
A: Currently not, but you can add localStorage to save routines.

---

Made with ❤️ for GPS enthusiasts and developers

**Questions?** Check the code comments or improve the app yourself! 🚀
