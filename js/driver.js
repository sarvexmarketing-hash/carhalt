/* ==========================================================================
   DRIVERBEE - DRIVER PARTNER CONTROLLER
   Manages online status, incoming trip dispatches, OTP start, active meters, & receipts
   ========================================================================== */

class DriverController {
  constructor() {
    // Only run inside the dedicated driver partner portal (driver.html)
    const isDriverPortal = window.location.pathname.includes('driver.html') || document.querySelector('.driver-header');
    if (!isDriverPortal) {
      return;
    }

    this.requestTimer = null;
    this.requestSecondsLeft = 30;
    this.tripTimerInterval = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.syncDriverUI();

    // Subscribe to state updates across tabs
    window.appState.subscribe(() => {
      this.syncDriverUI();
    });
  }

  bindEvents() {
    // Online / Offline Toggle
    const toggle = document.getElementById('driverOnlineToggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        const isOnline = e.target.checked;
        const state = window.appState.get();
        state.driverSession.isOnline = isOnline;
        window.appState.saveState();

        const statusText = document.getElementById('driverStatusText') || document.getElementById('driverStatusLabel');
        const statusDot = document.getElementById('driverStatusDot');

        if (statusText) {
          statusText.textContent = isOnline ? 'ONLINE & READY' : 'OFFLINE';
          statusText.style.color = isOnline ? '#10B981' : '#94A3B8';
        }
        if (statusDot) {
          statusDot.style.background = isOnline ? '#10B981' : '#64748B';
          statusDot.style.boxShadow = isOnline ? '0 0 10px #10B981' : 'none';
        }

        window.showToast(isOnline ? '🟢 You are now Online & receiving customer driver requests' : '⚪ You are now Offline', isOnline ? 'success' : 'accent');
      });
    }

    // Simulate Customer Request Button
    const simBtn = document.getElementById('btnSimulateCustomerSearch') || document.getElementById('driverTriggerSimBtn');
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        window.showToast('Simulating customer on-demand driver request...', 'accent');
        const req = window.appState.broadcastBookingRequest({
          durationHours: 4,
          pickupAddress: 'Benz Circle, Vijayawada',
          carModel: 'Hyundai Creta (Automatic)',
          tripType: 'within'
        });
        this.showIncomingDispatchModal(req);
      });
    }

    // Accept Request Button
    const acceptBtn = document.getElementById('btnAcceptRequest') || document.getElementById('driverAcceptReqBtn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        this.acceptIncomingBooking();
      });
    }

    // Decline Request Button
    const declineBtn = document.getElementById('btnDeclineRequest') || document.getElementById('driverRejectReqBtn');
    if (declineBtn) {
      declineBtn.addEventListener('click', () => {
        this.declineIncomingBooking();
      });
    }

    // Driver Arrived Button
    const arrivedBtn = document.getElementById('btnDriverMarkArrived');
    if (arrivedBtn) {
      arrivedBtn.addEventListener('click', () => {
        this.markDriverArrived();
      });
    }

    // Verify OTP Button
    const verifyOtpBtn = document.getElementById('btnVerifyOtpAndStart') || document.getElementById('driverVerifyOtpBtn');
    if (verifyOtpBtn) {
      verifyOtpBtn.addEventListener('click', () => {
        this.verifyOtpAndStart();
      });
    }

    // End Trip Button
    const endTripBtn = document.getElementById('btnDriverEndTrip') || document.getElementById('driverCompleteReturnBtn');
    if (endTripBtn) {
      endTripBtn.addEventListener('click', () => {
        this.endCurrentTrip();
      });
    }

    // Close Receipt Modal Button
    const closeReceiptBtn = document.getElementById('btnCloseCompletedModal');
    if (closeReceiptBtn) {
      closeReceiptBtn.addEventListener('click', () => {
        const modal = document.getElementById('driverCompletedModal');
        if (modal) modal.classList.remove('active');
        this.syncDriverUI();
      });
    }
  }

  syncDriverUI() {
    const isDriverPage = window.location.pathname.includes('driver.html') || document.getElementById('driverRadarSection');
    if (!isDriverPage) return; // Do not show driver dispatch UI on the customer booking website

    const state = window.appState.get();

    // 1. Update KPI Values
    const earningsEl = document.getElementById('kpiEarnings') || document.getElementById('driverTodayEarnings');
    const tripsEl = document.getElementById('kpiTrips') || document.getElementById('driverTodayTrips');
    const ratingEl = document.getElementById('kpiRating');
    const acceptanceEl = document.getElementById('kpiAcceptance');

    if (earningsEl) earningsEl.textContent = `₹${state.driverSession.todayEarnings.toLocaleString('en-IN')}`;
    if (tripsEl) tripsEl.textContent = state.driverSession.todayTrips;
    if (ratingEl) ratingEl.textContent = state.driverSession.driverRating || '4.95';
    if (acceptanceEl) acceptanceEl.textContent = state.driverSession.acceptanceRate || '98%';

    // 2. Render History Table
    this.renderDutyHistory(state.driverSession.tripHistory || []);

    // 3. Check for Live Incoming Dispatch (ONLY in Driver Portal)
    if (state.liveDispatch && state.liveDispatch.status === 'searching' && state.driverSession.isOnline) {
      this.showIncomingDispatchModal(state.liveDispatch);
    } else if (!state.liveDispatch || state.liveDispatch.status !== 'searching') {
      this.closeIncomingModal();
    }

    // 4. Update Console Box State
    const radarSec = document.getElementById('driverRadarSection') || document.getElementById('driverRadarCard');
    const enRouteSec = document.getElementById('driverEnRouteSection');
    const otpSec = document.getElementById('driverOtpSection');
    const activeTripSec = document.getElementById('driverActiveTripSection');

    // Reset visibility if present
    const hideAll = () => {
      if (radarSec) radarSec.style.display = 'none';
      if (enRouteSec) enRouteSec.style.display = 'none';
      if (otpSec) otpSec.style.display = 'none';
      if (activeTripSec) activeTripSec.style.display = 'none';
    };

    const booking = state.activeBooking;

    if (!booking || booking.status === 'searching' || booking.status === 'completed') {
      if (radarSec) radarSec.style.display = 'block';
      if (enRouteSec) enRouteSec.style.display = 'none';
      if (otpSec) otpSec.style.display = 'none';
      if (activeTripSec) activeTripSec.style.display = 'none';
      if (this.tripTimerInterval) clearInterval(this.tripTimerInterval);
    } else if (booking.status === 'driver_assigned' || booking.status === 'driver_accepted') {
      hideAll();
      if (enRouteSec) enRouteSec.style.display = 'block';
      
      const custName = document.getElementById('activeCustomerName');
      const custCar = document.getElementById('activeCustomerCar');
      const custPickup = document.getElementById('activeCustomerPickup');
      if (custName) custName.textContent = booking.customerName || 'Javed Sayed';
      if (custCar) custCar.textContent = `${booking.carModel || 'Customer Car'} · ${booking.durationHours || 4}h Booked`;
      if (custPickup) custPickup.textContent = booking.pickupAddress || 'Benz Circle, Vijayawada';
    } else if (booking.status === 'arrived') {
      hideAll();
      if (otpSec) otpSec.style.display = 'block';
    } else if (booking.status === 'trip_active') {
      hideAll();
      if (activeTripSec) activeTripSec.style.display = 'block';

      const durLbl = document.getElementById('driverTripBookedDuration');
      const carLbl = document.getElementById('driverActiveCarModel');
      const custFareLbl = document.getElementById('driverCustFare');
      const yourEarnLbl = document.getElementById('driverYourEarnings');

      const dur = booking.durationHours || 4;
      const fare = booking.fare ? booking.fare.total : (booking.totalFare || 600);
      const payout = Math.round(fare * 0.8);

      if (durLbl) durLbl.textContent = `${dur} Hours Booked Package (${booking.tripType === 'outside' ? 'Outstation' : 'Within City'})`;
      if (carLbl) carLbl.textContent = booking.carModel || 'Customer Car';
      if (custFareLbl) custFareLbl.textContent = `₹${fare.toLocaleString('en-IN')}`;
      if (yourEarnLbl) yourEarnLbl.textContent = `₹${payout.toLocaleString('en-IN')}`;

      this.startDutyMeterTimer(booking);
    }
  }

  showIncomingDispatchModal(req) {
    if (this.activeModalRequestId === req.id) return;
    this.activeModalRequestId = req.id;

    const modal = document.getElementById('driverIncomingModal');
    if (!modal) return;

    const nameEl = document.getElementById('modalCustomerName');
    const carEl = document.getElementById('modalCustomerCar');
    const payoutEl = document.getElementById('modalDriverPayout');
    const durEl = document.getElementById('modalDurationHours');
    const pickupEl = document.getElementById('modalPickupAddress');

    const dur = req.durationHours || 4;
    const payout = req.driverPayout || Math.round((req.totalFare || 600) * 0.8);

    if (nameEl) nameEl.textContent = req.customerName || 'Javed Sayed';
    if (carEl) carEl.textContent = `${req.carModel || 'Customer Car'} (${req.carTransmission || 'Automatic'})`;
    if (payoutEl) payoutEl.textContent = `₹${payout.toLocaleString('en-IN')}`;
    if (durEl) durEl.textContent = `${dur} Hours Package (${req.tripType === 'outside' ? 'Outside City' : 'Within City'})`;
    if (pickupEl) pickupEl.textContent = req.pickupAddress || 'Benz Circle, Vijayawada';

    const badgeEl = document.getElementById('driverRequestTypeBadge');
    if (badgeEl) {
      if (req.isDirectRequest) {
        badgeEl.style.background = '#FEF3C7';
        badgeEl.style.color = '#92400E';
        badgeEl.style.border = '1.5px solid #F59E0B';
        badgeEl.innerHTML = `<i class="fa-solid fa-star" style="color: #D97706;"></i> ⭐ DIRECT REQUEST: Customer Specifically Picked YOU!`;
      } else {
        badgeEl.style.background = '#EFF6FF';
        badgeEl.style.color = '#1D4ED8';
        badgeEl.style.border = '1px solid #BFDBFE';
        badgeEl.innerHTML = `<i class="fa-solid fa-tower-broadcast"></i> BROADCAST REQUEST (First to accept gets duty)`;
      }
    }

    modal.classList.add('active');
    if (window.soundFx) window.soundFx.playCarBeep();

    this.requestSecondsLeft = 30;
    const fill = document.getElementById('driverDispatchTimerFill') || document.getElementById('requestTimerFill');
    const secText = document.getElementById('dispatchSecondsLeft');

    if (this.requestTimer) clearInterval(this.requestTimer);
    this.requestTimer = setInterval(() => {
      this.requestSecondsLeft -= 1;
      if (fill) fill.style.width = `${(this.requestSecondsLeft / 30) * 100}%`;
      if (secText) secText.textContent = `${this.requestSecondsLeft}s`;

      if (this.requestSecondsLeft <= 0) {
        clearInterval(this.requestTimer);
        this.declineIncomingBooking();
        window.showToast('Request expired', 'warning');
      }
    }, 1000);
  }

  closeIncomingModal() {
    this.activeModalRequestId = null;
    if (this.requestTimer) clearInterval(this.requestTimer);
    const modal = document.getElementById('driverIncomingModal');
    if (modal) modal.classList.remove('active');
  }

  acceptIncomingBooking() {
    this.closeIncomingModal();
    const state = window.appState.get();
    const updated = window.appState.acceptBookingByDriver(state.driverSession.driverId || 'drv_1');

    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`🎉 Duty Accepted! Navigating to customer at ${updated.pickupAddress.split(',')[0]}`, 'success');
    this.syncDriverUI();
  }

  declineIncomingBooking() {
    this.closeIncomingModal();
    window.appState.declineLiveDispatch();
    window.showToast('Duty request declined', 'accent');
  }

  markDriverArrived() {
    window.appState.driverArrivedAtPickup();
    if (window.soundFx) window.soundFx.playCarBeep();
    window.showToast('📍 Arrived at customer location. Ask customer for Security OTP.', 'success');
    this.syncDriverUI();
  }

  verifyOtpAndStart() {
    const input = document.getElementById('driverOtpInput');
    const val = (input ? input.value : '').trim();

    if (!val || val.length !== 4) {
      window.showToast('Please enter the 4-digit Security OTP from the customer', 'danger');
      return;
    }

    const res = window.appState.startActiveRide(val);
    if (!res.success) {
      window.showToast(res.msg || 'Invalid OTP', 'danger');
      return;
    }

    if (input) input.value = '';
    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast('✅ Key handed over! Customer drive is now ACTIVE.', 'success');
    this.syncDriverUI();
  }

  startDutyMeterTimer(booking) {
    if (this.tripTimerInterval) clearInterval(this.tripTimerInterval);

    const timerEl = document.getElementById('driverRemainingTimer');
    const updateTime = () => {
      const state = window.appState.get();
      if (!state.activeBooking || state.activeBooking.status !== 'trip_active') {
        clearInterval(this.tripTimerInterval);
        return;
      }

      const remaining = state.activeBooking.remainingSeconds;
      if (remaining > 0) {
        state.activeBooking.remainingSeconds -= 1;
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (timerEl) timerEl.textContent = formatted;
      }
    };

    updateTime();
    this.tripTimerInterval = setInterval(updateTime, 1000);
  }

  endCurrentTrip() {
    const completed = window.appState.endActiveRide();
    if (!completed) return;

    if (this.tripTimerInterval) clearInterval(this.tripTimerInterval);
    if (window.soundFx) window.soundFx.playSuccessChime();
    window.showToast(`✨ Duty Completed! ₹${completed.driverPayout} credited to your earnings.`, 'success');

    // Show completed receipt modal
    const modal = document.getElementById('driverCompletedModal');
    if (modal) {
      const nameEl = document.getElementById('receiptCustName');
      const hoursEl = document.getElementById('receiptHoursBooked');
      const totalEl = document.getElementById('receiptCustTotal');
      const earnedEl = document.getElementById('receiptDriverEarned');

      if (nameEl) nameEl.textContent = completed.customerName;
      if (hoursEl) hoursEl.textContent = `${completed.durationHours} Hours Booked`;
      if (totalEl) totalEl.textContent = `₹${completed.totalFare.toLocaleString('en-IN')}`;
      if (earnedEl) earnedEl.textContent = `+₹${completed.driverPayout.toLocaleString('en-IN')}`;

      modal.classList.add('active');
    }

    this.syncDriverUI();
  }

  renderDutyHistory(historyList) {
    const tbody = document.getElementById('driverHistoryTableBody');
    if (!tbody) return;

    if (!historyList || historyList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94A3B8;">No completed duties yet today.</td></tr>`;
      return;
    }

    tbody.innerHTML = historyList.map(item => `
      <tr style="border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 14px 16px; font-weight: 800; color: #0066FF;">${item.id}</td>
        <td style="padding: 14px 16px; font-weight: 700; color: #0F172A;">${item.customerName}</td>
        <td style="padding: 14px 16px;"><span style="background: #EEF4FF; color: #0066FF; font-weight: 800; padding: 4px 10px; border-radius: 9999px; font-size: 0.78rem;">${item.hoursBooked} Hours Booked</span></td>
        <td style="padding: 14px 16px; color: #64748B;">${item.pickup}</td>
        <td style="padding: 14px 16px; color: #64748B; font-size: 0.85rem;">${item.time}</td>
        <td style="padding: 14px 16px; font-weight: 900; color: #10B981; text-align: right; font-size: 1.05rem;">+₹${item.amount}</td>
      </tr>
    `).join('');
  }
}

window.driverCtrl = new DriverController();
