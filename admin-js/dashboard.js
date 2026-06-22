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
        ...CONFIG.store,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    }
  });

  const pCategories = db.ref('categories').once('value').then(snap => {
    if (!snap.exists()) {
      console.log("Seeding default categories...");
      const promises = CONFIG.categories.map(cat => {
        const newCat = { ...cat };
        newCat.createdAt = firebase.database.ServerValue.TIMESTAMP;
        newCat.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        return db.ref('categories').push(newCat);
      });
      return Promise.all(promises);
    }
  });

  const pProducts = db.ref('products').once('value').then(snap => {
    if (!snap.exists()) {
      console.log("Seeding default products...");
      const promises = CONFIG.products.map(p => {
        const newProd = { ...p };
        newProd.createdAt = firebase.database.ServerValue.TIMESTAMP;
        newProd.updatedAt = firebase.database.ServerValue.TIMESTAMP;
        return db.ref('products').push(newProd);
      });
      return Promise.all(promises);
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
