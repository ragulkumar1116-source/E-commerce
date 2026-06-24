document.addEventListener('DOMContentLoaded', () => {
  const isListPage = document.getElementById('adminProductsTable');
  const isFormPage = document.getElementById('addProductForm') || document.getElementById('editProductForm');
  const isCatPage = document.getElementById('adminCatsGrid');

  if (isListPage) {
    loadAdminProducts();
  } else if (isFormPage) {
    initProductForm();
  } else if (isCatPage) {
    loadCategoriesPage();
  }
});

function loadAdminProducts() {
  showLoader();
  // Load categories into dropdown
  db.ref('categories').once('value').then(snap => {
    const cats = snap.val() || {};
    const sel = document.getElementById('prodCatSelect');
    if (sel) {
      Object.values(cats).forEach(c => {
        sel.innerHTML += `<option value="${c.name}">${c.name}</option>`;
      });
    }
  });

  db.ref('products').once('value').then(snap => {
    const data = snap.val() || {};
    const table = document.getElementById('adminProductsTable');
    if (!table) return;

    const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
    renderProductsTable(list);
    
    // Bind search and filter triggers
    const triggerFilters = () => {
      const q = document.getElementById('prodSearchInput').value.toLowerCase();
      const cat = document.getElementById('prodCatSelect').value;
      
      let filtered = [...list];
      if (q) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      }
      if (cat !== 'all') {
        filtered = filtered.filter(p => p.category === cat);
      }
      renderProductsTable(filtered);
    };
    
    document.getElementById('prodSearchInput')?.addEventListener('input', debounce(triggerFilters, 300));
    document.getElementById('prodCatSelect')?.addEventListener('change', triggerFilters);
    hideLoader();
  });
}

function renderProductsTable(list) {
  const table = document.getElementById('adminProductsTable');
  if (list.length === 0) {
    table.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">No products available.</td></tr>';
    return;
  }

  let html = '';
  list.forEach(p => {
    html += `
      <tr>
        <td><img src="${p.images ? p.images[0] : ''}" style="width:40px; height:40px; object-fit:contain;" onerror="this.src='https://placehold.co/40'"></td>
        <td class="fw-semibold small text-truncate" style="max-width:200px">${p.name}</td>
        <td class="small">${p.sku}</td>
        <td>${p.category}</td>
        <td>${p.stockQuantity}</td>
        <td>${formatCurrency(p.discountPrice || p.price)}</td>
        <td><span class="badge ${p.status === 'active' ? 'bg-success' : 'bg-secondary'}">${p.status}</span></td>
        <td>
          <a href="edit-product.html?id=${p.id}" class="btn btn-xs btn-outline-secondary py-1 px-2 small"><i class="bi bi-pencil"></i></a>
          <button class="btn btn-xs btn-outline-danger py-1 px-2 small" onclick="deleteProduct('${p.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `;
  });
  table.innerHTML = html;
}

function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    showLoader();
    db.ref(`products/${id}`).remove().then(() => {
      hideLoader();
      showToast('Product deleted successfully', 'success');
      loadAdminProducts();
    });
  }
}

// Form Operations (Add / Edit)
function initProductForm() {
  const categoriesSelect = document.getElementById('pCat');
  const prodId = getUrlParam('id');

  // Load categories dropdown
  db.ref('categories').once('value').then(snap => {
    const cats = snap.val() || {};
    if (categoriesSelect) {
      categoriesSelect.innerHTML = '<option value="" disabled selected>Select Category</option>';
      Object.values(cats).forEach(c => {
        if (c.status === 'active') {
          categoriesSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
        }
      });
    }

    if (prodId) {
      // Edit form pre-population
      showLoader();
      db.ref(`products/${prodId}`).once('value').then(pSnap => {
        const p = pSnap.val();
        if (!p) return;

        document.getElementById('pName').value = p.name || '';
        document.getElementById('pSku').value = p.sku || '';
        document.getElementById('pBrand').value = p.brand || '';
        document.getElementById('pCat').value = p.category || '';
        document.getElementById('pSubCat').value = p.subCategory || '';
        document.getElementById('pHsn').value = p.hsnCode || '';
        document.getElementById('pPrice').value = p.price || 0;
        document.getElementById('pDiscountPrice').value = p.discountPrice || '';
        document.getElementById('pGst').value = p.gstPercent || '18';
        document.getElementById('pStock').value = p.stockQuantity || 0;
        document.getElementById('pWeight').value = p.weight || '';
        document.getElementById('pShipping').value = (p.shippingCharge !== undefined && p.shippingCharge !== null) ? p.shippingCharge : '';
        document.getElementById('pWarranty').value = p.warranty || '';
        document.getElementById('pDesc').value = p.description || '';
        
        // Specs format parser
        if (p.specifications) {
          if (typeof p.specifications === 'string') {
            document.getElementById('pSpecs').value = p.specifications;
          } else {
            // Convert json back to key-value lines
            let specStr = '';
            Object.keys(p.specifications).forEach(k => {
              specStr += `${k}: ${p.specifications[k]}\n`;
            });
            document.getElementById('pSpecs').value = specStr.trim();
          }
        }

        if (p.images) {
          if (p.images[0]) document.getElementById('pImg1').value = p.images[0];
          if (p.images[1]) document.getElementById('pImg2').value = p.images[1];
          if (p.images[2]) document.getElementById('pImg3').value = p.images[2];
          if (p.images[3]) document.getElementById('pImg4').value = p.images[3];
          if (p.images[4]) document.getElementById('pImg5').value = p.images[4];
        }

        document.getElementById('pFeatured').checked = !!p.featured;
        document.getElementById('pBestSeller').checked = !!p.bestSeller;
        hideLoader();
      });
    }
  });

  const form = document.getElementById('addProductForm') || document.getElementById('editProductForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoader();

    // Parse technical specifications key:value lines
    const rawSpecs = document.getElementById('pSpecs').value;
    const specObj = {};
    rawSpecs.split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.substring(0, idx).trim();
        const v = line.substring(idx + 1).trim();
        if (k) specObj[k] = v;
      }
    });

    const productData = {
      name: sanitizeInput(document.getElementById('pName').value),
      sku: sanitizeInput(document.getElementById('pSku').value),
      brand: sanitizeInput(document.getElementById('pBrand').value),
      category: sanitizeInput(document.getElementById('pCat').value),
      subCategory: sanitizeInput(document.getElementById('pSubCat').value) || '',
      hsnCode: sanitizeInput(document.getElementById('pHsn').value) || '',
      price: Number(document.getElementById('pPrice').value),
      discountPrice: Number(document.getElementById('pDiscountPrice').value) || null,
      gstPercent: Number(document.getElementById('pGst').value),
      stockQuantity: Number(document.getElementById('pStock').value),
      weight: sanitizeInput(document.getElementById('pWeight').value) || '',
      shippingCharge: document.getElementById('pShipping').value.trim() !== '' ? Number(document.getElementById('pShipping').value) : null,
      shippingAreaId: null, // Clear dynamic delivery area reference
      warranty: sanitizeInput(document.getElementById('pWarranty').value) || '',
      description: sanitizeInput(document.getElementById('pDesc').value),
      specifications: specObj,
      images: [
        sanitizeInput(document.getElementById('pImg1').value),
        sanitizeInput(document.getElementById('pImg2').value) || null,
        sanitizeInput(document.getElementById('pImg3').value) || null,
        sanitizeInput(document.getElementById('pImg4').value) || null,
        sanitizeInput(document.getElementById('pImg5').value) || null
      ].filter(Boolean),
      featured: document.getElementById('pFeatured').checked,
      bestSeller: document.getElementById('pBestSeller').checked,
      status: 'active',
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    if (prodId) {
      db.ref(`products/${prodId}`).update(productData).then(() => {
        hideLoader();
        showToast('Product updated successfully!', 'success');
        setTimeout(() => window.location.href = 'products.html', 1000);
      });
    } else {
      productData.createdAt = firebase.database.ServerValue.TIMESTAMP;
      db.ref('products').push(productData).then(() => {
        hideLoader();
        showToast('Product created successfully!', 'success');
        setTimeout(() => window.location.href = 'products.html', 1000);
      });
    }
  });
}

// Categories Management Page
function loadCategoriesPage() {
  showLoader();
  const catGrid = document.getElementById('adminCatsGrid');
  const catForm = document.getElementById('catForm');
  const editCatId = document.getElementById('editCatId');
  const cancelBtn = document.getElementById('btnCancelCatEdit');
  const formTitle = document.getElementById('catFormTitle');

  const refreshCats = () => {
    db.ref('categories').once('value').then(snap => {
      const cats = snap.val() || {};
      let html = '';
      
      Object.keys(cats).forEach(key => {
        const cat = cats[key];
        html += `
          <div class="col-md-6 col-lg-4">
            <div class="card p-2 text-center border-light shadow-sm">
              <img src="${cat.image}" style="height:60px; object-fit:contain;" class="mb-2" onerror="this.src='https://placehold.co/60'">
              <h6 class="fw-bold mb-1">${cat.name}</h6>
              <span class="badge ${cat.status === 'active' ? 'bg-success' : 'bg-secondary'} mb-2">${cat.status}</span>
              <div class="d-flex justify-content-center gap-1">
                <button class="btn btn-xs btn-outline-secondary py-1" onclick="editCat('${key}', '${cat.name}', '${cat.image}', '${cat.description || ''}', '${cat.status}')">Edit</button>
                <button class="btn btn-xs btn-outline-danger py-1" onclick="deleteCat('${key}')">Delete</button>
              </div>
            </div>
          </div>
        `;
      });
      catGrid.innerHTML = html || '<p class="text-muted small">No categories registered.</p>';
      hideLoader();
    });
  };

  // Cancel edit button click
  cancelBtn?.addEventListener('click', () => {
    catForm.reset();
    editCatId.value = '';
    formTitle.textContent = 'Create New Category';
    cancelBtn.classList.add('d-none');
  });

  // Handle category form submits
  catForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoader();
    
    const name = sanitizeInput(document.getElementById('catName').value);
    const img = sanitizeInput(document.getElementById('catImg').value);
    const desc = sanitizeInput(document.getElementById('catDesc').value) || '';
    const status = document.getElementById('catStatus').value;
    const cid = editCatId.value;

    const data = {
      name: name,
      image: img,
      description: desc,
      status: status,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    if (cid) {
      db.ref(`categories/${cid}`).update(data).then(() => {
        showToast('Category updated!', 'success');
        catForm.reset();
        editCatId.value = '';
        formTitle.textContent = 'Create New Category';
        cancelBtn.classList.add('d-none');
        refreshCats();
      });
    } else {
      data.createdAt = firebase.database.ServerValue.TIMESTAMP;
      db.ref('categories').push(data).then(() => {
        showToast('Category created!', 'success');
        catForm.reset();
        refreshCats();
      });
    }
  });

  // Load functions globally
  window.editCat = (id, name, image, desc, status) => {
    editCatId.value = id;
    document.getElementById('catName').value = name;
    document.getElementById('catImg').value = image;
    document.getElementById('catDesc').value = desc;
    document.getElementById('catStatus').value = status;
    formTitle.textContent = `Edit Category: ${name}`;
    cancelBtn.classList.remove('d-none');
  };

  window.deleteCat = (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      showLoader();
      db.ref(`categories/${id}`).remove().then(() => {
        showToast('Category deleted', 'success');
        refreshCats();
      });
    }
  };

  refreshCats();
}

window.deleteProduct = deleteProduct;
