document.addEventListener('DOMContentLoaded', () => {
  // Detect forms
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const forgotForm = document.getElementById('forgotForm');

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', handleForgotPassword);
  }

  const btnGoogle = document.getElementById('btnGoogle');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', handleGoogleLogin);
  }
});

function handleRegister(e) {
  e.preventDefault();
  const name = sanitizeInput(document.getElementById('regName').value);
  const email = sanitizeInput(document.getElementById('regEmail').value);
  const phone = sanitizeInput(document.getElementById('regPhone').value);
  const pass = document.getElementById('regPassword').value;
  const confPass = document.getElementById('regConfirmPassword').value;

  if (!name || !email || !phone || !pass) {
    showToast('All fields are required', 'warning');
    return;
  }

  if (!validateEmail(email)) {
    showToast('Please enter a valid email address', 'warning');
    return;
  }

  if (!validatePhone(phone)) {
    showToast('Please enter a valid 10-digit mobile number', 'warning');
    return;
  }

  if (pass.length < 6) {
    showToast('Password must be at least 6 characters long', 'warning');
    return;
  }

  if (pass !== confPass) {
    showToast('Passwords do not match', 'warning');
    return;
  }

  showLoader();
  auth.createUserWithEmailAndPassword(email, pass)
    .then((result) => {
      const user = result.user;
      return user.updateProfile({ displayName: name }).then(() => {
        // Save user profile to Realtime Database
        return db.ref(`users/${user.uid}`).set({
          name: name,
          email: email,
          phone: phone,
          role: 'customer',
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      });
    })
    .then(() => {
      hideLoader();
      showToast('Registration successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = '../index.html', 1500);
    })
    .catch((err) => {
      hideLoader();
      showToast(err.message, 'error');
    });
}

function handleLogin(e) {
  e.preventDefault();
  const email = sanitizeInput(document.getElementById('loginEmail').value);
  const pass = document.getElementById('loginPassword').value;

  if (!email || !pass) {
    showToast('Please fill all fields', 'warning');
    return;
  }

  showLoader();
  auth.signInWithEmailAndPassword(email, pass)
    .then((result) => {
      const user = result.user;
      // Get role
      return db.ref(`users/${user.uid}/role`).once('value');
    })
    .then((roleSnap) => {
      hideLoader();
      const role = roleSnap.val() || 'customer';
      showToast('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '../admin/dashboard.html';
        } else {
          window.location.href = '../index.html';
        }
      }, 1000);
    })
    .catch((err) => {
      hideLoader();
      showToast(err.message, 'error');
    });
}

function handleGoogleLogin() {
  showLoader();
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      // Check if user exists in Database, if not, write profile
      const userRef = db.ref(`users/${user.uid}`);
      return userRef.once('value').then((snap) => {
        if (!snap.exists()) {
          return userRef.set({
            name: user.displayName,
            email: user.email,
            phone: user.phoneNumber || '',
            role: 'customer',
            createdAt: firebase.database.ServerValue.TIMESTAMP
          });
        }
      });
    })
    .then(() => {
      // Re-read role and redirect
      const uid = auth.currentUser.uid;
      return db.ref(`users/${uid}/role`).once('value');
    })
    .then((roleSnap) => {
      hideLoader();
      const role = roleSnap.val() || 'customer';
      showToast('Login successful!', 'success');
      setTimeout(() => {
        if (role === 'admin') {
          window.location.href = '../admin/dashboard.html';
        } else {
          window.location.href = '../index.html';
        }
      }, 1000);
    })
    .catch((err) => {
      hideLoader();
      showToast(err.message, 'error');
    });
}

function handleForgotPassword(e) {
  e.preventDefault();
  const email = sanitizeInput(document.getElementById('forgotEmail').value);

  if (!email || !validateEmail(email)) {
    showToast('Please enter a valid email address', 'warning');
    return;
  }

  showLoader();
  auth.sendPasswordResetEmail(email)
    .then(() => {
      hideLoader();
      showToast('Password reset link sent to your email', 'success');
      document.getElementById('forgotEmail').value = '';
    })
    .catch((err) => {
      hideLoader();
      showToast(err.message, 'error');
    });
}
