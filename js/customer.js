/* ==========================================================================
   DRIVERBEE - ON-DEMAND DRIVER CUSTOMER CONTROLLER
   Booking verified professional drivers for fixed durations (2h, 4h, 6h, 8h)
   Cross-synced in real-time with Driver Partner Portal
   ========================================================================== */

class CustomerController {
  constructor() {
    this.countdownInterval = null;
    this.appliedPromo = null;
    this.selectedPaymentMethod = 'UPI';
    this.currentResultsCategory = 'all';
    this.customHours = 4;
    this.isCustomMode = false;
    this.lastShownReceiptId = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderDurationCards();
    this.renderDrivers();
    this.syncActiveScreen();

    // Listen for state changes (including cross-tab storage events from driver portal)
    window.appState.subscribe(() => {
      this.renderDurationCards();
      this.renderDrivers();
      this.syncActiveSessionBanner();
      this.syncTrackingStateFromStore();
    });

    // Listen for driver arrival event
    window.addEventListener('driverArrivedAtPickup', () => {
      this.onDriverArrived();
    });
  }

  bindEvents() {
    // Backdrop click to dismiss completed ride receipt
    const compModal = document.getElementById('customerCompletedModal');
    if (compModal) {
      compModal.addEventListener('click', (e) => {
        if (e.target === compModal) {
          this.dismissCompletedReceipt();
        }
      });
    }

    // Trip Type Selector (Within City vs Outside City)
    const tripCards = document.querySelectorAll('.trip-type-card');
    tripCards.forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        tripCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        window.appState.setSelection({ tripType: type });
        
        const outstationBox = document.getElementById('outstationDestCard');
        if (outstationBox) {
          if (type === 'outside') {
            outstationBox.classList.add('visible');
          } else {
            outstationBox.classList.remove('visible');
          }
        }

        this.renderDurationCards();
        this.updateCustomDurationDisplay();
        this.renderDrivers();
        window.showToast(`Switched to ${type === 'outside' ? 'Outside City (Outstation Driver)' : 'Within City Driver'} pricing`, 'accent');
      });
    });

    // Duration Selector Cards (Preset 2h, 4h, 6h, 8h)
    document.querySelectorAll('.duration-card[data-hours]:not([data-hours="custom"])').forEach(card => {
      card.addEventListener('click', () => {
        const hours = parseInt(card.dataset.hours, 10);
        this.isCustomMode = false;

        document.querySelectorAll('.duration-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const customPanel = document.getElementById('customDurationPanel');
        if (customPanel) customPanel.classList.remove('visible');

        const customCard = document.getElementById('customDurationCard');
        if (customCard) customCard.classList.remove('active');

        window.appState.setSelection({ durationHours: hours });
        this.renderDrivers();
      });
    });

    // Category Filter Pills on Homepage
    document.querySelectorAll('.cat-pill.fleet-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.dataset.category;
        if (!cat) return;
        document.querySelectorAll('.cat-pill.fleet-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        window.appState.setSelection({ selectedCategory: cat });
        this.renderDrivers();
      });
    });

    // Use GPS Location Button
    const gpsBtn = document.getElementById('useGpsBtn');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        window.showToast('Detecting current GPS pickup location...', 'accent');
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = [pos.coords.latitude, pos.coords.longitude];
              const addr = 'Benz Circle, Vijayawada (GPS Verified)';
              window.appState.setSelection({ pickupAddress: addr, pickupCoords: coords });
              this.updateLocationDisplays(addr);
              window.showToast('Location set! Nearest drivers located.', 'success');
            },
            () => {
              const addr = 'Benz Circle, Vijayawada';
              window.appState.setSelection({ pickupAddress: addr, pickupCoords: [16.5015, 80.6534] });
              this.updateLocationDisplays(addr);
              window.showToast('GPS verified: Benz Circle, Vijayawada', 'success');
            }
          );
        }
      });
    }

    // Promo Code Apply Button
    const promoBtn = document.getElementById('applyPromoBtn');
    if (promoBtn) {
      promoBtn.addEventListener('click', () => {
        const input = document.getElementById('promoCodeInput');
        const code = (input ? input.value : '').trim().toUpperCase();
        if (!code) return;

        const promos = window.appState.get().promos;
        if (promos[code]) {
          this.appliedPromo = code;
          window.showToast(`Coupon ${code} applied! Saved ₹${promos[code].discount}`, 'success');
          this.updateDrawerFare();
        } else {
          window.showToast('Invalid coupon code. Try FIRSTDRIVE or WEEKEND50', 'danger');
        }
      });
    }

    // Payment method selector in modal
    document.querySelectorAll('.pay-method-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.pay-method-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedPaymentMethod = card.dataset.method;
      });
    });

    // Find & Match Available Drivers Action
    const findDriversBtn = document.getElementById('btnFindMatchDrivers');
    if (findDriversBtn) {
      findDriversBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDriversPage();
      });
    }

    // Confirm Booking Action
    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.processBookingConfirmation();
      });
    }

    // Extend Booking in Active Trip
    const extendBtn = document.getElementById('extendTripBtn');
    if (extendBtn) {
      extendBtn.addEventListener('click', () => {
        this.openExtendModal();
      });
    }

    // Emergency SOS
    const sosBtn = document.getElementById('sosBtn');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => {
        this.openSosModal();
      });
    }

    // Simulate Driver Arrived Trigger
    const simArriveBtn = document.getElementById('simArrivedBtn');
    if (simArriveBtn) {
      simArriveBtn.addEventListener('click', () => {
        this.onDriverArrived();
      });
    }
  }

  // Opens the dedicated Matched Drivers Directory Page & Broadcasts Request to Drivers
  openDriversPage() {
    try {
      const searchInp = document.getElementById('locationSearchInput');
      const destInp = document.getElementById('outstationDestInput');

      if (searchInp && searchInp.value) {
        window.appState.setSelection({ pickupAddress: searchInp.value });
      }
      if (destInp && destInp.value) {
        window.appState.setSelection({ destinationAddress: destInp.value });
      }

      const updatedState = window.appState.get();
      const duration = updatedState.selection.durationHours || 4;
      const tripType = updatedState.selection.tripType || 'within';
      const pickup = updatedState.selection.pickupAddress || 'Benz Circle, Vijayawada';

      // 1. Broadcast customer searching / ride request to Driver Portal immediately
      window.appState.broadcastBookingRequest({
        durationHours: duration,
        tripType: tripType,
        pickupAddress: pickup,
        carModel: 'Hyundai Creta (Automatic)'
      });

      // 2. Play audio feedback
      if (window.soundFx && typeof window.soundFx.playSuccessChime === 'function') {
        window.soundFx.playSuccessChime();
      }

      // 3. Switch view directly in DOM & via router
      if (typeof window.switchAppView === 'function') {
        window.switchAppView('screen-drivers-results');
      } else {
        const custView = document.getElementById('customerAppView');
        const resultsView = document.getElementById('driverResultsView');
        if (custView) custView.style.display = 'none';
        if (resultsView) resultsView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // 4. Update Summary Header Bar on Results Page
      const locText = document.getElementById('resultsPickupText');
      const durText = document.getElementById('resultsDurationText');
      const tripText = document.getElementById('resultsTripTypeText');
      const price = window.appState.getDurationPrice(duration, tripType);

      if (locText) locText.textContent = pickup.split(',')[0] + ', Vijayawada';
      if (durText) durText.textContent = `${duration} Hours Duration (₹${price.toLocaleString('en-IN')})`;
      if (tripText) tripText.textContent = tripType === 'outside' ? 'Outside City (Outstation)' : 'Within City Drive';

      // 5. Render drivers list
      this.renderDrivers();

      // 6. Initialize interactive map
      setTimeout(() => {
        if (window.mapManager && typeof window.mapManager.initDispatcherMap === 'function') {
          window.mapManager.initDispatcherMap('matchedDriversMap');
        }
      }, 200);

      // 7. Toast notification
      if (typeof window.showToast === 'function') {
        window.showToast(`🔔 Duty request broadcasted to Driver Portal! Available drivers can accept it.`, 'success');
      }
    } catch (err) {
      console.error('Error in openDriversPage:', err);
    }
  }

  filterResultsCategory(cat, btn) {
    this.currentResultsCategory = cat;
    if (btn) {
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    this.renderDrivers();
  }

  selectCustomDurationMode() {
    this.isCustomMode = true;
    document.querySelectorAll('.duration-card').forEach(c => c.classList.remove('active'));
    
    const customCard = document.getElementById('customDurationCard');
    if (customCard) customCard.classList.add('active');

    const customPanel = document.getElementById('customDurationPanel');
    if (customPanel) customPanel.classList.add('visible');

    window.appState.setSelection({ durationHours: this.customHours });
    this.updateCustomDurationDisplay();
    this.renderDrivers();
    window.showToast(`Custom duration set to ${this.customHours} Hour(s)`, 'accent');
  }

  adjustCustomHours(delta) {
    this.customHours = Math.max(2, Math.min(24, this.customHours + delta));
    this.selectCustomDurationMode();
  }

  onCustomSliderChange(val) {
    this.customHours = Math.max(2, Math.min(24, parseInt(val, 10)));
    this.selectCustomDurationMode();
  }

  setCustomHours(hours) {
    this.customHours = Math.max(2, Math.min(24, hours));
    this.selectCustomDurationMode();
  }

  updateCustomDurationDisplay() {
    const state = window.appState.get();
    const tripType = state.selection.tripType;
    const rate = tripType === 'outside' ? 200 : 150;
    const price = window.appState.getDurationPrice(this.customHours, tripType);

    const displayHrs = document.getElementById('customHoursDisplay');
    const displayFare = document.getElementById('customCalculatedFare');
    const displayRate = document.getElementById('customRateBadge');
    const slider = document.getElementById('customDurationSlider');
    const cardPrice = document.getElementById('customCardPrice');
    const cardLabel = document.getElementById('customCardLabel');

    if (displayHrs) displayHrs.textContent = `${this.customHours} Hour${this.customHours > 1 ? 's' : ''}`;
    if (displayFare) displayFare.textContent = `Total Fare: ₹${price.toLocaleString('en-IN')}`;
    if (displayRate) displayRate.textContent = `₹${rate} / hr (${tripType === 'outside' ? 'Outstation' : 'City'})`;
    if (slider) slider.value = this.customHours;
    if (cardPrice) cardPrice.textContent = `₹${price.toLocaleString('en-IN')}`;
    if (cardLabel) cardLabel.textContent = `${this.customHours}h Custom`;

    document.querySelectorAll('.quick-hour-chip').forEach(chip => {
      const match = chip.textContent.trim() === `${this.customHours}h` || (this.customHours === 24 && chip.textContent.includes('24h'));
      if (match) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  setBookingDuration(hours) {
    this.isCustomMode = false;
    window.appState.setSelection({ durationHours: hours });
    
    const customPanel = document.getElementById('customDurationPanel');
    if (customPanel) customPanel.classList.remove('visible');

    this.renderDurationCards();
    this.renderDrivers();
    const targetCard = document.querySelector(`.duration-card[data-hours="${hours}"]`);
    if (targetCard) {
      document.querySelectorAll('.duration-card').forEach(c => c.classList.remove('active'));
      targetCard.classList.add('active');
    }
  }

  updateLocationDisplays(address) {
    const locText = document.getElementById('currentLocText');
    const searchInp = document.getElementById('locationSearchInput');
    if (locText) locText.textContent = address;
    if (searchInp) searchInp.value = address;
  }

  renderDurationCards() {
    const state = window.appState.get();
    const tripType = state.selection.tripType;
    const currentDuration = state.selection.durationHours;
    const durations = [2, 4, 6, 8];
    const isPreset = durations.includes(currentDuration);

    durations.forEach(hours => {
      const price = window.appState.getDurationPrice(hours, tripType);
      const cards = document.querySelectorAll(`.duration-card[data-hours="${hours}"]`);
      cards.forEach(card => {
        const priceEl = card.querySelector('.duration-price') || card.querySelector('.dur-cost');
        if (priceEl) priceEl.textContent = `₹${price.toLocaleString('en-IN')}`;

        const badge = card.querySelector('.duration-badge-trip');
        if (badge) {
          badge.textContent = tripType === 'outside' ? 'Outside City' : 'Within City';
        }

        if (hours === currentDuration && !this.isCustomMode) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    });

    const customCard = document.getElementById('customDurationCard');
    const customPanel = document.getElementById('customDurationPanel');
    if (!isPreset || this.isCustomMode) {
      if (customCard) customCard.classList.add('active');
      if (customPanel) customPanel.classList.add('visible');
      this.customHours = currentDuration;
      this.updateCustomDurationDisplay();
    } else {
      if (customCard && !this.isCustomMode) customCard.classList.remove('active');
      if (customPanel && !this.isCustomMode) customPanel.classList.remove('visible');
    }
  }

  renderDrivers() {
    const state = window.appState.get();
    const tripType = state.selection.tripType;
    const duration = state.selection.durationHours;
    const category = this.currentResultsCategory !== 'all' ? this.currentResultsCategory : state.selection.selectedCategory;

    let drivers = state.drivers;
    if (category && category !== 'all') {
      drivers = drivers.filter(d => d.category.toLowerCase().includes(category.toLowerCase()));
    }

    const generateDriverCardHtml = (driver, isResultsPage = false) => {
      const price = window.appState.getDriverPrice(driver.id, duration, tripType);
      
      if (isResultsPage) {
        return `
          <div class="fleet-car-card" style="border-radius: 24px; padding: 24px; box-shadow: var(--shadow-sm); background: #FFFFFF; border: 1.5px solid #E2E8F0;" data-driver-id="${driver.id}">
            <div class="card-top-badges">
              <span class="badge-fleet-cat" style="background: #EEF4FF; color: #0066FF; font-weight: 800;">${driver.category}</span>
              <span class="badge-fleet-eta"><i class="fa-solid fa-bolt"></i> Reaches in ${driver.etaMins} mins · ${driver.distanceKm} km</span>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; margin: 12px 0 16px;">
              <img src="${driver.avatar}" alt="${driver.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80'" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 3px solid #0066FF; box-shadow: 0 4px 14px rgba(0, 102, 255, 0.25);">
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <h3 style="font-size: 1.35rem; font-weight: 900; color: #0F172A; margin: 0;">${driver.name}</h3>
                  <span class="badge badge-success" style="font-size: 0.72rem;"><i class="fa-solid fa-shield-check"></i> Police Verified</span>
                </div>
                <div style="font-size: 0.88rem; font-weight: 800; color: #F59E0B; margin: 4px 0;">
                  ⭐ ${driver.rating} · ${driver.trips} Rides Completed (${driver.experienceYears}+ Yrs Exp)
                </div>
                <div style="font-size: 0.82rem; color: #64748B;">
                  <i class="fa-solid fa-language" style="color: #0066FF; margin-right: 4px;"></i> Speaks: <b>${driver.languages.join(', ')}</b>
                </div>
              </div>
            </div>
            
            <div style="font-size: 0.88rem; color: #334155; font-weight: 600; margin-bottom: 16px; background: #F8FAFC; padding: 12px 16px; border-radius: 12px; border: 1px solid #E2E8F0;">
              <i class="fa-solid fa-car-side" style="color: #0066FF; margin-right: 8px;"></i> <b>Specialty:</b> ${driver.specialty}
            </div>

            <div class="fleet-car-bottom" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div class="fleet-price-col">
                <span class="fleet-price-amount" style="font-size: 1.6rem; color: #0F172A;">₹${price.toLocaleString('en-IN')}</span>
                <span class="fleet-price-sub" style="font-weight: 700; color: #64748B;">Total for ${duration} Hours (${tripType === 'outside' ? 'Outside City' : 'Within City'})</span>
              </div>
              <div style="display: flex; gap: 10px;">
                <button class="fleet-btn-book" style="padding: 12px 20px; font-size: 0.9rem; background: #F1F5F9; color: #0F172A; border: 1.5px solid #CBD5E1;" onclick="customerCtrl.openBookingDrawer('${driver.id}')">
                  <span>Fare & Details</span>
                </button>
                <button class="fleet-btn-book" style="padding: 12px 24px; font-size: 0.95rem; background: #0066FF; color: #FFFFFF; border: none; box-shadow: 0 4px 14px rgba(0, 102, 255, 0.35);" onclick="customerCtrl.requestDirectDriver('${driver.id}')">
                  <span><i class="fa-solid fa-paper-plane" style="margin-right: 6px;"></i> Request ${driver.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // Homepage Grid Card
      return `
        <div class="fleet-car-card" data-driver-id="${driver.id}">
          <div class="card-top-badges">
            <span class="badge-fleet-cat">${driver.category}</span>
            <span class="badge-fleet-eta"><i class="fa-solid fa-bolt"></i> Reaches in ${driver.etaMins} mins</span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; margin: 12px 0 16px;">
            <img src="${driver.avatar}" alt="${driver.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80'" style="width: 78px; height: 78px; border-radius: 50%; object-fit: cover; border: 3px solid #0066FF; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div>
              <h3 class="fleet-car-title" style="margin-bottom: 2px;">${driver.name}</h3>
              <div style="font-size: 0.82rem; font-weight: 800; color: #F59E0B; margin-bottom: 4px;">
                ⭐ ${driver.rating} · ${driver.trips} Trips
              </div>
              <span class="badge badge-success" style="font-size: 0.7rem;">
                <i class="fa-solid fa-circle-check"></i> Police Verified
              </span>
            </div>
          </div>
          
          <div style="font-size: 0.84rem; color: #475569; font-weight: 600; margin-bottom: 12px; background: #F8FAFC; padding: 10px 14px; border-radius: 12px; border: 1px solid #E2E8F0;">
            <i class="fa-solid fa-car-side" style="color: #0066FF; margin-right: 6px;"></i> ${driver.specialty}
          </div>

          <div class="fleet-car-specs-row" style="margin-bottom: 16px;">
            <span><i class="fa-solid fa-user-tie"></i> ${driver.experienceYears} Yrs Exp</span>
            <span>•</span>
            <span><i class="fa-solid fa-language"></i> ${driver.languages.slice(0, 2).join(', ')}</span>
          </div>

          <div class="fleet-car-bottom">
            <div class="fleet-price-col">
              <span class="fleet-price-amount">₹${price.toLocaleString('en-IN')}</span>
              <span class="fleet-price-sub">for ${duration} Hours (${tripType === 'outside' ? 'Outside City' : 'Within City'})</span>
            </div>
            <button class="fleet-btn-book" onclick="customerCtrl.requestDirectDriver('${driver.id}')">
              Request Driver <i class="fa-solid fa-arrow-right" style="font-size: 0.75rem; margin-left: 4px;"></i>
            </button>
          </div>
        </div>
      `;
    };

    const homeList = document.getElementById('popularCarsList');
    if (homeList) {
      homeList.innerHTML = drivers.map(d => generateDriverCardHtml(d, false)).join('');
    }

    const resultsList = document.getElementById('resultsDriverCardsList');
    if (resultsList) {
      resultsList.innerHTML = drivers.map(d => generateDriverCardHtml(d, true)).join('');
    }
  }

  openBookingDrawer(driverId) {
    const state = window.appState.get();
    const driver = state.drivers.find(d => d.id === driverId);
    if (!driver) return;

    window.appState.setSelection({ selectedDriverId: driverId });
    this.updateDrawerContent(driver);

    const drawerOverlay = document.getElementById('bookingDrawerOverlay');
    if (drawerOverlay) {
      drawerOverlay.classList.add('active');
    }
  }

  closeBookingDrawer() {
    const drawerOverlay = document.getElementById('bookingDrawerOverlay');
    if (drawerOverlay) {
      drawerOverlay.classList.remove('active');
    }
  }

  updateDrawerContent(driver) {
    const state = window.appState.get();
    const tripType = state.selection.tripType;

    const nameEl = document.getElementById('drawerCarName');
    const subEl = document.getElementById('drawerCarSub');
    const imgEl = document.getElementById('drawerCarImg');
    const confirmBtn = document.getElementById('confirmBookingBtn');

    if (nameEl) nameEl.textContent = driver.name;
    if (subEl) subEl.textContent = `${driver.category} · ${driver.experienceYears} Yrs Experience · ${tripType === 'outside' ? 'Outside City Drive' : 'Within City Drive'}`;
    if (imgEl) imgEl.src = driver.avatar;

    if (confirmBtn) {
      confirmBtn.innerHTML = `<span>Send Direct Request to ${driver.name.split(' ')[0]}</span> <i class="fa-solid fa-paper-plane"></i>`;
    }

    this.updateDrawerFare();
  }

  updateDrawerFare() {
    const state = window.appState.get();
    const driverId = state.selection.selectedDriverId;
    const duration = state.selection.durationHours;
    const tripType = state.selection.tripType;

    const fare = window.appState.calculateFareSummary(driverId, duration, tripType, this.appliedPromo);

    const baseEl = document.getElementById('drawerFareBase');
    const insEl = document.getElementById('drawerFareInsurance');
    const discRow = document.getElementById('drawerFareDiscountRow');
    const discEl = document.getElementById('drawerFareDiscount');
    const gstEl = document.getElementById('drawerFareGst');
    const totalEl = document.getElementById('drawerFareTotal');

    if (baseEl) baseEl.textContent = `₹${fare.baseFare.toLocaleString('en-IN')}`;
    if (insEl) insEl.textContent = `₹${fare.insurance}`;
    
    if (fare.discount > 0 && discRow && discEl) {
      discRow.style.display = 'flex';
      discEl.textContent = `-₹${fare.discount}`;
    } else if (discRow) {
      discRow.style.display = 'none';
    }

    if (gstEl) gstEl.textContent = `₹${fare.gst}`;
    if (totalEl) totalEl.textContent = `₹${fare.total.toLocaleString('en-IN')}`;
  }

  // Handle drawer confirm button
  processBookingConfirmation() {
    const state = window.appState.get();
    const driverId = state.selection.selectedDriverId || 'drv_1';
    this.closeBookingDrawer();
    this.requestDirectDriver(driverId);
  }

  // 1. Direct Request to a Specific Driver
  requestDirectDriver(driverId) {
    const state = window.appState.get();
    const driver = state.drivers.find(d => d.id === driverId) || state.drivers[0];
    const duration = state.selection.durationHours || 4;
    const tripType = state.selection.tripType || 'within';
    const pickup = state.selection.pickupAddress || 'Benz Circle, Vijayawada';

    const fare = window.appState.calculateFareSummary(
      driver.id,
      duration,
      tripType,
      this.appliedPromo
    );

    // Broadcast direct request targeted to this driver
    const req = window.appState.broadcastBookingRequest({
      targetDriverId: driver.id,
      targetDriverName: driver.name,
      durationHours: duration,
      tripType: tripType,
      pickupAddress: pickup,
      carModel: state.selection.carModel || 'Hyundai Creta (Automatic)',
      carTransmission: state.selection.carTransmission || 'Automatic',
      fare: fare
    });

    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`🎯 Direct request sent to ${driver.name}. Waiting for driver confirmation...`, 'accent');

    this.openWaitingRoomModal(req);
  }

  // 2. Broadcast to All Drivers Directly (Quick Match)
  broadcastToAllDirectly() {
    const state = window.appState.get();
    const duration = state.selection.durationHours || 4;
    const tripType = state.selection.tripType || 'within';
    const pickup = state.selection.pickupAddress || 'Benz Circle, Vijayawada';

    const req = window.appState.broadcastBookingRequest({
      targetDriverId: null,
      durationHours: duration,
      tripType: tripType,
      pickupAddress: pickup,
      carModel: state.selection.carModel || 'Hyundai Creta (Automatic)'
    });

    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast('⚡ Request broadcasted to all nearby drivers in Vijayawada!', 'success');
    this.openWaitingRoomModal(req);
  }

  // Opens the Waiting Room Modal
  openWaitingRoomModal(req) {
    const modal = document.getElementById('directRequestWaitingModal');
    if (!modal) return;

    const state = window.appState.get();
    const targetDriver = req.targetDriver || (req.targetDriverId ? state.drivers.find(d => d.id === req.targetDriverId) : null);

    const nameEl = document.getElementById('waitingDriverName');
    const avatarEl = document.getElementById('waitingDriverAvatar');
    const ratingEl = document.getElementById('waitingDriverRating');
    const specialtyEl = document.getElementById('waitingDriverSpecialty');
    const etaEl = document.getElementById('waitingDriverEta');
    const statusTextEl = document.getElementById('waitingStatusText');
    const subTextEl = document.getElementById('waitingSubText');
    const altSection = document.getElementById('alternativeDriversSection');
    const altList = document.getElementById('alternativeDriversList');

    if (targetDriver) {
      if (nameEl) nameEl.textContent = targetDriver.name;
      if (avatarEl) avatarEl.src = targetDriver.avatar;
      if (ratingEl) ratingEl.textContent = `⭐ ${targetDriver.rating}`;
      if (specialtyEl) specialtyEl.textContent = `Specialist: ${targetDriver.specialty}`;
      if (etaEl) etaEl.textContent = `~${targetDriver.etaMins} mins away · ${targetDriver.distanceKm} km`;
      if (statusTextEl) statusTextEl.textContent = `Waiting for ${targetDriver.name} to accept your booking...`;
      if (subTextEl) subTextEl.textContent = `Direct dispatch alert sent to ${targetDriver.name}'s Driver Portal.`;
    } else {
      if (nameEl) nameEl.textContent = 'All Available Drivers';
      if (avatarEl) avatarEl.src = 'assets/driverbee-icon.svg';
      if (ratingEl) ratingEl.textContent = `⭐ 4.9 Avg`;
      if (specialtyEl) specialtyEl.textContent = 'Broadcasting to all verified drivers nearby';
      if (etaEl) etaEl.textContent = 'Earliest driver response matches duty';
      if (statusTextEl) statusTextEl.textContent = 'Broadcasting to 6 nearby drivers in Vijayawada...';
      if (subTextEl) subTextEl.textContent = 'First driver to accept will navigate to your doorstep.';
    }

    // Populate alternative drivers list
    const alternatives = state.drivers.filter(d => (!targetDriver || d.id !== targetDriver.id) && d.status !== 'on_trip').slice(0, 2);
    if (altList && alternatives.length > 0) {
      altList.innerHTML = alternatives.map(alt => `
        <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${alt.avatar}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #0066FF;">
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: #0F172A;">${alt.name} <span style="font-size: 0.75rem; color: #F59E0B; font-weight: 800;">⭐ ${alt.rating}</span></div>
              <div style="font-size: 0.78rem; color: #64748B;">${alt.category} · ${alt.etaMins} mins away</div>
            </div>
          </div>
          <button onclick="customerCtrl.switchAlternativeDriver('${alt.id}')" style="background: #10B981; color: #FFFFFF; border: none; padding: 7px 14px; border-radius: 9999px; font-weight: 800; font-size: 0.78rem; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
            <span>Switch & Request</span> <i class="fa-solid fa-arrow-right" style="font-size: 0.7rem;"></i>
          </button>
        </div>
      `).join('');
      if (altSection) altSection.style.display = 'block';
    } else if (altSection) {
      altSection.style.display = 'none';
    }

    modal.classList.add('active');

    // Countdown Timer (30s)
    this.waitingSecondsLeft = 30;
    const fillEl = document.getElementById('directWaitingTimerFill');
    const secEl = document.getElementById('directWaitingSecondsText');

    if (this.waitingTimerInterval) clearInterval(this.waitingTimerInterval);
    this.waitingTimerInterval = setInterval(() => {
      this.waitingSecondsLeft -= 1;
      if (fillEl) fillEl.style.width = `${(this.waitingSecondsLeft / 30) * 100}%`;
      if (secEl) secEl.textContent = `${this.waitingSecondsLeft}s`;

      if (this.waitingSecondsLeft <= 0) {
        clearInterval(this.waitingTimerInterval);
        if (targetDriver) {
          window.showToast(`${targetDriver.name} is occupied. Broadcasting to other nearby drivers...`, 'warning');
          this.fallbackBroadcastToAll();
        }
      }
    }, 1000);
  }

  // Switch direct request to an alternative driver who is active
  switchAlternativeDriver(driverId) {
    window.appState.switchDirectDriver(driverId);
    const state = window.appState.get();
    const driver = state.drivers.find(d => d.id === driverId);
    if (driver) {
      if (window.soundFx) window.soundFx.playSuccessChime();
      window.showToast(`Switched request to ${driver.name}!`, 'success');
      this.openWaitingRoomModal(state.liveDispatch);
    }
  }

  // Fallback to Broadcast to All Drivers
  fallbackBroadcastToAll() {
    window.appState.broadcastToAllDrivers();
    const state = window.appState.get();
    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast('📡 Now broadcasting to all available drivers nearby!', 'accent');
    this.openWaitingRoomModal(state.liveDispatch);
  }

  // Cancel direct waiting request
  cancelDirectRequestWaiting() {
    if (this.waitingTimerInterval) clearInterval(this.waitingTimerInterval);
    const modal = document.getElementById('directRequestWaitingModal');
    if (modal) modal.classList.remove('active');
    window.showToast('Request cancelled. You can select another driver.', 'accent');
  }

  showTrackingScreen(booking) {
    if (this.waitingTimerInterval) clearInterval(this.waitingTimerInterval);
    const modal = document.getElementById('directRequestWaitingModal');
    if (modal) modal.classList.remove('active');

    window.switchAppView('screen-tracking');
    this.populateTrackingDetails(booking);

    setTimeout(() => {
      if (window.mapManager) {
        window.mapManager.initTrackingMap('trackingMap');
      }
    }, 200);

    this.initTripCountdown();
    this.syncActiveSessionBanner();
  }

  populateTrackingDetails(booking) {
    if (!booking) return;

    const driverNameEl = document.getElementById('trackDriverName');
    const driverCarEl = document.getElementById('trackDriverCar');
    const driverPlateEl = document.getElementById('trackDriverPlate');
    const driverAvatarEl = document.getElementById('trackDriverAvatar');
    const otpEl = document.getElementById('trackOtpNumber');

    if (booking.driver) {
      if (driverNameEl) driverNameEl.textContent = booking.driver.name;
      if (driverCarEl) driverCarEl.textContent = `${booking.driver.category} · ${booking.durationHours || 4}h Booked`;
      if (driverPlateEl) driverPlateEl.textContent = `${booking.driver.experienceYears} Yrs Exp`;
      if (driverAvatarEl) driverAvatarEl.src = booking.driver.avatar;
    }

    if (otpEl) otpEl.textContent = booking.otp || '5815';

    // Update status timeline
    const step2 = document.getElementById('stepCarOnWay');
    const step3 = document.getElementById('stepArrived');
    const step4 = document.getElementById('stepTripActive');

    if (booking.status === 'searching') {
      if (step2) { step2.className = 'timeline-step current'; }
      if (step3) { step3.className = 'timeline-step'; }
      if (step4) { step4.className = 'timeline-step'; }
    } else if (booking.status === 'driver_accepted' || booking.status === 'driver_assigned') {
      if (step2) { step2.className = 'timeline-step completed'; }
      if (step3) { step3.className = 'timeline-step current'; }
      if (step4) { step4.className = 'timeline-step'; }
    } else if (booking.status === 'arrived') {
      if (step2) { step2.className = 'timeline-step completed'; }
      if (step3) { step3.className = 'timeline-step completed'; }
      if (step4) { step4.className = 'timeline-step current'; }
    } else if (booking.status === 'trip_active') {
      if (step2) { step2.className = 'timeline-step completed'; }
      if (step3) { step3.className = 'timeline-step completed'; }
      if (step4) { step4.className = 'timeline-step completed'; }
    }
  }

  syncTrackingStateFromStore() {
    const state = window.appState.get();

    // Check if ride was ended by driver
    if (state.lastCompletedTrip && state.lastCompletedTrip.id !== this.lastShownReceiptId) {
      this.lastShownReceiptId = state.lastCompletedTrip.id;
      this.showCustomerCompletedReceipt(state.lastCompletedTrip);
    }

    const booking = state.activeBooking;
    if (!booking) return;

    const isAcceptedOrActive = booking.status === 'driver_accepted' || booking.status === 'driver_assigned' || booking.status === 'arrived' || booking.status === 'trip_active';

    // Check if direct request waiting modal is active
    const waitingModal = document.getElementById('directRequestWaitingModal');
    const isWaitingOpen = waitingModal && waitingModal.classList.contains('active');

    if (isWaitingOpen && isAcceptedOrActive) {
      if (this.waitingTimerInterval) clearInterval(this.waitingTimerInterval);
      waitingModal.classList.remove('active');
      if (window.soundFx) window.soundFx.playSuccessChime();
      window.showToast(`🎉 ${booking.driver ? booking.driver.name : 'Driver'} accepted your request! Reaching your pickup spot in ~${booking.driver ? booking.driver.etaMins : 6} mins.`, 'success');
      this.showTrackingScreen(booking);
      return;
    } else if (isWaitingOpen && booking.status === 'declined_by_driver') {
      const statusTextEl = document.getElementById('waitingStatusText');
      const subTextEl = document.getElementById('waitingSubText');
      if (statusTextEl) statusTextEl.innerHTML = `<span style="color: #EF4444;">${booking.targetDriverName || 'Driver'} is currently unavailable</span>`;
      if (subTextEl) subTextEl.textContent = 'Please switch to an alternative driver below or broadcast to all nearby drivers.';
    }

    // Auto-transition to tracking screen if booking is accepted/active and user is on homepage/results
    const trackingView = document.getElementById('liveTrackingDesktopView');
    const isTrackingVisible = trackingView && trackingView.style.display === 'block';

    if (isAcceptedOrActive && !isTrackingVisible) {
      this.showTrackingScreen(booking);
      return;
    }

    this.populateTrackingDetails(booking);

    // Update Countdown Timer & OTP Box based on whether OTP has been entered
    const timerEl = document.getElementById('activeTripCountdownTimer');
    const headerEl = document.getElementById('activeHudCountdownHeader');
    const subEl = document.getElementById('activeHudCountdownSub');
    const otpBox = document.querySelector('.handover-otp-box');

    const totalSecs = (booking.durationHours || 2) * 3600;

    if (booking.status !== 'trip_active') {
      // PRE-OTP: Timer is paused and waiting for driver to verify OTP
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (timerEl) timerEl.textContent = formatted;
      if (headerEl) headerEl.innerHTML = `<span style="color: #F59E0B; font-weight: 800;"><i class="fa-solid fa-hourglass-start"></i> SESSION DURATION (${booking.durationHours || 2}H BOOKED)</span>`;
      if (subEl) subEl.innerHTML = `<span style="color: #FDE68A; font-weight: 700;">⏳ Timer starts as soon as driver verifies your OTP</span>`;

      if (otpBox) {
        otpBox.style.border = '2px solid #0066FF';
        otpBox.style.background = '#EFF6FF';
      }
    } else {
      // POST-OTP (Trip Active): Timer is live & counting down
      if (!this.hasNotifiedOtpStarted) {
        this.hasNotifiedOtpStarted = true;
        if (window.soundFx) window.soundFx.playSuccessChime();
        window.showToast('🔑 Driver entered Security OTP! Your driving duty session timer is now running.', 'success');
      }

      if (headerEl) headerEl.innerHTML = `<span style="color: #10B981; font-weight: 800;"><i class="fa-solid fa-circle-dot fa-fade"></i> TRIP ACTIVE · DRIVER WITH YOU FOR</span>`;
      if (subEl) subEl.innerHTML = `<span style="color: #94A3B8;">remaining in your booked driving duty</span>`;

      if (otpBox) {
        otpBox.style.border = '1.5px solid #86EFAC';
        otpBox.style.background = '#ECFDF5';
        const otpLabel = otpBox.querySelector('.otp-label');
        if (otpLabel) otpLabel.innerHTML = `<span style="color: #15803D; font-weight: 800;"><i class="fa-solid fa-circle-check"></i> Security OTP Verified</span>`;
      }
    }

    this.initTripCountdown();
  }

  showCustomerCompletedReceipt(receipt) {
    const modal = document.getElementById('customerCompletedModal');
    if (!modal) return;

    const nameEl = document.getElementById('custReceiptDriverName');
    const imgEl = document.getElementById('custReceiptDriverImg');
    const hoursEl = document.getElementById('custReceiptHours');
    const tripTypeEl = document.getElementById('custReceiptTripType');
    const baseEl = document.getElementById('custReceiptBaseFare');
    const gstEl = document.getElementById('custReceiptGst');
    const totalEl = document.getElementById('custReceiptTotal');

    if (nameEl) nameEl.textContent = receipt.driverName || 'Rajesh Kumar';
    if (imgEl && receipt.driver) imgEl.src = receipt.driver.avatar;
    if (hoursEl) hoursEl.textContent = `${receipt.durationHours} Hours Booked`;
    if (tripTypeEl) tripTypeEl.textContent = receipt.tripType || 'Within City Drive';
    if (baseEl) baseEl.textContent = `₹${(receipt.fareBreakdown ? receipt.fareBreakdown.baseRate : receipt.totalFare - 81).toLocaleString('en-IN')}`;
    if (gstEl) gstEl.textContent = `₹${(receipt.fareBreakdown ? receipt.fareBreakdown.gst : 32)}`;
    if (totalEl) totalEl.textContent = `₹${receipt.totalFare.toLocaleString('en-IN')}`;

    if (window.soundFx) window.soundFx.playSuccessChime();
    modal.classList.add('active');
  }

  dismissCompletedReceipt() {
    const modal = document.getElementById('customerCompletedModal');
    if (modal) modal.classList.remove('active');

    const trackModal = document.getElementById('trackingModal');
    if (trackModal) trackModal.classList.remove('active');

    window.appState.clearLastCompletedTrip();
    this.lastShownReceiptId = null;
    this.hasNotifiedOtpStarted = false;
    this.syncActiveSessionBanner();
    window.showToast('✅ Ready to book your next driver!', 'success');

    // Scroll smoothly to booking hero
    const hero = document.getElementById('hero');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  }

  rateDriverAndDismiss(stars = 5) {
    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`⭐ Thank you for rating your driver ${stars} Stars!`, 'success');
    setTimeout(() => {
      this.dismissCompletedReceipt();
    }, 600);
  }

  syncActiveSessionBanner() {
    const state = window.appState.get();
    const banner = document.getElementById('customerActiveSessionAlert');
    const alertText = document.getElementById('activeAlertText');

    if (banner) {
      if (state.activeBooking) {
        banner.style.display = 'block';
        const driverName = state.activeBooking.driver ? state.activeBooking.driver.name : 'Verified Driver';
        if (alertText) {
          alertText.textContent = `${driverName} is assigned to drive your car · ${state.activeBooking.durationHours || 4} Hours Session (${state.activeBooking.status.replace('_', ' ').toUpperCase()})`;
        }
      } else {
        banner.style.display = 'none';
      }
    }
  }

  onDriverArrived() {
    window.appState.driverArrivedAtPickup();
    window.soundFx.playCarBeep();
    window.showToast('🚘 Your Professional Driver has arrived at your doorstep!', 'success');
    this.syncTrackingStateFromStore();
  }

  initTripCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const updateTimerDisplay = () => {
      const state = window.appState.get();
      if (!state.activeBooking) return;

      const booking = state.activeBooking;
      const isTripActive = booking.status === 'trip_active';

      const timerEl = document.getElementById('activeTripCountdownTimer');
      const totalSecs = (booking.durationHours || 2) * 3600;

      // DO NOT DECREMENT if trip is NOT yet active (waiting for OTP)
      if (!isTripActive) {
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (timerEl) timerEl.textContent = formatted;
        return;
      }

      // Initialize remaining seconds if not already initialized
      if (typeof booking.remainingSeconds === 'undefined' || booking.remainingSeconds === null) {
        booking.remainingSeconds = totalSecs;
      }

      const remaining = booking.remainingSeconds;
      if (remaining <= 0) {
        clearInterval(this.countdownInterval);
        return;
      }

      booking.remainingSeconds -= 1;
      
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (timerEl) {
        timerEl.textContent = formatted;
      }
    };

    updateTimerDisplay();
    this.countdownInterval = setInterval(updateTimerDisplay, 1000);
  }

  openExtendModal() {
    const modal = document.getElementById('extendModalOverlay');
    if (modal) modal.classList.add('active');
  }

  closeExtendModal() {
    const modal = document.getElementById('extendModalOverlay');
    if (modal) modal.classList.remove('active');
  }

  applyExtension(hours) {
    window.appState.extendActiveBooking(hours);
    this.closeExtendModal();
    window.showToast(`✨ Driver booking extended by +${hours} Hour(s)!`, 'success');
  }

  openSosModal() {
    const modal = document.getElementById('sosModalOverlay');
    if (modal) modal.classList.add('active');
  }

  closeSosModal() {
    const modal = document.getElementById('sosModalOverlay');
    if (modal) modal.classList.remove('active');
  }

  openLocationModal() {
    const modal = document.getElementById('locationModalOverlay');
    if (modal) modal.classList.remove('active');
  }

  closeLocationModal() {
    const modal = document.getElementById('locationModalOverlay');
    if (modal) modal.classList.remove('active');
  }

  selectQuickLocation(addr, lat, lng) {
    window.appState.setSelection({
      pickupAddress: addr,
      pickupCoords: [lat, lng]
    });
    this.updateLocationDisplays(addr);
    this.closeLocationModal();
    window.showToast(`Driver pickup spot set to ${addr.split(',')[0]}`, 'success');
  }

  syncActiveScreen() {
    const state = window.appState.get();
    this.syncActiveSessionBanner();
    this.syncTrackingStateFromStore();
    if (state.activeBooking) {
      this.initTripCountdown();
    }
  }
}

window.customerCtrl = new CustomerController();
