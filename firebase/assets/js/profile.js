document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('profileForm')) {
    loadProfile();
    document.getElementById('profileForm').addEventListener('submit', updateProfile);
    document.getElementById('addressForm')?.addEventListener('submit', addNewAddress);
  }
});

function loadProfile() {
  getCurrentUser().then(user => {
    if (!user) {
      window.location.href = 'auth/login.html';
      return;
    }

    showLoader();
    db.ref(`users/${user.uid}`).once('value').then(snap => {
      const u = snap.val() || {};
      
      // Fill Form
      document.getElementById('profName').value = u.name || user.displayName || '';
      document.getElementById('profEmail').value = u.email || user.email || '';
      document.getElementById('profPhone').value = u.phone || '';
      
      // Avatar Initials
      const name = u.name || user.displayName || 'User';
      const initials = document.getElementById('profileInitials');
      if (initials) initials.textContent = name.charAt(0).toUpperCase();

      loadAddressesList(u.addresses);
      hideLoader();
    }).catch(err => {
      hideLoader();
      console.error(err);
    });
  });
}

function updateProfile(e) {
  e.preventDefault();
  const name = sanitizeInput(document.getElementById('profName').value);
  const phone = sanitizeInput(document.getElementById('profPhone').value);

  if (!name || !phone) {
    showToast('Name and phone numbers are required', 'warning');
    return;
  }

  showLoader();
  getCurrentUser().then(user => {
    return user.updateProfile({ displayName: name }).then(() => {
      return db.ref(`users/${user.uid}`).update({
        name: name,
        phone: phone,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      });
    });
  }).then(() => {
    hideLoader();
    showToast('Profile updated successfully', 'success');
    loadProfile();
  }).catch(err => {
    hideLoader();
    showToast(err.message, 'error');
  });
}

function loadAddressesList(addresses) {
  const container = document.getElementById('addressesList');
  if (!container) return;

  if (!addresses) {
    container.innerHTML = '<p class="text-muted small">No addresses saved yet.</p>';
    return;
  }

  let html = '';
  Object.keys(addresses).forEach(key => {
    const addr = addresses[key];
    html += `
      <div class="card p-3 mb-2 shadow-sm border-light">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="mb-1 fw-semibold">${addr.address}</p>
            <small class="text-muted">${addr.city}, ${addr.state} - ${addr.pincode}</small>
            ${addr.isDefault ? '<span class="badge bg-success ms-2">Default</span>' : ''}
          </div>
          <div class="d-flex gap-2">
            ${!addr.isDefault ? `<button class="btn btn-link btn-sm text-secondary" onclick="setDefaultAddress('${key}')">Set Default</button>` : ''}
            <button class="btn btn-link btn-sm text-danger" onclick="deleteAddress('${key}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function addNewAddress(e) {
  e.preventDefault();
  const address = sanitizeInput(document.getElementById('addrText').value);
  const city = sanitizeInput(document.getElementById('addrCity').value);
  const state = sanitizeInput(document.getElementById('addrState').value);
  const pincode = sanitizeInput(document.getElementById('addrPincode').value);

  if (!address || !city || !state || !pincode) {
    showToast('Please fill all address fields', 'warning');
    return;
  }

  showLoader();
  getCurrentUser().then(user => {
    const addressesRef = db.ref(`users/${user.uid}/addresses`);
    
    // Push new address
    return addressesRef.push({
      address: address,
      city: city,
      state: state,
      pincode: pincode,
      isDefault: false
    });
  }).then(() => {
    hideLoader();
    showToast('New address added!', 'success');
    document.getElementById('addressForm').reset();
    
    // Close modal
    const modalEl = document.getElementById('addAddressModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    }
    loadProfile();
  }).catch(err => {
    hideLoader();
    showToast(err.message, 'error');
  });
}

function deleteAddress(key) {
  showLoader();
  getCurrentUser().then(user => {
    return db.ref(`users/${user.uid}/addresses/${key}`).remove();
  }).then(() => {
    hideLoader();
    showToast('Address deleted', 'success');
    loadProfile();
  });
}

function setDefaultAddress(key) {
  showLoader();
  getCurrentUser().then(user => {
    const userRef = db.ref(`users/${user.uid}/addresses`);
    return userRef.once('value').then(snap => {
      const updates = {};
      snap.forEach(child => {
        updates[`${child.key}/isDefault`] = child.key === key;
      });
      return userRef.update(updates);
    });
  }).then(() => {
    hideLoader();
    showToast('Default address updated', 'success');
    loadProfile();
  });
}

window.deleteAddress = deleteAddress;
window.setDefaultAddress = setDefaultAddress;
