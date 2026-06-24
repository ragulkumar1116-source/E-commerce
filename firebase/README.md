# E&P SMART Electrical Store V2.0 (Multi-Tenant Platform)

A Complete Production-Ready Multi-Company (Multi-Tenant) B2B E-Commerce Web Application built with HTML5, CSS3, Bootstrap 5, and Firebase Services. This system supports hosting unlimited independent companies/storefronts on the same codebase and Firebase project.

## Tech Stack
- **Frontend**: HTML5, CSS3, Bootstrap 5.3, JavaScript ES6
- **Backend**: Firebase Auth, Firebase Realtime Database
- **Payments**: Dynamic UPI QR Payments with UTR verifications
- **PWA**: manifest.json, sw.js (Offline caching capability)

## Database Structure
```json
{
  "users": {
    "UID": { "name": "...", "email": "...", "phone": "...", "role": "customer|admin", "companyId": "COMPANYID" }
  },
  "companies": {
    "COMPANYID": { 
      "companyName": "...", 
      "email": "...", 
      "phone": "...", 
      "address": "...", 
      "upiMerchantId": "...", 
      "shippingCharges": 100 
    }
  },
  "categories": {
    "CATID": { "name": "MCB", "image": "...", "status": "active", "companyId": "COMPANYID" }
  },
  "products": {
    "PRODID": { "name": "...", "price": 0, "stockQuantity": 0, "status": "active", "companyId": "COMPANYID" }
  },
  "cart": {
    "UID": {
      "PRODID": { "productId": "...", "name": "...", "companyId": "COMPANYID" }
    }
  },
  "wishlist": {
    "UID": {
      "PRODID": { "productId": "...", "name": "...", "companyId": "COMPANYID" }
    }
  },
  "orders": {
    "ORDERID": { "orderId": "...", "companyId": "COMPANYID", "userId": "...", "customerName": "...", "grandTotal": 0 }
  },
  "payments": {
    "PAYMENTID": { "paymentId": "...", "companyId": "COMPANYID", "orderId": "...", "status": "..." }
  },
  "notifications": {
    "UID": {
      "NOTIFID": { "title": "...", "message": "...", "companyId": "COMPANYID" }
    }
  },
  "broadcasts": {
    "BROADCASTID": { "title": "...", "message": "...", "companyId": "COMPANYID" }
  }
}
```

## First Time Configuration & Deployment Guide

### 1. Firebase Project Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** and **Google** sign-in providers in the **Authentication** section.
3. Initialize the **Realtime Database** (choose your location and test mode rules).
4. Register a new Web App in your Firebase project and copy the configuration object.
5. Open `assets/js/firebase-config.js` and replace the placeholder credentials with your configuration.

### 2. Deploy Rules & Registering a Company
1. Open database rules in the Firebase console and copy the rules from `firebase/database.rules.json`. These include index rules for `companyId` parameters.
2. Launch the storefront application and navigate to `auth/register-company.html` to register a new company. This will:
   - Create the company node under `/companies/{companyId}`.
   - Register the admin authentication credentials.
   - Create an admin user profile under `/users/{uid}`.
   - Push a default general category flat to `/categories`.

### 3. Accessing the Dashboard & Seeding
1. Log in to the Admin Dashboard at `admin/login.html` using your registered administrator credentials.
2. Upon first login, the admin script will detect that no products exist for your specific company and automatically seed the default electrical products and categories with your unique `companyId` attached.
3. Go to **Settings** under the Admin Panel. Update your company details (branding, email, address, logo, and **Merchant UPI VPA ID**) and click **Save Store Configurations**. Changes are saved directly to `/companies/{companyId}` and instantly update your customer storefront.

### 4. Customer Storefront Entry
- The entry point for the storefront is **`index.html`**. If a customer visits the storefront without a specific company parameter, the script automatically queries the database for the first registered company, sets it as active, and reloads the page with `?companyId=COMPANYID`. 
- To visit a specific company storefront directly, link to `index.html?companyId=COMPANYID`.

### 5. Deploying to Firebase Hosting
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
   - Choose **Use an existing project** and select your project.
   - For public directory, specify `../` (which maps to the root directory where your `.html` files reside).
   - For database rules, choose `database.rules.json`.
4. Deploy to production:
   ```bash
   firebase deploy
   ```
