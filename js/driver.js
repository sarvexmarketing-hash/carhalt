/* ==========================================================================
   CAR-ON-DEMAND - DRIVER PARTNER CONTROLLER
   Online status, booking dispatch, customer navigation, and earnings
   ========================================================================== */

class DriverController {
  constructor() {
    this.requestTimer = null;
    this.requestSecondsLeft = 15;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateDriverUI();
  }

  bindEvents() {
    // Online/Offline Toggle
    const toggle = document.getElementById('driverOnlineToggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        const isOnline = e.target.checked;
        const statusText = document.getElementById('driverStatusLabel');
        const radarCard = document.getElementById('driverRadarCard');
        const offlineNotice = document.getElementById('driverOfflineNotice');

        if (statusText) {
          statusText.textContent = isOnline ? 'You are Online' : 'You are Offline';
          statusText.style.color = isOnline ? '#10B981' : '#94A3B8';
        }

        if (radarCard && offlineNotice) {
          if (isOnline) {
            radarCard.style.display = 'flex';
            offlineNotice.style.display = 'none';
          } else {
            radarCard.style.display = 'none';
            offlineNotice.style.display = 'block';
          }
        }

        window.showToast(isOnline ? '🟢 You are now Online & receiving bookings' : '⚪ You are now Offline', isOnline ? 'success' : 'accent');
      });
    }

    // Driver Simulate Incoming Request button
    const triggerReqBtn = document.getElementById('driverTriggerSimBtn');
    if (triggerReqBtn) {
      triggerReqBtn.addEventListener('click', () => {
        this.triggerSimulatedRideRequest();
      });
    }

    // Reject Request
    const rejectBtn = document.getElementById('driverRejectReqBtn');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        this.closeIncomingRequest();
        window.showToast('Booking request declined', 'accent');
      });
    }

    // Accept Request
    const acceptBtn = document.getElementById('driverAcceptReqBtn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        this.acceptRideRequest();
      });
    }

    // Verify OTP & Handover Car
    const verifyOtpBtn = document.getElementById('driverVerifyOtpBtn');
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => {
        this.verifyOtpAndStart();
      });
    }

    // Complete Driver Handover
    const completeReturnBtn = document.getElementById('driverCompleteReturnBtn');
    if (completeReturnBtn) {
      completeReturnBtn.addEventListener('click', () => {
        this.completeDriverTrip();
      });
    }
  }

  updateDriverUI() {
    const state = window.appState.get();
    const earningsEl = document.getElementById('driverTodayEarnings');
    const tripsEl = document.getElementById('driverTodayTrips');

    if (earningsEl) earningsEl.textContent = `₹${state.driverSession.todayEarnings.toLocaleString('en-IN')}`;
    if (tripsEl) tripsEl.textContent = state.driverSession.todayTrips;
  }

  triggerSimulatedRideRequest() {
    const modal = document.getElementById('driverIncomingModal');
    if (!modal) return;

    window.soundFx.playCarBeep();
    modal.classList.add('active');

    this.requestSecondsLeft = 15;
    const fill = document.getElementById('requestTimerFill');
    if (fill) fill.style.width = '100%';

    if (this.requestTimer) clearInterval(this.requestTimer);
    this.requestTimer = setInterval(() => {
      this.requestSecondsLeft -= 1;
      if (fill) {
        fill.style.width = `${(this.requestSecondsLeft / 15) * 100}%`;
      }
      if (this.requestSecondsLeft <= 0) {
        clearInterval(this.requestTimer);
        this.closeIncomingRequest();
        window.showToast('Request expired', 'warning');
      }
    }, 1000);
  }

  closeIncomingRequest() {
    if (this.requestTimer) clearInterval(this.requestTimer);
    const modal = document.getElementById('driverIncomingModal');
    if (modal) modal.classList.remove('active');
  }

  acceptRideRequest() {
    this.closeIncomingRequest();
    window.soundFx.playSuccessChime();
    window.showToast('🎉 Booking Accepted! Navigating to customer...', 'success');

    // Show driver nav panel
    const radarCard = document.getElementById('driverRadarCard');
    const navCard = document.getElementById('driverActiveTripPanel');
    if (radarCard) radarCard.style.display = 'none';
    if (navCard) navCard.style.display = 'flex';

    setTimeout(() => {
      window.mapManager.initDriverNavMap('driverNavMap');
    }, 200);
  }

  verifyOtpAndStart() {
    const input = document.getElementById('driverOtpInput');
    const val = (input ? input.value : '').trim();

    if (val.length !== 4) {
      window.showToast('Please enter the 4-digit OTP provided by customer', 'danger');
      return;
    }

    window.soundFx.playSuccessChime();
    window.showToast('✅ Key handed over! Customer trip is now ACTIVE.', 'success');

    const otpSection = document.getElementById('driverOtpSection');
    const onTripSection = document.getElementById('driverOnTripSection');
    if (otpSection) otpSection.style.display = 'none';
    if (onTripSection) onTripSection.style.display = 'block';

    // Also update main customer flow
    if (window.customerCtrl) {
      window.customerCtrl.startActiveTrip();
    }
  }

  completeDriverTrip() {
    window.soundFx.playSuccessChime();
    window.showToast('✨ Car returned and verified. ₹600 added to your earnings!', 'success');

    const state = window.appState.get();
    state.driverSession.todayEarnings += 600;
    state.driverSession.todayTrips += 1;
    window.appState.saveState();

    this.updateDriverUI();

    // Reset Driver view
    const navCard = document.getElementById('driverActiveTripPanel');
    const radarCard = document.getElementById('driverRadarCard');
    if (navCard) navCard.style.display = 'none';
    if (radarCard) radarCard.style.display = 'flex';
  }
}

window.driverCtrl = new DriverController();
