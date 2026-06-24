let reportDataList = [];

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('btnGenReport')) {
    // Set default dates (Current month)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('reportFrom').value = `${y}-${m}-01`;
    document.getElementById('reportTo').value = new Date().toISOString().split('T')[0];

    document.getElementById('btnGenReport').addEventListener('click', generateReport);
    document.getElementById('btnExportCSV').addEventListener('click', exportCSVReport);
  }
});

function generateReport() {
  const from = new Date(document.getElementById('reportFrom').value).getTime();
  const to = new Date(document.getElementById('reportTo').value).getTime() + (24 * 60 * 60 * 1000); // end of day

  if (isNaN(from) || isNaN(to)) {
    showToast('Please specify valid report dates', 'warning');
    return;
  }

  showLoader();
  getCompanyQuery('orders').once('value').then(snap => {
    const data = snap.val() || {};
    const orders = Object.values(data).filter(o => o.createdAt >= from && o.createdAt <= to && o.status !== 'cancelled');
    
    reportDataList = orders;
    
    let totalSales = 0;
    orders.forEach(o => totalSales += Number(o.grandTotal || 0));

    // Summary boxes
    document.getElementById('repSales').textContent = formatCurrency(totalSales);
    document.getElementById('repOrders').textContent = orders.length;
    document.getElementById('repAvg').textContent = orders.length > 0 ? formatCurrency(totalSales / orders.length) : '₹0.00';

    document.getElementById('reportSummaryBox').style.display = 'flex';

    // Populate Table
    const table = document.getElementById('reportTableBody');
    let html = '';
    orders.forEach(o => {
      html += `
        <tr>
          <td class="small fw-semibold">${o.orderId}</td>
          <td class="small">${formatDateTime(o.createdAt)}</td>
          <td>${o.customerName}</td>
          <td>${formatCurrency(o.subtotal)}</td>
          <td>${formatCurrency(o.gstAmount)}</td>
          <td>${o.shippingCharge === 0 ? 'FREE' : formatCurrency(o.shippingCharge)}</td>
          <td class="fw-bold">${formatCurrency(o.grandTotal)}</td>
        </tr>
      `;
    });
    table.innerHTML = html || '<tr><td colspan="7" class="text-center py-3 text-muted">No sales matching date range.</td></tr>';
    document.getElementById('reportTableContainer').style.display = 'block';
    
    hideLoader();
  }).catch(e => {
    hideLoader();
    showToast(e.message, 'error');
  });
}

function exportCSVReport() {
  if (reportDataList.length === 0) return;

  let csv = 'Order ID,Date,Customer,Subtotal (Excl. GST),GST Amount,Shipping,Grand Total\n';
  reportDataList.forEach(o => {
    csv += `"${o.orderId}","${new Date(o.createdAt).toLocaleString()}","${o.customerName}",${o.subtotal},${o.gstAmount},${o.shippingCharge},${o.grandTotal}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nvmTech_SalesReport_${document.getElementById('reportFrom').value}_to_${document.getElementById('reportTo').value}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
