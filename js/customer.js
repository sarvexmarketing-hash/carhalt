/* ==========================================================================
   DRIVERBEE - ON-DEMAND DRIVER CUSTOMER CONTROLLER
   Booking verified professional drivers for fixed durations (2h, 4h, 6h, 8h)
   ========================================================================== */

class CustomerController {
  constructor() {
    this.countdownInterval = null;
    this.appliedPromo = null;
    this.selectedPaymentMethod = 'UPI';
    this.currentResultsCategory = 'all';
    this.customHours = 3;
    this.isCustomMode = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderDurationCards();
    this.renderDrivers();
    this.syncActiveScreen();

    // Listen for state changes
    window.appState.subscribe(() => {
      this.renderDurationCards();
      this.renderDrivers();
      this.syncActiveSessionBanner();
    });

    // Listen for driver arrival event
    window.addEventListener('driverArrivedAtPickup', () => {
      this.onDriverArrived();
    });
  }

  bindEvents() {
    // Trip Type Selector (Within City vs Outside City)
    const tripCards = document.querySelectorAll('.trip-type-card');
    tripCards.forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        tripCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        window.appState.setSelection({ tripType: type });
        
        // Show/hide outstation destination input
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
              const addr = 'Koramangala 4th Block, Bengaluru (GPS Verified)';
              window.appState.setSelection({ pickupAddress: addr, pickupCoords: coords });
              this.updateLocationDisplays(addr);
              window.showToast('Location set! Nearest drivers located.', 'success');
            },
            () => {
              const addr = 'Koramangala 5th Block, Bengaluru';
              window.appState.setSelection({ pickupAddress: addr, pickupCoords: [12.9352, 77.6245] });
              this.updateLocationDisplays(addr);
              window.showToast('GPS verified: Koramangala, Bengaluru', 'success');
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

  // Opens the dedicated Matched Drivers Directory Page
  openDriversPage() {
    const searchInp = document.getElementById('locationSearchInput');
    const destInp = document.getElementById('outstationDestInput');
    const state = window.appState.get();

    if (searchInp && searchInp.value) {
      window.appState.setSelection({ pickupAddress: searchInp.value });
    }
    if (destInp && destInp.value) {
      window.appState.setSelection({ destinationAddress: destInp.value });
    }

    window.soundFx.playSuccessChime();
    window.switchAppView('screen-drivers-results');

    // Update Summary Header Bar on Results Page
    const updatedState = window.appState.get();
    const locText = document.getElementById('resultsPickupText');
    const durText = document.getElementById('resultsDurationText');
    const tripText = document.getElementById('resultsTripTypeText');

    const duration = updatedState.selection.durationHours;
    const tripType = updatedState.selection.tripType;
    const price = window.appState.getDurationPrice(duration, tripType);

    if (locText) locText.textContent = updatedState.selection.pickupAddress.split(',')[0] + ', Bengaluru';
    if (durText) durText.textContent = `${duration} Hours Duration (₹${price.toLocaleString('en-IN')})`;
    if (tripText) tripText.textContent = tripType === 'outside' ? 'Outside City (Outstation)' : 'Within City Drive';

    this.renderDrivers();

    // Initialize radar map on the results page
    setTimeout(() => {
      window.mapManager.initDispatcherMap('matchedDriversMap');
    }, 200);

    window.showToast(`Found 6 verified drivers available in ${updatedState.selection.pickupAddress.split(',')[0]}!`, 'success');
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

    // Update active quick chip
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
          <div class="fleet-car-card" style="border-radius: 24px; padding: 24px; box-shadow: var(--shadow-sm); background: #FFFFFF;" data-driver-id="${driver.id}">
            <div class="card-top-badges">
              <span class="badge-fleet-cat" style="background: #EEF4FF; color: #0066FF; font-weight: 800;">${driver.category}</span>
              <span class="badge-fleet-eta"><i class="fa-solid fa-bolt"></i> Reaches in ${driver.etaMins} mins · ${driver.distanceKm} km</span>
            </div>

            <div style="display: flex; gap: 20px; align-items: flex-start; margin: 12px 0 16px;">
              <img src="${driver.avatar}" alt="${driver.name}" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 3px solid #0066FF; box-shadow: 0 4px 14px rgba(0, 102, 255, 0.25);">
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

            <div class="fleet-car-bottom">
              <div class="fleet-price-col">
                <span class="fleet-price-amount" style="font-size: 1.6rem; color: #0F172A;">₹${price.toLocaleString('en-IN')}</span>
                <span class="fleet-price-sub" style="font-weight: 700; color: #64748B;">Total for ${duration} Hours (${tripType === 'outside' ? 'Outside City' : 'Within City'})</span>
              </div>
              <button class="fleet-btn-book" style="padding: 13px 28px; font-size: 0.95rem;" onclick="customerCtrl.openBookingDrawer('${driver.id}')">
                <span>Hire This Driver</span>
                <i class="fa-solid fa-arrow-right" style="font-size: 0.8rem;"></i>
              </button>
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
            <img src="${driver.avatar}" alt="${driver.name}" style="width: 78px; height: 78px; border-radius: 50%; object-fit: cover; border: 3px solid #0066FF; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
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
            <button class="fleet-btn-book" onclick="customerCtrl.openBookingDrawer('${driver.id}')">
              Hire Driver <i class="fa-solid fa-arrow-right" style="font-size: 0.75rem; margin-left: 4px;"></i>
            </button>
          </div>
        </div>
      `;
    };

    // Render to Homepage List
    const homeList = document.getElementById('popularCarsList');
    if (homeList) {
      homeList.innerHTML = drivers.map(d => generateDriverCardHtml(d, false)).join('');
    }

    // Render to Dedicated Results Page List
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

    if (nameEl) nameEl.textContent = driver.name;
    if (subEl) subEl.textContent = `${driver.category} · ${driver.experienceYears} Yrs Experience · ${tripType === 'outside' ? 'Outside City Drive' : 'Within City Drive'}`;
    if (imgEl) imgEl.src = driver.avatar;

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

  processBookingConfirmation() {
    const state = window.appState.get();
    const driver = state.drivers.find(d => d.id === state.selection.selectedDriverId) || state.drivers[0];
    const fare = window.appState.calculateFareSummary(
      driver.id,
      state.selection.durationHours,
      state.selection.tripType,
      this.appliedPromo
    );

    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
      confirmBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Dispatching Driver...`;
      confirmBtn.disabled = true;
    }

    setTimeout(() => {
      window.soundFx.playSuccessChime();
      const newBooking = window.appState.createBooking({
        driver: driver,
        carModel: state.selection.carModel || 'Customer Car',
        fare: fare,
        paymentMethod: this.selectedPaymentMethod,
        tripType: state.selection.tripType,
        durationHours: state.selection.durationHours
      });

      this.closeBookingDrawer();
      if (confirmBtn) {
        confirmBtn.innerHTML = `<span>Confirm & Dispatch Driver</span> <i class="fa-solid fa-arrow-right"></i>`;
        confirmBtn.disabled = false;
      }

      window.showToast('🎉 Driver Confirmed! Dispatched to your location.', 'success');
      this.showTrackingScreen(newBooking);
    }, 1200);
  }

  showTrackingScreen(booking) {
    window.switchAppView('screen-tracking');
    
    const driverNameEl = document.getElementById('trackDriverName');
    const driverCarEl = document.getElementById('trackDriverCar');
    const driverPlateEl = document.getElementById('trackDriverPlate');
    const driverAvatarEl = document.getElementById('trackDriverAvatar');
    const otpEl = document.getElementById('trackOtpNumber');

    if (driverNameEl) driverNameEl.textContent = booking.driver.name;
    if (driverCarEl) driverCarEl.textContent = booking.driver.category;
    if (driverPlateEl) driverPlateEl.textContent = `${booking.driver.experienceYears} Yrs Exp`;
    if (driverAvatarEl) driverAvatarEl.src = booking.driver.avatar;
    if (otpEl) otpEl.textContent = booking.otp;

    setTimeout(() => {
      window.mapManager.initTrackingMap('trackingMap');
    }, 200);

    this.initTripCountdown();
    this.syncActiveSessionBanner();
  }

  syncActiveSessionBanner() {
    const state = window.appState.get();
    const banner = document.getElementById('customerActiveSessionAlert');
    const alertText = document.getElementById('activeAlertText');

    if (banner) {
      if (state.activeBooking) {
        banner.style.display = 'block';
        if (alertText) {
          alertText.textContent = `${state.activeBooking.driver.name} is assigned to drive your car · ${state.activeBooking.durationHours} Hours Session`;
        }
      } else {
        banner.style.display = 'none';
      }
    }
  }

  onDriverArrived() {
    const booking = window.appState.get().activeBooking;
    if (!booking) return;

    window.soundFx.playCarBeep();
    window.showToast('🚘 Your Professional Driver has arrived at your doorstep!', 'success');

    const step2 = document.getElementById('stepCarOnWay');
    const step3 = document.getElementById('stepArrived');
    const step4 = document.getElementById('stepTripActive');
    
    if (step2) { step2.classList.remove('current'); step2.classList.add('completed'); }
    if (step3) { step3.classList.add('completed'); }
    if (step4) { step4.classList.add('current'); }

    window.appState.updateActiveBooking({
      status: 'trip_active',
      stepIndex: 4
    });
  }

  initTripCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const updateTimerDisplay = () => {
      const state = window.appState.get();
      if (!state.activeBooking) return;

      const remaining = state.activeBooking.remainingSeconds;
      if (remaining <= 0) {
        clearInterval(this.countdownInterval);
        return;
      }

      state.activeBooking.remainingSeconds -= 1;
      
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      const timerEl = document.getElementById('activeTripCountdownTimer');
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
    if (state.activeBooking) {
      this.initTripCountdown();
    }
  }
}

window.customerCtrl = new CustomerController();
