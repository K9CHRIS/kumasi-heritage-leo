// ==========================================
// Firebase Admin Panel Logic
// ==========================================

// Ensure config exists
if (!window.firebaseConfig || (window.firebaseConfig.apiKey === "YOUR_API_KEY" && !window.firebaseConfig.isDemoMode)) {
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
        showAdminDemoNotice(true);
    } else {
        // User logged out
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        showAdminDemoNotice(false);
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
                
                const thumb = escapeHTML(data.imageUrl || 'assets/hero_bg.png'); // Fallback
                const dateText = escapeHTML(data.dateString || 'Recently');
                const safeId = escapeHTML(id);
                const safeImageUrl = escapeHTML(data.imageUrl || '');
                
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
                    <button class="btn-delete" data-id="${safeId}" data-image="${safeImageUrl}">Delete</button>
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
            postsListContainer.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">Failed to load posts: ${escapeHTML(error.message)}</p>`;
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

function showAdminDemoNotice(isLoggedIn) {
    if (!window.firebaseConfig || !window.firebaseConfig.isDemoMode) return;
    
    // Remove existing notices if any
    const existing = document.querySelectorAll('.admin-demo-notice');
    existing.forEach(el => el.remove());
    
    const notice = document.createElement('div');
    notice.className = 'admin-demo-notice';
    notice.style.background = 'rgba(255, 179, 0, 0.08)';
    notice.style.border = '1px dashed var(--accent-color, #ffb300)';
    notice.style.color = 'var(--text-color)';
    notice.style.padding = '15px';
    notice.style.borderRadius = '8px';
    notice.style.marginBottom = '20px';
    notice.style.fontSize = '0.95rem';
    notice.style.lineHeight = '1.5';
    
    if (isLoggedIn) {
        notice.innerHTML = `
            <strong>✨ Demo Mode Dashboard Active</strong><br>
            Posts and image uploads are saved directly to your browser's local storage database. 
            To deploy live to the cloud, configure your real credentials in <code>firebase-config.js</code>.
        `;
        dashboardView.insertBefore(notice, dashboardView.firstChild);
    } else {
        notice.innerHTML = `
            <strong>✨ Demo Mode Active</strong><br>
            Use <strong>any email and password</strong> to log in and try out the publisher dashboard locally.
        `;
        loginView.insertBefore(notice, loginView.firstChild);
    }
}

// ==========================================
// 6. Admin Member Portal Tab Logic
// ==========================================

// Tabs Switching
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetPanel = document.getElementById(targetTab);
        if (targetPanel) targetPanel.classList.add('active');
        
        if (targetTab === 'tab-members') {
            loadMembers();
        }
    });
});

// Member Management Variables Selection
const memberForm = document.getElementById('member-form');
const memberEmail = document.getElementById('member-email');
const memberName = document.getElementById('member-name');
const memberIdInput = document.getElementById('member-id');
const memberJoined = document.getElementById('member-joined');
const memberDuesStatus = document.getElementById('member-dues-status');
const memberDuesAmount = document.getElementById('member-dues-amount');
const memberDueDate = document.getElementById('member-due-date');
const memberStatus = document.getElementById('member-status');
const submitMemberBtn = document.getElementById('submit-member-btn');

const invoiceForm = document.getElementById('invoice-form');
const invoiceMemberSelect = document.getElementById('invoice-member-select');
const invoiceId = document.getElementById('invoice-id');
const invoiceDesc = document.getElementById('invoice-desc');
const invoiceAmount = document.getElementById('invoice-amount');
const invoiceStatusSelect = document.getElementById('invoice-status');
const invoiceStatusDisplay = document.getElementById('invoice-status-display');
const submitInvoiceBtn = document.getElementById('submit-invoice-btn');

const membersListContainer = document.getElementById('members-list-container');

// Load and Render Members
let registeredMembersList = [];

function loadMembers() {
    membersListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Fetching members...</p>';
    invoiceMemberSelect.innerHTML = '<option value="" disabled selected>Select a member...</option>';
    
    db.collection('members').get()
        .then(snapshot => {
            registeredMembersList = [];
            membersListContainer.innerHTML = '';
            
            if (snapshot.empty) {
                membersListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No members registered yet.</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const member = doc.data();
                registeredMembersList.push(member);
                
                // Add option to dropdown
                const opt = document.createElement('option');
                opt.value = member.email;
                opt.textContent = `${member.name} (${member.memberId})`;
                invoiceMemberSelect.appendChild(opt);
                
                // Render list item
                const mRow = document.createElement('div');
                mRow.className = 'post-row';
                mRow.style.padding = '12px 15px';
                mRow.style.borderBottom = '1px solid var(--border-color)';
                mRow.style.cursor = 'pointer';
                mRow.style.display = 'flex';
                mRow.style.justifyContent = 'space-between';
                mRow.style.alignItems = 'center';
                
                const statusBadge = (member.duesStatus || 'Pending').toLowerCase() === 'paid' ? 'badge-paid' : 'badge-unpaid';
                
                mRow.innerHTML = `
                    <div>
                        <strong style="font-size: 0.95rem; display: block; color: var(--primary);">${escapeHTML(member.name)}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(member.email)} | ${escapeHTML(member.memberId)}</span>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${statusBadge}" style="font-size: 0.75rem; padding: 2px 8px; margin-bottom: 4px; display: inline-block;">${escapeHTML(member.duesStatus)}</span>
                        <strong style="display: block; font-size: 0.9rem; color: var(--text-main);">${escapeHTML(member.duesAmount)}</strong>
                    </div>
                `;
                
                // Clicking populates the Edit form
                mRow.addEventListener('click', () => {
                    memberEmail.value = member.email;
                    memberName.value = member.name;
                    memberIdInput.value = member.memberId;
                    memberJoined.value = member.joinedDate || '';
                    memberDuesStatus.value = member.duesStatus || 'Pending';
                    memberDuesAmount.value = member.duesAmount || 'GH¢ 0.00';
                    memberDueDate.value = member.dueDate || '';
                    
                    showStatus(memberStatus, 'Editing existing member profile.', 'success');
                });
                
                membersListContainer.appendChild(mRow);
            });
        })
        .catch(err => {
            console.error("Error loading members: ", err);
            membersListContainer.innerHTML = `<p style="text-align: center; color: #ef4444;">Error: ${escapeHTML(err.message)}</p>`;
        });
}

// Register / Save Member Form Submission
memberForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = memberEmail.value.trim().toLowerCase();
    const name = memberName.value.trim();
    const mid = memberIdInput.value.trim();
    const joined = memberJoined.value.trim();
    const duesStatus = memberDuesStatus.value;
    const duesAmountVal = memberDuesAmount.value.trim();
    const dueDateVal = memberDueDate.value.trim();
    
    showStatus(memberStatus, '', 'clear');
    
    let isValid = true;
    if (email === '') {
        memberEmail.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        memberEmail.parentElement.classList.remove('invalid');
    }
    
    if (name === '') {
        memberName.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        memberName.parentElement.classList.remove('invalid');
    }
    
    if (mid === '') {
        memberIdInput.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        memberIdInput.parentElement.classList.remove('invalid');
    }
    
    if (isValid) {
        submitMemberBtn.disabled = true;
        submitMemberBtn.textContent = 'Saving Profile...';
        
        // Fetch existing member to preserve invoices list
        const mRef = db.collection('members').doc(email);
        mRef.get().then(doc => {
            let invoices = [];
            if (doc.exists) {
                invoices = doc.data().invoices || [];
            }
            
            return mRef.set({
                email,
                name,
                memberId: mid,
                joinedDate: joined,
                duesStatus,
                duesAmount: duesAmountVal,
                dueDate: dueDateVal,
                invoices
            }, { merge: true });
        })
        .then(() => {
            submitMemberBtn.disabled = false;
            submitMemberBtn.textContent = 'Save Member Profile';
            memberForm.reset();
            showStatus(memberStatus, 'Member profile saved successfully!', 'success');
            loadMembers();
        })
        .catch(err => {
            console.error(err);
            submitMemberBtn.disabled = false;
            submitMemberBtn.textContent = 'Save Member Profile';
            showStatus(memberStatus, `Error: ${err.message}`, 'error');
        });
    }
});

// Issue Invoice Form Submission
invoiceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const selectedEmail = invoiceMemberSelect.value;
    const invId = invoiceId.value.trim();
    const desc = invoiceDesc.value.trim();
    const amountVal = invoiceAmount.value.trim();
    const statusVal = invoiceStatusSelect.value;
    
    showStatus(invoiceStatusDisplay, '', 'clear');
    
    let isValid = true;
    if (!selectedEmail) {
        invoiceMemberSelect.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        invoiceMemberSelect.parentElement.classList.remove('invalid');
    }
    
    if (invId === '') {
        invoiceId.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        invoiceId.parentElement.classList.remove('invalid');
    }
    
    if (desc === '') {
        invoiceDesc.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        invoiceDesc.parentElement.classList.remove('invalid');
    }
    
    if (amountVal === '') {
        invoiceAmount.parentElement.classList.add('invalid');
        isValid = false;
    } else {
        invoiceAmount.parentElement.classList.remove('invalid');
    }
    
    if (isValid) {
        submitInvoiceBtn.disabled = true;
        submitInvoiceBtn.textContent = 'Issuing Invoice...';
        
        const mRef = db.collection('members').doc(selectedEmail.toLowerCase());
        mRef.get().then(doc => {
            if (!doc.exists) {
                throw new Error("Selected member profile does not exist.");
            }
            
            const memberData = doc.data();
            const invoices = memberData.invoices || [];
            
            // Check if invoice ID already exists to prevent duplicate entries
            if (invoices.some(inv => inv.id.toLowerCase() === invId.toLowerCase())) {
                throw new Error("An invoice with this ID already exists.");
            }
            
            const newInvoice = {
                id: invId,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                description: desc,
                amount: amountVal,
                status: statusVal
            };
            
            invoices.push(newInvoice);
            
            // Recalculate member dues automatically if unpaid
            let updatedDuesAmount = memberData.duesAmount || 'GH¢ 0.00';
            let updatedDuesStatus = memberData.duesStatus || 'Pending';
            
            if (statusVal === 'Unpaid') {
                const parseAmt = (str) => parseFloat(str.replace(/[^\d.]/g, '')) || 0;
                const totalDues = parseAmt(updatedDuesAmount) + parseAmt(amountVal);
                updatedDuesAmount = `GH¢ ${totalDues.toFixed(2)}`;
                updatedDuesStatus = 'Pending';
            }
            
            return mRef.update({
                invoices,
                duesAmount: updatedDuesAmount,
                duesStatus: updatedDuesStatus
            });
        })
        .then(() => {
            submitInvoiceBtn.disabled = false;
            submitInvoiceBtn.textContent = 'Issue Invoice';
            invoiceForm.reset();
            showStatus(invoiceStatusDisplay, 'Invoice successfully issued to member!', 'success');
            loadMembers();
        })
        .catch(err => {
            console.error(err);
            submitInvoiceBtn.disabled = false;
            submitInvoiceBtn.textContent = 'Issue Invoice';
            showStatus(invoiceStatusDisplay, `Error: ${err.message}`, 'error');
        });
    }
});

// Clear invalid borders on inputs
const memberInputs = [memberEmail, memberName, memberIdInput, invoiceId, invoiceDesc, invoiceAmount];
memberInputs.forEach(input => {
    input.addEventListener('input', () => {
        input.parentElement.classList.remove('invalid');
    });
});
if (invoiceMemberSelect) {
    invoiceMemberSelect.addEventListener('change', () => {
        invoiceMemberSelect.parentElement.classList.remove('invalid');
    });
}

