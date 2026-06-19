function toggleWishlist(productId) {
  getCurrentUser().then(user => {
    if (!user) {
      showToast('Please login to save items to wishlist', 'warning');
      return;
    }

    const wishRef = db.ref(`wishlist/${user.uid}/${productId}`);
    wishRef.once('value').then(snap => {
      if (snap.exists()) {
        // Remove
        wishRef.remove().then(() => {
          showToast('Removed from wishlist', 'success');
          updateWishlistHeartIcon(productId, false);
          if (document.getElementById('wishlistGrid')) loadWishlist();
        });
      } else {
        // Add
        showLoader();
        db.ref(`products/${productId}`).once('value').then(pSnap => {
          const p = pSnap.val();
          if (!p) {
            hideLoader();
            return;
          }
          return wishRef.set({
            productId: productId,
            name: p.name,
            brand: p.brand || 'Generic',
            price: p.price,
            discountPrice: p.discountPrice || p.price,
            image: p.images ? p.images[0] : '',
            addedAt: firebase.database.ServerValue.TIMESTAMP
          });
        }).then(() => {
          hideLoader();
          showToast('Added to wishlist!', 'success');
          updateWishlistHeartIcon(productId, true);
        });
      }
    });
  });
}

function updateWishlistHeartIcon(productId, state) {
  const icon = document.getElementById(`wishIcon_${productId}`);
  if (icon) {
    if (state) {
      icon.className = "bi bi-heart-fill text-danger";
    } else {
      icon.className = "bi bi-heart";
    }
  }
}

function loadWishlist() {
  getCurrentUser().then(user => {
    if (!user) {
      window.location.href = 'auth/login.html';
      return;
    }

    const container = document.getElementById('wishlistGrid');
    if (!container) return;

    showLoader();
    db.ref(`wishlist/${user.uid}`).once('value').then(snap => {
      const items = snap.val();
      if (!items) {
        container.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-heartbreak fs-1 text-muted"></i>
            <h4 class="mt-3">Your Wishlist is Empty</h4>
            <a href="products.html" class="btn btn-primary mt-3">Browse Products</a>
          </div>
        `;
        hideLoader();
        return;
      }

      let html = '';
      Object.values(items).forEach(item => {
        const priceHtml = item.discountPrice 
          ? `<span class="price-current">${formatCurrency(item.discountPrice)}</span>
             <span class="price-original">${formatCurrency(item.price)}</span>`
          : `<span class="price-current">${formatCurrency(item.price)}</span>`;

        html += `
          <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="product-card">
              <div class="product-card-img-wrap" onclick="location.href='product-details.html?id=${item.productId}'" style="cursor: pointer;">
                <img src="${item.image || 'https://placehold.co/300?text=No+Image'}" alt="${item.name}" class="product-card-img">
              </div>
              <button class="btn btn-light btn-sm rounded-circle shadow-sm position-absolute top-2 end-2" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; z-index: 5;" onclick="toggleWishlist('${item.productId}')">
                <i class="bi bi-heart-fill text-danger"></i>
              </button>
              <div class="product-card-body">
                <span class="product-brand">${item.brand}</span>
                <h6 class="product-title"><a href="product-details.html?id=${item.productId}">${item.name}</a></h6>
                <div class="product-price-row mb-3">${priceHtml}</div>
                <div class="d-grid gap-2 mt-auto">
                  <button class="btn btn-primary btn-sm" onclick="moveWishToCart('${item.productId}')">
                    <i class="bi bi-cart-plus me-1"></i> Move to Cart
                  </button>
                  <button class="btn btn-outline-danger btn-sm" onclick="toggleWishlist('${item.productId}')">Remove</button>
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

function moveWishToCart(productId) {
  addToCart(productId, 1);
  toggleWishlist(productId);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('wishlistGrid')) {
    loadWishlist();
  }
});

window.toggleWishlist = toggleWishlist;
window.moveWishToCart = moveWishToCart;
