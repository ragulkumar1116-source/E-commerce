function addToCart(productId, quantity = 1) {
  getCurrentUser().then(user => {
    if (!user) {
      showToast('Please login to add items to cart', 'warning');
      setTimeout(() => window.location.href = 'auth/login.html', 1500);
      return;
    }

    showLoader();
    db.ref(`products/${productId}`).once('value').then(snap => {
      const p = snap.val();
      if (!p || Number(p.stockQuantity) <= 0) {
        showToast('Product is out of stock', 'error');
        hideLoader();
        return;
      }

      // Check current quantity in cart
      const cartRef = db.ref(`cart/${user.uid}/${productId}`);
      return cartRef.once('value').then(cartSnap => {
        const cartItem = cartSnap.val();
        const existingQty = cartItem ? Number(cartItem.quantity) : 0;
        const targetQty = existingQty + quantity;

        if (targetQty > Number(p.stockQuantity)) {
          showToast(`Only ${p.stockQuantity} units available in stock`, 'warning');
          hideLoader();
          return;
        }

        return cartRef.set({
          productId: productId,
          name: p.name,
          brand: p.brand || 'Generic',
          price: p.price,
          discountPrice: p.discountPrice || p.price,
          gstPercent: p.gstPercent || 18,
          image: p.images ? p.images[0] : '',
          quantity: targetQty,
          addedAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
          hideLoader();
          showToast('Added to cart successfully!', 'success');
          updateCartBadge();
        });
      });
    }).catch(err => {
      hideLoader();
      showToast(err.message, 'error');
    });
  });
}

function removeFromCart(productId) {
  getCurrentUser().then(user => {
    if (!user) return;
    showLoader();
    db.ref(`cart/${user.uid}/${productId}`).remove().then(() => {
      hideLoader();
      showToast('Item removed from cart', 'success');
      loadCart();
    });
  });
}

function updateCartQuantity(productId, newQty) {
  getCurrentUser().then(user => {
    if (!user) return;
    if (newQty < 1) return;

    db.ref(`products/${productId}/stockQuantity`).once('value').then(stockSnap => {
      const stock = Number(stockSnap.val() || 0);
      if (newQty > stock) {
        showToast(`Only ${stock} units available in stock`, 'warning');
        return;
      }

      showLoader();
      db.ref(`cart/${user.uid}/${productId}/quantity`).set(newQty).then(() => {
        hideLoader();
        loadCart();
      });
    });
  });
}

function loadCart() {
  getCurrentUser().then(user => {
    if (!user) {
      window.location.href = 'auth/login.html';
      return;
    }

    const container = document.getElementById('cartItemsList');
    if (!container) return; // Not on cart page

    showLoader();
    const settingsPromise = window.storeSettingsPromise || Promise.resolve();
    Promise.all([
      db.ref(`cart/${user.uid}`).once('value'),
      db.ref('products').once('value'),
      settingsPromise
    ]).then(([snap, prodSnap]) => {
      const itemsVal = snap.val() || {};
      const items = Object.values(itemsVal);
      const products = prodSnap.val() || {};
      if (!items || items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5">
            <i class="bi bi-cart-x fs-1 text-muted"></i>
            <h4 class="mt-3">Your Cart is Empty</h4>
            <a href="products.html" class="btn btn-primary mt-3">Continue Shopping</a>
          </div>
        `;
        document.getElementById('cartSummaryBox').style.display = 'none';
        hideLoader();
        return;
      }

      document.getElementById('cartSummaryBox').style.display = 'block';
      let html = '';
      let subtotal = 0;
      let totalGst = 0;

      Object.values(items).forEach(item => {
        const unitPrice = item.discountPrice || item.price;
        const lineTotal = unitPrice * item.quantity;
        const { basePrice, gstAmount } = calculateGST(lineTotal, item.gstPercent);
        
        subtotal += basePrice;
        totalGst += gstAmount;

        html += `
          <div class="card mb-3 shadow-sm border-light">
            <div class="row g-0 align-items-center p-3">
              <div class="col-3 col-md-2 text-center">
                <img src="${item.image || 'https://placehold.co/100?text=No+Image'}" alt="${item.name}" class="img-fluid rounded" style="max-height:80px; object-fit:contain;">
              </div>
              <div class="col-9 col-md-10">
                <div class="row align-items-center">
                  <div class="col-12 col-md-5 mb-2 mb-md-0">
                    <span class="text-uppercase text-muted fs-7 small">${item.brand}</span>
                    <h6 class="mb-0 fw-bold"><a href="product-details.html?id=${item.productId}" class="text-dark">${item.name}</a></h6>
                    <small class="text-muted">GST ${item.gstPercent}% included</small>
                  </div>
                  <div class="col-4 col-md-2 text-md-center">
                    <span class="text-muted d-block d-md-none small">Unit Price</span>
                    <span class="fw-semibold">${formatCurrency(unitPrice)}</span>
                  </div>
                  <div class="col-4 col-md-2">
                    <div class="input-group input-group-sm">
                      <button class="btn btn-outline-secondary" type="button" onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                      <input type="text" class="form-control text-center bg-white" value="${item.quantity}" readonly>
                      <button class="btn btn-outline-secondary" type="button" onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                    </div>
                  </div>
                  <div class="col-4 col-md-2 text-end text-md-center">
                    <span class="text-muted d-block d-md-none small">Subtotal</span>
                    <span class="fw-bold text-primary">${formatCurrency(lineTotal)}</span>
                  </div>
                  <div class="col-12 col-md-1 text-end mt-2 mt-md-0">
                    <button class="btn btn-link text-danger p-0" onclick="removeFromCart('${item.productId}')"><i class="bi bi-trash fs-5"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;

      // Summary Calculations
      const grandTotal = subtotal + totalGst;
      const shippingThreshold = storeSettings.freeShippingThreshold;
      
      let hasCustomShipping = false;
      let customShippingSum = 0;
      items.forEach(item => {
        const prod = products[item.productId] || {};
        const shippingVal = prod.shippingCharge;
        if (shippingVal !== undefined && shippingVal !== null && shippingVal !== '') {
          hasCustomShipping = true;
          customShippingSum += Number(shippingVal) * Number(item.quantity);
        }
      });

      let shippingCharge = 0;
      if (grandTotal < shippingThreshold) {
        shippingCharge = hasCustomShipping ? customShippingSum : storeSettings.shippingCharges;
      }

      const finalGrandTotal = grandTotal + shippingCharge;

      document.getElementById('sumSubtotal').textContent = formatCurrency(subtotal);
      document.getElementById('sumGST').textContent = formatCurrency(totalGst);
      document.getElementById('sumShipping').textContent = shippingCharge === 0 ? 'FREE' : formatCurrency(shippingCharge);
      document.getElementById('sumGrandTotal').textContent = formatCurrency(finalGrandTotal);
      
      hideLoader();
    });
  });
}

// Bind loadCart on details page DOM load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartItemsList')) {
    loadCart();
  }
});

// Bind add product details page trigger
const detailBtnCart = document.getElementById('detailBtnCart');
if (detailBtnCart) {
  detailBtnCart.addEventListener('click', () => {
    const prodId = getUrlParam('id');
    const qty = Number(document.getElementById('detailQty')?.value) || 1;
    addToCart(prodId, qty);
  });
}

const detailBtnBuy = document.getElementById('detailBtnBuy');
if (detailBtnBuy) {
  detailBtnBuy.addEventListener('click', () => {
    const prodId = getUrlParam('id');
    const qty = Number(document.getElementById('detailQty')?.value) || 1;
    addToCart(prodId, qty);
    setTimeout(() => window.location.href = 'checkout.html', 800);
  });
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
