document.addEventListener('DOMContentLoaded', () => {
  initNotifications();
});

function initNotifications() {
  getCurrentUser().then(user => {
    if (!user) return;
    
    // Register Notification Bell listener
    const dropContainer = document.getElementById('notifDropdown');
    const dot = document.getElementById('notifDot');
    
    // Listen for customer notifications in real time
    db.ref(`notifications/${user.uid}`).orderByChild('createdAt').limitToLast(20).on('value', snap => {
      const data = snap.val() || {};
      const list = Object.keys(data)
        .map(key => ({ id: key, ...data[key] }))
        .reverse();
      const unreadCount = list.filter(n => !n.read).length;

      if (dot) {
        dot.style.display = unreadCount > 0 ? 'block' : 'none';
      }

      if (dropContainer) {
        let html = '<div class="dropdown-header fw-bold">Notifications</div>';
        if (list.length === 0) {
          html += '<p class="text-muted p-3 mb-0 small">No new notifications</p>';
        } else {
          list.forEach(n => {
            html += `
              <a href="#" class="dropdown-item p-3 border-bottom border-light ${!n.read ? 'bg-light fw-semibold' : ''}" onclick="readNotification('${user.uid}', '${n.id}')">
                <h6 class="mb-1 small">${n.title}</h6>
                <p class="mb-0 text-muted fs-7 small" style="white-space:normal">${n.message}</p>
                <small class="text-muted fs-8">${timeAgo(n.createdAt)}</small>
              </a>
            `;
          });
        }
        dropContainer.innerHTML = html;
      }
    });
  });
}

function readNotification(uid, notifId) {
  db.ref(`notifications/${uid}/${notifId}/read`).set(true);
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
