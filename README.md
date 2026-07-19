# 🦁 Leo-Lion Club Website with Admin Dashboard

Welcome to the official **Kumasi Heritage Virtual Leo-Lions Club** website repository! Hosted live at **[https://kumasiheritageleolions.org](https://kumasiheritageleolions.org)**.

It is structured with a **modern hybrid architecture**:
1. **Frontend Hosting (100% Free)**: Powered by **GitHub Pages**.
2. **Backend Database & Authentication (100% Free)**: Powered by **Firebase**.

This setup allows the Club President/Administrators to securely log into an admin panel (`/admin.html`), publish news updates, and upload photos, which instantly display on the homepage feed without editing any code!

---

## 📂 Project Directory Structure
```text
leo-lion-club-website/
├── assets/               # 📸 Images, photos, and branding icons
│   ├── hero_bg.png       
│   ├── project_env.png   
│   ├── project_food.png  
│   └── project_edu.png   
├── index.html            # 📝 Public website skeleton & layout
├── styles.css            # 🎨 Theme styles & responsive grids
├── app.js                # ⚙️ Public client script (fetches posts, timer, scroll checks)
├── admin.html            # 🔐 Secure Admin Login & Publisher panel
├── admin.js              # 🛡️ Admin dashboard controller (uploads & auth)
├── firebase-config.js    # 🔑 Firebase API credentials storage
├── firebase_setup.md     # 🛠️ Guide to creating your free Firebase project
└── README.md             # 🚀 Deployment guide (this document)
```

---

## 🛠️ Step 1: Firebase Project Setup
Before putting your site live, you must create a free database. 
1. Open the file **[firebase_setup.md](file:///C:/Users/Hermes/.gemini/antigravity/scratch/leo-lion-club-website/firebase_setup.md)**.
2. Follow the 7 quick steps to register your app, configure authentication, and copy your keys.
3. Paste your credentials into **[firebase-config.js](file:///C:/Users/Hermes/.gemini/antigravity/scratch/leo-lion-club-website/firebase-config.js)**.

---

## 🚀 Step 2: Host on GitHub Pages (Free)

### 1. Create a GitHub Repository
1. Log in to [github.com](https://github.com).
2. Create a new repository named `leo-lion-club`. Set it to **Public** (required for free GitHub Pages).
3. Do **not** initialize it with a README or gitignore.

### 2. Push Your Files
Open your terminal, navigate to this project folder, and run:
```bash
# Initialize local git
git init

# Stage and commit files
git add .
git commit -m "Initial commit: Leo-Lion website with Firebase backend"

# Set branch name to main
git branch -M main

# Link to GitHub (Replace USERNAME and REPO-NAME with your details)
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Push code
git push -u origin main
```

### 3. Activate Pages
1. In your GitHub repository, click **Settings** (gear icon) -> **Pages** (in the left-hand column).
2. Set Build and deployment Source to **Deploy from a branch**.
3. Select **main** and `/ (root)`, then click **Save**.
4. Wait 1-2 minutes and refresh the page. Your live site URL will be displayed at the top!

---

## 🔐 How the President Publishes Updates
1. Go to your live URL and append `/admin.html` to the address bar (e.g., `https://username.github.io/repo-name/admin.html`).
2. Log in using the email and password you created in **Authentication** during the Firebase setup.
3. Fill out the Title, select an optional photo, write your update text, and click **Publish Update**.
4. The update is uploaded to Firebase Cloud Storage, saved to Firestore, and appears instantly on the public homepage feed!
