document.addEventListener('DOMContentLoaded', () => {
  initSearch();
});

function initSearch() {
  const inputs = document.querySelectorAll('#searchInput');
  
  inputs.forEach(input => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const suggestDiv = document.createElement('div');
    suggestDiv.className = 'dropdown-menu shadow-lg w-100 p-2';
    suggestDiv.style.cssText = 'position:absolute; top:100%; left:0; max-height:300px; overflow-y:auto; z-index:1050;';
    wrapper.appendChild(suggestDiv);

    input.addEventListener('input', debounce((e) => {
      const query = sanitizeInput(e.target.value);
      if (query.length < 2) {
        suggestDiv.classList.remove('show');
        return;
      }

      getCompanyQuery('products').once('value').then(snap => {
        const data = snap.val() || {};
        const results = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .filter(p => 
            p.status === 'active' && 
            (p.name.toLowerCase().includes(query.toLowerCase()) || 
             (p.brand && p.brand.toLowerCase().includes(query.toLowerCase())) ||
             (p.category && p.category.toLowerCase().includes(query.toLowerCase())))
          )
          .slice(0, 5);

        renderSuggestions(results, suggestDiv, query);
      });
    }, 300));

    // Hide dropdown on blur
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        suggestDiv.classList.remove('show');
      }
    });
  });
}

function renderSuggestions(results, element, query) {
  if (results.length === 0) {
    element.innerHTML = '<p class="text-muted small p-2 mb-0">No matching products found</p>';
    element.classList.add('show');
    return;
  }

  let html = '';
  results.forEach(p => {
    const price = p.discountPrice || p.price;
    html += `
      <a href="product-details.html?id=${p.id}" class="dropdown-item d-flex align-items-center gap-2 p-2 border-bottom border-light">
        <img src="${p.images ? p.images[0] : ''}" style="width:40px; height:40px; object-fit:contain;" onerror="this.src='https://placehold.co/40?text=x'">
        <div class="text-truncate">
          <h6 class="mb-0 fw-semibold text-truncate small">${highlightMatch(p.name, query)}</h6>
          <small class="text-primary fw-bold">${formatCurrency(price)}</small>
        </div>
      </a>
    `;
  });
  html += `<a href="products.html?q=${encodeURIComponent(query)}" class="dropdown-item text-center text-primary small fw-semibold p-2">View all results</a>`;
  
  element.innerHTML = html;
  element.classList.add('show');
}

function highlightMatch(text, query) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index >= 0) {
    return text.substring(0, index) + '<strong>' + text.substring(index, index + query.length) + '</strong>' + text.substring(index + query.length);
  }
  return text;
}
