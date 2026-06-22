document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('paymentsTable')) {
    loadPayments();
  }
});

function loadPayments() {
  showLoader();
  db.ref('payments').once('value').then(snap => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(key => data[key]).reverse();
    const table = document.getElementById('paymentsTable');
    if (!table) return;

    if (list.length === 0) {
      table.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">No payment transactions submitted.</td></tr>';
      hideLoader();
      return;
    }

    let html = '';
    list.forEach(p => {
      const actionBtn = p.status === 'pending_verification'
        ? `<button class="btn btn-xs btn-success py-1 px-2 small me-1" onclick="verifyPayment('${p.paymentId}', true)"><i class="bi bi-check-circle"></i> Approve</button>
           <button class="btn btn-xs btn-danger py-1 px-2 small" onclick="verifyPayment('${p.paymentId}', false)"><i class="bi bi-x-circle"></i> Reject</button>`
        : `<span class="badge ${p.status === 'approved' ? 'bg-success' : 'bg-danger'}">${p.status.toUpperCase()}</span>`;

      html += `
        <tr>
          <td class="small fw-semibold">${p.paymentId.substring(0,8)}...</td>
          <td class="small">${p.orderId.substring(0,8)}...</td>
          <td class="small">${p.userId.substring(0,8)}...</td>
          <td class="fw-bold text-primary">${formatCurrency(p.amount)}</td>
          <td class="fw-semibold text-secondary">${p.utrNumber}</td>
          <td><span class="badge bg-warning">${p.status.toUpperCase()}</span></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    });
    table.innerHTML = html;
    hideLoader();
  }).catch(e => {
    hideLoader();
    console.error(e);
  });
}

function verifyPayment(paymentId, approve) {
  const status = approve ? 'approved' : 'rejected';
  if (confirm(`Are you sure you want to mark this transaction as ${status.toUpperCase()}?`)) {
    showLoader();
    db.ref(`payments/${paymentId}`).update({
      status: status,
      verifiedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
      // Get order ID
      return db.ref(`payments/${paymentId}/orderId`).once('value');
    }).then(orderIdSnap => {
      const orderId = orderIdSnap.val();
      
      const orderUpdates = {
        paymentStatus: status
      };
      if (approve) {
        orderUpdates.status = 'paid'; // Automatically progress order status to paid
      }

      return db.ref(`orders/${orderId}`).update(orderUpdates).then(() => {
        // Notify user
        return db.ref(`orders/${orderId}/userId`).once('value').then(uidSnap => {
          const uid = uidSnap.val();
          return db.ref(`notifications/${uid}`).push({
            title: approve ? 'Payment Approved!' : 'Payment Transaction Rejected',
            message: approve 
              ? `Your payment of order #${orderId.substring(0,8)} was verified. Order processing initiated.`
              : `Your transaction UTR number for order #${orderId.substring(0,8)} was rejected. Contact store support.`,
            read: false,
            createdAt: firebase.database.ServerValue.TIMESTAMP
          });
        });
      });
    }).then(() => {
      hideLoader();
      showToast(`Transaction was successfully ${status}!`, 'success');
      loadPayments();
    }).catch(e => {
      hideLoader();
      showToast(e.message, 'error');
    });
  }
}

window.verifyPayment = verifyPayment;
