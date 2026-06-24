document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('adminOrdersTable')) {
    loadAdminOrders();
  }
});

function loadAdminOrders() {
  showLoader();
  const searchId = getUrlParam('search');
  if (searchId) {
    document.getElementById('orderSearchInput').value = searchId;
  }

  db.ref('orders').once('value').then(snap => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(key => data[key]).sort((a,b)=>b.createdAt-a.createdAt);
    
    renderOrdersTable(list);

    const triggerFilters = () => {
      const q = document.getElementById('orderSearchInput').value.trim().toLowerCase();
      const status = document.getElementById('orderStatusFilter').value;

      let filtered = [...list];
      if (q) {
        filtered = filtered.filter(o => o.orderId.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
      }
      if (status !== 'all') {
        filtered = filtered.filter(o => o.status === status);
      }
      renderOrdersTable(filtered);
    };

    document.getElementById('orderSearchInput')?.addEventListener('input', debounce(triggerFilters, 300));
    document.getElementById('orderStatusFilter')?.addEventListener('change', triggerFilters);
    
    if (searchId) triggerFilters();
    hideLoader();
  });
}

function renderOrdersTable(list) {
  const table = document.getElementById('adminOrdersTable');
  if (list.length === 0) {
    table.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No orders found.</td></tr>';
    return;
  }

  let html = '';
  list.forEach(o => {
    html += `
      <tr>
        <td class="fw-semibold small">${o.orderId}</td>
        <td>${o.customerName}</td>
        <td class="small">${formatDate(o.createdAt)}</td>
        <td>${formatCurrency(o.grandTotal)}</td>
        <td><span class="badge ${o.paymentStatus === 'approved' ? 'bg-success' : 'bg-warning'}">${o.paymentStatus.toUpperCase()}</span></td>
        <td>
          <select class="form-select form-select-sm" onchange="updateOrderStatus('${o.orderId}', this.value)" style="width:130px">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Paid</option>
            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
            <option value="packed" ${o.status === 'packed' ? 'selected' : ''}>Packed</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>Shipped</option>
            <option value="out_for_delivery" ${o.status === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="d-flex gap-1 justify-content-center">
            <button class="btn btn-xs btn-outline-primary py-1 px-2 small" onclick="viewOrderDetails('${o.orderId}')"><i class="bi bi-eye"></i> Details</button>
            <a href="print-label.html?id=${o.orderId}" target="_blank" class="btn btn-xs btn-outline-success py-1 px-2 small"><i class="bi bi-printer"></i> Label</a>
          </div>
        </td>
      </tr>
    `;
  });
  table.innerHTML = html;
}

function updateOrderStatus(orderId, status) {
  showLoader();
  db.ref(`orders/${orderId}`).update({
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

    // Create system notification for customer
    return db.ref(`orders/${orderId}/userId`).once('value').then(uidSnap => {
      const uid = uidSnap.val();
      return db.ref(`notifications/${uid}`).push({
        title: `Order Status Update`,
        message: `Your order #${orderId.substring(0,8)} status has been updated to: ${status.toUpperCase()}`,
        read: false,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    });
  }).then(() => {
    hideLoader();
    showToast(`Order status updated to ${status}`, 'success');
  }).catch(e => {
    hideLoader();
    showToast(e.message, 'error');
  });
}

window.updateOrderStatus = updateOrderStatus;

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
            <small class="text-muted">Brand: ${item.brand} | GST: ${item.gstPercent}%</small>
          </div>
          <span>${item.quantity} × ${formatCurrency(item.discountPrice || item.price)}</span>
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
              <ul class="list-group mb-0 small" style="max-height: 200px; overflow-y: auto;">${itemsHtml}</ul>
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
                  <label class="form-label small fw-semibold mb-1">Courier Service</label>
                  <input type="text" class="form-control form-control-sm" id="courierNameInput" list="courierList" value="${order.courierName || ''}" placeholder="e.g. DTDC">
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
                  <label class="form-label small fw-semibold mb-1">Tracking / Consignment ID</label>
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

                <button class="btn btn-primary btn-sm w-100 mb-2" onclick="saveCourierDetails('${orderId}')"><i class="bi bi-save"></i> Save Details</button>
                
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
            <h5 class="modal-title fw-bold">Order Details - ${orderId}</h5>
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
    showToast('Shipment details saved successfully', 'success');
    loadAdminOrders();
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
    
    // Construct tracking URL using global helper
    const trackingUrl = getCourierTrackingUrl(courierName, trackingNumber);

    // Draft notification text
    const message = `Hello ${customerName}, your order #${orderId.substring(0, 8)} from ${companyName} status is updated to ${status.toUpperCase()}.\n\nCourier: ${courierName || 'N/A'}\nTracking Number: ${trackingNumber || 'N/A'}\nStatus: ${status.toUpperCase()}\nTrack your parcel here: ${trackingUrl}\n\nThank you for shopping with us!`;

    // Clean phone number for WhatsApp
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

window.viewOrderDetails = viewOrderDetails;
window.saveCourierDetails = saveCourierDetails;
window.notifyCustomer = notifyCustomer;
