document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('broadcastForm')) {
    loadNotifHistory();
    document.getElementById('broadcastForm').addEventListener('submit', sendBroadcast);
  }
});

function sendBroadcast(e) {
  e.preventDefault();
  const title = sanitizeInput(document.getElementById('notifTitle').value);
  const msg = sanitizeInput(document.getElementById('notifMsg').value);

  showLoader();
  // Get all customer UIDs
  db.ref('users').once('value').then(snap => {
    const users = snap.val() || {};
    const uids = Object.keys(users).filter(uid => users[uid].role === 'customer');

    if (uids.length === 0) {
      showToast('No customers registered to broadcast to', 'warning');
      hideLoader();
      return;
    }

    const updates = {};
    const notifId = db.ref().child('notifications').push().key;

    // Write to each user's notification list
    uids.forEach(uid => {
      updates[`notifications/${uid}/${notifId}`] = {
        title: title,
        message: msg,
        read: false,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      };
    });

    // Write to admin broadcast logs
    updates[`broadcasts/${notifId}`] = {
      title: title,
      message: msg,
      sentToCount: uids.length,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    return db.ref().update(updates).then(() => {
      hideLoader();
      showToast('Announcement broadcasted successfully!', 'success');
      document.getElementById('broadcastForm').reset();
      loadNotifHistory();
    });
  }).catch(err => {
    hideLoader();
    showToast(err.message, 'error');
  });
}

function loadNotifHistory() {
  db.ref('broadcasts').limitToLast(10).once('value').then(snap => {
    const data = snap.val();
    const container = document.getElementById('adminNotifHistory');
    if (!container) return;

    if (!data) {
      container.innerHTML = '<p class="text-muted p-3 mb-0 small text-center">No broadcast history logs.</p>';
      return;
    }

    const list = Object.keys(data).map(key => data[key]).reverse();
    let html = '';
    list.forEach(item => {
      html += `
        <div class="list-group-item p-3 border-bottom">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <h6 class="mb-0 fw-bold small">${item.title}</h6>
            <span class="badge bg-secondary small">${item.sentToCount} Recip.</span>
          </div>
          <p class="mb-1 text-muted small" style="white-space:normal">${item.message}</p>
          <small class="text-muted fs-8">${formatDateTime(item.createdAt)}</small>
        </div>
      `;
    });
    container.innerHTML = html;
  });
}
