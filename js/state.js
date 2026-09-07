/* ==========================================================================
   DRIVERBEE - ON-DEMAND DRIVER PLATFORM STATE STORE
   Professional driver rental on demand for fixed durations (2h, 4h, 6h, 8h)
   ========================================================================== */

const STORAGE_KEY = 'driverbee_on_demand_state_v3';

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
      { id: 'loc_1', label: 'Home', address: 'Koramangala 4th Block, Bengaluru', lat: 12.9352, lng: 77.6245 },
      { id: 'loc_2', label: 'Work', address: 'Indiranagar 100ft Road, Bengaluru', lat: 12.9716, lng: 77.6412 },
      { id: 'loc_3', label: 'Airport', address: 'Kempegowda Int. Airport, Bengaluru', lat: 13.1986, lng: 77.7066 }
    ]
  },

  // Selected Booking Preferences
  selection: {
    pickupAddress: 'Koramangala 4th Block, Bengaluru',
    pickupCoords: [12.9352, 77.6245],
    tripType: 'within', // 'within' | 'outside'
    destinationAddress: '',
    durationHours: 2,
    selectedCategory: 'all',
    selectedDriverId: null,
    carTransmission: 'Automatic', // 'Manual' | 'Automatic' | 'Luxury'
    carModel: 'Hyundai Creta'
  },

  // Professional Verified Drivers Fleet
  drivers: [
    {
      id: 'drv_1',
      name: 'Rajesh Kumar',
      category: 'Top Rated Driver',
      specialty: 'All Cars · Automatic & Manual Expert',
      experienceYears: 8,
      rating: 4.9,
      trips: 1420,
      etaMins: 6,
      distanceKm: 1.2,
      phone: '+91 98450 12345',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      languages: ['English', 'Hindi', 'Kannada'],
      badge: 'Uniformed & Verified',
      isOnline: true,
      currentLocation: [12.9385, 77.6310],
      priceMultiplier: 1.0,
      verifiedKYC: true
    },
    {
      id: 'drv_2',
      name: 'Amit Sharma',
      category: 'Luxury Car Specialist',
      specialty: 'BMW, Mercedes, Audi & High-End SUVs',
      experienceYears: 10,
      rating: 4.9,
      trips: 980,
      etaMins: 8,
      distanceKm: 1.8,
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      languages: ['English', 'Hindi'],
      badge: 'Executive Driver',
      isOnline: true,
      currentLocation: [12.9310, 77.6210],
      priceMultiplier: 1.1,
      verifiedKYC: true
    },
    {
      id: 'drv_3',
      name: 'Suresh Gowda',
      category: 'Outstation Highway Expert',
      specialty: 'Long Distance & Night Driving Specialist',
      experienceYears: 12,
      rating: 4.9,
      trips: 2150,
      etaMins: 7,
      distanceKm: 1.5,
      phone: '+91 99001 55432',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      languages: ['Kannada', 'Tamil', 'Telugu', 'Hindi'],
      badge: 'Highway Veteran',
      isOnline: true,
      currentLocation: [12.9412, 77.6280],
      priceMultiplier: 1.0,
      verifiedKYC: true
    },
    {
      id: 'drv_4',
      name: 'Vikram Singh',
      category: 'City Commute & Party Driver',
      specialty: 'Safe Night Rides & Heavy Traffic Pro',
      experienceYears: 6,
      rating: 4.8,
      trips: 760,
      etaMins: 10,
      distanceKm: 2.2,
      phone: '+91 98800 11223',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      languages: ['Hindi', 'English'],
      badge: 'Quick Dispatched',
      isOnline: true,
      currentLocation: [12.9280, 77.6350],
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
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
      languages: ['English', 'Kannada', 'Hindi'],
      badge: 'VIP White Glove',
      isOnline: true,
      currentLocation: [12.9450, 77.6220],
      priceMultiplier: 1.2,
      verifiedKYC: true
    },
    {
      id: 'drv_6',
      name: 'Praveen Nair',
      category: 'EV & Automatic Specialist',
      specialty: 'Electric Vehicles, Hybrids & DCT/CVT',
      experienceYears: 7,
      rating: 4.9,
      trips: 820,
      etaMins: 9,
      distanceKm: 2.0,
      phone: '+91 97410 55667',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      languages: ['English', 'Malayalam', 'Kannada'],
      badge: 'EV Certified',
      isOnline: true,
      currentLocation: [12.9320, 77.6400],
      priceMultiplier: 1.0,
      verifiedKYC: true
    }
  ],

  // Active Booking State
  activeBooking: null,

  // Booking History
  bookingHistory: [
    {
      id: 'BK-7890',
      driverName: 'Rajesh Kumar',
      date: 'Yesterday, 3:30 PM',
      duration: '4 Hours',
      tripType: 'Within City',
      totalFare: 600,
      status: 'Completed',
      pickup: 'Indiranagar 100ft Rd',
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
    isOnline: true,
    todayEarnings: 2150,
    todayTrips: 3,
    activeRequest: null
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
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
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
    this.listeners.forEach(cb => cb(this.state));
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

  updatePricing(newPricing) {
    this.state.pricing = { ...this.state.pricing, ...newPricing };
    this.saveState();
  }

  setSelection(updates) {
    this.state.selection = { ...this.state.selection, ...updates };
    this.saveState();
  }

  createBooking(bookingData) {
    const bookingId = 'DRV-' + Math.floor(1000 + Math.random() * 9000);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const durationSeconds = (bookingData.durationHours || 2) * 3600;

    const newBooking = {
      id: bookingId,
      createdAt: new Date().toISOString(),
      pickupAddress: bookingData.pickupAddress || this.state.selection.pickupAddress,
      destinationAddress: bookingData.destinationAddress || '',
      tripType: bookingData.tripType || 'within',
      durationHours: bookingData.durationHours || 2,
      remainingSeconds: durationSeconds,
      totalSeconds: durationSeconds,
      driver: bookingData.driver || this.state.drivers[0],
      carModel: bookingData.carModel || 'Your Car',
      fare: bookingData.fare,
      paymentMethod: bookingData.paymentMethod || 'UPI',
      otp: otp,
      status: 'driver_assigned', // 'driver_assigned' | 'driver_on_the_way' | 'arrived' | 'trip_active' | 'completed'
      stepIndex: 1
    };

    this.state.activeBooking = newBooking;
    this.saveState();
    return newBooking;
  }

  updateActiveBooking(updates) {
    if (!this.state.activeBooking) return;
    this.state.activeBooking = { ...this.state.activeBooking, ...updates };
    this.saveState();
  }

  completeActiveBooking() {
    if (!this.state.activeBooking) return;
    const completed = {
      id: this.state.activeBooking.id,
      driverName: this.state.activeBooking.driver.name,
      date: 'Just now',
      duration: `${this.state.activeBooking.durationHours} Hours`,
      tripType: this.state.activeBooking.tripType === 'outside' ? 'Outside City' : 'Within City',
      totalFare: this.state.activeBooking.fare.total,
      status: 'Completed',
      pickup: this.state.activeBooking.pickupAddress,
      ratingGiven: 5
    };

    this.state.bookingHistory.unshift(completed);
    this.state.stats.completedBookings += 1;
    this.state.stats.totalRevenue += completed.totalFare;
    this.state.activeBooking = null;
    this.saveState();
  }

  cancelActiveBooking() {
    this.state.activeBooking = null;
    this.saveState();
  }

  extendActiveBooking(additionalHours) {
    if (!this.state.activeBooking) return;
    const additionalPrice = this.getDriverPrice(
      this.state.activeBooking.driver.id,
      additionalHours,
      this.state.activeBooking.tripType
    );
    this.state.activeBooking.durationHours += additionalHours;
    this.state.activeBooking.remainingSeconds += additionalHours * 3600;
    this.state.activeBooking.totalSeconds += additionalHours * 3600;
    this.state.activeBooking.fare.total += additionalPrice;
    this.saveState();
  }

  resetDefaults() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }
}

window.appState = new StateStore();
