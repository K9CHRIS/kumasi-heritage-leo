// ==========================================
// Firebase Member Portal Logic
// ==========================================

// Ensure config exists
if (!window.firebaseConfig || (window.firebaseConfig.apiKey === "YOUR_API_KEY" && !window.firebaseConfig.isDemoMode)) {
    console.error("Firebase config is missing or contains placeholder values. Please update firebase-config.js.");
}

// Initialize Firebase
firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements Selection
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginStatus = document.getElementById('login-status');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

const loginDemoNotice = document.getElementById('login-demo-notice');
const dashboardDemoNotice = document.getElementById('dashboard-demo-notice');

// Dashboard Elements
const portalUserName = document.getElementById('portal-user-name');
const cardMemberName = document.getElementById('card-member-name');
const cardMemberId = document.getElementById('card-member-id');
const cardMemberJoined = document.getElementById('card-member-joined');
const cardStatusBadge = document.getElementById('card-status-badge');
const duesBalance = document.getElementById('dues-balance');
const duesNextDate = document.getElementById('dues-next-date');
const invoiceRowsContainer = document.getElementById('invoice-rows-container');

// Current logged in member data cache
let activeMemberData = null;

// ==========================================
// 1. Auth State Tracking
// ==========================================
auth.onAuthStateChanged(user => {
    if (user) {
        // User logged in
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        loadMemberProfile(user.email);
        showPortalDemoNotice(true);
    } else {
        // User logged out
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        activeMemberData = null;
        showPortalDemoNotice(false);
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
// 4. Fetch Member Profile & Invoices
// ==========================================
function loadMemberProfile(email) {
    invoiceRowsContainer.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Fetching records...</td></tr>';
    
    db.collection('members').doc(email.toLowerCase()).get()
        .then(doc => {
            if (!doc.exists) {
                // Profile not registered by administrator
                portalUserName.textContent = email.split('@')[0];
                duesBalance.textContent = "GH¢ 0.00";
                invoiceRowsContainer.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #ef4444; padding: 30px;">
                            ⚠️ No member record matches this email address. Please contact the Club President to register your profile.
                        </td>
                    </tr>
                `;
                // Set placeholder values on the card
                cardMemberName.textContent = "Guest User";
                cardMemberId.textContent = "Unregistered";
                cardMemberJoined.textContent = "N/A";
                cardStatusBadge.textContent = "Inactive";
                cardStatusBadge.className = "status-badge-card badge-overdue";
                return;
            }
            
            const member = doc.data();
            activeMemberData = member; // Cache globally
            
            // 1. Populate details
            portalUserName.textContent = member.name;
            cardMemberName.textContent = member.name;
            cardMemberId.textContent = member.memberId;
            cardMemberJoined.textContent = member.joinedDate || 'N/A';
            
            // Dues
            duesBalance.textContent = member.duesAmount || 'GH¢ 0.00';
            duesNextDate.textContent = member.dueDate || 'N/A';
            
            // Status badge on Digital Card
            const status = (member.duesStatus || 'Pending').toLowerCase();
            cardStatusBadge.textContent = member.duesStatus || 'Pending';
            
            if (status === 'paid') {
                cardStatusBadge.className = 'status-badge-card badge-paid';
            } else if (status === 'overdue') {
                cardStatusBadge.className = 'status-badge-card badge-overdue';
            } else {
                cardStatusBadge.className = 'status-badge-card badge-unpaid';
            }
            
            // 2. Render Invoices Table
            renderInvoices(member.invoices || []);
        })
        .catch(err => {
            console.error("Error loading profile: ", err);
            invoiceRowsContainer.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ef4444; padding: 30px;">
                        Failed to fetch data: ${escapeHTML(err.message)}
                    </td>
                </tr>
            `;
        });
}

function renderInvoices(invoices) {
    if (invoices.length === 0) {
        invoiceRowsContainer.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No invoice records issued yet.</td></tr>';
        return;
    }
    
    invoiceRowsContainer.innerHTML = '';
    
    invoices.forEach(inv => {
        const id = escapeHTML(inv.id);
        const date = escapeHTML(inv.date);
        const desc = escapeHTML(inv.description);
        const amt = escapeHTML(inv.amount);
        const status = escapeHTML(inv.status || 'Unpaid');
        const statusClass = status.toLowerCase() === 'paid' ? 'badge-paid' : 'badge-unpaid';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${id}</strong></td>
            <td>${date}</td>
            <td>${desc}</td>
            <td>${amt}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td style="text-align: right;">
                <button class="btn btn-secondary btn-sm btn-print" data-id="${id}" style="padding: 6px 12px; font-size: 0.8rem;">Print Invoice 📄</button>
            </td>
        `;
        
        row.querySelector('.btn-print').addEventListener('click', (e) => {
            const selectedId = e.target.getAttribute('data-id');
            printInvoice(selectedId);
        });
        
        invoiceRowsContainer.appendChild(row);
    });
}

// ==========================================
// 5. Dynamic Print Invoice Receipt Generator
// ==========================================
function printInvoice(invoiceId) {
    if (!activeMemberData || !activeMemberData.invoices) return;
    
    const invoice = activeMemberData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert("Invoice not found!");
        return;
    }
    
    const win = window.open('', '_blank', 'width=800,height=700');
    
    // Write printable content with a premium billing layout
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${escapeHTML(invoice.id)}</title>
            <style>
                body {
                    font-family: 'Inter', Arial, sans-serif;
                    color: #1e293b;
                    padding: 40px;
                    line-height: 1.5;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo-section h2 {
                    margin: 0 0 5px 0;
                    color: #003366;
                    font-size: 1.5rem;
                }
                .logo-section p {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .title-section {
                    text-align: right;
                }
                .title-section h1 {
                    margin: 0 0 5px 0;
                    color: #1e293b;
                    font-size: 1.8rem;
                }
                .title-section p {
                    margin: 0;
                    font-size: 0.9rem;
                    font-weight: bold;
                }
                .bill-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-bottom: 40px;
                }
                .bill-col h3 {
                    margin: 0 0 10px 0;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    color: #64748b;
                    letter-spacing: 0.5px;
                }
                .bill-col p {
                    margin: 0 0 5px 0;
                    font-size: 0.95rem;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 40px;
                }
                .invoice-table th {
                    background-color: #f8fafc;
                    border-bottom: 2px solid #cbd5e1;
                    padding: 12px;
                    text-align: left;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    color: #64748b;
                }
                .invoice-table td {
                    border-bottom: 1px solid #e2e8f0;
                    padding: 12px;
                    font-size: 0.95rem;
                }
                .invoice-total {
                    text-align: right;
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-bottom: 50px;
                }
                .badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .badge-paid { background-color: #dcfce7; color: #15803d; }
                .badge-unpaid { background-color: #ffedd5; color: #c2410c; }
                .footer {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                    text-align: center;
                    font-size: 0.8rem;
                    color: #64748b;
                }
                @media print {
                    body { padding: 0; }
                    .btn-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;" class="btn-print">
                <button onclick="window.print()" style="background-color: #003366; color: white; border: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer;">Print / Download PDF</button>
            </div>
            
            <div class="invoice-header">
                <div class="logo-section">
                    <h2>KUMASI HERITAGE VIRTUAL LEO-LIONS</h2>
                    <p>Community Hall, Kumasi, Ghana</p>
                    <p>info@kumasiheritageleo.org</p>
                </div>
                <div class="title-section">
                    <h1>INVOICE</h1>
                    <p>No: ${escapeHTML(invoice.id)}</p>
                </div>
            </div>
            
            <div class="bill-grid">
                <div class="bill-col">
                    <h3>Billed To:</h3>
                    <p><strong>Name:</strong> ${escapeHTML(activeMemberData.name)}</p>
                    <p><strong>Member ID:</strong> ${escapeHTML(activeMemberData.memberId)}</p>
                    <p><strong>Email:</strong> ${escapeHTML(activeMemberData.email)}</p>
                </div>
                <div class="bill-col" style="text-align: right;">
                    <h3>Details:</h3>
                    <p><strong>Date Issued:</strong> ${escapeHTML(invoice.date)}</p>
                    <p><strong>Billing Status:</strong> <span class="badge ${invoice.status.toLowerCase() === 'paid' ? 'badge-paid' : 'badge-unpaid'}">${escapeHTML(invoice.status)}</span></p>
                </div>
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${escapeHTML(invoice.description)}</td>
                        <td style="text-align: right;">${escapeHTML(invoice.amount)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="invoice-total">
                Total Due: ${escapeHTML(invoice.amount)}
            </div>
            
            <div class="footer">
                <p>Thank you for your service and commitment to the Kumasi Heritage Club!</p>
                <p>&copy; 2026 Kumasi Heritage Virtual Leo-Lions Club. Sponsored by Lions Club International.</p>
            </div>
        </body>
        </html>
    `);
    
    win.document.close();
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
const formInputs = [loginEmail, loginPassword];
formInputs.forEach(input => {
    input.addEventListener('input', () => {
        input.parentElement.classList.remove('invalid');
    });
});

function showPortalDemoNotice(isLoggedIn) {
    if (!window.firebaseConfig || !window.firebaseConfig.isDemoMode) return;
    
    if (isLoggedIn) {
        loginDemoNotice.style.display = 'none';
        dashboardDemoNotice.style.display = 'block';
        dashboardDemoNotice.innerHTML = `
            <strong>✨ Member Portal Demo Mode Active</strong><br>
            Showing mock data saved locally in your browser storage. You can register new members or issue invoices inside the <a href="admin.html" style="color: var(--accent); text-decoration: underline; font-weight: bold;">Admin Panel</a>!
        `;
    } else {
        loginDemoNotice.style.display = 'block';
        dashboardDemoNotice.style.display = 'none';
        loginDemoNotice.innerHTML = `
            <strong>✨ Demo Mode Active</strong><br>
            Log in with <strong><code>member@leolion.org</code></strong> and any password to test the member dashboard!
        `;
    }
}
