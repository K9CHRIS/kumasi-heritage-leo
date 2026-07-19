# 🛠️ Firebase Project Setup Guide

To power the dynamic features of your website (login, posting updates, and uploading images), you need to set up a free **Firebase Project**. Follow these step-by-step instructions to get started.

---

## Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., `leo-lion-club-website`).
4. Choose whether to enable Google Analytics (recommended, but optional) and click **Create project**.
5. Once your project is ready, click **Continue**.

---

## Step 2: Register your Web App
1. On the project home page, click the **Web icon** (`</>`) in the center of the screen to register a new web app.
2. Give your app a nickname (e.g., `Leo Lion Web`).
3. Leave "Also set up Firebase Hosting" unchecked (since we are hosting on GitHub Pages).
4. Click **Register app**.
5. Under the "Add Firebase SDK" section, find the `const firebaseConfig = { ... };` block. 
6. Copy just the configuration keys inside the curly braces. You will paste these into your `firebase-config.js` file later!
7. Click **Continue to console**.

---

## Step 3: Enable Email/Password Authentication
This enables the secure login page for the Club President.
1. In the left-hand navigation sidebar, click on **Build** -> **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Toggle **Enable** (leave "Email link (passwordless sign-in)" disabled) and click **Save**.
5. Go to the **Users** tab (next to Sign-in method).
6. Click **Add user**.
7. Enter the President's email address and a strong password. Click **Add user**. (Make a note of these credentials for logging into the admin panel!)

---

## Step 4: Create a Cloud Firestore Database
This database will store your text posts and metadata.
1. In the left-hand sidebar, click on **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Set your Database ID to `(default)` and click **Next**.
4. Select **Start in test mode** (we will configure security rules in the next step) and click **Next**.
5. Choose a cloud location near you and click **Create**.

---

## Step 5: Configure Firestore Security Rules
1. In your Firestore Database menu, click on the **Rules** tab at the top.
2. Replace the existing rules with the following code (which allows anyone to read posts, but only logged-in users to create or delete them):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{document} {
      // Anyone can read posts
      allow read: if true;
      // Only authenticated users can write (create/update/delete) posts
      allow write: if request.auth != null;
    }
  }
}
```
3. Click **Publish**.

---

## Step 6: Set up Firebase Cloud Storage (For Uploading Images)
This stores images uploaded during posts.
1. In the left-hand sidebar, click on **Build** -> **Storage**.
2. Click **Get Started**.
3. Select **Start in test mode** and click **Next**.
4. Select your location (leave default) and click **Done**.
5. Once configured, click the **Rules** tab at the top of the Storage menu.
6. Replace the rules with the following code:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Anyone can view files
      allow read: if true;
      // Only logged-in users can upload/delete files
      allow write: if request.auth != null;
    }
  }
}
```
7. Click **Publish**.

---

## Step 7: Update your Configuration file
Now open your project directory, open **[firebase-config.js](file:///C:/Users/Hermes/.gemini/antigravity/scratch/leo-lion-club-website/firebase-config.js)**, and replace the empty values with the keys you copied in **Step 2**:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```
Now, you are fully set up! Your admin dashboard is fully secure and operational.
