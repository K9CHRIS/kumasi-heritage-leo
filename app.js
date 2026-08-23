document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 0. Automatic Subdomain Router
    // ==========================================
    const host = window.location.hostname.toLowerCase();
    if (host.startsWith('portal.') || host.startsWith('members.')) {
        if (!window.location.pathname.includes('portal.html')) {
            window.location.replace('portal.html');
            return;
        }
    } else if (host.startsWith('admin.')) {
        if (!window.location.pathname.includes('admin.html')) {
            window.location.replace('admin.html');
            return;
        }
    }

    // ==========================================
    // 1. Firebase Initialization & Dynamic Feed
    // ==========================================
    const updatesContainer = document.getElementById('updates-feed-container');
    let db = null;

    if (window.firebaseConfig && window.firebaseConfig.apiKey !== "YOUR_API_KEY" && !window.firebaseConfig.isDemoMode) {
        try {
            firebase.initializeApp(window.firebaseConfig);
            db = firebase.firestore();
            loadUpdatesFromFirestore();
        } catch (err) {
            console.warn("Firebase live sync offline, displaying pre-rendered announcements feed:", err);
        }
    }

    function loadUpdatesFromFirestore() {
        if (!db || !updatesContainer) return;
        
        db.collection('posts')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                if (snapshot.empty) return;
                
                updatesContainer.innerHTML = ''; // Replace with live database posts
                
                snapshot.forEach(doc => {
                    const post = doc.data();
                    const title = escapeHTML(post.title);
                    const content = escapeHTML(post.content);
                    const imageUrl = escapeHTML(post.imageUrl || 'assets/events/social_media_event_aug23.jpg');
                    const date = escapeHTML(post.dateString || 'Recently');

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
                    const imageUrl = escapeHTML(post.imageUrl || 'assets/hero_bg.png'); // Fallback
                    const date = escapeHTML(post.dateString || 'Recently');
                    const author = escapeHTML(post.author ? post.author.split('@')[0] : 'Admin');
                    
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
                showFirebaseWarning(`Error loading data: ${escapeHTML(error.message)}. Check your Firestore rules.`);
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
    // 3. Theme Toggle & Persistent Settings
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        document.body.className = 'dark-theme';
    } else {
        document.body.className = 'light-theme';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            if (document.body.classList.contains('dark-theme')) {
                document.body.className = 'light-theme';
                localStorage.setItem('theme', 'light');
            } else {
                document.body.className = 'dark-theme';
                localStorage.setItem('theme', 'dark');
            }
            updateThemeSwitcherUI();
        });
    }

    function updateThemeSwitcherUI() {
        if (!themeToggleBtn) return;
        const isDark = document.body.classList.contains('dark-theme');
        themeToggleBtn.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }
    updateThemeSwitcherUI();

    // ==========================================
    // Back to Top Button with Scroll Progress
    // ==========================================
    const backToTopBtn = document.getElementById('back-to-top');
    const progressCircle = document.getElementById('back-to-top-progress');

    if (backToTopBtn && progressCircle) {
        const radius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        progressCircle.style.strokeDashoffset = circumference;

        function updateProgress() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            
            if (scrollTop > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }

            if (docHeight > 0) {
                const scrollPercent = scrollTop / docHeight;
                const offset = circumference - (scrollPercent * circumference);
                progressCircle.style.strokeDashoffset = offset;
            }
        }

        window.addEventListener('scroll', updateProgress);
        updateProgress();

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================
    // Donation Impact Calculator
    // ==========================================
    const donationSlider = document.getElementById('donation-slider');
    const calcGhs = document.getElementById('calc-amount-ghs');
    const calcUsd = document.getElementById('calc-amount-usd');
    const calcImpactText = document.getElementById('calc-impact-text');

    if (donationSlider && calcGhs && calcUsd && calcImpactText) {
        const usdRate = 15.0; // Mock exchange rate: 1 USD = 15 GH¢
        
        const impacts = [
            { threshold: 50, text: "🌱 Plants 2 shade trees in community parks to combat deforestation and clean local air." },
            { threshold: 100, text: "🍱 Feeds a vulnerable family of four in Kumasi for a full week through our Food for Families project." },
            { threshold: 250, text: "📚 Provides school textbooks, writing materials, and educational kits for 2 children." },
            { threshold: 500, text: "💻 Funds digital literacy and coding training modules for 5 underprivileged youth." },
            { threshold: 1000, text: "🏥 Sponsors a free community health screening and basic medication distribution outreach." },
            { threshold: 2000, text: "🔧 Restores a local borehole water facility to deliver clean, potable water to an entire community." }
        ];

        function calculateImpact() {
            const amountGhs = parseInt(donationSlider.value, 10);
            const amountUsd = amountGhs / usdRate;

            calcGhs.textContent = `GH¢ ${amountGhs.toLocaleString()}`;
            calcUsd.textContent = `$${amountUsd.toFixed(2)}`;

            // Determine matching impact
            let matchedImpact = impacts[0].text;
            for (let i = 0; i < impacts.length; i++) {
                if (amountGhs >= impacts[i].threshold) {
                    matchedImpact = impacts[i].text;
                }
            }
            calcImpactText.textContent = matchedImpact;
        }

        donationSlider.addEventListener('input', calculateImpact);
        calculateImpact(); // Initial run
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

    // ==========================================
    // 10. Board of Directors Interactive Carousel
    // ==========================================
    function initBoardCarousel() {
        const track = document.getElementById('board-carousel-track');
        const prevBtn = document.getElementById('board-prev-btn');
        const nextBtn = document.getElementById('board-next-btn');
        const dotsContainer = document.getElementById('board-carousel-dots');
        const viewport = document.getElementById('board-carousel-viewport');

        if (!track || !viewport) return;

        const cards = track.querySelectorAll('.board-card');
        if (!cards.length) return;

        let currentIndex = 0;
        let cardsPerView = getCardsPerView();
        let maxIndex = Math.max(0, cards.length - cardsPerView);
        let autoplayTimer = null;

        function getCardsPerView() {
            return window.innerWidth <= 600 ? 1 : 2;
        }

        function createDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            cardsPerView = getCardsPerView();
            maxIndex = Math.max(0, cards.length - cardsPerView);

            for (let i = 0; i <= maxIndex; i++) {
                const dot = document.createElement('div');
                dot.classList.add('board-dot');
                if (i === currentIndex) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                    resetAutoplay();
                });
                dotsContainer.appendChild(dot);
            }
        }

        function updateCarousel() {
            cardsPerView = getCardsPerView();
            maxIndex = Math.max(0, cards.length - cardsPerView);

            if (currentIndex > maxIndex) currentIndex = maxIndex;
            if (currentIndex < 0) currentIndex = 0;

            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = 20;
            const moveAmount = (cardWidth + gap) * currentIndex;

            track.style.transform = `translateX(-${moveAmount}px)`;

            if (dotsContainer) {
                const dots = dotsContainer.querySelectorAll('.board-dot');
                dots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === currentIndex);
                });
            }
        }

        function nextSlide() {
            if (currentIndex >= maxIndex) {
                currentIndex = 0;
            } else {
                currentIndex++;
            }
            updateCarousel();
        }

        function prevSlide() {
            if (currentIndex <= 0) {
                currentIndex = maxIndex;
            } else {
                currentIndex--;
            }
            updateCarousel();
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                resetAutoplay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                resetAutoplay();
            });
        }

        function startAutoplay() {
            stopAutoplay();
            autoplayTimer = setInterval(nextSlide, 4500);
        }

        function stopAutoplay() {
            if (autoplayTimer) clearInterval(autoplayTimer);
        }

        function resetAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        viewport.addEventListener('mouseenter', stopAutoplay);
        viewport.addEventListener('mouseleave', startAutoplay);

        // Touch Swipe Support
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        viewport.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
            stopAutoplay();
        }, { passive: true });

        viewport.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });

        viewport.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;
            const diffX = startX - currentX;
            if (Math.abs(diffX) > 40) {
                if (diffX > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
            startAutoplay();
        });

        window.addEventListener('resize', () => {
            createDots();
            updateCarousel();
        });

        createDots();
        updateCarousel();
        startAutoplay();
    }

    initBoardCarousel();

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
