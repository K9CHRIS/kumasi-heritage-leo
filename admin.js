// ==========================================
// Firebase Admin Panel Logic
// ==========================================

// Ensure config exists
if (!window.firebaseConfig || window.firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.error("Firebase config is missing or contains placeholder values. Please update firebase-config.js.");
}

// Initialize Firebase
firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Elements Selection
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginStatus = document.getElementById('login-status');
const loginBtn = document.getElementById('login-btn');

const adminUserEmail = document.getElementById('admin-user-email');
const logoutBtn = document.getElementById('logout-btn');

const postForm = document.getElementById('post-form');
const postTitle = document.getElementById('post-title');
const postImage = document.getElementById('post-image');
const postContent = document.getElementById('post-content');
const postStatus = document.getElementById('post-status');
const imagePreview = document.getElementById('image-preview');
const previewPlaceholder = document.getElementById('preview-placeholder');
const postsListContainer = document.getElementById('posts-list-container');

// ==========================================
// 1. Auth State Tracking
// ==========================================
auth.onAuthStateChanged(user => {
    if (user) {
        // User logged in
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        adminUserEmail.textContent = user.email;
        loadAdminPosts();
    } else {
        // User logged out
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
    }
});

// ==========================================
// 2. Login Form Handling
// ==========================================
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    // Clear status
    showStatus(loginStatus, '', 'clear');
    
    let isValid = true;
    if (email === '') {
        loginEmail.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        loginEmail.parentElement.classList.remove('invalid');
    }
    
    if (password === '') {
        loginPassword.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        loginPassword.parentElement.classList.remove('invalid');
    }
    
    if (isValid) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Log In';
                loginForm.reset();
            })
            .catch(error => {
                console.error(error);
                loginBtn.disabled = false;
                loginBtn.textContent = 'Log In';
                showStatus(loginStatus, `Login failed: ${error.message}`, 'error');
            });
    }
});

// ==========================================
// 3. Logout Handling
// ==========================================
logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .catch(err => {
            alert("Error logging out: " + err.message);
        });
});

// ==========================================
// 4. File Preview Selection
// ==========================================
postImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
            previewPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        resetImagePreview();
    }
});

function resetImagePreview() {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    previewPlaceholder.style.display = 'block';
}

// ==========================================
// 5. Post Submission
// ==========================================
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = postTitle.value.trim();
    const content = postContent.value.trim();
    const imageFile = postImage.files[0];
    const submitBtn = document.getElementById('submit-post-btn');
    
    showStatus(postStatus, '', 'clear');
    
    let isValid = true;
    if (title === '') {
        postTitle.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        postTitle.parentElement.classList.remove('invalid');
    }
    
    if (content === '') {
        postContent.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        postContent.parentElement.classList.remove('invalid');
    }
    
    if (!isValid) return;
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';
    showStatus(postStatus, 'Uploading assets and saving to database...', 'success');
    
    try {
        let imageUrl = '';
        
        // 1. Upload image to Storage if present
        if (imageFile) {
            const fileExtension = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
            const storageRef = storage.ref(`posts/${fileName}`);
            
            const uploadTask = await storageRef.put(imageFile);
            imageUrl = await uploadTask.ref.getDownloadURL();
        }
        
        // 2. Save document data in Firestore
        await db.collection('posts').add({
            title: title,
            content: content,
            imageUrl: imageUrl,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            dateString: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            author: auth.currentUser.email
        });
        
        // Success cleanup
        showStatus(postStatus, 'Success! Post published to homepage feed.', 'success');
        postForm.reset();
        resetImagePreview();
        loadAdminPosts(); // Refresh active list
        
    } catch (error) {
        console.error("Submission failed: ", error);
        showStatus(postStatus, `Error publishing update: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publish Update';
    }
});

// ==========================================
// 6. Manage Active Posts List
// ==========================================
function loadAdminPosts() {
    postsListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Fetching updates...</p>';
    
    db.collection('posts')
        .orderBy('timestamp', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                postsListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No posts published yet.</p>';
                return;
            }
            
            postsListContainer.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const id = doc.id;
                
                const thumb = data.imageUrl || 'assets/hero_bg.png'; // Fallback
                const dateText = data.dateString || 'Recently';
                
                const postRow = document.createElement('div');
                postRow.className = 'post-row';
                postRow.innerHTML = `
                    <div class="post-row-info">
                        <img src="${thumb}" class="post-row-thumb" alt="Thumbnail">
                        <div class="post-row-meta">
                            <h4>${escapeHTML(data.title)}</h4>
                            <span>${dateText}</span>
                        </div>
                    </div>
                    <button class="btn-delete" data-id="${id}" data-image="${data.imageUrl || ''}">Delete</button>
                `;
                
                // Add Delete Event Listener
                postRow.querySelector('.btn-delete').addEventListener('click', (e) => {
                    const postId = e.target.getAttribute('data-id');
                    const postImgUrl = e.target.getAttribute('data-image');
                    deletePost(postId, postImgUrl);
                });
                
                postsListContainer.appendChild(postRow);
            });
        })
        .catch(error => {
            console.error("Error loading posts: ", error);
            postsListContainer.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">Failed to load posts: ${error.message}</p>`;
        });
}

// ==========================================
// 7. Delete Post Logic
// ==========================================
function deletePost(id, imageUrl) {
    if (!confirm("Are you sure you want to delete this update? This will remove it from the homepage immediately.")) {
        return;
    }
    
    // 1. Delete Firestore Document
    db.collection('posts').doc(id).delete()
        .then(() => {
            // 2. Delete file in storage if it exists and belongs to storage
            if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
                // Extract file path from storage URL
                try {
                    const storageRef = firebase.storage().refFromURL(imageUrl);
                    storageRef.delete()
                        .then(() => console.log("Image deleted from Storage."))
                        .catch(err => console.error("Error deleting image from Storage: ", err));
                } catch (urlError) {
                    console.error("Could not parse image ref: ", urlError);
                }
            }
            loadAdminPosts(); // Refresh UI
        })
        .catch(err => {
            alert("Error deleting post: " + err.message);
        });
}

// ==========================================
// Helpers
// ==========================================
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = 'form-status';
    
    if (type === 'success') {
        element.style.display = 'block';
        element.classList.add('success');
    } else if (type === 'error') {
        element.style.display = 'block';
        element.classList.add('error');
    } else {
        element.style.display = 'none';
    }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Form clear styles on typing
const formInputs = [postTitle, postContent];
formInputs.forEach(input => {
    input.addEventListener('input', () => {
        input.parentElement.classList.remove('invalid');
    });
});
