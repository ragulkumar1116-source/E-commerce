# nvm Tech Electrical Store V2.0

A Complete Production-Ready B2B E-Commerce Web Application built with HTML5, CSS3, Bootstrap 5, and Firebase Services.

## Tech Stack
- **Frontend**: HTML5, CSS3, Bootstrap 5.3, JavaScript ES6
- **Backend**: Firebase Auth, Firebase Realtime Database
- **Payments**: Dynamic UPI QR Payments with UTR verifications
- **PWA**: manifest.json, sw.js (Offline caching capability)

## Database Structure
```json
{
  "users": {
    "UID": { "name": "...", "email": "...", "phone": "...", "role": "customer|admin" }
  },
  "categories": {
    "CATID": { "name": "MCB", "image": "...", "status": "active" }
  },
  "products": {
    "PRODID": { "name": "...", "price": 0, "stockQuantity": 0, "status": "active" }
  },
  "cart": {},
  "wishlist": {},
  "orders": {},
  "payments": {},
  "notifications": {},
  "settings": {}
}
```

## First Time Configuration & Deployment Guide

### 1. Firebase Project Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** and **Google** sign-in providers in the **Authentication** section.
3. Initialize the **Realtime Database** (choose your location and test mode rules).
4. Register a new Web App in your Firebase project and copy the configuration object.
5. Open `assets/js/firebase-config.js` and replace the placeholder credentials with your configuration.

### 2. Seeding default data
- Run the storefront locally. On the first page load, the application will automatically detect that no categories or products exist in your Firebase Database, and it will seed the default 15 electrical/industrial categories (MCB, MCCB, PLCs, VFDs, etc.) and 3 sample products, along with fallback store settings.

### 3. Creating Admin User
1. Register a new user account through `/auth/register.html`.
2. Open your Firebase Database console and locate the user's UID under `users/{UID}`.
3. Change the `"role": "customer"` field to `"role": "admin"`.
4. Navigate to `/admin/login.html` to log in to your Admin Dashboard.
5. In **Settings**, update your company details, default GST, shipping, and set your **Merchant UPI VPA** ID.

### 4. Deploying to Firebase Hosting
To host the production site on Firebase Hosting:
1. Install the Firebase CLI tool globally:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to your Firebase account:
   ```bash
   firebase login
   ```
3. Initialize the Firebase setup inside the `firebase/` directory:
   ```bash
   cd firebase
   firebase init
   ```
   - Select **Hosting** and **Database**.
   - Choose **Use an existing project** and select your created project.
   - When asked for the public directory, specify `../` (which maps to the root directory where your `.html` files reside, as pre-configured in `firebase.json`).
   - For database rules, choose `database.rules.json`.
4. Deploy the rules and hosting assets to production:
   ```bash
   firebase deploy
   ```
5. Your application is now live at `https://<YOUR_PROJECT_ID>.web.app`!

