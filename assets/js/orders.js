document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ordersList')) {
    loadOrders();
  }
});

function loadOrders() {
  getCurrentUser().then(user => {
    if (!user) {
      window.location.href = 'auth/login.html';
      return;
    }

    showLoader();
    const container = document.getElementById('ordersList');
    
    db.ref('orders').orderByChild('userId').equalTo(user.uid).once('value').then(snap => {
      const data = snap.val() || {};

      if (Object.keys(data).length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-journal-x fs-1 text-muted"></i>
            <h4 class="mt-3">No Orders Placed Yet</h4>
            <a href="products.html" class="btn btn-primary mt-3">Shop Now</a>
          </div>
        `;
        hideLoader();
        return;
      }

      // Sort orders descending by date
      const list = Object.keys(data).map(key => data[key]).sort((a,b) => b.createdAt - a.createdAt);
      let html = '';

      list.forEach(order => {
        const itemNames = order.items.map(item => `${item.name} (Qty: ${item.quantity})`).join(', ');
        
        html += `
          <div class="card mb-4 shadow-sm border-light">
            <div class="card-header bg-light border-0 py-3">
              <div class="row align-items-center">
                <div class="col-6 col-md-3">
                  <small class="text-muted d-block">ORDER ID</small>
                  <span class="fw-bold">${order.orderId}</span>
                </div>
                <div class="col-6 col-md-3">
                  <small class="text-muted d-block">DATE PLACED</small>
                  <span>${formatDateTime(order.createdAt)}</span>
                </div>
                <div class="col-6 col-md-3 mt-2 mt-md-0">
                  <small class="text-muted d-block">TOTAL AMOUNT</small>
                  <span class="fw-bold text-primary">${formatCurrency(order.grandTotal)}</span>
                </div>
                <div class="col-6 col-md-3 mt-2 mt-md-0 text-end">
                  <span class="badge ${getStatusClass(order.status)} fs-6 py-2 px-3">${order.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-12 col-md-8">
                  <h6 class="fw-bold mb-2">Order Items:</h6>
                  <p class="text-muted mb-0">${itemNames}</p>
                </div>
                <div class="col-12 col-md-4 text-end mt-3 mt-md-0 d-flex gap-2 justify-content-end align-items-center">
                  ${(order.status === 'pending' || order.status === 'paid' || order.status === 'processing') ? `
                    <button class="btn btn-outline-danger btn-sm" onclick="cancelOrder('${order.orderId}')">
                      <i class="bi bi-x-circle"></i> Cancel Order
                    </button>
                  ` : ''}
                  <button class="btn btn-outline-primary btn-sm" onclick="viewOrderDetails('${order.orderId}')">
                    <i class="bi bi-eye"></i> View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
      hideLoader();
    });
  });
}

function getStatusClass(status) {
  const map = {
    pending: 'bg-warning text-dark',
    paid: 'bg-info text-white',
    processing: 'bg-primary text-white',
    packed: 'bg-secondary text-white',
    shipped: 'bg-dark text-white',
    delivered: 'bg-success text-white',
    cancelled: 'bg-danger text-white',
    returned: 'bg-danger text-white'
  };
  return map[status] || 'bg-secondary text-white';
}

function viewOrderDetails(orderId) {
  showLoader();
  db.ref(`orders/${orderId}`).once('value').then(snap => {
    const order = snap.val();
    if (!order) return;

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
            <h6 class="fw-bold mb-1">Shipping Address:</h6>
            <p class="small text-muted mb-0">
              ${order.shippingAddress.address}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
              Phone: ${order.customerPhone}
            </p>
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
          <div class="col-6">
            <h6 class="fw-bold mb-1">Order Status (Tracking):</h6>
            <span class="badge ${getStatusClass(order.status)}">${order.status.toUpperCase()}</span>
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

function cancelOrder(orderId) {
  if (confirm('Are you sure you want to cancel this order?')) {
    showLoader();
    db.ref(`orders/${orderId}`).update({
      status: 'cancelled',
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      // Return items back to stock quantity
      return db.ref(`orders/${orderId}/items`).once('value').then(snap => {
        const items = snap.val() || [];
        const promises = [];
        items.forEach(item => {
          const p = db.ref(`products/${item.productId}/stockQuantity`).once('value').then(stockSnap => {
            const currentStock = Number(stockSnap.val() || 0);
            return db.ref(`products/${item.productId}/stockQuantity`).set(currentStock + Number(item.quantity));
          });
          promises.push(p);
        });
        return Promise.all(promises);
      });
    }).then(() => {
      hideLoader();
      showToast('Order cancelled successfully', 'success');
      loadOrders();
    }).catch(err => {
      hideLoader();
      showToast(err.message, 'error');
    });
  }
}

window.viewOrderDetails = viewOrderDetails;
window.cancelOrder = cancelOrder;
