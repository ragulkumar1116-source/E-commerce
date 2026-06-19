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
        <div class="row mb-3">
          <div class="col-md-6">
            <h6 class="fw-bold mb-1">Customer Shipping Address:</h6>
            <p class="small text-muted mb-0">
              <strong>${order.customerName}</strong><br>
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
              Phone: ${order.customerPhone}<br>
              Email: ${order.customerEmail || 'N/A'}
            </p>
            ${order.gstNumber ? `<p class="small text-dark mb-0 mt-2"><strong>GSTIN:</strong> ${order.gstNumber}</p>` : ''}
          </div>
          <div class="col-md-6 text-md-end">
            <h6 class="fw-bold mb-1">Billing Summary:</h6>
            <p class="small text-muted mb-0">
              Subtotal: ${formatCurrency(order.subtotal)}<br>
              GST: ${formatCurrency(order.gstAmount)}<br>
              Shipping: ${order.shippingCharge === 0 ? 'FREE' : formatCurrency(order.shippingCharge)}<br>
              <strong>Grand Total: ${formatCurrency(order.grandTotal)}</strong>
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <h6 class="fw-bold mb-2">Order Items:</h6>
            <ul class="list-group mb-3">${itemsHtml}</ul>
          </div>
        </div>
        <div class="row mt-2">
          <div class="col-6">
            <h6 class="fw-bold mb-1">Payment Status:</h6>
            <span class="badge ${(order.paymentStatus || 'pending').toUpperCase() === 'APPROVED' ? 'bg-success' : 'bg-warning'}">${(order.paymentStatus || 'pending_verification').toUpperCase()}</span>
          </div>
          <div class="col-6 text-end">
            <h6 class="fw-bold mb-1">Order Status:</h6>
            <span class="badge bg-primary">${order.status.toUpperCase()}</span>
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

window.viewOrderDetails = viewOrderDetails;
