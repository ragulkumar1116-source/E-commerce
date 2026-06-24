document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminCourierTable')) {
    loadCourierOrders();
  }
});

function loadCourierOrders() {
  showLoader();
  const searchId = getUrlParam('search');
  if (searchId) {
    document.getElementById('courierSearchInput').value = searchId;
  }

  db.ref('orders').once('value').then(snap => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(key => data[key]).sort((a,b)=>b.createdAt-a.createdAt);
    
    renderCourierTable(list);

    const triggerFilters = () => {
      const q = document.getElementById('courierSearchInput').value.trim().toLowerCase();
      const status = document.getElementById('courierStatusFilter').value;

      let filtered = [...list];
      if (q) {
        filtered = filtered.filter(o => o.orderId.toLowerCase().includes(q) || 
                                        o.customerName.toLowerCase().includes(q) ||
                                        (o.courierName || '').toLowerCase().includes(q) ||
                                        (o.trackingNumber || '').toLowerCase().includes(q));
      }
      if (status !== 'all') {
        filtered = filtered.filter(o => o.status === status);
      }
      renderCourierTable(filtered);
    };

    document.getElementById('courierSearchInput')?.addEventListener('input', debounce(triggerFilters, 300));
    document.getElementById('courierStatusFilter')?.addEventListener('change', triggerFilters);
    
    if (searchId) triggerFilters();
    hideLoader();
  }).catch(err => {
    hideLoader();
    showToast(err.message, 'error');
  });
}

function renderCourierTable(list) {
  const table = document.getElementById('adminCourierTable');
  if (!table) return;

  if (list.length === 0) {
    table.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No orders found.</td></tr>';
    return;
  }

  let html = '';
  list.forEach(o => {
    const courierVal = o.courierName ? `<strong>${o.courierName}</strong>` : `<span class="text-muted small">Not Set</span>`;
    const trackingVal = o.trackingNumber ? `<code class="text-dark fw-bold">${o.trackingNumber}</code>` : `<span class="text-muted small">Not Set</span>`;
    const dateVal = o.shipmentDate ? formatDate(o.shipmentDate) : `<span class="text-muted small">Not Set</span>`;

    html += `
      <tr>
        <td class="fw-semibold small">${o.orderId}</td>
        <td>
          <div class="fw-semibold">${o.customerName}</div>
          <div class="small text-muted">${o.customerPhone}</div>
        </td>
        <td><span class="badge ${getBadgeClass(o.status)}">${o.status.toUpperCase()}</span></td>
        <td>${courierVal}</td>
        <td>${trackingVal}</td>
        <td class="small">${dateVal}</td>
        <td>
          <div class="d-flex gap-1 justify-content-center">
            <button class="btn btn-xs btn-outline-primary py-1 px-2 small" onclick="viewOrderDetails('${o.orderId}')">
              <i class="bi bi-truck"></i> Manage Courier
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  table.innerHTML = html;
}

function getBadgeClass(status) {
  const map = {
    pending: 'bg-warning text-dark',
    paid: 'bg-info text-white',
    processing: 'bg-primary text-white',
    packed: 'bg-secondary text-white',
    shipped: 'bg-dark text-white',
    out_for_delivery: 'bg-info text-white',
    delivered: 'bg-success text-white',
    cancelled: 'bg-danger text-white'
  };
  return map[status] || 'bg-secondary';
}

function viewOrderDetails(orderId) {
  showLoader();
  db.ref(`orders/${orderId}`).once('value').then(snap => {
    const order = snap.val();
    if (!order) {
      hideLoader();
      showToast('Order details not found', 'error');
      return;
    }

    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0 fw-bold">${item.name}</h6>
            <small class="text-muted">Brand: ${item.brand} | Qty: ${item.quantity}</small>
          </div>
          <span>${formatCurrency(item.discountPrice || item.price)}</span>
        </li>
      `;
    });

    const modalBody = `
      <div class="container-fluid">
        <div class="row">
          <!-- Left Column: Details -->
          <div class="col-md-7 border-end">
            <div class="mb-3">
              <h6 class="fw-bold mb-1">Customer Shipping Address:</h6>
              <p class="small text-muted mb-2">
                <strong>${order.customerName}</strong><br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
                Phone: ${order.customerPhone}<br>
                Email: ${order.customerEmail || 'N/A'}
              </p>
              ${order.gstNumber ? `<p class="small text-dark mb-0 mt-2"><strong>GSTIN:</strong> ${order.gstNumber}</p>` : ''}
            </div>
            
            <div class="mb-3">
              <h6 class="fw-bold mb-1">Billing Summary:</h6>
              <p class="small text-muted mb-0">
                Subtotal: ${formatCurrency(order.subtotal)} | 
                GST: ${formatCurrency(order.gstAmount)} | 
                Shipping: ${order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}<br>
                <strong>Grand Total: ${formatCurrency(order.grandTotal)}</strong>
              </p>
            </div>

            <div class="mb-3">
              <h6 class="fw-bold mb-2">Order Items:</h6>
              <ul class="list-group mb-0 small" style="max-height: 180px; overflow-y: auto;">${itemsHtml}</ul>
            </div>

            <div class="row mt-2">
              <div class="col-6">
                <h6 class="fw-bold mb-1 small text-muted">Payment Status:</h6>
                <span class="badge ${(order.paymentStatus || 'pending').toUpperCase() === 'APPROVED' ? 'bg-success' : 'bg-warning'}">${(order.paymentStatus || 'pending_verification').toUpperCase()}</span>
              </div>
              <div class="col-6">
                <h6 class="fw-bold mb-1 small text-muted">Order Status:</h6>
                <span class="badge bg-primary">${order.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Shipment Configuration Card -->
          <div class="col-md-5">
            <div class="card border-0 bg-light">
              <div class="card-body p-3">
                <h6 class="fw-bold text-primary mb-3"><i class="bi bi-truck"></i> Shipment & Tracking</h6>
                
                <div class="mb-2">
                  <label class="form-label small fw-semibold mb-1">Courier Name</label>
                  <input type="text" class="form-control form-control-sm" id="courierNameInput" list="courierList" value="${order.courierName || ''}" placeholder="e.g. Blue Dart">
                  <datalist id="courierList">
                    <option value="Blue Dart">
                    <option value="Professional Courier">
                    <option value="ST Courier">
                    <option value="DTDC">
                    <option value="Delhivery">
                    <option value="India Post">
                  </datalist>
                </div>

                <div class="mb-2">
                  <label class="form-label small fw-semibold mb-1">Docket / Tracking Number</label>
                  <input type="text" class="form-control form-control-sm" id="trackingNumberInput" value="${order.trackingNumber || ''}" placeholder="Enter Tracking Number">
                </div>

                <div class="mb-2">
                  <label class="form-label small fw-semibold mb-1">Shipment Date</label>
                  <input type="date" class="form-control form-control-sm" id="shipmentDateInput" value="${order.shipmentDate || ''}">
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-semibold mb-1">Delivery Status</label>
                  <select class="form-select form-select-sm" id="shipmentStatusInput">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="packed" ${order.status === 'packed' ? 'selected' : ''}>Packed</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="out_for_delivery" ${order.status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </div>

                <button class="btn btn-primary btn-sm w-100 mb-2" onclick="saveCourierDetails('${orderId}')"><i class="bi bi-save"></i> Save Courier Details</button>
                
                ${order.trackingNumber ? `
                  <a href="${getCourierTrackingUrl(order.courierName, order.trackingNumber)}" target="_blank" class="btn btn-outline-secondary btn-sm w-100 mb-3"><i class="bi bi-geo-alt"></i> Track Shipment</a>
                ` : ''}

                <div class="mt-2 border-top pt-2">
                  <label class="fw-bold small text-muted mb-2 d-block">Notify Customer via:</label>
                  <div class="d-flex gap-1 justify-content-between">
                    <button class="btn btn-outline-success btn-xs py-1 px-2 small flex-grow-1" onclick="notifyCustomer('${orderId}', 'whatsapp')"><i class="bi bi-whatsapp"></i> WhatsApp</button>
                    <button class="btn btn-outline-primary btn-xs py-1 px-2 small flex-grow-1" onclick="notifyCustomer('${orderId}', 'email')"><i class="bi bi-envelope"></i> Email</button>
                    <button class="btn btn-outline-info btn-xs py-1 px-2 small flex-grow-1" onclick="notifyCustomer('${orderId}', 'sms')"><i class="bi bi-chat-left-text"></i> SMS</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render modal
    const div = document.createElement('div');
    div.className = "modal fade";
    div.id = "orderDetailModal";
    div.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Manage Shipment - ${orderId}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">${modalBody}</div>
          <div class="modal-footer">
            <a href="print-label.html?id=${orderId}" target="_blank" class="btn btn-success btn-sm"><i class="bi bi-printer"></i> Print Shipping Label</a>
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div);
    const modalEl = new bootstrap.Modal(div);
    modalEl.show();
    
    div.addEventListener('hidden.bs.modal', () => div.remove());
    hideLoader();
  }).catch(err => {
    hideLoader();
    showToast(err.message, 'error');
  });
}

function saveCourierDetails(orderId) {
  const courierName = document.getElementById('courierNameInput').value.trim();
  const trackingNumber = document.getElementById('trackingNumberInput').value.trim();
  const shipmentDate = document.getElementById('shipmentDateInput').value;
  const status = document.getElementById('shipmentStatusInput').value;

  showLoader();
  db.ref(`orders/${orderId}`).update({
    courierName: courierName,
    trackingNumber: trackingNumber,
    shipmentDate: shipmentDate,
    status: status,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    // If order was cancelled, return stock
    if (status === 'cancelled') {
      db.ref(`orders/${orderId}/items`).once('value').then(snap => {
        const items = snap.val() || [];
        items.forEach(item => {
          db.ref(`products/${item.productId}/stockQuantity`).once('value').then(stockSnap => {
            const current = Number(stockSnap.val() || 0);
            db.ref(`products/${item.productId}/stockQuantity`).set(current + Number(item.quantity));
          });
        });
      });
    }

    // Push notification to user
    return db.ref(`orders/${orderId}/userId`).once('value').then(uidSnap => {
      const uid = uidSnap.val();
      const trackingMsg = trackingNumber 
        ? `via ${courierName} (Tracking #: ${trackingNumber})` 
        : '';
      return db.ref(`notifications/${uid}`).push({
        title: `Order Shipment Updated`,
        message: `Your order #${orderId.substring(0,8)} is now: ${status.toUpperCase()} ${trackingMsg}.`,
        read: false,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    });
  }).then(() => {
    hideLoader();
    showToast('Courier details saved successfully', 'success');
    loadCourierOrders();
    const modalEl = bootstrap.Modal.getInstance(document.getElementById('orderDetailModal'));
    if (modalEl) modalEl.hide();
  }).catch(e => {
    hideLoader();
    showToast(e.message, 'error');
  });
}

function notifyCustomer(orderId, type) {
  const courierName = document.getElementById('courierNameInput').value.trim();
  const trackingNumber = document.getElementById('trackingNumberInput').value.trim();
  const status = document.getElementById('shipmentStatusInput').value;

  db.ref(`orders/${orderId}`).once('value').then(snap => {
    const order = snap.val();
    if (!order) {
      showToast('Order details not found', 'error');
      return;
    }

    const companyName = storeSettings.companyName || "E&P SMART";
    const customerName = order.customerName;
    const phone = order.customerPhone;
    const email = order.customerEmail;
    
    const trackingUrl = getCourierTrackingUrl(courierName, trackingNumber);
    const message = `Hello ${customerName}, your order #${orderId.substring(0, 8)} from ${companyName} status is updated to ${status.toUpperCase()}.\n\nCourier: ${courierName || 'N/A'}\nTracking Number: ${trackingNumber || 'N/A'}\nStatus: ${status.toUpperCase()}\nTrack your parcel here: ${trackingUrl}\n\nThank you for shopping with us!`;

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    if (type === 'whatsapp') {
      const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    } else if (type === 'email') {
      if (!email) {
        showToast('Customer email not found!', 'warning');
        return;
      }
      const mailSubject = `Shipment Update for Order #${orderId.substring(0, 8)}`;
      const mailUrl = `mailto:${email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(message)}`;
      window.open(mailUrl, '_blank');
    } else if (type === 'sms') {
      const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, '_blank');
    }
  });
}

// Debounce helper
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

window.viewOrderDetails = viewOrderDetails;
window.saveCourierDetails = saveCourierDetails;
window.notifyCustomer = notifyCustomer;
