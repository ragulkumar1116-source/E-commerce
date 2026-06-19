document.addEventListener('DOMContentLoaded', () => {
  showLoader();
  seedDatabaseIfNeeded().then(() => {
    return Promise.allSettled([
      loadKPIs(),
      loadCharts(),
      loadRecentOrders()
    ]);
  }).then(() => {
    hideLoader();
  }).catch(err => {
    console.error("Initialization error:", err);
    hideLoader();
  });
});

function seedDatabaseIfNeeded() {
  const pSettings = db.ref('settings/store').once('value').then(snap => {
    if (!snap.exists()) {
      console.log("Seeding settings/store...");
      return db.ref('settings/store').set({
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
        currencySymbol: "₹",
        upiMerchantId: "merchant@upi"
      });
    }
  });

  const pCategories = db.ref('categories').once('value').then(snap => {
    if (!snap.exists()) {
      console.log("Seeding default categories...");
      const defaultCategories = {
        cat1: { name: "MCB", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "Miniature Circuit Breakers", status: "active" },
        cat2: { name: "MCCB", image: "https://images.unsplash.com/photo-1618042164219-62c820f10723?w=400", description: "Molded Case Circuit Breakers", status: "active" },
        cat3: { name: "Relay", image: "https://images.unsplash.com/photo-1590372847085-f3991147f0bc?w=400", description: "Control Relays and Sockets", status: "active" },
        cat4: { name: "Contactor", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", description: "Power Contactors & Overloads", status: "active" },
        cat5: { name: "PLC", image: "https://images.unsplash.com/photo-1581092334651-ddf26d9a1930?w=400", description: "Programmable Logic Controllers", status: "active" },
        cat6: { name: "VFD", image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400", description: "Variable Frequency Drives", status: "active" },
        cat7: { name: "Sensors", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", description: "Proximity, Photoelectric & Limit Sensors", status: "active" },
        cat8: { name: "Cable", image: "https://images.unsplash.com/photo-1601524909162-be87252be298?w=400", description: "Industrial Power & Control Cables", status: "active" },
        cat9: { name: "Switches", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "Industrial Control switches", status: "active" },
        cat10: { name: "Push Buttons", image: "https://images.unsplash.com/photo-1596495578065-6e076baf155f?w=400", description: "Control Push Buttons & Actuators", status: "active" },
        cat11: { name: "Indicator Lamps", image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400", description: "LED Panel Indicators", status: "active" },
        cat12: { name: "SMPS", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400", description: "Switch Mode Power Supplies", status: "active" },
        cat13: { name: "Power Supply", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400", description: "Industrial Power Supplies", status: "active" },
        cat14: { name: "Instrumentation", image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400", description: "Process Measurement Instruments", status: "active" },
        cat15: { name: "Industrial Automation", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400", description: "Industrial Automation Systems", status: "active" }
      };
      return db.ref('categories').set(defaultCategories);
    }
  });

  const pProducts = db.ref('products').once('value').then(snap => {
    if (!snap.exists()) {
      console.log("Seeding default products...");
      const defaultProducts = {
        prod1: {
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
          status: "active",
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        },
        prod2: {
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
          status: "active",
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        },
        prod3: {
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
          status: "active",
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        }
      };
      return db.ref('products').set(defaultProducts);
    }
  });

  return Promise.all([pSettings, pCategories, pProducts]);
}

function loadKPIs() {
  const p1 = db.ref('products').once('value').then(snap => {
    const data = snap.val() || {};
    const list = Object.values(data);
    const kpiProdsEl = document.getElementById('kpiProducts');
    if (kpiProdsEl) kpiProdsEl.textContent = list.length;
    
    const lowStock = list.filter(p => Number(p.stockQuantity) > 0 && Number(p.stockQuantity) <= 10).length;
    const outOfStock = list.filter(p => Number(p.stockQuantity) <= 0).length;
    
    const kpiLowEl = document.getElementById('kpiLowStock');
    if (kpiLowEl) kpiLowEl.textContent = lowStock;
    
    const kpiOutEl = document.getElementById('kpiOutOfStock');
    if (kpiOutEl) kpiOutEl.textContent = outOfStock;
  });

  const p2 = db.ref('users').once('value').then(snap => {
    const data = snap.val() || {};
    const count = Object.values(data).filter(u => u.role === 'customer').length;
    const kpiCustsEl = document.getElementById('kpiCustomers');
    if (kpiCustsEl) kpiCustsEl.textContent = count;
  });

  const p3 = db.ref('orders').once('value').then(snap => {
    const data = snap.val() || {};
    const list = Object.values(data);
    
    const kpiOrdersEl = document.getElementById('kpiOrders');
    if (kpiOrdersEl) kpiOrdersEl.textContent = list.length;
    
    const pendingOrders = list.filter(o => o.status === 'pending').length;
    const kpiPendingOrdersEl = document.getElementById('kpiPendingOrders');
    if (kpiPendingOrdersEl) kpiPendingOrdersEl.textContent = pendingOrders;

    let totalRevenue = 0;
    list.forEach(o => {
      if (o.status !== 'cancelled' && o.status !== 'returned') {
        totalRevenue += Number(o.grandTotal || 0);
      }
    });
    const kpiRevEl = document.getElementById('kpiRevenue');
    if (kpiRevEl) kpiRevEl.textContent = formatCurrency(totalRevenue);
  });

  const p4 = db.ref('payments').once('value').then(snap => {
    const data = snap.val() || {};
    const count = Object.values(data).filter(p => p.status === 'pending_verification').length;
    const kpiPayEl = document.getElementById('kpiPendingPayments');
    if (kpiPayEl) kpiPayEl.textContent = count;
  });

  return Promise.all([p1, p2, p3, p4]);
}

function loadCharts() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js library is not loaded. Skipping chart rendering.");
    return Promise.resolve();
  }

  return db.ref('orders').once('value').then(snap => {
    const data = snap.val() || {};
    const orders = Object.values(data);
    
    // 1. Daily sales (last 30 days)
    const salesByDate = {};
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const dateStr = new Date(now - (i * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      salesByDate[dateStr] = 0;
    }

    orders.forEach(o => {
      if (o.status !== 'cancelled') {
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (salesByDate[dateStr] !== undefined) {
          salesByDate[dateStr] += Number(o.grandTotal || 0);
        }
      }
    });

    const ctxDaily = document.getElementById('dailySalesChart')?.getContext('2d');
    if (ctxDaily) {
      new Chart(ctxDaily, {
        type: 'line',
        data: {
          labels: Object.keys(salesByDate),
          datasets: [{
            label: 'Sales (INR)',
            data: Object.values(salesByDate),
            borderColor: '#0066FF',
            backgroundColor: 'rgba(0, 102, 255, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 2. Payments breakdown
    let approved = 0, pending = 0, rejected = 0;
    orders.forEach(o => {
      if (o.paymentStatus === 'approved') approved++;
      else if (o.paymentStatus === 'pending_verification') pending++;
      else if (o.paymentStatus === 'rejected') rejected++;
    });

    const ctxPay = document.getElementById('paymentStatusChart')?.getContext('2d');
    if (ctxPay) {
      new Chart(ctxPay, {
        type: 'doughnut',
        data: {
          labels: ['Approved', 'Pending', 'Rejected'],
          datasets: [{
            data: [approved, pending, rejected],
            backgroundColor: ['#00C853', '#FFB300', '#FF1744']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 3. Monthly Sales
    const monthlySales = {};
    orders.forEach(o => {
      if (o.status !== 'cancelled') {
        const monthStr = new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        monthlySales[monthStr] = (monthlySales[monthStr] || 0) + Number(o.grandTotal || 0);
      }
    });

    const ctxMonthly = document.getElementById('monthlySalesChart')?.getContext('2d');
    if (ctxMonthly) {
      new Chart(ctxMonthly, {
        type: 'bar',
        data: {
          labels: Object.keys(monthlySales),
          datasets: [{
            label: 'Monthly sales',
            data: Object.values(monthlySales),
            backgroundColor: '#1A2332'
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    // 4. Top Selling Products
    const prodQty = {};
    orders.forEach(o => {
      if (o.status !== 'cancelled' && o.items) {
        o.items.forEach(item => {
          prodQty[item.name] = (prodQty[item.name] || 0) + Number(item.quantity);
        });
      }
    });

    const topProds = Object.keys(prodQty).map(k => ({ name: k, qty: prodQty[k] })).sort((a,b)=>b.qty-a.qty).slice(0,5);
    const ctxTop = document.getElementById('topProductsChart')?.getContext('2d');
    if (ctxTop && topProds.length > 0) {
      new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: topProds.map(p=>p.name),
          datasets: [{
            label: 'Quantity Sold',
            data: topProds.map(p=>p.qty),
            backgroundColor: '#FF6B35'
          }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
      });
    }
  });
}

function loadRecentOrders() {
  const container = document.getElementById('recentOrdersTable');
  if (!container) return Promise.resolve();

  return db.ref('orders').limitToLast(10).once('value').then(snap => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(key => data[key]).reverse();
    let html = '';
    
    if (list.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center text-muted small py-3">No orders placed.</td></tr>';
      return;
    }

    list.forEach(o => {
      html += `
        <tr>
          <td class="fw-semibold">${o.orderId.substring(0, 8)}...</td>
          <td>${o.customerName}</td>
          <td>${formatDate(o.createdAt)}</td>
          <td>${formatCurrency(o.grandTotal)}</td>
          <td><span class="badge ${getBadgeClass(o.status)}">${o.status.toUpperCase()}</span></td>
          <td><a href="orders.html?search=${o.orderId}" class="btn btn-outline-primary btn-xs py-1 px-2 small"><i class="bi bi-eye"></i> View</a></td>
        </tr>
      `;
    });
    container.innerHTML = html;
  });
}

function getBadgeClass(status) {
  const map = {
    pending: 'bg-warning text-dark',
    paid: 'bg-info text-white',
    processing: 'bg-primary text-white',
    packed: 'bg-secondary text-white',
    shipped: 'bg-dark text-white',
    delivered: 'bg-success text-white',
    cancelled: 'bg-danger text-white'
  };
  return map[status] || 'bg-secondary';
}
