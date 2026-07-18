document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Firebase Initialization & Dynamic Feed
    // ==========================================
    const updatesContainer = document.getElementById('updates-feed-container');
    let db = null;

    if (window.firebaseConfig && (window.firebaseConfig.apiKey !== "YOUR_API_KEY" || window.firebaseConfig.isDemoMode)) {
        try {
            firebase.initializeApp(window.firebaseConfig);
            db = firebase.firestore();
            loadUpdatesFromFirestore();
        } catch (err) {
            console.error("Firebase initialization failed:", err);
            showFirebaseWarning("Firebase initialization failed. Check your config key format.");
        }
    } else {
        // Firebase is not configured yet, show local preview notice
        showFirebaseWarning("Firebase is not configured yet. Complete the steps in firebase_setup.md to activate live posts!");
    }

    function showFirebaseWarning(message) {
        if (!updatesContainer) return;
        updatesContainer.innerHTML = `
            <div class="firebase-warning-card">
                <div class="warning-icon">⚙️</div>
                <p><strong>Database Live Feed Offline</strong></p>
                <p class="warning-text">${message}</p>
                <!-- Fallback Mock Post so the site doesn't look empty -->
                <div class="mock-posts-preview">
                    <div class="update-card">
                        <img src="assets/project_food.png" class="update-card-img" alt="Preview Image">
                        <div class="update-card-body">
                            <div class="update-card-meta">
                                <span>📅 Live Preview</span>
                                <span>👤 Club Secretary (Mock)</span>
                            </div>
                            <h3 class="update-card-title">Welcome to Our Live Feed!</h3>
                            <p class="update-card-text">Once you link your Firebase database, posts created by the President in the Admin Panel will appear here instantly. Overwrite configuration in firebase-config.js to link.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadUpdatesFromFirestore() {
        if (!db) return;
        
        db.collection('posts')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                updatesContainer.innerHTML = ''; // Clear loading spinner

                if (window.firebaseConfig && window.firebaseConfig.isDemoMode) {
                    const demoBanner = document.createElement('div');
                    demoBanner.className = 'firebase-warning-card demo-mode-card';
                    demoBanner.style.border = '1px dashed var(--accent-color, #ffb300)';
                    demoBanner.style.background = 'rgba(255, 179, 0, 0.08)';
                    demoBanner.style.marginBottom = '24px';
                    demoBanner.style.padding = '15px';
                    demoBanner.style.borderRadius = '12px';
                    demoBanner.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                    demoBanner.innerHTML = `
                        <p style="margin: 0; color: var(--accent-color, #ffb300); font-weight: bold; font-size: 1.15rem; text-align: center;">
                            ✨ Demo Mode Active (Local Storage Database)
                        </p>
                        <p style="margin: 6px 0 0 0; font-size: 0.95rem; text-align: center; color: var(--text-color); opacity: 0.9;">
                            Updates are saved locally in your browser. 
                            <a href="admin.html" style="color: var(--accent-color, #ffb300); font-weight: bold; text-decoration: underline;">Go to Admin Panel</a> 
                            to log in using any email/password and post updates!
                        </p>
                    `;
                    updatesContainer.appendChild(demoBanner);
                }

                if (snapshot.empty) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'updates-empty-state';
                    emptyState.innerHTML = `
                        <span>📢</span>
                        <h3>No updates posted yet</h3>
                        <p>Check back later or log in to the admin panel to post the first update!</p>
                    `;
                    updatesContainer.appendChild(emptyState);
                    return;
                }
                
                snapshot.forEach(doc => {
                    const post = doc.data();
                    const title = escapeHTML(post.title);
                    const content = escapeHTML(post.content);
                    const imageUrl = post.imageUrl || 'assets/hero_bg.png'; // Fallback
                    const date = post.dateString || 'Recently';
                    const author = post.author ? post.author.split('@')[0] : 'Admin';
                    
                    const updateCard = document.createElement('div');
                    updateCard.className = 'update-card reveal active'; // Visible immediately
                    updateCard.innerHTML = `
                        <img src="${imageUrl}" class="update-card-img" alt="${title}">
                        <div class="update-card-body">
                            <div class="update-card-meta">
                                <span>📅 ${date}</span>
                                <span>👤 By ${author}</span>
                            </div>
                            <h3 class="update-card-title">${title}</h3>
                            <p class="update-card-text">${content}</p>
                        </div>
                    `;
                    
                    // Add click zoom support for the post image
                    updateCard.querySelector('.update-card-img').addEventListener('click', () => {
                        openLightboxModal(imageUrl, title);
                    });

                    updatesContainer.appendChild(updateCard);
                });
            }, error => {
                console.error("Firestore listen failed: ", error);
                showFirebaseWarning(`Error loading data: ${error.message}. Check your Firestore rules.`);
            });
    }

    // ==========================================
    // 2. Countdown Timer (Takoradi 2026 Convention)
    // ==========================================
    const daysVal = document.getElementById('days');
    const hoursVal = document.getElementById('hours');
    const minutesVal = document.getElementById('minutes');
    
    // Target date: December 1, 2026
    const targetDate = new Date('December 1, 2026 09:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

            if (daysVal) daysVal.textContent = days.toString().padStart(2, '0');
            if (hoursVal) hoursVal.textContent = hours.toString().padStart(2, '0');
            if (minutesVal) minutesVal.textContent = minutes.toString().padStart(2, '0');
        } else {
            // Event started or finished
            const timerContainer = document.querySelector('.countdown-container');
            if (timerContainer) {
                timerContainer.innerHTML = '<h4>Event Ongoing / Completed!</h4>';
            }
        }
    }

    setInterval(updateCountdown, 1000);
    updateCountdown(); // Run immediately

    // ==========================================
    // 3. Theme Toggle (Light / Dark)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const toggleIcon = themeToggleBtn.querySelector('.toggle-icon');
    const body = document.body;

    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    body.className = savedTheme;
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('theme', 'dark-theme');
            updateThemeIcon('dark-theme');
        } else {
            body.classList.replace('dark-theme', 'light-theme');
            localStorage.setItem('theme', 'light-theme');
            updateThemeIcon('light-theme');
        }
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark-theme') {
            toggleIcon.textContent = '🌙';
        } else {
            toggleIcon.textContent = '☀️';
        }
    }

    // ==========================================
    // 4. Sticky Header & Active Navigation Link
    // ==========================================
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('.id-anchor, #home');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        let currentSection = 'home';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}` || 
                (currentSection === 'home' && link.getAttribute('href') === '#')) {
                link.classList.add('active');
            }
        });
    });

    // ==========================================
    // 5. Mobile Navigation Menu Toggle
    // ==========================================
    const menuBtn = document.getElementById('menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const links = document.querySelectorAll('.nav-link');

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // ==========================================
    // 6. Scroll Reveal Animations
    // ==========================================
    const reveals = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });

    // ==========================================
    // 7. Stat Counter Count-up Animation
    // ==========================================
    const statNumbers = document.querySelectorAll('.stat-number');
    let animatedStats = false;

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animatedStats) {
                animateNumbers();
                animatedStats = true;
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        statsObserver.observe(statsGrid);
    }

    function animateNumbers() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'), 10);
            const duration = 2000;
            const stepTime = Math.abs(Math.floor(duration / target));
            let current = 0;
            const increment = target > 1000 ? Math.ceil(target / 100) : 1;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = target.toLocaleString() + '+';
                    clearInterval(timer);
                } else {
                    stat.textContent = current.toLocaleString() + '+';
                }
            }, target > 1000 ? 20 : stepTime);
        });
    }

    // ==========================================
    // 8. Gallery Lightbox Modal
    // ==========================================
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const caption = item.querySelector('.gallery-overlay span').textContent;
            openLightboxModal(img.src, caption);
        });
    });

    function openLightboxModal(src, captionText) {
        lightboxImg.src = src;
        lightboxImg.alt = captionText;
        lightboxCaption.textContent = captionText;
        
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
    };

    lightboxClose.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // ==========================================
    // 9. Contact Form Validation
    // ==========================================
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        formStatus.className = 'form-status';
        formStatus.textContent = '';
        formStatus.style.display = 'none';

        let isValid = true;

        if (nameInput.value.trim() === '') {
            nameInput.parentElement.classList.add('invalid');
            isValid = false;
        } else {
            nameInput.parentElement.classList.remove('invalid');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            emailInput.parentElement.classList.add('invalid');
            isValid = false;
        } else {
            emailInput.parentElement.classList.remove('invalid');
        }

        if (messageInput.value.trim() === '') {
            messageInput.parentElement.classList.add('invalid');
            isValid = false;
        } else {
            messageInput.parentElement.classList.remove('invalid');
        }

        if (isValid) {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
                formStatus.classList.add('success');
                formStatus.textContent = 'Thank you! Your message has been sent successfully. We will get back to you shortly.';
                form.reset();
            }, 1500);
        } else {
            formStatus.classList.add('error');
            formStatus.textContent = 'Please fill out all required fields correctly.';
        }
    });

    const inputs = [nameInput, emailInput, messageInput];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                input.parentElement.classList.remove('invalid');
            }
        });
    });

    // Helpers
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
});
