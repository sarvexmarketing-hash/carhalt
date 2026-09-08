/* ==========================================================================
   DRIVERBEE - ON-DEMAND DRIVER PLATFORM STATE STORE
   Synchronized cross-portal reactive state store for Customer & Driver Portals
   ========================================================================== */

const STORAGE_KEY = 'driverbee_on_demand_state_v7';

const DEFAULT_STATE = {
  // Configurable Pricing Matrix for Driver Services
  pricing: {
    withinCity: {
      2: 300,
      4: 600,
      6: 900,
      8: 1200
    },
    outsideCity: {
      2: 400,
      4: 800,
      6: 1200,
      8: 1600
    },
    baseHourlyWithin: 150,
    baseHourlyOutside: 200,
    extraHourRate: 150,
    nightAllowance: 99,
    insurancePerBooking: 49,
    gstPercent: 5
  },

  // Active Customer Context
  user: {
    id: 'usr_8832',
    name: 'Javed Sayed',
    phone: '+91 98765 43210',
    email: 'javed@example.com',
    walletBalance: 2450,
    savedLocations: [
      { id: 'loc_1', label: 'Home', address: 'Benz Circle, Vijayawada', lat: 16.5015, lng: 80.6534 },
      { id: 'loc_2', label: 'Work', address: 'MG Road (Bandar Road), Vijayawada', lat: 16.5085, lng: 80.6385 },
      { id: 'loc_3', label: 'Airport', address: 'Vijayawada Airport (Gannavaram)', lat: 16.5304, lng: 80.7968 }
    ]
  },

  // Selected Booking Preferences
  selection: {
    pickupAddress: 'Benz Circle, Vijayawada',
    pickupCoords: [16.5015, 80.6534],
    tripType: 'within', // 'within' | 'outside'
    destinationAddress: '',
    durationHours: 4,
    selectedCategory: 'all',
    selectedDriverId: 'drv_1',
    carTransmission: 'Automatic', // 'Manual' | 'Automatic' | 'Luxury'
    carModel: 'Hyundai Creta (Automatic)'
  },

  // Professional Verified Drivers Fleet
  drivers: [
    {
      id: 'drv_1',
      name: 'Rajesh Kumar',
      category: 'Top Rated Driver',
      specialty: 'All Cars · Automatic & Manual Expert',
      experienceYears: 8,
      rating: 4.95,
      trips: 1420,
      etaMins: 6,
      distanceKm: 1.2,
      phone: '+91 98450 12345',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80',
      languages: ['Telugu', 'English', 'Hindi'],
      badge: 'Uniformed & Verified',
      isOnline: true,
      currentLocation: [16.5040, 80.6510],
      priceMultiplier: 1.0,
      verifiedKYC: true
    },
    {
      id: 'drv_2',
      name: 'Amit Sharma',
      category: 'Luxury Car Specialist',
      specialty: 'BMW, Mercedes, Audi & High-End SUVs',
      experienceYears: 10,
      rating: 4.92,
      trips: 980,
      etaMins: 8,
      distanceKm: 1.8,
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&h=300&q=80',
      languages: ['English', 'Hindi', 'Telugu'],
      badge: 'Executive Driver',
      isOnline: true,
      currentLocation: [16.4990, 80.6480],
      priceMultiplier: 1.1,
      verifiedKYC: true
    },
    {
      id: 'drv_3',
      name: 'Suresh Gowda',
      category: 'Outstation Highway Expert',
      specialty: 'Long Distance & Night Driving Specialist',
      experienceYears: 12,
      rating: 4.88,
      trips: 2150,
      etaMins: 7,
      distanceKm: 1.5,
      phone: '+91 99001 55432',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
      languages: ['Telugu', 'Tamil', 'Hindi', 'English'],
      badge: 'Highway Veteran',
      isOnline: true,
      currentLocation: [16.5120, 80.6550],
      priceMultiplier: 1.0,
      verifiedKYC: true
    },
    {
      id: 'drv_4',
      name: 'Vikram Singh',
      category: 'City Commute & Party Driver',
      specialty: 'Safe Night Rides & Heavy Traffic Pro',
      experienceYears: 6,
      rating: 4.85,
      trips: 760,
      etaMins: 10,
      distanceKm: 2.2,
      phone: '+91 98800 11223',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80',
      languages: ['Hindi', 'English', 'Telugu'],
      badge: 'Quick Dispatched',
      isOnline: true,
      currentLocation: [16.4950, 80.6600],
      priceMultiplier: 1.0,
      verifiedKYC: true
    },
    {
      id: 'drv_5',
      name: 'Manjunath Swamy',
      category: 'Corporate & Executive Driver',
      specialty: 'Corporate Travel, Airport & VIP Protocols',
      experienceYears: 9,
      rating: 5.0,
      trips: 1340,
      etaMins: 11,
      distanceKm: 2.6,
      phone: '+91 99440 33445',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&h=300&q=80',
      languages: ['English', 'Telugu', 'Hindi'],
      badge: 'VIP White Glove',
      isOnline: true,
      currentLocation: [16.5150, 80.6450],
      priceMultiplier: 1.2,
      verifiedKYC: true
    },
    {
      id: 'drv_6',
      name: 'Praveen Nair',
      category: 'EV & Automatic Specialist',
      specialty: 'Electric Vehicles, Hybrids & DCT/CVT',
      experienceYears: 7,
      rating: 4.90,
      trips: 820,
      etaMins: 9,
      distanceKm: 2.0,
      phone: '+91 97410 55667',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&h=300&q=80',
      languages: ['English', 'Malayalam', 'Telugu'],
      badge: 'EV Certified',
      isOnline: true,
      currentLocation: [16.5020, 80.6620],
      priceMultiplier: 1.0,
      verifiedKYC: true
    }
  ],

  // Registered Platform Customers
  users: [
    {
      id: 'usr_8832',
      name: 'Javed Sayed',
      phone: '+91 98765 43210',
      email: 'javed@driverbee.com',
      walletBalance: 2450,
      totalBookings: 14,
      totalSpent: 9600,
      registeredCity: 'Vijayawada',
      favoriteDriver: 'Rajesh Kumar',
      cars: ['Hyundai Creta (Automatic) - AP 16 BK 4492', 'Honda City (Manual) - AP 16 DJ 1092'],
      memberStatus: 'VIP Platinum',
      joinedDate: 'Jan 2026'
    },
    {
      id: 'usr_8833',
      name: 'Venkatesh Rao',
      phone: '+91 98490 55443',
      email: 'venkatesh.rao@outlook.com',
      walletBalance: 1200,
      totalBookings: 8,
      totalSpent: 4800,
      registeredCity: 'Vijayawada',
      favoriteDriver: 'Rajesh Kumar',
      cars: ['Toyota Fortuner (Automatic) - AP 16 EE 8821'],
      memberStatus: 'Active Regular',
      joinedDate: 'Feb 2026'
    },
    {
      id: 'usr_8834',
      name: 'Anita Sharma',
      phone: '+91 99887 66554',
      email: 'anita.s@techcorp.in',
      walletBalance: 3100,
      totalBookings: 19,
      totalSpent: 14200,
      registeredCity: 'Vijayawada',
      favoriteDriver: 'Amit Sharma',
      cars: ['Mercedes-Benz C-Class - AP 16 LM 0001'],
      memberStatus: 'VIP Platinum',
      joinedDate: 'Dec 2025'
    },
    {
      id: 'usr_8835',
      name: 'Kishore Reddy',
      phone: '+91 94401 22334',
      email: 'kishore.reddy@gmail.com',
      walletBalance: 850,
      totalBookings: 6,
      totalSpent: 3600,
      registeredCity: 'Vijayawada',
      favoriteDriver: 'Suresh Gowda',
      cars: ['Mahindra XUV700 - AP 16 ZZ 9900'],
      memberStatus: 'Active Regular',
      joinedDate: 'Mar 2026'
    },
    {
      id: 'usr_8836',
      name: 'Priya Varma',
      phone: '+91 98223 99887',
      email: 'priya.varma@healthcare.org',
      walletBalance: 1800,
      totalBookings: 11,
      totalSpent: 7200,
      registeredCity: 'Vijayawada',
      favoriteDriver: 'Praveen Nair',
      cars: ['Tata Nexon EV - AP 16 EV 2024'],
      memberStatus: 'Active Regular',
      joinedDate: 'Feb 2026'
    }
  ],

  // Platform Bookings & Dispatches (From Places to Places)
  allBookings: [
    {
      id: 'BK-9021',
      customerId: 'usr_8832',
      customerName: 'Javed Sayed',
      customerPhone: '+91 98765 43210',
      carModel: 'Hyundai Creta (Automatic)',
      driverId: 'drv_1',
      driverName: 'Rajesh Kumar',
      driverAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80',
      pickupAddress: 'Benz Circle, Vijayawada',
      destinationAddress: 'Vijayawada Airport (Gannavaram)',
      durationHours: 4,
      tripType: 'Within City',
      totalFare: 600,
      driverPayout: 480,
      platformRevenue: 120,
      status: 'trip_active',
      otp: '8492',
      createdAt: 'Today, 12:45 PM',
      notes: 'Customer requested smooth highway driving to terminal 1'
    },
    {
      id: 'BK-9020',
      customerId: 'usr_8834',
      customerName: 'Anita Sharma',
      customerPhone: '+91 99887 66554',
      carModel: 'Mercedes-Benz C-Class',
      driverId: 'drv_2',
      driverName: 'Amit Sharma',
      driverAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&h=300&q=80',
      pickupAddress: 'Governorpet, Vijayawada',
      destinationAddress: 'Guntur Highway (Amaravati Club)',
      durationHours: 6,
      tripType: 'Outside City',
      totalFare: 1200,
      driverPayout: 960,
      platformRevenue: 240,
      status: 'driver_accepted',
      otp: '3190',
      createdAt: 'Today, 01:10 PM',
      notes: 'Executive corporate commute'
    },
    {
      id: 'BK-9019',
      customerId: 'usr_8833',
      customerName: 'Venkatesh Rao',
      customerPhone: '+91 98490 55443',
      carModel: 'Toyota Fortuner (Automatic)',
      driverId: 'drv_3',
      driverName: 'Suresh Gowda',
      driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300&q=80',
      pickupAddress: 'MG Road (Bandar Road), Vijayawada',
      destinationAddress: 'Bhavani Island Boat Point',
      durationHours: 2,
      tripType: 'Within City',
      totalFare: 300,
      driverPayout: 240,
      platformRevenue: 60,
      status: 'completed',
      otp: '7721',
      createdAt: 'Today, 10:00 AM',
      notes: 'Family weekend drop'
    },
    {
      id: 'BK-9018',
      customerId: 'usr_8835',
      customerName: 'Kishore Reddy',
      customerPhone: '+91 94401 22334',
      carModel: 'Mahindra XUV700',
      driverId: 'drv_4',
      driverName: 'Vikram Singh',
      driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80',
      pickupAddress: 'PVP Square Mall, MG Road',
      destinationAddress: 'Tadepalli, Vijayawada',
      durationHours: 4,
      tripType: 'Within City',
      totalFare: 600,
      driverPayout: 480,
      platformRevenue: 120,
      status: 'completed',
      otp: '5512',
      createdAt: 'Yesterday, 06:30 PM',
      notes: 'Late night dinner return drive'
    }
  ],

  // Live incoming dispatch request (for drivers)
  liveDispatch: null,

  // Active Booking State
  activeBooking: null,

  // Last Completed Trip Receipt (for showing ended ride summary)
  lastCompletedTrip: null,

  // Booking History
  bookingHistory: [
    {
      id: 'BK-7890',
      driverName: 'Rajesh Kumar',
      date: 'Yesterday, 3:30 PM',
      durationHours: 4,
      duration: '4 Hours',
      tripType: 'Within City',
      totalFare: 600,
      status: 'Completed',
      pickup: 'MG Road, Vijayawada',
      ratingGiven: 5
    }
  ],

  // Promo Codes
  promos: {
    'FIRSTDRIVE': { discount: 100, minFare: 300, desc: '₹100 off on first driver booking' },
    'WEEKEND50': { discount: 50, minFare: 300, desc: '₹50 off weekend driver rental' }
  },

  // Driver App Session State
  driverSession: {
    driverId: 'drv_1',
    name: 'Rajesh Kumar',
    phone: '+91 98450 12345',
    isOnline: true,
    todayEarnings: 2150,
    todayTrips: 3,
    acceptanceRate: '98%',
    driverRating: 4.95,
    tripHistory: [
      { id: 'DRV-101', customerName: 'Venkatesh Rao', hoursBooked: 2, amount: 240, time: '10:00 AM - 12:00 PM', pickup: 'Benz Circle' },
      { id: 'DRV-102', customerName: 'Anita Sharma', hoursBooked: 4, amount: 480, time: '01:00 PM - 05:00 PM', pickup: 'Governorpet' },
      { id: 'DRV-103', customerName: 'Kishore Reddy', hoursBooked: 6, amount: 720, time: '05:30 PM - 11:30 PM', pickup: 'MG Road' }
    ]
  },

  // System Analytics
  stats: {
    totalRevenue: 284500,
    completedBookings: 348,
    activeDriversCount: 42,
    avgRating: 4.9
  }
};

class StateStore {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];

    // Dual Sync: Storage Event + BroadcastChannel for zero-delay cross-tab reactivity
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.state = JSON.parse(e.newValue);
            this.notify();
          } catch (err) {
            console.error('Cross-tab sync parse error:', err);
          }
        }
      });

      try {
        this.channel = new BroadcastChannel('driverbee_channel_v1');
        this.channel.onmessage = (msg) => {
          if (msg && msg.data && msg.data.type === 'STATE_UPDATE') {
            this.state = msg.data.state;
            this.notify();
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization skipped:', err);
      }
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          pricing: { ...DEFAULT_STATE.pricing, ...(parsed.pricing || {}) },
          user: { ...DEFAULT_STATE.user, ...(parsed.user || {}) },
          driverSession: { ...DEFAULT_STATE.driverSession, ...(parsed.driverSession || {}) },
          selection: { ...DEFAULT_STATE.selection, ...(parsed.selection || {}) }
        };
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (this.channel) {
        this.channel.postMessage({ type: 'STATE_UPDATE', state: this.state });
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  get() {
    return this.state;
  }

  // Duration pricing calculation
  getDurationPrice(durationHours, tripType = 'within') {
    const matrix = tripType === 'outside' ? this.state.pricing.outsideCity : this.state.pricing.withinCity;
    return matrix[durationHours] || (durationHours * (tripType === 'outside' ? 200 : 150));
  }

  getDriverPrice(driverId, durationHours, tripType = 'within') {
    const basePrice = this.getDurationPrice(durationHours, tripType);
    const driver = this.state.drivers.find(d => d.id === driverId);
    if (!driver) return basePrice;
    return Math.round(basePrice * (driver.priceMultiplier || 1));
  }

  calculateFareSummary(driverId, durationHours, tripType, promoCode = '') {
    const baseFare = this.getDriverPrice(driverId, durationHours, tripType);
    const insurance = this.state.pricing.insurancePerBooking;
    const subtotal = baseFare + insurance;
    
    let discount = 0;
    if (promoCode && this.state.promos[promoCode.toUpperCase()]) {
      const promo = this.state.promos[promoCode.toUpperCase()];
      if (baseFare >= promo.minFare) {
        discount = promo.discount;
      }
    }

    const gst = Math.round((subtotal - discount) * (this.state.pricing.gstPercent / 100));
    const total = Math.max(0, (subtotal - discount) + gst);

    return {
      baseFare,
      insurance,
      discount,
      gst,
      total,
      durationHours,
      tripType
    };
  }

  setSelection(updates) {
    this.state.selection = { ...this.state.selection, ...updates };
    this.saveState();
  }

  // Customer searches/dispatches a ride request -> Broadcast to Drivers or Direct Request
  broadcastBookingRequest(bookingData = {}) {
    const reqId = 'REQ-' + Math.floor(1000 + Math.random() * 9000);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const durationHours = bookingData.durationHours || this.state.selection.durationHours || 4;
    const tripType = bookingData.tripType || this.state.selection.tripType || 'within';
    const totalFare = bookingData.fare ? bookingData.fare.total : this.getDurationPrice(durationHours, tripType);
    const driverPayout = Math.round(totalFare * 0.8); // 80% driver share

    const targetDriverId = bookingData.targetDriverId || null;
    let targetDriver = null;
    if (targetDriverId) {
      targetDriver = this.state.drivers.find(d => d.id === targetDriverId) || null;
    }

    // Alternative available drivers who can take duty immediately
    const alternativeDrivers = this.state.drivers
      .filter(d => (!targetDriverId || d.id !== targetDriverId) && d.status !== 'on_trip')
      .slice(0, 2);

    const pickup = bookingData.pickupAddress || this.state.selection.pickupAddress || 'Benz Circle, Vijayawada';
    const dest = bookingData.destinationAddress || this.state.selection.destinationAddress || 'Local Destination / Flexible';

    const dispatchRequest = {
      id: reqId,
      customerId: this.state.user.id,
      customerName: this.state.user.name,
      customerPhone: this.state.user.phone,
      pickupAddress: pickup,
      destinationAddress: dest,
      tripType: tripType,
      durationHours: durationHours,
      carModel: bookingData.carModel || this.state.selection.carModel,
      carTransmission: bookingData.carTransmission || this.state.selection.carTransmission,
      totalFare: totalFare,
      driverPayout: driverPayout,
      fare: bookingData.fare,
      otp: otp,
      targetDriverId: targetDriverId,
      targetDriverName: targetDriver ? targetDriver.name : null,
      targetDriver: targetDriver,
      isDirectRequest: !!targetDriverId,
      alternativeDrivers: alternativeDrivers,
      status: 'searching', // 'searching' | 'driver_accepted' | 'arrived' | 'trip_active' | 'completed' | 'declined_by_driver'
      createdAt: Date.now(),
      expiresAt: Date.now() + 35000 // 35 seconds window
    };

    // Set activeBooking in searching state
    this.state.activeBooking = {
      ...dispatchRequest,
      stepIndex: 1,
      driver: targetDriver,
      remainingSeconds: durationHours * 3600,
      totalSeconds: durationHours * 3600
    };

    this.state.liveDispatch = dispatchRequest;

    // Prepend to Admin Master All Bookings Registry
    if (!this.state.allBookings) this.state.allBookings = [];
    this.state.allBookings.unshift({
      id: reqId,
      customerId: this.state.user.id,
      customerName: this.state.user.name,
      customerPhone: this.state.user.phone,
      carModel: bookingData.carModel || this.state.selection.carModel || 'Customer Car',
      driverId: targetDriver ? targetDriver.id : null,
      driverName: targetDriver ? targetDriver.name : 'Searching Nearby...',
      driverAvatar: targetDriver ? targetDriver.avatar : 'assets/driverbee-icon.svg',
      pickupAddress: pickup,
      destinationAddress: dest,
      durationHours: durationHours,
      tripType: tripType === 'outside' ? 'Outside City' : 'Within City',
      totalFare: totalFare,
      driverPayout: driverPayout,
      platformRevenue: totalFare - driverPayout,
      status: 'searching',
      otp: otp,
      createdAt: 'Just now',
      notes: targetDriver ? `Direct request to ${targetDriver.name}` : 'Broadcast to all drivers'
    });

    this.saveState();
    return dispatchRequest;
  }

  // Switch a direct targeted request to broadcast mode for all nearby drivers
  broadcastToAllDrivers() {
    if (!this.state.liveDispatch) return;
    this.state.liveDispatch.targetDriverId = null;
    this.state.liveDispatch.targetDriverName = null;
    this.state.liveDispatch.targetDriver = null;
    this.state.liveDispatch.isDirectRequest = false;
    this.state.liveDispatch.status = 'searching';
    this.state.liveDispatch.expiresAt = Date.now() + 35000;
    
    if (this.state.activeBooking) {
      this.state.activeBooking.targetDriverId = null;
      this.state.activeBooking.targetDriverName = null;
      this.state.activeBooking.isDirectRequest = false;
      this.state.activeBooking.status = 'searching';
    }

    if (this.state.allBookings && this.state.allBookings[0]) {
      this.state.allBookings[0].driverName = 'Broadcasting to all...';
      this.state.allBookings[0].status = 'searching';
    }

    this.saveState();
  }

  // Switch direct request to an alternative driver who accepted/is available
  switchDirectDriver(driverId) {
    const driver = this.state.drivers.find(d => d.id === driverId);
    if (!driver || !this.state.liveDispatch) return;
    this.state.liveDispatch.targetDriverId = driver.id;
    this.state.liveDispatch.targetDriverName = driver.name;
    this.state.liveDispatch.targetDriver = driver;
    this.state.liveDispatch.isDirectRequest = true;
    this.state.liveDispatch.status = 'searching';
    this.state.liveDispatch.expiresAt = Date.now() + 35000;

    if (this.state.activeBooking) {
      this.state.activeBooking.targetDriverId = driver.id;
      this.state.activeBooking.targetDriverName = driver.name;
      this.state.activeBooking.targetDriver = driver;
      this.state.activeBooking.isDirectRequest = true;
      this.state.activeBooking.status = 'searching';
    }

    if (this.state.allBookings && this.state.allBookings[0]) {
      this.state.allBookings[0].driverId = driver.id;
      this.state.allBookings[0].driverName = driver.name;
      this.state.allBookings[0].driverAvatar = driver.avatar;
    }

    this.saveState();
  }

  // Driver Accepts the live request
  acceptBookingByDriver(driverId = 'drv_1') {
    const driver = this.state.drivers.find(d => d.id === driverId) || this.state.drivers[0];
    
    if (!this.state.activeBooking) {
      if (this.state.liveDispatch) {
        this.state.activeBooking = { ...this.state.liveDispatch };
      } else {
        const dummyReq = this.broadcastBookingRequest({ durationHours: 4 });
        this.state.activeBooking = { ...dummyReq };
      }
    }

    const durationHours = this.state.activeBooking.durationHours || 4;

    this.state.activeBooking.driver = driver;
    this.state.activeBooking.status = 'driver_accepted';
    this.state.activeBooking.stepIndex = 2;
    this.state.activeBooking.acceptedAt = Date.now();
    this.state.activeBooking.etaMins = driver.etaMins || 6;
    this.state.activeBooking.remainingSeconds = durationHours * 3600;
    this.state.activeBooking.totalSeconds = durationHours * 3600;

    if (this.state.liveDispatch) {
      this.state.liveDispatch.status = 'accepted';
      this.state.liveDispatch.driver = driver;
    }

    // Sync in allBookings
    if (this.state.allBookings) {
      const b = this.state.allBookings.find(item => item.id === this.state.activeBooking.id);
      if (b) {
        b.driverId = driver.id;
        b.driverName = driver.name;
        b.driverAvatar = driver.avatar;
        b.status = 'driver_accepted';
      }
    }

    this.saveState();
    return this.state.activeBooking;
  }

  // Decline live dispatch (or decline by specific driver)
  declineLiveDispatch(driverId = 'drv_1') {
    if (!this.state.liveDispatch) return;
    if (this.state.liveDispatch.targetDriverId && this.state.liveDispatch.targetDriverId === driverId) {
      this.state.liveDispatch.status = 'declined_by_driver';
      if (this.state.activeBooking) {
        this.state.activeBooking.status = 'declined_by_driver';
      }
      if (this.state.allBookings && this.state.allBookings[0]) {
        this.state.allBookings[0].status = 'declined';
      }
    } else {
      this.state.liveDispatch.status = 'declined';
    }
    this.saveState();
  }

  // Driver marks "I have arrived at pickup location"
  driverArrivedAtPickup() {
    if (!this.state.activeBooking) return;
    this.state.activeBooking.status = 'arrived';
    this.state.activeBooking.stepIndex = 3;
    this.state.activeBooking.arrivedAt = Date.now();
    
    if (this.state.allBookings) {
      const b = this.state.allBookings.find(item => item.id === this.state.activeBooking.id);
      if (b) b.status = 'arrived';
    }

    this.saveState();
  }

  // Driver verifies OTP and starts the ride
  startActiveRide(enteredOtp) {
    if (!this.state.activeBooking) return { success: false, msg: 'No active booking found' };

    if (enteredOtp && this.state.activeBooking.otp && enteredOtp.trim() !== this.state.activeBooking.otp.trim()) {
      return { success: false, msg: 'Incorrect OTP. Please enter the 4-digit code shown on customer screen.' };
    }

    this.state.activeBooking.status = 'trip_active';
    this.state.activeBooking.stepIndex = 4;
    this.state.activeBooking.startedAt = Date.now();
    this.state.activeBooking.remainingSeconds = (this.state.activeBooking.durationHours || 2) * 3600;

    if (this.state.allBookings) {
      const b = this.state.allBookings.find(item => item.id === this.state.activeBooking.id);
      if (b) b.status = 'trip_active';
    }

    this.saveState();
    return { success: true };
  }

  // Driver (or Customer) ends the active ride
  endActiveRide() {
    if (!this.state.activeBooking) return null;

    const booking = this.state.activeBooking;
    const durationHours = booking.durationHours || 4;
    const driverName = booking.driver ? booking.driver.name : 'Rajesh Kumar';
    const totalFare = booking.fare ? booking.fare.total : (booking.totalFare || 600);
    const driverPayout = Math.round(totalFare * 0.8);

    const completedReceipt = {
      id: booking.id || ('DRV-' + Math.floor(1000 + Math.random() * 9000)),
      customerName: booking.customerName || this.state.user.name,
      customerPhone: booking.customerPhone || this.state.user.phone,
      driver: booking.driver || this.state.drivers[0],
      driverName: driverName,
      pickupAddress: booking.pickupAddress || 'Benz Circle, Vijayawada',
      destinationAddress: booking.destinationAddress || 'Local Destination',
      tripType: booking.tripType === 'outside' ? 'Outside City (Outstation)' : 'Within City Drive',
      durationHours: durationHours,
      durationLabel: `${durationHours} Hours Booked`,
      carModel: booking.carModel || 'Customer Car',
      totalFare: totalFare,
      driverPayout: driverPayout,
      paymentMethod: booking.paymentMethod || 'UPI / Cash',
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      ratingGiven: 5,
      fareBreakdown: {
        baseRate: booking.fare ? booking.fare.baseFare : totalFare - 81,
        insurance: 49,
        gst: booking.fare ? booking.fare.gst : 32,
        total: totalFare
      }
    };

    // Add to customer booking history
    this.state.bookingHistory.unshift(completedReceipt);

    // Update master allBookings registry
    if (this.state.allBookings) {
      const b = this.state.allBookings.find(item => item.id === booking.id);
      if (b) {
        b.status = 'completed';
      }
    }

    // Update driver earnings & session
    this.state.driverSession.todayEarnings += driverPayout;
    this.state.driverSession.todayTrips += 1;
    this.state.driverSession.tripHistory.unshift({
      id: completedReceipt.id,
      customerName: completedReceipt.customerName,
      hoursBooked: durationHours,
      amount: driverPayout,
      time: 'Just now',
      pickup: completedReceipt.pickupAddress.split(',')[0]
    });

    // Update platform stats
    this.state.stats.completedBookings += 1;
    this.state.stats.totalRevenue += totalFare;

    // Set last completed receipt for popup modal in both customer and driver views
    this.state.lastCompletedTrip = completedReceipt;
    this.state.activeBooking = null;
    this.state.liveDispatch = null;

    this.saveState();
    return completedReceipt;
  }

  clearLastCompletedTrip() {
    this.state.lastCompletedTrip = null;
    this.saveState();
  }

  // Admin Control Operations
  cancelBookingAdmin(bookingId) {
    if (this.state.allBookings) {
      const b = this.state.allBookings.find(item => item.id === bookingId);
      if (b) b.status = 'cancelled';
    }
    if (this.state.activeBooking && this.state.activeBooking.id === bookingId) {
      this.state.activeBooking = null;
      this.state.liveDispatch = null;
    }
    this.saveState();
  }

  forceCompleteBookingAdmin(bookingId) {
    if (this.state.allBookings) {
      const b = this.state.allBookings.find(item => item.id === bookingId);
      if (b) b.status = 'completed';
    }
    if (this.state.activeBooking && this.state.activeBooking.id === bookingId) {
      this.endActiveRide();
    } else {
      this.saveState();
    }
  }

  reassignDriverAdmin(bookingId, newDriverId) {
    const driver = this.state.drivers.find(d => d.id === newDriverId);
    if (!driver) return;

    if (this.state.allBookings) {
      const b = this.state.allBookings.find(item => item.id === bookingId);
      if (b) {
        b.driverId = driver.id;
        b.driverName = driver.name;
        b.driverAvatar = driver.avatar;
        b.status = 'driver_accepted';
      }
    }

    if (this.state.activeBooking && this.state.activeBooking.id === bookingId) {
      this.state.activeBooking.driver = driver;
      this.state.activeBooking.status = 'driver_accepted';
    }

    this.saveState();
  }

  addDriver(driverData) {
    const newId = 'drv_' + (this.state.drivers.length + 1);
    const newDriver = {
      id: newId,
      name: driverData.name || 'New Driver',
      category: driverData.category || 'Top Rated Driver',
      specialty: driverData.specialty || 'Manual & Automatic Vehicles',
      experienceYears: parseInt(driverData.experienceYears || '5', 10),
      rating: 5.0,
      trips: 0,
      etaMins: 8,
      distanceKm: 1.5,
      phone: driverData.phone || '+91 98000 00000',
      avatar: driverData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
      languages: driverData.languages || ['Telugu', 'English', 'Hindi'],
      badge: 'Verified Pro',
      isOnline: true,
      currentLocation: [16.5050, 80.6500],
      priceMultiplier: 1.0,
      verifiedKYC: true
    };
    this.state.drivers.push(newDriver);
    this.state.stats.activeDriversCount = this.state.drivers.length;
    this.saveState();
    return newDriver;
  }

  deleteDriver(driverId) {
    this.state.drivers = this.state.drivers.filter(d => d.id !== driverId);
    this.state.stats.activeDriversCount = this.state.drivers.length;
    this.saveState();
  }

  toggleDriverOnline(driverId) {
    const driver = this.state.drivers.find(d => d.id === driverId);
    if (driver) {
      driver.isOnline = !driver.isOnline;
      this.saveState();
    }
  }

  addCustomerUser(userData) {
    const newId = 'usr_' + Math.floor(1000 + Math.random() * 9000);
    const newUser = {
      id: newId,
      name: userData.name || 'New Customer',
      phone: userData.phone || '+91 98000 00000',
      email: userData.email || 'customer@example.com',
      walletBalance: 1000,
      totalBookings: 0,
      totalSpent: 0,
      registeredCity: 'Vijayawada',
      favoriteDriver: 'None yet',
      cars: userData.cars || ['Personal Car (Automatic)'],
      memberStatus: 'New Member',
      joinedDate: 'Today'
    };
    if (!this.state.users) this.state.users = [];
    this.state.users.unshift(newUser);
    this.saveState();
    return newUser;
  }

  // Driver cancels or rejects request
  declineLiveDispatch() {
    this.state.liveDispatch = null;
    this.saveState();
  }

  // Customer cancels active booking
  cancelActiveBooking() {
    this.state.activeBooking = null;
    this.state.liveDispatch = null;
    this.saveState();
  }

  // Extend active booking
  extendActiveBooking(additionalHours) {
    if (!this.state.activeBooking) return;
    const additionalPrice = this.getDriverPrice(
      this.state.activeBooking.driver ? this.state.activeBooking.driver.id : 'drv_1',
      additionalHours,
      this.state.activeBooking.tripType
    );
    this.state.activeBooking.durationHours += additionalHours;
    this.state.activeBooking.remainingSeconds += additionalHours * 3600;
    this.state.activeBooking.totalSeconds += additionalHours * 3600;
    if (this.state.activeBooking.fare) {
      this.state.activeBooking.fare.total += additionalPrice;
    } else {
      this.state.activeBooking.totalFare = (this.state.activeBooking.totalFare || 600) + additionalPrice;
    }
    this.saveState();
  }

  // Driver cancels or rejects request
  declineLiveDispatch() {
    this.state.liveDispatch = null;
    this.saveState();
  }

  // Customer cancels active booking
  cancelActiveBooking() {
    this.state.activeBooking = null;
    this.state.liveDispatch = null;
    this.saveState();
  }

  // Extend active booking
  extendActiveBooking(additionalHours) {
    if (!this.state.activeBooking) return;
    const additionalPrice = this.getDriverPrice(
      this.state.activeBooking.driver ? this.state.activeBooking.driver.id : 'drv_1',
      additionalHours,
      this.state.activeBooking.tripType
    );
    this.state.activeBooking.durationHours += additionalHours;
    this.state.activeBooking.remainingSeconds += additionalHours * 3600;
    this.state.activeBooking.totalSeconds += additionalHours * 3600;
    if (this.state.activeBooking.fare) {
      this.state.activeBooking.fare.total += additionalPrice;
    } else {
      this.state.activeBooking.totalFare = (this.state.activeBooking.totalFare || 600) + additionalPrice;
    }
    this.saveState();
  }

  resetDefaults() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

window.appState = new StateStore();
