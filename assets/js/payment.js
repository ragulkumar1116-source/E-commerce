function generateUPIQR(amount, orderId) {
  const upiId = storeSettings.upiMerchantId || 'YOUR_UPI_ID';
  const name = storeSettings.companyName || 'nvm Tech';
  
  // Format Dynamic UPI URI schema
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=Order-${orderId}`;
  
  // Empty QR container and generate new QR
  const qrContainer = document.getElementById('qrCodeContainer');
  if (qrContainer) {
    qrContainer.innerHTML = '';
    // Generate QR using CDN library QRCode
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

  // Set intents for mobile app launchers
  document.getElementById('btnPayGpay').href = upiUri;
  document.getElementById('btnPayPhonepe').href = upiUri;
  document.getElementById('btnPayPaytm').href = upiUri;
  document.getElementById('btnPayBhim').href = upiUri;

  // Bind Submit Payment Handler
  const payForm = document.getElementById('paymentSubmitForm');
  if (payForm) {
    // Prevent duplicate handlers
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
        // Create payment transaction
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
          // Update order references
          return db.ref(`orders/${orderId}`).update({
            paymentStatus: 'pending_verification',
            paymentId: paymentId
          });
        });
      }).then(() => {
        // Clear customer cart
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
window.generateUPIQR = generateUPIQR;
