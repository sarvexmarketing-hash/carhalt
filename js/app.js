/* ==========================================================================
   HALT - MAIN APP BOOTSTRAPPER & ROUTER (WEBSITE VERSION)
   Audio synthesizer, toast alerts, role switcher, and live view navigation
   ========================================================================== */

// Web Audio API Synthesizer for rich interactive haptics
class SoundFx {
  constructor() {
    this.ctx = null;
  }

  getContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    return this.ctx;
  }

  playSuccessChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
    } catch (e) {}
  }

  playCarBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }
}

window.soundFx = new SoundFx();

// Global Toast System
window.showToast = function(msg, type = 'accent') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '<i class="fa-solid fa-info-circle"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
  if (type === 'danger') icon = '<i class="fa-solid fa-circle-xmark"></i>';

  toast.innerHTML = `${icon} <span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// Global App Screen Switcher (Website Viewport)
window.switchAppView = function(viewId) {
  const customerView = document.getElementById('customerAppView');
  const driverResultsView = document.getElementById('driverResultsView');
  const trackingView = document.getElementById('liveTrackingDesktopView');
  const driverView = document.getElementById('driverAppView');
  const adminView = document.getElementById('adminAppView');

  if (viewId === 'screen-drivers-results') {
    if (customerView) customerView.style.display = 'none';
    if (driverResultsView) driverResultsView.style.display = 'block';
    if (trackingView) trackingView.style.display = 'none';
    if (driverView) driverView.style.display = 'none';
    if (adminView) adminView.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (viewId === 'screen-tracking' || viewId === 'screen-active-trip') {
    if (customerView) customerView.style.display = 'none';
    if (driverResultsView) driverResultsView.style.display = 'none';
    if (trackingView) trackingView.style.display = 'block';
    if (driverView) driverView.style.display = 'none';
    if (adminView) adminView.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Default: Homepage customer view
  if (customerView) customerView.style.display = 'flex';
  if (driverResultsView) driverResultsView.style.display = 'none';
  if (trackingView) trackingView.style.display = 'none';
  if (driverView) driverView.style.display = 'none';
  if (adminView) adminView.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Website Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Role Switcher Buttons (Customer Website / Driver Partner / Admin Control Hub)
  const roleButtons = document.querySelectorAll('.role-btn-web');
  const customerView = document.getElementById('customerAppView');
  const trackingView = document.getElementById('liveTrackingDesktopView');
  const driverView = document.getElementById('driverAppView');
  const adminView = document.getElementById('adminAppView');

  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const role = btn.dataset.role;

      if (customerView) customerView.style.display = 'none';
      if (trackingView) trackingView.style.display = 'none';
      if (driverView) driverView.style.display = 'none';
      if (adminView) adminView.style.display = 'none';

      if (role === 'customer' && customerView) {
        customerView.style.display = 'flex';
        window.showToast('Viewing Customer Booking Website', 'accent');
      } else if (role === 'driver' && driverView) {
        driverView.style.display = 'block';
        window.showToast('Viewing Driver Partner Portal', 'accent');
      } else if (role === 'admin' && adminView) {
        adminView.style.display = 'block';
        window.showToast('Viewing Admin Pricing & Fleet Control Hub', 'accent');
        if (window.adminCtrl) {
          window.adminCtrl.populatePricingInputs();
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Top banner button to open active ride tracker
  const openTrackerBtn = document.getElementById('btnOpenActiveTracker');
  if (openTrackerBtn) {
    openTrackerBtn.addEventListener('click', () => {
      window.switchAppView('screen-tracking');
      setTimeout(() => {
        window.mapManager.initTrackingMap('trackingMap');
      }, 200);
    });
  }

  // My bookings nav link
  const myBookingsNav = document.getElementById('btnMyBookingsNav');
  if (myBookingsNav) {
    myBookingsNav.addEventListener('click', () => {
      const state = window.appState.get();
      if (state.activeBooking) {
        window.switchAppView('screen-tracking');
        setTimeout(() => {
          window.mapManager.initTrackingMap('trackingMap');
        }, 200);
      } else {
        const historyCount = state.bookingHistory.length;
        window.showToast(`You have ${historyCount} completed trip(s) in your history.`, 'accent');
      }
    });
  }
});
