/* ==========================================================================
   HALT - ON-DEMAND DRIVER ADMIN CONTROLLER
   Independent pricing matrix for driver rental (2h/4h/6h/8h) & driver fleet
   ========================================================================== */

class AdminController {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.populatePricingInputs();
    this.renderDriversTable();
    this.updateStatsCards();
  }

  bindEvents() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.dataset.tab;
        document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
        
        const target = document.getElementById(`adminTab_${tab}`);
        if (target) {
          target.style.display = 'block';
          if (tab === 'fleetMap') {
            setTimeout(() => {
              window.mapManager.initDispatcherMap('dispatcherMap');
            }, 200);
          }
        }
      });
    });

    const savePricingBtn = document.getElementById('adminSavePricingBtn');
    if (savePricingBtn) {
      savePricingBtn.addEventListener('click', () => {
        this.savePricingMatrix();
      });
    }

    const resetPricingBtn = document.getElementById('adminResetPricingBtn');
    if (resetPricingBtn) {
      resetPricingBtn.addEventListener('click', () => {
        if (confirm('Reset driver pricing to system defaults (Within City ₹300-₹1200 / Outside City ₹400-₹1600)?')) {
          window.appState.resetDefaults();
          this.populatePricingInputs();
          this.updateStatsCards();
          window.showToast('✅ Driver pricing reset to defaults!', 'success');
        }
      });
    }

    const addPromoBtn = document.getElementById('adminAddPromoBtn');
    if (addPromoBtn) {
      addPromoBtn.addEventListener('click', () => {
        const codeInput = document.getElementById('newPromoCode');
        const discInput = document.getElementById('newPromoDiscount');
        const code = (codeInput ? codeInput.value : '').trim().toUpperCase();
        const disc = parseInt(discInput ? discInput.value : '0', 10);

        if (!code || disc <= 0) {
          window.showToast('Please enter a valid coupon code and discount', 'danger');
          return;
        }

        const state = window.appState.get();
        state.promos[code] = { discount: disc, minFare: 300, desc: `₹${disc} driver discount` };
        window.appState.saveState();

        if (codeInput) codeInput.value = '';
        if (discInput) discInput.value = '';
        window.showToast(`🎉 Promo code "${code}" is now active!`, 'success');
      });
    }
  }

  populatePricingInputs() {
    const state = window.appState.get();
    const p = state.pricing;

    const w2 = document.getElementById('priceWithin_2');
    const w4 = document.getElementById('priceWithin_4');
    const w6 = document.getElementById('priceWithin_6');
    const w8 = document.getElementById('priceWithin_8');

    if (w2) w2.value = p.withinCity[2] || 300;
    if (w4) w4.value = p.withinCity[4] || 600;
    if (w6) w6.value = p.withinCity[6] || 900;
    if (w8) w8.value = p.withinCity[8] || 1200;

    const o2 = document.getElementById('priceOutside_2');
    const o4 = document.getElementById('priceOutside_4');
    const o6 = document.getElementById('priceOutside_6');
    const o8 = document.getElementById('priceOutside_8');

    if (o2) o2.value = p.outsideCity[2] || 400;
    if (o4) o4.value = p.outsideCity[4] || 800;
    if (o6) o6.value = p.outsideCity[6] || 1200;
    if (o8) o8.value = p.outsideCity[8] || 1600;

    const gstInput = document.getElementById('priceGst');
    const insInput = document.getElementById('priceInsurance');
    if (gstInput) gstInput.value = p.gstPercent || 5;
    if (insInput) insInput.value = p.insurancePerBooking || 49;
  }

  savePricingMatrix() {
    const w2 = parseInt(document.getElementById('priceWithin_2').value, 10) || 300;
    const w4 = parseInt(document.getElementById('priceWithin_4').value, 10) || 600;
    const w6 = parseInt(document.getElementById('priceWithin_6').value, 10) || 900;
    const w8 = parseInt(document.getElementById('priceWithin_8').value, 10) || 1200;

    const o2 = parseInt(document.getElementById('priceOutside_2').value, 10) || 400;
    const o4 = parseInt(document.getElementById('priceOutside_4').value, 10) || 800;
    const o6 = parseInt(document.getElementById('priceOutside_6').value, 10) || 1200;
    const o8 = parseInt(document.getElementById('priceOutside_8').value, 10) || 1600;

    const gst = parseFloat(document.getElementById('priceGst').value) || 5;
    const ins = parseInt(document.getElementById('priceInsurance').value, 10) || 49;

    window.appState.updatePricing({
      withinCity: { 2: w2, 4: w4, 6: w6, 8: w8 },
      outsideCity: { 2: o2, 4: o4, 6: o6, 8: o8 },
      gstPercent: gst,
      insurancePerBooking: ins
    });

    window.soundFx.playSuccessChime();
    window.showToast('🚀 Driver rates updated! Customer pricing modified immediately.', 'success');
  }

  renderDriversTable() {
    const tbody = document.getElementById('adminFleetTableBody');
    if (!tbody) return;

    const state = window.appState.get();
    tbody.innerHTML = state.drivers.map(driver => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${driver.avatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">
            <div>
              <div style="font-weight: 800; color: #fff;">${driver.name}</div>
              <div style="font-size: 0.75rem; color: #94A3B8;">${driver.category} · ${driver.experienceYears} Yrs Exp</div>
            </div>
          </div>
        </td>
        <td>${driver.languages.join(', ')}</td>
        <td>
          <span style="font-weight: 800; color: #10B981;">${driver.priceMultiplier}x</span> base
        </td>
        <td>
          <span class="badge ${driver.isOnline ? 'badge-success' : 'badge-warning'}">
            ${driver.isOnline ? 'Available & Online' : 'On Active Duty'}
          </span>
        </td>
        <td>
          <button style="background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer;" onclick="adminCtrl.toggleDriverOnline('${driver.id}')">
            Toggle Status
          </button>
        </td>
      </tr>
    `).join('');
  }

  toggleDriverOnline(driverId) {
    const state = window.appState.get();
    const driver = state.drivers.find(d => d.id === driverId);
    if (driver) {
      driver.isOnline = !driver.isOnline;
      window.appState.saveState();
      this.renderDriversTable();
      window.showToast(`Driver ${driver.name} status updated`, 'accent');
    }
  }

  updateStatsCards() {
    const state = window.appState.get();
    const revEl = document.getElementById('adminStatRevenue');
    const bookEl = document.getElementById('adminStatBookings');
    const fleetEl = document.getElementById('adminStatFleet');
    const ratingEl = document.getElementById('adminStatRating');

    if (revEl) revEl.textContent = `₹${state.stats.totalRevenue.toLocaleString('en-IN')}`;
    if (bookEl) bookEl.textContent = state.stats.completedBookings;
    if (fleetEl) fleetEl.textContent = state.drivers.length;
    if (ratingEl) ratingEl.textContent = `⭐ ${state.stats.avgRating}`;
  }
}

window.adminCtrl = new AdminController();
