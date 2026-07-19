// Firebase Configuration
// NOTE: For production, replace this with your actual Firebase project config.
// The app currently runs in Demo Mode using localStorage for all member/admin data.
// To connect to a live Firebase backend, set isDemoMode to false and add real credentials.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Always run in demo mode (localStorage-backed mock) until real Firebase credentials are set.
// This prevents the app from hitting real Firebase endpoints and avoids exposing API keys.
firebaseConfig.isDemoMode = true;
setupFirebaseMock();

// Expose config globally so it can be accessed by other files (app.js and admin.js)
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
}

function setupFirebaseMock() {
    console.warn("Firebase is running in Demo Mode (Local Storage Mock).");
    
    // Save default posts to localStorage if empty
    const defaultPosts = [
        {
            id: "post_1",
            title: "Beach Clean-up Drive",
            content: "Our members gathered at the coastline to collect plastics and restore the local ecosystem. Over 50 bags of waste were successfully recycled.",
            imageUrl: "assets/project_env.png",
            dateString: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            timestamp: Date.now(),
            author: "secretary@leo-lion.org"
        },
        {
            id: "post_2",
            title: "Food Security Campaign",
            content: "Successfully distributed over 500 food boxes to vulnerable families in the community. Thank you to all donors and volunteers!",
            imageUrl: "assets/project_food.png",
            dateString: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            timestamp: Date.now() - 86400000,
            author: "president@leo-lion.org"
        },
        {
            id: "post_3",
            title: "Education Support for Kids",
            content: "Donated textbooks, school bags, and writing materials to students at local schools to aid their educational journey.",
            imageUrl: "assets/project_edu.png",
            dateString: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            timestamp: Date.now() - 172800000,
            author: "education.chair@leo-lion.org"
        }
    ];
    
    if (!localStorage.getItem('leo_lion_posts')) {
        localStorage.setItem('leo_lion_posts', JSON.stringify(defaultPosts));
    }

    // Save default members to localStorage if empty
    const defaultMembers = [
        {
            name: "Klu Evans Kwesi",
            memberId: "KHVLLC-024",
            email: "member@leolion.org",
            joinedDate: "September 12, 2025",
            duesAmount: "GH¢ 150.00",
            duesStatus: "Pending", // Paid, Pending, Overdue
            dueDate: "September 1, 2026",
            invoices: [
                {
                    id: "INV-2026-004",
                    date: "July 01, 2026",
                    description: "Annual Membership Dues 2026/2027",
                    amount: "GH¢ 150.00",
                    status: "Unpaid"
                },
                {
                    id: "INV-2025-012",
                    date: "September 15, 2025",
                    description: "New Member Induction Fee",
                    amount: "GH¢ 100.00",
                    status: "Paid"
                }
            ]
        }
    ];

    if (!localStorage.getItem('leo_lion_members')) {
        localStorage.setItem('leo_lion_members', JSON.stringify(defaultMembers));
    }
    
    const listeners = [];
    function notifyListeners() {
        const posts = JSON.parse(localStorage.getItem('leo_lion_posts') || '[]');
        listeners.forEach(cb => {
            const snapshot = {
                empty: posts.length === 0,
                forEach: (forEachCb) => {
                    posts.forEach(p => {
                        forEachCb({
                            id: p.id,
                            data: () => ({
                                ...p,
                                timestamp: p.timestamp
                            })
                        });
                    });
                }
            };
            cb(snapshot);
        });
    }

    const mockFirebase = {
        initializeApp: () => {
            console.log("Mock Firebase App Initialized");
        },
        auth: () => {
            let currentUserEmail = localStorage.getItem('leo_lion_auth_email') || null;
            const authStateListeners = [];
            
            const triggerAuthState = () => {
                const user = currentUserEmail ? { email: currentUserEmail } : null;
                authStateListeners.forEach(cb => cb(user));
            };
            
            return {
                onAuthStateChanged: (callback) => {
                    authStateListeners.push(callback);
                    const user = currentUserEmail ? { email: currentUserEmail } : null;
                    setTimeout(() => callback(user), 50);
                },
                signInWithEmailAndPassword: async (email, password) => {
                    // Sign in admin or member
                    localStorage.setItem('leo_lion_auth_email', email);
                    currentUserEmail = email;
                    triggerAuthState();
                    return { user: { email } };
                },
                signOut: async () => {
                    localStorage.removeItem('leo_lion_auth_email');
                    currentUserEmail = null;
                    triggerAuthState();
                },
                get currentUser() {
                    return currentUserEmail ? { email: currentUserEmail } : null;
                }
            };
        },
        firestore: Object.assign(() => {
            return {
                collection: (name) => {
                    if (name === 'posts') {
                        return {
                            orderBy: (field, direction) => {
                                return {
                                    onSnapshot: (callback) => {
                                        listeners.push(callback);
                                        notifyListeners();
                                        return () => {
                                            const idx = listeners.indexOf(callback);
                                            if (idx > -1) listeners.splice(idx, 1);
                                        };
                                    },
                                    get: async () => {
                                        const posts = JSON.parse(localStorage.getItem('leo_lion_posts') || '[]');
                                        return {
                                            empty: posts.length === 0,
                                            forEach: (forEachCb) => {
                                                posts.forEach(p => {
                                                    forEachCb({
                                                        id: p.id,
                                                        data: () => p
                                                    });
                                                });
                                            }
                                        };
                                    }
                                };
                            },
                            add: async (data) => {
                                const posts = JSON.parse(localStorage.getItem('leo_lion_posts') || '[]');
                                const newPost = {
                                    id: 'post_' + Date.now(),
                                    title: data.title,
                                    content: data.content,
                                    imageUrl: data.imageUrl || 'assets/hero_bg.png',
                                    dateString: data.dateString || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                                    timestamp: Date.now(),
                                    author: data.author || 'Admin'
                                };
                                posts.unshift(newPost);
                                localStorage.setItem('leo_lion_posts', JSON.stringify(posts));
                                notifyListeners();
                                return { id: newPost.id };
                            },
                            doc: (id) => {
                                return {
                                    delete: async () => {
                                        let posts = JSON.parse(localStorage.getItem('leo_lion_posts') || '[]');
                                        posts = posts.filter(p => p.id !== id);
                                        localStorage.setItem('leo_lion_posts', JSON.stringify(posts));
                                        notifyListeners();
                                        return;
                                    }
                                };
                            }
                        };
                    } else if (name === 'members') {
                        return {
                            get: async () => {
                                const members = JSON.parse(localStorage.getItem('leo_lion_members') || '[]');
                                return {
                                    empty: members.length === 0,
                                    forEach: (forEachCb) => {
                                        members.forEach(m => {
                                            forEachCb({
                                                id: m.email,
                                                data: () => m
                                            });
                                        });
                                    }
                                };
                            },
                            add: async (data) => {
                                const members = JSON.parse(localStorage.getItem('leo_lion_members') || '[]');
                                const newMember = {
                                    ...data,
                                    invoices: data.invoices || []
                                };
                                members.push(newMember);
                                localStorage.setItem('leo_lion_members', JSON.stringify(members));
                                return { id: newMember.email };
                            },
                            doc: (email) => {
                                return {
                                    get: async () => {
                                        const members = JSON.parse(localStorage.getItem('leo_lion_members') || '[]');
                                        const member = members.find(m => m.email.toLowerCase() === email.toLowerCase());
                                        return {
                                            exists: !!member,
                                            data: () => member
                                        };
                                    },
                                    set: async (data, options) => {
                                        let members = JSON.parse(localStorage.getItem('leo_lion_members') || '[]');
                                        const idx = members.findIndex(m => m.email.toLowerCase() === email.toLowerCase());
                                        if (idx > -1) {
                                            if (options && options.merge) {
                                                members[idx] = { ...members[idx], ...data };
                                            } else {
                                                members[idx] = data;
                                            }
                                        } else {
                                            members.push(data);
                                        }
                                        localStorage.setItem('leo_lion_members', JSON.stringify(members));
                                        return;
                                    },
                                    update: async (data) => {
                                        let members = JSON.parse(localStorage.getItem('leo_lion_members') || '[]');
                                        const idx = members.findIndex(m => m.email.toLowerCase() === email.toLowerCase());
                                        if (idx > -1) {
                                            members[idx] = { ...members[idx], ...data };
                                            localStorage.setItem('leo_lion_members', JSON.stringify(members));
                                        }
                                        return;
                                    },
                                    delete: async () => {
                                        let members = JSON.parse(localStorage.getItem('leo_lion_members') || '[]');
                                        members = members.filter(m => m.email.toLowerCase() !== email.toLowerCase());
                                        localStorage.setItem('leo_lion_members', JSON.stringify(members));
                                        return;
                                    }
                                };
                            }
                        };
                    }
                }
            };
        }, {
            FieldValue: {
                serverTimestamp: () => Date.now()
            }
        }),
        storage: () => {
            return {
                ref: (path) => {
                    return {
                        put: async (file) => {
                            return new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    resolve({
                                        ref: {
                                            getDownloadURL: async () => e.target.result
                                        }
                                    });
                                };
                                reader.onerror = (err) => reject(err);
                                reader.readAsDataURL(file);
                            });
                        }
                    };
                },
                refFromURL: (url) => {
                    return {
                        delete: async () => {
                            console.log("Mock Storage: deleted file from URL", url);
                        }
                    };
                }
            };
        }
    };
    
    // Override the global firebase object or define it if not present
    window.firebase = mockFirebase;
}
