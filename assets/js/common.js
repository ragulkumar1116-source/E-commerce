// Global shared store settings cached
let storeSettings = {
  companyName: "nvm Tech",
  tagline: "Your Trusted Partner for Electrical & Industrial Solutions",
  logoUrl: "",
  email: "info@nvmtech.com",
  phone: "+91 98765 43210",
  address: "123, Industrial Area, Phase-1, New Delhi, India",
  facebookUrl: "#",
  instagramUrl: "#",
  twitterUrl: "#",
  linkedinUrl: "#",
  youtubeUrl: "#",
  defaultGst: 18,
  shippingCharges: 100,
  freeShippingThreshold: 5000,
  currencySymbol: "₹"
};

// Toast Notification System
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const bgClasses = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-primary text-white'
  };

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
  };

  const toastHtml = `
    <div class="toast align-items-center ${bgClasses[type] || bgClasses.info} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icons[type] || icons.info}"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = toastHtml.trim();
  const toastEl = div.firstChild;
  container.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 500);
  }, 4000);
}

// Loader Utilities (Disabled globally for instant loading experience)
function showLoader() {
  // Disabled
}

function hideLoader() {
  // Disabled
}

// Currency formatting
function formatCurrency(amount) {
  return storeSettings.currencySymbol + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// GST calculation
function calculateGST(price, gstPercent) {
  const basePrice = price / (1 + (gstPercent / 100));
  const gstAmount = price - basePrice;
  return {
    basePrice: basePrice,
    gstAmount: gstAmount,
    totalPrice: price
  };
}

// Input sanitization & validation
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePhone(phone) {
  const re = /^[6789]\d{9}$/;
  return re.test(phone);
}

function validatePincode(pincode) {
  const re = /^\d{6}$/;
  return re.test(pincode);
}

// Date formatting
function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// URL Params helper
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Auth role checks
function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

function getUserRole(uid) {
  return db.ref(`users/${uid}/role`).once('value').then(snap => snap.val() || 'customer');
}

// Dynamic Branding Loader
function loadStoreSettings() {
  return db.ref('settings/store').once('value').then((snap) => {
    const data = snap.val();
    if (data) {
      storeSettings = { ...storeSettings, ...data };
    }
    applyDynamicBranding();
  }).catch((err) => {
    console.error("Failed to load store settings", err);
    applyDynamicBranding(); // Apply fallback defaults
  });
}

function applyDynamicBranding() {
  // Brand name updates
  const brandNames = document.querySelectorAll('#navBrandName, #footerBrandName, #footerCopyright, #sidebarBrandName');
  brandNames.forEach(el => el.textContent = storeSettings.companyName);

  // Logo updates
  const logoImg = document.getElementById('navLogo');
  if (logoImg) {
    if (storeSettings.logoUrl) {
      logoImg.src = storeSettings.logoUrl;
      logoImg.classList.remove('d-none');
    } else {
      logoImg.classList.add('d-none');
    }
  }

  // Admin Sidebar branding
  const sidebarBrand = document.querySelector('.sidebar-brand');
  if (sidebarBrand) {
    let sidebarLogoImg = sidebarBrand.querySelector('img');
    const sidebarIcon = sidebarBrand.querySelector('.bi-lightning-charge-fill');
    
    if (storeSettings.logoUrl) {
      if (!sidebarLogoImg) {
        sidebarLogoImg = document.createElement('img');
        sidebarLogoImg.style.height = '32px';
        sidebarLogoImg.style.objectFit = 'contain';
        sidebarLogoImg.style.marginRight = '8px';
        sidebarBrand.insertBefore(sidebarLogoImg, sidebarBrand.firstChild);
      }
      sidebarLogoImg.src = storeSettings.logoUrl;
      if (sidebarIcon) sidebarIcon.style.display = 'none';
    } else {
      if (sidebarLogoImg) sidebarLogoImg.remove();
      if (sidebarIcon) sidebarIcon.style.display = 'inline-block';
    }
  }

  // Footer fields
  const ftTagline = document.getElementById('footerTagline');
  if (ftTagline) ftTagline.textContent = storeSettings.tagline;

  const ftAddress = document.getElementById('footerAddress');
  if (ftAddress) ftAddress.textContent = storeSettings.address;

  const ftEmail = document.getElementById('footerEmail');
  if (ftEmail) ftEmail.textContent = storeSettings.email;

  const ftPhone = document.getElementById('footerPhone');
  if (ftPhone) ftPhone.textContent = storeSettings.phone;

  // Social Links
  const fb = document.getElementById('socialFb'); if (fb) fb.href = storeSettings.facebookUrl;
  const insta = document.getElementById('socialInsta'); if (insta) insta.href = storeSettings.instagramUrl;
  const tw = document.getElementById('socialTwitter'); if (tw) tw.href = storeSettings.twitterUrl;
  const li = document.getElementById('socialLinkedin'); if (li) li.href = storeSettings.linkedinUrl;
  const yt = document.getElementById('socialYoutube'); if (yt) yt.href = storeSettings.youtubeUrl;

  // Document Title prefix
  if (document.title === "nvm Tech" || !document.title) {
    document.title = storeSettings.companyName;
  }
}

// Real-time Cart Badge Updater
function updateCartBadge() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      db.ref(`cart/${user.uid}`).on('value', (snap) => {
        const items = snap.val();
        let totalQty = 0;
        if (items) {
          Object.values(items).forEach(item => {
            totalQty += Number(item.quantity || 1);
          });
        }
        
        const badges = ['cartBadge', 'cartBadgeMobile', 'cartBadgeBottom'];
        badges.forEach(id => {
          const badge = document.getElementById(id);
          if (badge) {
            badge.textContent = totalQty;
            badge.style.display = totalQty > 0 ? 'flex' : 'none';
          }
        });
      });
    } else {
      const badges = ['cartBadge', 'cartBadgeMobile', 'cartBadgeBottom'];
      badges.forEach(id => {
        const badge = document.getElementById(id);
        if (badge) badge.style.display = 'none';
      });
    }
  });
}

// Dynamic Navigation & Profile Dropdown
function renderNavbarMenu() {
  auth.onAuthStateChanged((user) => {
    const container = document.getElementById('userMenuContainer');
    const mobileMenu = document.getElementById('mobileMenuBody');
    if (!container) return;

    if (user) {
      // Authenticated User Dropdown
      db.ref(`users/${user.uid}`).once('value').then((snap) => {
        const userData = snap.val() || {};
        const isAdmin = userData.role === 'admin';
        const displayName = userData.name || user.displayName || 'My Account';

        container.className = "nav-item dropdown";
        container.innerHTML = `
          <a class="nav-link dropdown-toggle btn btn-outline-primary py-1 px-3 ms-2" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle me-1"></i> ${displayName}
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow-md">
            ${isAdmin ? '<li><a class="dropdown-item fw-bold text-primary" href="admin/dashboard.html"><i class="bi bi-speedometer2"></i> Admin Dashboard</a></li>' : ''}
            <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person"></i> My Profile</a></li>
            <li><a class="dropdown-item" href="orders.html"><i class="bi bi-receipt"></i> My Orders</a></li>
            <li><a class="dropdown-item" href="wishlist.html"><i class="bi bi-heart"></i> Wishlist</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" id="btnLogout"><i class="bi bi-box-arrow-left"></i> Logout</a></li>
          </ul>
        `;

        // Mobile Menu render
        if (mobileMenu) {
          mobileMenu.innerHTML = `
            <div class="d-flex align-items-center gap-3 border-bottom pb-3 mb-3">
              <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px; font-weight: 700;">
                ${displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h6 class="mb-0 fw-bold">${displayName}</h6>
                <small class="text-muted">${user.email}</small>
              </div>
            </div>
            <div class="list-group list-group-flush">
              ${isAdmin ? '<a href="admin/dashboard.html" class="list-group-item list-group-item-action text-primary fw-bold"><i class="bi bi-speedometer2 me-2"></i> Admin Dashboard</a>' : ''}
              <a href="index.html" class="list-group-item list-group-item-action"><i class="bi bi-house me-2"></i> Home</a>
              <a href="products.html" class="list-group-item list-group-item-action"><i class="bi bi-grid me-2"></i> Products</a>
              <a href="profile.html" class="list-group-item list-group-item-action"><i class="bi bi-person me-2"></i> Profile</a>
              <a href="orders.html" class="list-group-item list-group-item-action"><i class="bi bi-receipt me-2"></i> My Orders</a>
              <a href="wishlist.html" class="list-group-item list-group-item-action"><i class="bi bi-heart me-2"></i> Wishlist</a>
              <a href="about.html" class="list-group-item list-group-item-action"><i class="bi bi-info-circle me-2"></i> About Us</a>
              <a href="contact.html" class="list-group-item list-group-item-action"><i class="bi bi-telephone me-2"></i> Contact Us</a>
              <a href="#" id="btnLogoutMobile" class="list-group-item list-group-item-action text-danger mt-3"><i class="bi bi-box-arrow-left me-2"></i> Logout</a>
            </div>
          `;
        }

        // Attach logout listeners
        const triggerLogout = (e) => {
          e.preventDefault();
          showLoader();
          auth.signOut().then(() => {
            showToast('Logged out successfully', 'success');
            window.location.href = 'index.html';
          });
        };
        document.getElementById('btnLogout')?.addEventListener('click', triggerLogout);
        document.getElementById('btnLogoutMobile')?.addEventListener('click', triggerLogout);
      });
    } else {
      // Guest Links
      container.className = "nav-item d-flex gap-2";
      container.innerHTML = `
        <a class="btn btn-outline-primary btn-sm" href="auth/login.html">Login</a>
        <a class="btn btn-primary btn-sm" href="auth/register.html">Register</a>
      `;

      if (mobileMenu) {
        mobileMenu.innerHTML = `
          <div class="d-grid gap-2 border-bottom pb-3 mb-3">
            <a href="auth/login.html" class="btn btn-outline-primary">Login</a>
            <a href="auth/register.html" class="btn btn-primary">Register</a>
          </div>
          <div class="list-group list-group-flush">
            <a href="index.html" class="list-group-item list-group-item-action"><i class="bi bi-house me-2"></i> Home</a>
            <a href="products.html" class="list-group-item list-group-item-action"><i class="bi bi-grid me-2"></i> Products</a>
            <a href="about.html" class="list-group-item list-group-item-action"><i class="bi bi-info-circle me-2"></i> About Us</a>
            <a href="contact.html" class="list-group-item list-group-item-action"><i class="bi bi-telephone me-2"></i> Contact Us</a>
          </div>
        `;
      }
    }
  });
}

// Active link helper
function initActiveLinks() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  // Header active state
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile bottom nav active state
  const bottomItems = document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item');
  bottomItems.forEach(item => {
    if (item.getAttribute('href') === currentPath) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Back-to-Top Button
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = "back-to-top btn btn-primary position-fixed shadow-md";
  btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
  btn.style.cssText = "bottom: 80px; right: 20px; z-index: 999; display: none; width: 44px; height: 44px; border-radius: 50%; justify-content: center; align-items: center;";
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Connection Alert listener
db.ref('.info/connected').on('value', (snap) => {
  if (snap.val() === false) {
    showToast("You are offline. Reconnecting...", "warning");
  }
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('SW Registered with scope: ', reg.scope);
    }).catch(err => console.log('SW Registration failed: ', err));
  });
}

// Main initializations
document.addEventListener('DOMContentLoaded', () => {
  hideLoader();
  window.storeSettingsPromise = loadStoreSettings();
  renderNavbarMenu();
  updateCartBadge();
  initActiveLinks();
  initBackToTop();
  
  const yr = document.getElementById('footerYear');
  if (yr) yr.textContent = new Date().getFullYear();
});

// Debounce helper to throttle function executions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
