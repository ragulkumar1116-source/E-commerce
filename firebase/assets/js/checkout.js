let checkoutCartItems = [];
let checkoutTotals = { subtotal: 0, gst: 0, shipping: 0, grandTotal: 0 };

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('checkoutForm')) {
    loadCheckout();
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckout);
  }
});

function loadCheckout() {
  getCurrentUser().then(user => {
    if (!user) {
      window.location.href = 'auth/login.html';
      return;
    }

    showLoader();
    // Load Saved Address fields
    db.ref(`users/${user.uid}`).once('value').then(uSnap => {
      const u = uSnap.val() || {};
      document.getElementById('billName').value = u.name || user.displayName || '';
      document.getElementById('billPhone').value = u.phone || '';
      document.getElementById('billEmail').value = u.email || user.email || '';
      
      if (u.addresses) {
        const defaultAddress = Object.values(u.addresses).find(a => a.isDefault) || Object.values(u.addresses)[0];
        if (defaultAddress) {
          document.getElementById('billAddress').value = defaultAddress.address || '';
          document.getElementById('billCity').value = defaultAddress.city || '';
          document.getElementById('billState').value = defaultAddress.state || '';
          document.getElementById('billPincode').value = defaultAddress.pincode || '';
        }
      }
    });

    // Load Cart Items and compute summaries
    const settingsPromise = window.storeSettingsPromise || Promise.resolve();
    Promise.all([
      db.ref(`cart/${user.uid}`).once('value'),
      db.ref('products').once('value'),
      settingsPromise
    ]).then(([snap, prodSnap]) => {
      const itemsVal = snap.val() || {};
      const itemsList = Object.values(itemsVal);
      const products = prodSnap.val() || {};
      if (!itemsVal || itemsList.length === 0) {
        showToast('Your cart is empty', 'warning');
        window.location.href = 'cart.html';
        return;
      }

      const listContainer = document.getElementById('checkoutSummaryItems');
      checkoutCartItems = itemsList;
      let html = '';
      let subtotal = 0;
      let totalGst = 0;

      checkoutCartItems.forEach(item => {
        const unitPrice = item.discountPrice || item.price;
        const lineTotal = unitPrice * item.quantity;
        const { basePrice, gstAmount } = calculateGST(lineTotal, item.gstPercent);
        subtotal += basePrice;
        totalGst += gstAmount;

        html += `
          <div class="d-flex justify-content-between align-items-center mb-2 small border-bottom pb-2">
            <div>
              <span class="fw-semibold text-dark">${item.name}</span>
              <span class="text-muted d-block">Qty: ${item.quantity} × ${formatCurrency(unitPrice)}</span>
            </div>
            <span class="fw-bold">${formatCurrency(lineTotal)}</span>
          </div>
        `;
      });
      listContainer.innerHTML = html;

      // Computation
      const grandTotal = subtotal + totalGst;
      
      let hasCustomShipping = false;
      let customShippingSum = 0;
      checkoutCartItems.forEach(item => {
        const prod = products[item.productId] || {};
        const shippingVal = prod.shippingCharge;
        if (shippingVal !== undefined && shippingVal !== null && shippingVal !== '') {
          hasCustomShipping = true;
          customShippingSum += Number(shippingVal) * Number(item.quantity);
        }
      });

      let shippingCharge = 0;
      if (grandTotal < storeSettings.freeShippingThreshold) {
        shippingCharge = hasCustomShipping ? customShippingSum : storeSettings.shippingCharges;
      }

      const finalGrandTotal = grandTotal + shippingCharge;

      checkoutTotals = {
        subtotal: subtotal,
        gst: totalGst,
        shipping: shippingCharge,
        grandTotal: finalGrandTotal
      };

      document.getElementById('chkSubtotal').textContent = formatCurrency(subtotal);
      document.getElementById('chkGST').textContent = formatCurrency(totalGst);
      document.getElementById('chkShipping').textContent = shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge);
      document.getElementById('chkGrandTotal').textContent = formatCurrency(finalGrandTotal);
      
      hideLoader();
    });
  });
}

function handleCheckout(e) {
  e.preventDefault();
  
  const name = sanitizeInput(document.getElementById('billName').value);
  const phone = sanitizeInput(document.getElementById('billPhone').value);
  const email = sanitizeInput(document.getElementById('billEmail').value);
  const address = sanitizeInput(document.getElementById('billAddress').value);
  const city = sanitizeInput(document.getElementById('billCity').value);
  const state = sanitizeInput(document.getElementById('billState').value);
  const pincode = sanitizeInput(document.getElementById('billPincode').value);
  const gstNum = sanitizeInput(document.getElementById('billGST').value);

  if (!name || !phone || !email || !address || !city || !state || !pincode) {
    showToast('Please fill in all shipping details', 'warning');
    return;
  }

  if (!validatePhone(phone)) {
    showToast('Please enter a valid 10-digit phone number', 'warning');
    return;
  }

  if (!validatePincode(pincode)) {
    showToast('Please enter a valid 6-digit PIN code', 'warning');
    return;
  }

  showLoader();
  getCurrentUser().then(user => {
    // Generate Order Entry
    const orderRef = db.ref('orders').push();
    const orderId = orderRef.key;

    const orderData = {
      orderId: orderId,
      userId: user.uid,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      shippingAddress: {
        address: address,
        city: city,
        state: state,
        pincode: pincode
      },
      gstNumber: gstNum,
      items: checkoutCartItems,
      subtotal: checkoutTotals.subtotal,
      gstAmount: checkoutTotals.gst,
      shippingCharge: checkoutTotals.shipping,
      grandTotal: checkoutTotals.grandTotal,
      status: 'pending',
      paymentStatus: 'pending_verification',
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    // Save default address if checkbox is checked
    const saveAddr = document.getElementById('saveAddressChk')?.checked;
    if (saveAddr) {
      db.ref(`users/${user.uid}/addresses`).push({
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        isDefault: true
      });
    }

    return orderRef.set(orderData).then(() => {
      // Step to show dynamic UPI code
      hideLoader();
      showToast('Order created! Generating UPI payment details...', 'success');
      document.getElementById('checkoutBillingCol').style.display = 'none';
      document.getElementById('checkoutPaymentCol').style.display = 'block';
      
      // Call payment generator
      generateUPIQR(checkoutTotals.grandTotal, orderId);
    });
  }).catch(err => {
    hideLoader();
    showToast(err.message, 'error');
  });
}
