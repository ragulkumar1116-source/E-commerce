function generateUPIQR(amount, orderId) {
  // Save payment details globally for Cashfree integration
  window.currentPaymentAmount = amount;
  window.currentPaymentOrderId = orderId;

  const upiId = storeSettings.upiMerchantId || 'YOUR_UPI_ID';
  const name = storeSettings.companyName || 'E&P SMART';
  
  // Format Dynamic UPI URI schema
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=Order-${orderId}`;
  
  // Empty QR container and generate new QR
  const qrContainer = document.getElementById('qrCodeContainer');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: upiUri,
      width: 220,
      height: 220,
      colorDark: "#0A1628",
      colorLight: "#FFFFFF",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  // Set amounts in payment screen
  document.getElementById('payAmountText').textContent = formatCurrency(amount);
  const cashfreeAmount = document.getElementById('cashfreeAmountText');
  if (cashfreeAmount) cashfreeAmount.textContent = formatCurrency(amount);
  const codAmount = document.getElementById('codAmountText');
  if (codAmount) codAmount.textContent = formatCurrency(amount);

  // Set intents for mobile app launchers
  document.getElementById('btnPayGpay').href = upiUri;
  document.getElementById('btnPayPhonepe').href = upiUri;
  document.getElementById('btnPayPaytm').href = upiUri;
  document.getElementById('btnPayBhim').href = upiUri;

  // Bind Submit Payment Handler (for manual UPI QR verification)
  const payForm = document.getElementById('paymentSubmitForm');
  if (payForm) {
    const newForm = payForm.cloneNode(true);
    payForm.parentNode.replaceChild(newForm, payForm);
    
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const utr = sanitizeInput(document.getElementById('payUtr').value);
      const ref = sanitizeInput(document.getElementById('payRef').value) || '';

      if (!utr || utr.length < 8) {
        showToast('Please enter a valid Transaction UTR Number', 'warning');
        return;
      }

      showLoader();
      getCurrentUser().then(user => {
        const paymentRef = db.ref('payments').push();
        const paymentId = paymentRef.key;

        const paymentData = {
          paymentId: paymentId,
          orderId: orderId,
          userId: user.uid,
          amount: amount,
          utrNumber: utr,
          paymentReference: ref,
          status: 'pending_verification',
          submittedAt: firebase.database.ServerValue.TIMESTAMP
        };

        return paymentRef.set(paymentData).then(() => {
          return db.ref(`orders/${orderId}`).update({
            paymentStatus: 'pending_verification',
            paymentId: paymentId
          });
        });
      }).then(() => {
        return getCurrentUser().then(user => {
          return db.ref(`cart/${user.uid}`).remove();
        });
      }).then(() => {
        hideLoader();
        showToast('Payment submitted successfully for verification!', 'success');
        setTimeout(() => {
          window.location.href = 'orders.html';
        }, 2000);
      }).catch(err => {
        hideLoader();
        showToast(err.message, 'error');
      });
    });
  }
}

// Cashfree Payment Gateway Integration
function initiateCashfreePayment() {
  const amount = window.currentPaymentAmount;
  const orderId = window.currentPaymentOrderId;

  if (!amount || !orderId) {
    showToast('Payment details are missing.', 'error');
    return;
  }

  showLoader();
  
  // Cloud Function URL for Cashfree order creation
  const functionsBaseUrl = "https://createcashfreeorder-YOUR_FUNCTION_ID.run.app";

  getCurrentUser().then(user => {
    if (!user) {
      hideLoader();
      showToast('User session expired. Please log in.', 'error');
      return;
    }

    // Call Cloud Function to create a secure payment session
    fetch(`${functionsBaseUrl}/createCashfreeOrder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
        customer: {
          id: user.uid,
          phone: user.phoneNumber || "9876543210", // Fallback if no phone
          name: user.displayName || "Customer",
          email: user.email
        }
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to initiate gateway order');
      return res.json();
    })
    .then(data => {
      hideLoader();
      
      // Initialize Cashfree JS SDK
      // Mode can be 'sandbox' or 'production' depending on settings
      const cashfree = Cashfree({
        mode: "sandbox" 
      });

      // Launch Cashfree web checkout modal
      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal" 
      });
    })
    .catch(err => {
      console.warn("Backend Cloud Function not configured, running sandbox simulator fallback", err);
      // Fallback Simulator: Redirect to status page after a brief delay
      // to demonstrate the integration workflow for sandbox testing
      setTimeout(() => {
        hideLoader();
        showToast('Initiating Sandbox Simulator...', 'info');
        setTimeout(() => {
          window.location.href = `payment-status.html?order_id=${orderId}`;
        }, 1500);
      }, 1000);
    });
  });
}

// Cash on Delivery (COD) Integration
function placeCodOrder() {
  const amount = window.currentPaymentAmount;
  const orderId = window.currentPaymentOrderId;

  if (!amount || !orderId) {
    showToast('Order details are missing.', 'error');
    return;
  }

  showLoader();
  
  // 1. Update order payment status and order status in Firebase
  db.ref(`orders/${orderId}`).update({
    paymentStatus: 'cod',
    status: 'processing', // Progress to processing directly since it's confirmed
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  })
  .then(() => {
    // 2. Clear customer's cart
    return getCurrentUser().then(user => {
      if (user) return db.ref(`cart/${user.uid}`).remove();
    });
  })
  .then(() => {
    hideLoader();
    showToast('Order placed successfully via Cash on Delivery!', 'success');
    setTimeout(() => {
      window.location.href = 'orders.html';
    }, 2000);
  })
  .catch(err => {
    hideLoader();
    showToast(err.message, 'error');
  });
}

window.generateUPIQR = generateUPIQR;
window.initiateCashfreePayment = initiateCashfreePayment;
window.placeCodOrder = placeCodOrder;
