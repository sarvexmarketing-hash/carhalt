/* ==========================================================================
   DRIVERBEE - OPERATIONS & FLEET ADMIN COMMAND CENTER
   Real-time visibility across all bookings, places-to-places routes, drivers, and users
   ========================================================================== */

class AdminController {
  constructor() {
    this.adminMap = null;
    this.driverMarkers = [];
    this.routeLayers = [];
    this.eventsList = [
      { time: '12:45 PM', text: 'Javed Sayed booked Rajesh Kumar for 4h drive (Benz Circle ➡️ Airport)', type: 'accent' },
      { time: '12:46 PM', text: 'Rajesh Kumar accepted duty REQ-8492', type: 'success' },
      { time: '12:52 PM', text: 'Security OTP verified (8492) - Drive active', type: 'success' },
      { time: '01:10 PM', text: 'Anita Sharma dispatched Outstation ride to Guntur Highway', type: 'accent' },
      { time: '01:11 PM', text: 'Amit Sharma assigned to Mercedes-Benz C-Class', type: 'success' }
    ];
    this.init();
  }

  init() {
    this.bindTabs();
    this.renderKPIs();
    this.renderBookingsTable();
    this.renderDriversTable();
    this.renderUsersTable();
    this.populatePricingInputs();
    this.renderLiveEventFeed();

    // Auto-sync live across tabs when customer or driver acts
    window.appState.subscribe(() => {
      this.renderKPIs();
      this.renderBookingsTable();
      this.renderDriversTable();
      this.renderUsersTable();
      this.updateAdminMap();
    });

    // Initialize Map if on radar tab
    setTimeout(() => {
      this.initAdminMap();
    }, 400);
  }

  bindTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display = 'none');

        const targetPane = document.getElementById(`pane_${tab}`);
        if (targetPane) {
          targetPane.style.display = 'block';
          if (tab === 'radarMap') {
            setTimeout(() => {
              if (this.adminMap) {
                this.adminMap.invalidateSize();
              } else {
                this.initAdminMap();
              }
            }, 200);
          }
        }
      });
    });
  }

  renderKPIs() {
    const state = window.appState.get();
    const activeTripsEl = document.getElementById('kpiActiveTrips');
    const totalBookingsEl = document.getElementById('kpiTotalBookings');
    const onlineDriversEl = document.getElementById('kpiOnlineDrivers');
    const grossRevEl = document.getElementById('kpiGrossRevenue');
    const totalUsersEl = document.getElementById('kpiTotalUsers');

    const activeCount = (state.activeBooking && (state.activeBooking.status === 'trip_active' || state.activeBooking.status === 'driver_accepted')) ? 1 : 0;
    const allBookingsCount = (state.allBookings ? state.allBookings.length : 0) + 348;
    const onlineDriversCount = state.drivers.filter(d => d.isOnline).length;
    const usersCount = state.users ? state.users.length : 5;

    let totalGmv = state.stats.totalRevenue || 286900;
    if (state.allBookings) {
      totalGmv = state.allBookings.reduce((sum, b) => sum + (b.totalFare || 600), 284500);
    }

    if (activeTripsEl) activeTripsEl.textContent = activeCount;
    if (totalBookingsEl) totalBookingsEl.textContent = allBookingsCount;
    if (onlineDriversEl) onlineDriversEl.textContent = `${onlineDriversCount} / ${state.drivers.length}`;
    if (grossRevEl) grossRevEl.textContent = `₹${totalGmv.toLocaleString('en-IN')}`;
    if (totalUsersEl) totalUsersEl.textContent = usersCount;
  }

  // Render Master Bookings Table (Places to Places)
  renderBookingsTable() {
    const tbody = document.getElementById('adminBookingsTableBody');
    if (!tbody) return;

    const state = window.appState.get();
    const searchVal = (document.getElementById('bookingSearchInput') ? document.getElementById('bookingSearchInput').value : '').toLowerCase();
    const statusVal = document.getElementById('bookingStatusFilter') ? document.getElementById('bookingStatusFilter').value : 'all';

    let bookings = state.allBookings || [];

    // Ensure active booking is visible at top
    if (state.activeBooking) {
      const activeId = state.activeBooking.id;
      if (!bookings.some(b => b.id === activeId)) {
        bookings = [{
          id: activeId,
          customerId: state.user.id,
          customerName: state.activeBooking.customerName || state.user.name,
          customerPhone: state.user.phone,
          carModel: state.activeBooking.carModel || 'Hyundai Creta (Automatic)',
          driverId: state.activeBooking.driver ? state.activeBooking.driver.id : null,
          driverName: state.activeBooking.driver ? state.activeBooking.driver.name : 'Searching...',
          driverAvatar: state.activeBooking.driver ? state.activeBooking.driver.avatar : 'assets/driverbee-icon.svg',
          pickupAddress: state.activeBooking.pickupAddress || 'Benz Circle, Vijayawada',
          destinationAddress: state.activeBooking.destinationAddress || 'Local Flexible Route',
          durationHours: state.activeBooking.durationHours || 4,
          tripType: state.activeBooking.tripType === 'outside' ? 'Outside City' : 'Within City',
          totalFare: state.activeBooking.fare ? state.activeBooking.fare.total : (state.activeBooking.totalFare || 600),
          driverPayout: state.activeBooking.driverPayout || 480,
          platformRevenue: 120,
          status: state.activeBooking.status || 'trip_active',
          otp: state.activeBooking.otp || '8492',
          createdAt: 'Live Now'
        }, ...bookings];
      }
    }

    if (statusVal !== 'all') {
      bookings = bookings.filter(b => b.status === statusVal);
    }

    if (searchVal) {
      bookings = bookings.filter(b =>
        (b.customerName && b.customerName.toLowerCase().includes(searchVal)) ||
        (b.driverName && b.driverName.toLowerCase().includes(searchVal)) ||
        (b.id && b.id.toLowerCase().includes(searchVal)) ||
        (b.pickupAddress && b.pickupAddress.toLowerCase().includes(searchVal)) ||
        (b.destinationAddress && b.destinationAddress.toLowerCase().includes(searchVal))
      );
    }

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 32px; color: #94A3B8;">No bookings matching search criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      let statusClass = 'status-completed';
      let statusLabel = 'Completed';
      if (b.status === 'trip_active') { statusClass = 'status-active'; statusLabel = '<i class="fa-solid fa-circle-dot fa-fade"></i> Drive Active'; }
      else if (b.status === 'searching') { statusClass = 'status-searching'; statusLabel = '<i class="fa-solid fa-radar fa-spin"></i> Searching'; }
      else if (b.status === 'driver_accepted') { statusClass = 'status-accepted'; statusLabel = '<i class="fa-solid fa-car-side"></i> Driver En Route'; }
      else if (b.status === 'arrived') { statusClass = 'status-accepted'; statusLabel = '📍 Driver Arrived'; }
      else if (b.status === 'cancelled') { statusClass = 'status-cancelled'; statusLabel = 'Cancelled'; }

      const fare = b.totalFare || 600;
      const payout = b.driverPayout || Math.round(fare * 0.8);
      const fee = fare - payout;

      return `
        <tr>
          <td>
            <div style="font-weight: 800; color: #0066FF; font-family: monospace; font-size: 0.95rem;">${b.id}</div>
            <div style="font-size: 0.75rem; color: #64748B;">OTP: <b>${b.otp || '8492'}</b></div>
          </td>

          <td>
            <div style="font-weight: 800; color: #0F172A;">${b.customerName || 'Customer'}</div>
            <div style="font-size: 0.78rem; color: #64748B;">${b.customerPhone || '+91 98765 43210'}</div>
            <div style="font-size: 0.75rem; color: #0284C7; font-weight: 700; margin-top: 2px;">🚗 ${b.carModel || 'Hyundai Creta'}</div>
          </td>

          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${b.driverAvatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #0066FF;">
              <div>
                <div style="font-weight: 800; color: #0F172A;">${b.driverName || 'Unassigned'}</div>
                <div style="font-size: 0.75rem; color: #64748B;">${b.driverId ? 'Assigned Pro' : 'Pending Match'}</div>
              </div>
            </div>
          </td>

          <td>
            <div class="route-places-box">
              <div class="route-point" style="color: #059669;">
                <i class="fa-solid fa-circle-dot" style="font-size: 0.7rem;"></i>
                <span style="font-weight: 700; color: #0F172A;">From: ${b.pickupAddress || 'Benz Circle, Vijayawada'}</span>
              </div>
              <div class="route-point" style="color: #0284C7;">
                <i class="fa-solid fa-location-dot" style="font-size: 0.7rem;"></i>
                <span style="color: #334155; font-weight: 600;">To: ${b.destinationAddress || 'Local Destination / Airport'}</span>
              </div>
            </div>
          </td>

          <td>
            <div style="font-weight: 800; color: #0F172A;">${b.durationHours || 4} Hours Package</div>
            <div style="font-size: 0.75rem; color: #64748B; font-weight: 600;">${b.tripType || 'Within City'}</div>
          </td>

          <td>
            <div style="font-weight: 900; color: #059669; font-size: 1.05rem;">₹${fare.toLocaleString('en-IN')}</div>
            <div style="font-size: 0.72rem; color: #64748B;">Driver: ₹${payout} · Net: ₹${fee}</div>
          </td>

          <td>
            <span class="status-badge-admin ${statusClass}">${statusLabel}</span>
          </td>

          <td style="text-align: right;">
            <div style="display: flex; justify-content: flex-end; gap: 6px;">
              ${b.status === 'trip_active' || b.status === 'searching' || b.status === 'driver_accepted' ? `
                <button onclick="adminCtrl.forceCompleteBooking('${b.id}')" style="background: #DCFCE7; border: 1px solid #86EFAC; color: #15803D; padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; cursor: pointer;" title="Force End">
                  <i class="fa-solid fa-flag-checkered"></i> Complete
                </button>
                <button onclick="adminCtrl.cancelBooking('${b.id}')" style="background: #FEE2E2; border: 1px solid #FCA5A5; color: #B91C1C; padding: 6px 10px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; cursor: pointer;" title="Cancel Booking">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              ` : `
                <button onclick="showToast('Booking ${b.id} archived receipt', 'accent')" style="background: #F1F5F9; border: 1px solid #E2E8F0; color: #475569; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; cursor: pointer;">
                  <i class="fa-solid fa-file-invoice"></i> Receipt
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterBookingsTable() {
    this.renderBookingsTable();
  }

  // Render Drivers Fleet Table
  renderDriversTable() {
    const tbody = document.getElementById('adminDriversTableBody');
    if (!tbody) return;

    const state = window.appState.get();
    const searchVal = (document.getElementById('driverSearchInput') ? document.getElementById('driverSearchInput').value : '').toLowerCase();

    let drivers = state.drivers || [];
    if (searchVal) {
      drivers = drivers.filter(d =>
        d.name.toLowerCase().includes(searchVal) ||
        d.specialty.toLowerCase().includes(searchVal) ||
        d.phone.includes(searchVal)
      );
    }

    tbody.innerHTML = drivers.map(d => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${d.avatar}" alt="${d.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2.5px solid #0066FF;">
            <div>
              <div style="font-weight: 800; color: #0F172A;">${d.name}</div>
              <div style="font-size: 0.75rem; color: #0284C7; font-weight: 700;">${d.category}</div>
            </div>
          </div>
        </td>

        <td>
          <div style="font-size: 0.85rem; color: #334155; font-weight: 600;">${d.specialty}</div>
        </td>

        <td>
          <div style="font-weight: 800; color: #D97706;">⭐ ${d.rating}</div>
          <div style="font-size: 0.75rem; color: #64748B;">${d.experienceYears}+ Years Exp</div>
        </td>

        <td>
          <div style="color: #0F172A; font-weight: 700;">${d.phone}</div>
          <div style="font-size: 0.75rem; color: #64748B;">${d.languages.join(', ')}</div>
        </td>

        <td>
          <div style="font-weight: 900; color: #0066FF; font-size: 1.05rem;">${d.trips}</div>
          <div style="font-size: 0.72rem; color: #64748B;">Trips Fulfilled</div>
        </td>

        <td>
          <div style="font-weight: 900; color: #059669; font-size: 1.05rem;">₹${(d.trips * 380).toLocaleString('en-IN')}</div>
          <div style="font-size: 0.72rem; color: #64748B;">80% Payout Share</div>
        </td>

        <td>
          <span style="background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; font-size: 0.72rem; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
            <i class="fa-solid fa-shield-check"></i> VERIFIED
          </span>
        </td>

        <td>
          <span class="status-badge-admin ${d.isOnline ? 'status-active' : 'status-completed'}">
            ${d.isOnline ? '🟢 Available' : '⚪ Offline'}
          </span>
        </td>

        <td style="text-align: right;">
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button onclick="adminCtrl.toggleDriverStatus('${d.id}')" style="background: #FFFFFF; border: 1px solid #CBD5E1; color: #0F172A; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
              ${d.isOnline ? 'Make Offline' : 'Make Online'}
            </button>
            <button onclick="adminCtrl.deleteDriverPartner('${d.id}')" style="background: #FEE2E2; border: 1px solid #FCA5A5; color: #B91C1C; padding: 6px 10px; border-radius: 8px; cursor: pointer;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  filterDriversTable() {
    this.renderDriversTable();
  }

  // Render Customer Users Table
  renderUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    const state = window.appState.get();
    const searchVal = (document.getElementById('userSearchInput') ? document.getElementById('userSearchInput').value : '').toLowerCase();

    let users = state.users || [];
    if (searchVal) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(searchVal) ||
        u.phone.includes(searchVal) ||
        u.email.toLowerCase().includes(searchVal)
      );
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #0066FF, #00C6FF); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1rem; box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);">
              ${u.name.charAt(0)}
            </div>
            <div>
              <div style="font-weight: 800; color: #0F172A;">${u.name}</div>
              <div style="font-size: 0.75rem; color: #64748B;">ID: ${u.id} · Joined ${u.joinedDate || '2026'}</div>
            </div>
          </div>
        </td>

        <td>
          <div style="font-weight: 700; color: #0F172A;">${u.phone}</div>
          <div style="font-size: 0.75rem; color: #64748B;">${u.email}</div>
        </td>

        <td>
          <div style="font-size: 0.85rem; color: #0284C7; font-weight: 700;">
            ${(u.cars && u.cars.length > 0) ? u.cars.join('<br>') : 'Hyundai Creta (Automatic)'}
          </div>
        </td>

        <td>
          <div style="font-weight: 900; color: #0066FF; font-size: 1.05rem;">${u.totalBookings || 12}</div>
          <div style="font-size: 0.72rem; color: #64748B;">Hourly Packages</div>
        </td>

        <td>
          <div style="font-weight: 900; color: #059669; font-size: 1.05rem;">₹${(u.totalSpent || 7200).toLocaleString('en-IN')}</div>
          <div style="font-size: 0.72rem; color: #64748B;">Wallet: ₹${u.walletBalance || 1500}</div>
        </td>

        <td>
          <div style="font-weight: 800; color: #0F172A;">${u.favoriteDriver || 'Rajesh Kumar'}</div>
        </td>

        <td>
          <span style="background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-size: 0.75rem; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
            ⭐ ${u.memberStatus || 'VIP Platinum'}
          </span>
        </td>

        <td style="text-align: right;">
          <button onclick="showToast('Customer ${u.name} details loaded', 'accent')" style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #0066FF; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
            View History
          </button>
        </td>
      </tr>
    `).join('');
  }

  filterUsersTable() {
    this.renderUsersTable();
  }

  // Real-time Event Feed
  renderLiveEventFeed() {
    const container = document.getElementById('adminLiveEventFeed');
    if (!container) return;

    container.innerHTML = this.eventsList.map(item => `
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.72rem; font-weight: 800; color: #0066FF;">${item.time}</span>
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #16A34A;"></span>
        </div>
        <div style="font-size: 0.82rem; color: #1E293B; font-weight: 600;">${item.text}</div>
      </div>
    `).join('');
  }

  addLiveEvent(text, type = 'accent') {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    this.eventsList.unshift({ time: timeStr, text: text, type: type });
    if (this.eventsList.length > 20) this.eventsList.pop();
    this.renderLiveEventFeed();
  }

  // Live GPS Map
  initAdminMap() {
    const container = document.getElementById('adminDispatcherLiveMap');
    if (!container) return;

    if (this.adminMap) {
      this.adminMap.remove();
      this.adminMap = null;
    }

    const vijayawadaCenter = [16.5062, 80.6480];
    this.adminMap = L.map('adminDispatcherLiveMap', {
      center: vijayawadaCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.adminMap);

    // Draw Hotspot Circles (Benz Circle, MG Road, Airport)
    const hotspots = [
      { name: 'Benz Circle Hotspot', coords: [16.5015, 80.6534], radius: 1200, color: '#0066FF' },
      { name: 'MG Road Commerce Hub', coords: [16.5085, 80.6385], radius: 900, color: '#10B981' },
      { name: 'Vijayawada Airport Corridor', coords: [16.5304, 80.7968], radius: 1800, color: '#F59E0B' }
    ];

    hotspots.forEach(h => {
      L.circle(h.coords, {
        color: h.color,
        fillColor: h.color,
        fillOpacity: 0.12,
        weight: 1.5,
        radius: h.radius
      }).addTo(this.adminMap).bindPopup(`<b>${h.name}</b><br>High Demand Driver Zone`);
    });

    this.updateAdminMap();
  }

  updateAdminMap() {
    if (!this.adminMap) return;

    // Remove existing driver markers
    this.driverMarkers.forEach(m => this.adminMap.removeLayer(m));
    this.driverMarkers = [];

    // Remove existing route lines
    this.routeLayers.forEach(l => this.adminMap.removeLayer(l));
    this.routeLayers = [];

    const state = window.appState.get();

    // Plot all drivers
    state.drivers.forEach(driver => {
      const icon = L.divIcon({
        className: 'admin-driver-map-pin',
        html: `
          <div style="
            width: 36px; height: 36px;
            background: #FFFFFF;
            border: 2.5px solid ${driver.isOnline ? '#10B981' : '#94A3B8'};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          ">
            <i class="fa-solid fa-car-side" style="color: ${driver.isOnline ? '#10B981' : '#94A3B8'}; font-size: 14px;"></i>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker(driver.currentLocation, { icon: icon }).addTo(this.adminMap);
      marker.bindPopup(`
        <div style="color: #0F172A; font-family: sans-serif; padding: 4px;">
          <b style="font-size: 14px;">${driver.name}</b><br>
          <span style="color: #0066FF; font-weight: 700;">${driver.category}</span><br>
          Status: <b>${driver.isOnline ? '🟢 Available' : '⚪ Offline'}</b><br>
          Rating: ⭐ ${driver.rating} · Trips: ${driver.trips}
        </div>
      `);
      this.driverMarkers.push(marker);
    });

    // Draw active trip routes from place to place
    const activeBooking = state.activeBooking;
    if (activeBooking && (activeBooking.status === 'trip_active' || activeBooking.status === 'driver_accepted')) {
      const pickupCoords = [16.5015, 80.6534]; // Benz Circle
      const destCoords = [16.5304, 80.7968]; // Airport / Destination

      const routeLine = L.polyline([pickupCoords, [16.5120, 80.7100], destCoords], {
        color: '#0066FF',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(this.adminMap);
      this.routeLayers.push(routeLine);

      const pickupMarker = L.circleMarker(pickupCoords, { radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 1 }).addTo(this.adminMap);
      pickupMarker.bindPopup(`<b>Pickup Spot:</b> ${activeBooking.pickupAddress}`);
      this.routeLayers.push(pickupMarker);

      const destMarker = L.circleMarker(destCoords, { radius: 8, color: '#EF4444', fillColor: '#EF4444', fillOpacity: 1 }).addTo(this.adminMap);
      destMarker.bindPopup(`<b>Destination:</b> ${activeBooking.destinationAddress || 'Airport Terminal'}`);
      this.routeLayers.push(destMarker);
    }
  }

  // Pricing Matrix Management
  populatePricingInputs() {
    const state = window.appState.get();
    const p = state.pricing;

    const w2 = document.getElementById('admPriceWithin_2');
    const w4 = document.getElementById('admPriceWithin_4');
    const w6 = document.getElementById('admPriceWithin_6');
    const w8 = document.getElementById('admPriceWithin_8');

    if (w2) w2.value = p.withinCity[2] || 300;
    if (w4) w4.value = p.withinCity[4] || 600;
    if (w6) w6.value = p.withinCity[6] || 900;
    if (w8) w8.value = p.withinCity[8] || 1200;

    const o2 = document.getElementById('admPriceOutside_2');
    const o4 = document.getElementById('admPriceOutside_4');
    const o6 = document.getElementById('admPriceOutside_6');
    const o8 = document.getElementById('admPriceOutside_8');

    if (o2) o2.value = p.outsideCity[2] || 400;
    if (o4) o4.value = p.outsideCity[4] || 800;
    if (o6) o6.value = p.outsideCity[6] || 1200;
    if (o8) o8.value = p.outsideCity[8] || 1600;

    const gst = document.getElementById('admPriceGst');
    const ins = document.getElementById('admPriceInsurance');
    if (gst) gst.value = p.gstPercent || 5;
    if (ins) ins.value = p.insurancePerBooking || 49;
  }

  savePricingMatrix() {
    const w2 = parseInt(document.getElementById('admPriceWithin_2').value, 10) || 300;
    const w4 = parseInt(document.getElementById('admPriceWithin_4').value, 10) || 600;
    const w6 = parseInt(document.getElementById('admPriceWithin_6').value, 10) || 900;
    const w8 = parseInt(document.getElementById('admPriceWithin_8').value, 10) || 1200;

    const o2 = parseInt(document.getElementById('admPriceOutside_2').value, 10) || 400;
    const o4 = parseInt(document.getElementById('admPriceOutside_4').value, 10) || 800;
    const o6 = parseInt(document.getElementById('admPriceOutside_6').value, 10) || 1200;
    const o8 = parseInt(document.getElementById('admPriceOutside_8').value, 10) || 1600;

    const gst = parseFloat(document.getElementById('admPriceGst').value) || 5;
    const ins = parseInt(document.getElementById('admPriceInsurance').value, 10) || 49;

    window.appState.updatePricing({
      withinCity: { 2: w2, 4: w4, 6: w6, 8: w8 },
      outsideCity: { 2: o2, 4: o4, 6: o6, 8: o8 },
      gstPercent: gst,
      insurancePerBooking: ins
    });

    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast('🚀 Dynamic hourly rates updated! Customer website reflects changes instantly.', 'success');
    this.addLiveEvent('Admin updated hourly pricing matrix (2h/4h/6h/8h rates applied)');
  }

  resetPricingDefaults() {
    if (confirm('Reset rates to system defaults (Within City ₹300-₹1200 / Outside City ₹400-₹1600)?')) {
      window.appState.resetDefaults();
      this.populatePricingInputs();
      this.renderKPIs();
      this.renderBookingsTable();
      this.renderDriversTable();
      this.renderUsersTable();
      window.showToast('✅ Pricing reset to standard defaults', 'success');
    }
  }

  // Admin Actions
  toggleDriverStatus(driverId) {
    window.appState.toggleDriverOnline(driverId);
    const state = window.appState.get();
    const d = state.drivers.find(item => item.id === driverId);
    if (d) {
      window.showToast(`Driver ${d.name} is now ${d.isOnline ? 'ONLINE' : 'OFFLINE'}`, 'accent');
      this.addLiveEvent(`Driver status updated: ${d.name} is now ${d.isOnline ? 'Online' : 'Offline'}`);
    }
    this.renderDriversTable();
    this.renderKPIs();
  }

  deleteDriverPartner(driverId) {
    if (confirm('Are you sure you want to remove this driver partner?')) {
      window.appState.deleteDriver(driverId);
      window.showToast('Driver removed from network', 'warning');
      this.renderDriversTable();
      this.renderKPIs();
    }
  }

  cancelBooking(bookingId) {
    if (confirm(`Cancel booking ${bookingId}?`)) {
      window.appState.cancelBookingAdmin(bookingId);
      window.showToast(`Booking ${bookingId} cancelled by Admin`, 'warning');
      this.addLiveEvent(`Admin cancelled booking ${bookingId}`, 'danger');
      this.renderBookingsTable();
      this.renderKPIs();
    }
  }

  forceCompleteBooking(bookingId) {
    window.appState.forceCompleteBookingAdmin(bookingId);
    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`Booking ${bookingId} marked completed & payout credited`, 'success');
    this.addLiveEvent(`Admin force-completed booking ${bookingId}`);
    this.renderBookingsTable();
    this.renderKPIs();
  }

  simulateNewIncomingBooking() {
    const customers = ['Javed Sayed', 'Venkatesh Rao', 'Anita Sharma', 'Kishore Reddy', 'Priya Varma'];
    const placesFrom = ['Benz Circle, Vijayawada', 'MG Road, Vijayawada', 'Governorpet, Vijayawada', 'PVP Square Mall'];
    const placesTo = ['Vijayawada Airport (Gannavaram)', 'Guntur Highway (Amaravati Club)', 'Bhavani Island Boat Point', 'Kanaka Durga Temple'];
    const cars = ['Hyundai Creta (Automatic)', 'Toyota Fortuner', 'Mercedes-Benz C-Class', 'Honda City', 'Kia Seltos'];

    const cust = customers[Math.floor(Math.random() * customers.length)];
    const from = placesFrom[Math.floor(Math.random() * placesFrom.length)];
    const to = placesTo[Math.floor(Math.random() * placesTo.length)];
    const car = cars[Math.floor(Math.random() * cars.length)];
    const dur = [2, 4, 6, 8][Math.floor(Math.random() * 4)];

    const req = window.appState.broadcastBookingRequest({
      durationHours: dur,
      pickupAddress: from,
      destinationAddress: to,
      carModel: car,
      tripType: Math.random() > 0.5 ? 'within' : 'outside'
    });

    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`⚡ New Live Booking Simulated: ${cust} (${from} ➡️ ${to})`, 'success');
    this.addLiveEvent(`Live Booking Dispatched: ${cust} for ${dur}h (${from} ➡️ ${to})`);

    this.renderBookingsTable();
    this.renderKPIs();
    this.updateAdminMap();
  }

  // Modals
  openAddDriverModal() {
    const modal = document.getElementById('adminAddDriverModal');
    if (modal) modal.classList.add('active');
  }

  openAddUserModal() {
    const modal = document.getElementById('adminAddUserModal');
    if (modal) modal.classList.add('active');
  }

  closeModals() {
    document.querySelectorAll('.modal-admin-overlay').forEach(m => m.classList.remove('active'));
  }

  submitNewDriver() {
    const name = (document.getElementById('newDrvName').value || '').trim();
    const phone = (document.getElementById('newDrvPhone').value || '').trim();
    const exp = document.getElementById('newDrvExp').value || '5';
    const cat = document.getElementById('newDrvCat').value;
    const specialty = (document.getElementById('newDrvSpecialty').value || 'Manual & Automatic Expert').trim();

    if (!name || !phone) {
      window.showToast('Please enter driver name and phone number', 'danger');
      return;
    }

    window.appState.addDriver({
      name: name,
      phone: phone,
      experienceYears: exp,
      category: cat,
      specialty: specialty
    });

    this.closeModals();
    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`🎉 Driver partner ${name} successfully onboarded and verified!`, 'success');
    this.addLiveEvent(`New driver onboarded: ${name} (${cat})`);

    this.renderDriversTable();
    this.renderKPIs();
  }

  submitNewUser() {
    const name = (document.getElementById('newUserName').value || '').trim();
    const phone = (document.getElementById('newUserPhone').value || '').trim();
    const email = (document.getElementById('newUserEmail').value || '').trim();
    const car = (document.getElementById('newUserCar').value || 'Personal Car (Automatic)').trim();

    if (!name || !phone) {
      window.showToast('Please enter customer name and phone', 'danger');
      return;
    }

    window.appState.addCustomerUser({
      name: name,
      phone: phone,
      email: email,
      cars: [car]
    });

    this.closeModals();
    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`✅ Customer account created for ${name}!`, 'success');
    this.addLiveEvent(`Registered customer created: ${name} (${car})`);

    this.renderUsersTable();
    this.renderKPIs();
  }
}

window.adminCtrl = new AdminController();
