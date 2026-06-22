// Global Configuration defaults (easily customizable in this single file)
const CONFIG = {
  store: {
    companyName: "E&P SMART",
    tagline: "Your Trusted Partner for Electrical & Industrial Solutions",
    logoUrl: "https://res.cloudinary.com/ddlr8lkot/image/upload/v1781878630/ChatGPT_Image_Jun_19_2026_07_46_20_PM_ribkun.png",
    email: "info@epsmart.com",
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
    currencySymbol: "₹",
    upiMerchantId: "merchant@upi"
  },
  
  categories: [
    { name: "MCB", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "Miniature Circuit Breakers", status: "active" },
    { name: "MCCB", image: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=400", description: "Molded Case Circuit Breakers", status: "active" },
    { name: "Relay", image: "https://images.unsplash.com/photo-1590372847085-f3991147f0bc?w=400", description: "Control Relays and Sockets", status: "active" },
    { name: "Contactor", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", description: "Power Contactors & Overloads", status: "active" },
    { name: "PLC", image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?w=400", description: "Programmable Logic Controllers", status: "active" },
    { name: "VFD", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400", description: "Variable Frequency Drives", status: "active" },
    { name: "Sensors", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", description: "Proximity, Photoelectric & Limit Sensors", status: "active" },
    { name: "Cable", image: "https://images.unsplash.com/photo-1601524909162-be87252be298?w=400", description: "Industrial Power & Control Cables", status: "active" },
    { name: "Switches", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "Industrial Control switches", status: "active" },
    { name: "Push Buttons", image: "https://images.unsplash.com/photo-1596495578065-6e076baf155f?w=400", description: "Control Push Buttons & Actuators", status: "active" },
    { name: "Indicator Lamps", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400", description: "LED Panel Indicators", status: "active" },
    { name: "SMPS", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400", description: "Switch Mode Power Supplies", status: "active" },
    { name: "Power Supply", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "Industrial Power Supplies", status: "active" },
    { name: "Instrumentation", image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400", description: "Process Measurement Instruments", status: "active" },
    { name: "Industrial Automation", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400", description: "Industrial Automation Systems", status: "active" }
  ],
  
  products: [
    {
      name: "Siemens 3 Pole Contactor 9A 230V AC Coil",
      sku: "3RT20161AP01",
      brand: "Siemens",
      category: "Contactor",
      subCategory: "Power Contactors",
      hsnCode: "85364900",
      price: 1550.00,
      discountPrice: 1240.00,
      gstPercent: 18,
      stockQuantity: 45,
      weight: "0.3 kg",
      warranty: "12 Months",
      description: "High reliability Siemens 3RT contactor suitable for industrial motor control switching application.",
      specifications: {
        "Poles": "3 Pole",
        "Coil Voltage": "230V AC",
        "Current Rating": "9 Amps",
        "Frequency": "50/60 Hz"
      },
      images: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600",
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600"
      ],
      featured: true,
      bestSeller: true,
      status: "active"
    },
    {
      name: "Schneider Acti9 3 Pole MCB C-Curve 16A 10kA",
      sku: "A9F74316",
      brand: "Schneider Electric",
      category: "MCB",
      subCategory: "Miniature Circuit Breakers",
      hsnCode: "85362030",
      price: 890.00,
      discountPrice: 712.00,
      gstPercent: 18,
      stockQuantity: 120,
      weight: "0.25 kg",
      warranty: "18 Months",
      description: "Schneider Acti9 C120H series MCB with C-Curve characteristic and 10kA breaking capacity for safety industrial protection.",
      specifications: {
        "Poles": "3 Pole",
        "Tripping Curve": "C Curve",
        "Current Rating": "16 Amps",
        "Breaking Capacity": "10 kA"
      },
      images: [
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600"
      ],
      featured: true,
      bestSeller: false,
      status: "active"
    },
    {
      name: "Omron Industrial Photoelectric Sensor 2m Range",
      sku: "E3Z-T61 2M",
      brand: "Omron",
      category: "Sensors",
      subCategory: "Photoelectric Sensors",
      hsnCode: "85365090",
      price: 3200.00,
      discountPrice: 2850.00,
      gstPercent: 18,
      stockQuantity: 8,
      weight: "0.15 kg",
      warranty: "12 Months",
      description: "Compact Omron E3Z photoelectric sensor with through-beam sensing style and built-in amplifier.",
      specifications: {
        "Sensing Mode": "Through-beam",
        "Sensing Distance": "2 Meters",
        "Output Type": "NPN",
        "Power Voltage": "12-24V DC"
      },
      images: [
        "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600"
      ],
      featured: false,
      bestSeller: true,
      status: "active"
    }
  ]
};

// Global shared store settings cached
let storeSettings = { ...CONFIG.store };

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
  return db.ref(`users/${uid}`).once('value').then(snap => {
    const data = snap.val() || {};
    return data.role || 'customer';
  });
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
  if (document.title === "E&P SMART" || !document.title) {
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
      container.className = "nav-item d-flex gap-2 ms-2 align-items-center";
      container.innerHTML = `
        <a class="btn btn-outline-primary btn-sm px-3" href="auth/login.html">Login</a>
        <a class="btn btn-primary btn-sm px-3" href="auth/register.html">Register</a>
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
let hasConnectedOnce = false;
db.ref('.info/connected').on('value', (snap) => {
  if (snap.val() === true) {
    hasConnectedOnce = true;
  } else if (snap.val() === false && hasConnectedOnce) {
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
