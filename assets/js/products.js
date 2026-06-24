let allProducts = [];
let activeFilters = {
  categories: [],
  brands: [],
  priceMin: 0,
  priceMax: 1000000,
  availability: 'all'
};

document.addEventListener('DOMContentLoaded', () => {
  const isListingPage = document.getElementById('productGrid');
  const isDetailsPage = document.getElementById('productDetailContainer');
  const isHomePage = document.getElementById('featuredProducts');

  if (isListingPage) {
    initListingPage();
  } else if (isDetailsPage) {
    initDetailsPage();
  } else if (isHomePage) {
    initHomePage();
  }
});

// Home Page Loader
function initHomePage() {
  showLoader();
  db.ref('products').once('value').then((snap) => {
    const data = snap.val() || {};
    const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    
    // Featured
    const featured = list.filter(p => p.featured && p.status === 'active').slice(0, 8);
    renderProductGrid(featured, 'featuredProducts');

    // New Arrivals (sorted by createdAt desc)
    const newArrivals = list.filter(p => p.status === 'active').sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
    renderProductGrid(newArrivals, 'newProducts');

    // Best Sellers
    const bestSellers = list.filter(p => p.bestSeller && p.status === 'active').slice(0, 8);
    renderProductGrid(bestSellers, 'bestSellers');
    
    hideLoader();
  }).catch((err) => {
    console.error(err);
    hideLoader();
  });

  // Load home categories
  db.ref('categories').once('value').then((snap) => {
    const cats = snap.val() || {};
    const container = document.getElementById('homeCategories');
    if (!container) return;
    
    let html = '';
    Object.keys(cats).forEach((key) => {
      const cat = cats[key];
      if (cat.status === 'active') {
        html += `
          <div class="col-6 col-md-3 col-lg-2">
            <a href="products.html?cat=${cat.name}" class="category-card">
              <div class="category-icon">
                <i class="bi bi-tag-fill"></i>
              </div>
              <h6 class="category-title text-truncate">${cat.name}</h6>
            </a>
          </div>
        `;
      }
    });
    container.innerHTML = html || '<p class="text-muted">No categories available</p>';
  });
}

// Listing Page Loader
function initListingPage() {
  showLoader();
  const catParam = getUrlParam('cat');
  const qParam = getUrlParam('q');

  db.ref('products').once('value').then((snap) => {
    const data = snap.val() || {};
    allProducts = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(p => p.status === 'active');
    
    // Populate filter options
    populateFilters();

    // Set initial parameter filters
    if (catParam) {
      const catCheck = document.querySelector(`.cat-filter[value="${catParam}"]`);
      if (catCheck) {
        catCheck.checked = true;
        activeFilters.categories.push(catParam);
      } else {
        activeFilters.categories.push(catParam);
      }
    }
    
    if (qParam) {
      const searchBox = document.getElementById('searchInput');
      if (searchBox) searchBox.value = qParam;
    }

    applyFiltersAndSort();
    hideLoader();
  }).catch(err => {
    console.error(err);
    hideLoader();
  });

  // Attach filter events
  document.getElementById('sortSelect')?.addEventListener('change', applyFiltersAndSort);
  document.getElementById('priceMin')?.addEventListener('input', debounce(applyFiltersAndSort, 500));
  document.getElementById('priceMax')?.addEventListener('input', debounce(applyFiltersAndSort, 500));
  document.getElementById('stockStatusFilter')?.addEventListener('change', applyFiltersAndSort);
}

function populateFilters() {
  const catContainer = document.getElementById('categoryFilters');
  const brandContainer = document.getElementById('brandFilters');
  
  if (catContainer) {
    const cats = [...new Set(allProducts.map(p => p.category))].filter(Boolean);
    let html = '';
    cats.forEach(c => {
      html += `
        <div class="form-check">
          <input class="form-check-input cat-filter" type="checkbox" value="${c}" id="cat_${c}">
          <label class="form-check-label" for="cat_${c}">${c}</label>
        </div>
      `;
    });
    catContainer.innerHTML = html;
    
    document.querySelectorAll('.cat-filter').forEach(chk => {
      chk.addEventListener('change', (e) => {
        if (e.target.checked) {
          activeFilters.categories.push(e.target.value);
        } else {
          activeFilters.categories = activeFilters.categories.filter(v => v !== e.target.value);
        }
        applyFiltersAndSort();
      });
    });
  }

  if (brandContainer) {
    const brands = [...new Set(allProducts.map(p => p.brand))].filter(Boolean);
    let html = '';
    brands.forEach(b => {
      html += `
        <div class="form-check">
          <input class="form-check-input brand-filter" type="checkbox" value="${b}" id="brand_${b}">
          <label class="form-check-label" for="brand_${b}">${b}</label>
        </div>
      `;
    });
    brandContainer.innerHTML = html;

    document.querySelectorAll('.brand-filter').forEach(chk => {
      chk.addEventListener('change', (e) => {
        if (e.target.checked) {
          activeFilters.brands.push(e.target.value);
        } else {
          activeFilters.brands = activeFilters.brands.filter(v => v !== e.target.value);
        }
        applyFiltersAndSort();
      });
    });
  }
}

function applyFiltersAndSort() {
  const sortVal = document.getElementById('sortSelect')?.value || 'newest';
  const priceMin = Number(document.getElementById('priceMin')?.value) || 0;
  const priceMax = Number(document.getElementById('priceMax')?.value) || 1000000;
  const stockFilter = document.getElementById('stockStatusFilter')?.value || 'all';
  const qParam = getUrlParam('q');

  let filtered = [...allProducts];

  // Search filter
  if (qParam) {
    const query = qParam.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.brand && p.brand.toLowerCase().includes(query)) || 
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.category && p.category.toLowerCase().includes(query))
    );
  }

  // Category filter
  if (activeFilters.categories.length > 0) {
    filtered = filtered.filter(p => activeFilters.categories.includes(p.category));
  }

  // Brand filter
  if (activeFilters.brands.length > 0) {
    filtered = filtered.filter(p => activeFilters.brands.includes(p.brand));
  }

  // Price range
  filtered = filtered.filter(p => {
    const price = p.discountPrice || p.price;
    return price >= priceMin && price <= priceMax;
  });

  // Stock availability
  if (stockFilter === 'instock') {
    filtered = filtered.filter(p => Number(p.stockQuantity) > 0);
  } else if (stockFilter === 'outofstock') {
    filtered = filtered.filter(p => Number(p.stockQuantity) <= 0);
  }

  // Sort
  if (sortVal === 'price-asc') {
    filtered.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (sortVal === 'price-desc') {
    filtered.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (sortVal === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortVal === 'newest') {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  renderProductGrid(filtered, 'productGrid');
}

function renderProductGrid(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted"></i>
        <h5 class="mt-3">No Products Found</h5>
        <p class="text-muted">Try modifying your search or filters.</p>
      </div>
    `;
    return;
  }

  let html = '';
  products.forEach(p => {
    const priceHtml = p.discountPrice 
      ? `<span class="price-current">${formatCurrency(p.discountPrice)}</span>
         <span class="price-original">${formatCurrency(p.price)}</span>
         <span class="badge-discount">${Math.round(((p.price - p.discountPrice)/p.price)*100)}% OFF</span>`
      : `<span class="price-current">${formatCurrency(p.price)}</span>`;

    const stockBadge = Number(p.stockQuantity) <= 0 
      ? `<span class="badge bg-danger position-absolute top-2 start-2" style="z-index: 5;">Out of Stock</span>`
      : '';

    html += `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <div class="product-card">
          ${stockBadge}
          <div class="product-card-img-wrap" onclick="location.href='product-details.html?id=${p.id}'" style="cursor: pointer;">
            <img src="${p.images ? p.images[0] : 'https://placehold.co/300?text=No+Image'}" alt="${p.name}" class="product-card-img" onerror="this.src='https://placehold.co/300?text=No+Image'">
          </div>
          <button class="btn btn-light btn-sm rounded-circle shadow-sm position-absolute top-2 end-2 wishlist-toggle-btn" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; z-index: 5;" onclick="toggleWishlist('${p.id}')">
            <i class="bi bi-heart" id="wishIcon_${p.id}"></i>
          </button>
          <div class="product-card-body">
            <span class="product-brand">${p.brand || 'Generic'}</span>
            <h6 class="product-title"><a href="product-details.html?id=${p.id}">${p.name}</a></h6>
            <div class="product-price-row mb-3">${priceHtml}</div>
            <button class="btn btn-outline-primary btn-sm w-100 py-2 mt-auto" onclick="addToCart('${p.id}', 1)" ${Number(p.stockQuantity) <= 0 ? 'disabled' : ''}>
              <i class="bi bi-cart-plus me-1"></i> Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Product Details Page Loader
function initDetailsPage() {
  const prodId = getUrlParam('id');
  if (!prodId) {
    showToast('Product ID not specified', 'error');
    return;
  }

  showLoader();
  db.ref(`products/${prodId}`).once('value').then((snap) => {
    const p = snap.val();
    if (!p || p.status !== 'active') {
      document.getElementById('productDetailContainer').innerHTML = `
        <div class="text-center py-5">
          <h3>Product Not Available</h3>
          <a href="products.html" class="btn btn-primary mt-3">Back to Products</a>
        </div>
      `;
      hideLoader();
      return;
    }

    // Set dynamic detail fields
    document.title = `${p.name} - ${storeSettings.companyName}`;
    document.getElementById('detailName').textContent = p.name;
    document.getElementById('detailBrand').textContent = p.brand || 'Generic';
    document.getElementById('detailSku').textContent = p.sku || 'N/A';
    document.getElementById('detailWarranty').textContent = p.warranty || 'No Warranty';
    document.getElementById('detailDesc').textContent = p.description || 'No description available.';

    // Price rendering
    const priceBox = document.getElementById('detailPriceBox');
    if (p.discountPrice) {
      priceBox.innerHTML = `
        <h3 class="price-current mb-0">${formatCurrency(p.discountPrice)}</h3>
        <span class="price-original fs-5 text-muted">${formatCurrency(p.price)}</span>
        <span class="badge bg-danger ms-2">${Math.round(((p.price - p.discountPrice)/p.price)*100)}% OFF</span>
      `;
    } else {
      priceBox.innerHTML = `<h3 class="price-current mb-0">${formatCurrency(p.price)}</h3>`;
    }

    // GST Rendering
    document.getElementById('detailGst').textContent = `Prices include ${p.gstPercent || 18}% GST (HSN: ${p.hsnCode || 'N/A'})`;

    // Stock check
    const stockStatus = document.getElementById('detailStockStatus');
    const btnCart = document.getElementById('detailBtnCart');
    const btnBuy = document.getElementById('detailBtnBuy');
    
    if (Number(p.stockQuantity) > 0) {
      stockStatus.innerHTML = `<span class="badge bg-success">In Stock (${p.stockQuantity} units)</span>`;
      btnCart.disabled = false;
      btnBuy.disabled = false;
    } else {
      stockStatus.innerHTML = `<span class="badge bg-danger">Out of Stock</span>`;
      btnCart.disabled = true;
      btnBuy.disabled = true;
    }

    // Gallery Render
    const mainImg = document.getElementById('detailMainImg');
    const thumbContainer = document.getElementById('detailThumbs');
    if (mainImg && p.images && p.images.length > 0) {
      mainImg.src = p.images[0];
      
      let thumbsHtml = '';
      p.images.forEach((img, index) => {
        if (img) {
          thumbsHtml += `
            <div class="col-2.4">
              <img src="${img}" class="img-thumbnail img-fluid detail-thumb-img ${index === 0 ? 'border-primary' : ''}" style="height:60px; object-fit:contain; cursor:pointer;" onclick="setMainImage('${img}', this)">
            </div>
          `;
        }
      });
      if (thumbContainer) thumbContainer.innerHTML = thumbsHtml;
    }

    // Specifications list rendering
    const specTable = document.getElementById('detailSpecsTable');
    if (specTable) {
      let specHtml = '';
      try {
        const specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
        if (specs && Object.keys(specs).length > 0) {
          Object.keys(specs).forEach(key => {
            specHtml += `
              <tr>
                <td class="fw-bold bg-light" style="width:30%">${key}</td>
                <td>${specs[key]}</td>
              </tr>
            `;
          });
          specTable.innerHTML = specHtml;
        } else {
          specTable.innerHTML = '<tr><td colspan="2">No detailed specifications available.</td></tr>';
        }
      } catch (e) {
        // Fallback if spec is raw text
        specTable.innerHTML = `<tr><td colspan="2">${p.specifications || 'No detailed specifications available.'}</td></tr>`;
      }
    }

    // Related Products loader
    loadRelatedProducts(p.category, p.id);
    hideLoader();
  }).catch(err => {
    console.error(err);
    hideLoader();
  });
}

function setMainImage(url, imgEl) {
  const main = document.getElementById('detailMainImg');
  if (main) main.src = url;
  
  document.querySelectorAll('.detail-thumb-img').forEach(el => el.classList.remove('border-primary'));
  imgEl.classList.add('border-primary');
}

function loadRelatedProducts(category, currentId) {
  db.ref('products').once('value').then((snap) => {
    const data = snap.val() || {};
    const related = Object.keys(data)
      .map(key => ({ id: key, ...data[key] }))
      .filter(p => p.id !== currentId && p.status === 'active' && p.category === category)
      .slice(0, 4);
      
    renderProductGrid(related, 'relatedProductsGrid');
  });
}

window.setMainImage = setMainImage;
