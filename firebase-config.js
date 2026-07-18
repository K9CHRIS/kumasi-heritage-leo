// Firebase Configuration Keys
// Replace these placeholders with your actual keys from your Firebase Console (Project Settings -> Web App)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Expose config globally so it can be accessed by other files (app.js and admin.js)
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
}
