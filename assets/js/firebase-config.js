// Synchronously load the .env file from the server root
function loadEnvConfig() {
  const xhr = new XMLHttpRequest();
  // Use root-relative path so it works across both storefront and admin subfolders
  xhr.open("GET", "/.env", false); 
  try {
    xhr.send();
    if (xhr.status === 200) {
      const env = {};
      xhr.responseText.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx > 0) {
            const k = trimmed.substring(0, idx).trim();
            let v = trimmed.substring(idx + 1).trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.substring(1, v.length - 1);
            }
            env[k] = v;
          }
        }
      });
      return env;
    }
  } catch (e) {
    console.warn("Failed to load .env config dynamically, using fallback credentials", e);
  }
  return null;
}

const env = loadEnvConfig() || {};

// Firebase project credentials
const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY || "AIzaSyCQy4Xbij6FlBlBhqHrrBd8Y4UVnAl_mrc",
  authDomain: env.FIREBASE_AUTH_DOMAIN || "rk-tech-eb179.firebaseapp.com",
  databaseURL: env.FIREBASE_DATABASE_URL || "https://rk-tech-eb179-default-rtdb.firebaseio.com",
  projectId: env.FIREBASE_PROJECT_ID || "rk-tech-eb179",
  storageBucket: env.FIREBASE_STORAGE_BUCKET || "rk-tech-eb179.firebasestorage.app",
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || "804146367196",
  appId: env.FIREBASE_APP_ID || "1:804146367196:web:e0cf09f937d5198cb74219"
};

// Initialize Firebase Compat
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

// Listen for connection state changes
db.ref(".info/connected").on("value", (snap) => {
  if (snap.val() === true) {
    console.log("Connected to Firebase Realtime Database");
  } else {
    console.log("Disconnected from Firebase Realtime Database");
  }
});
