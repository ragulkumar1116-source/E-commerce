document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('customersTable')) {
    loadCustomers();
  }
});

function loadCustomers() {
  showLoader();
  db.ref('users').once('value').then(snap => {
    const data = snap.val() || {};
    const table = document.getElementById('customersTable');
    if (!table) return;

    const customers = Object.keys(data)
      .map(key => ({ id: key, ...data[key] }))
      .filter(u => u.role === 'customer');

    if (customers.length === 0) {
      table.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No customers registered yet.</td></tr>';
      hideLoader();
      return;
    }

    // Read order database to count total orders per customer
    db.ref('orders').once('value').then(oSnap => {
      const orders = Object.values(oSnap.val() || {});
      
      let html = '';
      customers.forEach(c => {
        const custOrders = orders.filter(o => o.userId === c.id);
        
        html += `
          <tr>
            <td class="fw-semibold">${c.name || 'Unnamed'}</td>
            <td>${c.email}</td>
            <td>${c.phone || 'N/A'}</td>
            <td class="small">${formatDate(c.createdAt)}</td>
            <td><span class="badge bg-secondary">${custOrders.length} Orders</span></td>
          </tr>
        `;
      });
      table.innerHTML = html;
      hideLoader();
    });
  }).catch(e => {
    hideLoader();
    console.error(e);
  });
}
