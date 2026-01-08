# 🪙 PennyWise Pro
**Smart, Fast, Insightful Personal Finance PWA**

PennyWise Pro is an offline-first Progressive Web App designed to give users total control over their finances with automated insights, subscription tracking, and behavioral gamification.

## 🚀 Features
* **Google Authentication**: Secure, one-tap access.
* **Burn Rate Forecasting**: Predicts end-of-month spending based on current daily habits.
* **No-Spend Streaks**: Gamified tracker to encourage saving days.
* **Subscription Detector**: Automatically identifies and calculates the annual cost of recurring bills.
* **Round-Up Savings**: Visualizes potential savings by rounding up every transaction.
* **Dark Mode**: System-aware and persistent theme selection.
* **Offline Support**: View and add data without an internet connection via Firestore Persistence.

## 🛠️ Tech Stack
* **Frontend**: HTML5, Tailwind CSS, jQuery
* **Database**: Firebase Firestore
* **Auth**: Firebase Authentication (Google)
* **PWA**: Service Workers & Web App Manifest
* **Charts**: Chart.js

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/yourusername/pennywise-pro.git](https://github.com/yourusername/pennywise-pro.git)
    cd pennywise-pro
    ```

2.  **Firebase Configuration**
    Update the `firebaseConfig` object in `app.js` with your credentials from the [Firebase Console](https://console.firebase.google.com/).

3.  **Deploy Firestore Rules**
    Copy the rules from `firestore.rules` (provided in the project) into your Firebase Console under the Firestore "Rules" tab.

4.  **Deploy Indexes**
    Run the following command to ensure the composite indexes are built:
    ```bash
    firebase deploy --only firestore:indexes
    ```

5.  **Hosting**
    ```bash
    firebase deploy --only hosting
    ```

## 🔐 Security
The app uses granular Firestore Security Rules to ensure:
* Users can only access their own data (`request.auth.uid == resource.data.uid`).
* Historical data integrity is maintained by preventing edits to transactions older than 30 days.

## 📱 PWA Support
PennyWise is fully installable. 
* **iOS**: Share -> Add to Home Screen.
* **Android**: Tap the "Add to Home Screen" prompt.
