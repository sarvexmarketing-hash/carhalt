/* ==========================================================================
   HALT - ON-DEMAND DRIVER MAP CONTROLLER
   Leaflet live tracking of driver arriving to your location & dispatch
   ========================================================================== */

class MapManager {
  constructor() {
    this.trackingMap = null;
    this.driverNavMap = null;
    this.dispatcherMap = null;
    this.userMarker = null;
    this.driverMarker = null;
    this.routeLine = null;
    this.animationTimer = null;
  }

  // Custom Driver Icon
  createDriverIcon(color = '#0066FF') {
    return L.divIcon({
      className: 'custom-driver-pin',
      html: `
        <div style="
          width: 44px;
          height: 44px;
          background: #0F172A;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0,0,0,0.35);
          border: 3px solid ${color};
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }

  createUserPinIcon() {
    return L.divIcon({
      className: 'user-pin-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 24px;
            height: 24px;
            background: #0066FF;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.35);
            z-index: 2;
          "></div>
          <div style="
            position: absolute;
            width: 48px;
            height: 48px;
            background: rgba(0, 102, 255, 0.2);
            border-radius: 50%;
            animation: pulseWave 1.6s infinite ease-out;
            z-index: 1;
          "></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  initTrackingMap(containerId = 'trackingMap') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.trackingMap) {
      this.trackingMap.remove();
      this.trackingMap = null;
    }

    const state = window.appState.get();
    const userPos = state.selection.pickupCoords || [12.9352, 77.6245];
    const driverStart = [userPos[0] + 0.008, userPos[1] + 0.007];

    this.trackingMap = L.map(containerId, {
      center: userPos,
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.trackingMap);

    // User Marker
    this.userMarker = L.marker(userPos, { icon: this.createUserPinIcon() }).addTo(this.trackingMap);
    this.userMarker.bindPopup('<b>Your Meeting Spot</b><br>' + state.selection.pickupAddress).openPopup();

    // Driver Marker
    this.driverMarker = L.marker(driverStart, { icon: this.createDriverIcon('#0066FF') }).addTo(this.trackingMap);

    // Route Polyline
    this.drawSimulatedRoute(driverStart, userPos);

    const bounds = L.latLngBounds([userPos, driverStart]).pad(0.25);
    this.trackingMap.fitBounds(bounds);

    setTimeout(() => {
      this.trackingMap.invalidateSize();
    }, 200);
  }

  drawSimulatedRoute(from, to) {
    if (this.routeLine) {
      this.trackingMap.removeLayer(this.routeLine);
    }

    const mid1 = [from[0] - (from[0] - to[0]) * 0.4, from[1] - (from[1] - to[1]) * 0.1];
    const mid2 = [from[0] - (from[0] - to[0]) * 0.7, from[1] - (from[1] - to[1]) * 0.6];
    
    const waypoints = [from, mid1, mid2, to];

    this.routeLine = L.polyline(waypoints, {
      color: '#0066FF',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(this.trackingMap);

    this.animateDriverAlongRoute(waypoints);
  }

  animateDriverAlongRoute(points) {
    if (this.animationTimer) clearInterval(this.animationTimer);

    let currentSegment = 0;
    let progress = 0;
    const stepsPerSegment = 50;

    this.animationTimer = setInterval(() => {
      if (currentSegment >= points.length - 1) {
        clearInterval(this.animationTimer);
        window.dispatchEvent(new CustomEvent('driverArrivedAtPickup'));
        return;
      }

      const p1 = points[currentSegment];
      const p2 = points[currentSegment + 1];

      const lat = p1[0] + (p2[0] - p1[0]) * (progress / stepsPerSegment);
      const lng = p1[1] + (p2[1] - p1[1]) * (progress / stepsPerSegment);

      if (this.driverMarker) {
        this.driverMarker.setLatLng([lat, lng]);
      }

      progress++;
      if (progress > stepsPerSegment) {
        progress = 0;
        currentSegment++;
      }
    }, 400);
  }

  initDispatcherMap(containerId = 'dispatcherMap') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.dispatcherMap) {
      this.dispatcherMap.remove();
      this.dispatcherMap = null;
    }

    const center = [16.5062, 80.6480];
    this.dispatcherMap = L.map(containerId, {
      center: center,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.dispatcherMap);

    const state = window.appState.get();
    state.drivers.forEach(driver => {
      const marker = L.marker(driver.currentLocation, {
        icon: this.createDriverIcon(driver.isOnline ? '#10B981' : '#94A3B8')
      }).addTo(this.dispatcherMap);

      marker.bindPopup(`
        <div style="color: #0F172A; font-family: sans-serif; font-size: 13px;">
          <b>${driver.name}</b> (${driver.isOnline ? '🟢 Available' : '⚪ Offline'})<br>
          ${driver.category}<br>
          Rating: ⭐ ${driver.rating} | Trips: ${driver.trips}
        </div>
      `);
    });

    setTimeout(() => {
      this.dispatcherMap.invalidateSize();
    }, 200);
  }

  initDriverNavMap(containerId = 'driverNavMap') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.driverNavMap) {
      this.driverNavMap.remove();
      this.driverNavMap = null;
    }

    const userPos = [16.5015, 80.6534];
    this.driverNavMap = L.map(containerId, {
      center: userPos,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(this.driverNavMap);

    L.marker(userPos, { icon: this.createUserPinIcon() })
      .addTo(this.driverNavMap)
      .bindPopup('<b>Customer Pickup Location</b>');

    setTimeout(() => {
      this.driverNavMap.invalidateSize();
    }, 200);
  }
}

window.mapManager = new MapManager();
