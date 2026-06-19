// Firebase project credentials. Replace placeholders with actual credentials.
const firebaseConfig = {
  apiKey: "AIzaSyCQy4Xbij6FlBlBhqHrrBd8Y4UVnAl_mrc",
  authDomain: "rk-tech-eb179.firebaseapp.com",
  databaseURL: "https://rk-tech-eb179-default-rtdb.firebaseio.com",
  projectId: "rk-tech-eb179",
  storageBucket: "rk-tech-eb179.firebasestorage.app",
  messagingSenderId: "804146367196",
  appId: "1:804146367196:web:e0cf09f937d5198cb74219"
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
