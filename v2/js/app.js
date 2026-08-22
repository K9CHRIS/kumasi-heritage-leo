/* 
   ==========================================================================
   Kumasi Heritage Virtual Leo-Lions Club - Version 2 (V2) JavaScript Engine
   ==========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 0. Subdomain Router & Theme Toggle Setup
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

    // Theme Switcher Logic
    const themeBtn = document.getElementById('theme-toggle-btn');
    const savedTheme = localStorage.getItem('v2_theme') || 'dark';
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeBtn) themeBtn.textContent = '🌙';
    } else {
        if (themeBtn) themeBtn.textContent = '☀️';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            themeBtn.textContent = isLight ? '🌙' : '☀️';
            localStorage.setItem('v2_theme', isLight ? 'light' : 'dark');
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.v2-navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // ==========================================
    // 1. Hero Impact Stats Counter Animation
    // ==========================================
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    function animateCounters() {
        if (animated) return;
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target') || '0', 10);
            const prefix = stat.getAttribute('data-prefix') || '';
            const suffix = stat.getAttribute('data-suffix') || '';
            let current = 0;
            const increment = Math.ceil(target / 40);

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                stat.textContent = `${prefix}${current}${suffix}`;
            }, 30);
        });
        animated = true;
    }

    // Trigger on scroll or immediate
    const heroSection = document.querySelector('.hero-v2');
    if (heroSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateCounters();
            }
        }, { threshold: 0.2 });
        observer.observe(heroSection);
    }

    // ==========================================
    // 2. Leadership Board Carousel V2
    // ==========================================
    initBoardCarouselV2();

    function initBoardCarouselV2() {
        const track = document.getElementById('board-track-v2');
        const prevBtn = document.getElementById('carousel-prev-v2');
        const nextBtn = document.getElementById('carousel-next-v2');
        const dotsContainer = document.getElementById('carousel-dots-v2');
        if (!track) return;

        const cards = Array.from(track.children);
        if (cards.length === 0) return;

        let currentIndex = 0;

        function getCardsPerView() {
            if (window.innerWidth <= 640) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function getMaxIndex() {
            return Math.max(0, cards.length - getCardsPerView());
        }

        function updateDots() {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            const maxIdx = getMaxIndex();
            for (let i = 0; i <= maxIdx; i++) {
                const dot = document.createElement('div');
                dot.className = `dot-v2 ${i === currentIndex ? 'active' : ''}`;
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateCarousel();
                });
                dotsContainer.appendChild(dot);
            }
        }

        function updateCarousel() {
            const cardWidth = cards[0].getBoundingClientRect().width;
            const gap = 28;
            const moveAmount = (cardWidth + gap) * currentIndex;
            track.style.transform = `translateX(-${moveAmount}px)`;
            updateDots();
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentIndex < getMaxIndex()) {
                    currentIndex++;
                } else {
                    currentIndex = 0;
                }
                updateCarousel();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                } else {
                    currentIndex = getMaxIndex();
                }
                updateCarousel();
            });
        }

        window.addEventListener('resize', () => {
            if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
            updateCarousel();
        });

        updateCarousel();
    }

    // ==========================================
    // 3. Interactive Donation Impact Calculator
    // ==========================================
    const calcButtons = document.querySelectorAll('.calc-amount-btn');
    const calcIcon = document.getElementById('calc-icon');
    const calcTitle = document.getElementById('calc-title');
    const calcDesc = document.getElementById('calc-desc');

    const impactData = {
        '50': {
            icon: '🎒',
            title: 'School Supply Kits for 5 Students',
            desc: 'Provides notebooks, pens, and geometry sets to under-resourced youth in Kumasi primary schools.'
        },
        '100': {
            icon: '🍲',
            title: 'Feeds 35 Children',
            desc: 'Funds hot, nutritious meals during our quarterly Hunger Relief Community Service Drive.'
        },
        '250': {
            icon: '👓',
            title: 'Free Eye Screening & Prescription Glasses',
            desc: 'Sponsors vision tests and optical lenses for 10 elderly community members in Ashanti region.'
        },
        '500': {
            icon: '🩺',
            title: 'Full Diabetes Screening & Health Camp',
            desc: 'Sponsors glucose test kits, medical consultation, and awareness supplies for an entire village.'
        }
    };

    calcButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            calcButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const amount = btn.getAttribute('data-amount');
            if (impactData[amount]) {
                calcIcon.textContent = impactData[amount].icon;
                calcTitle.textContent = impactData[amount].title;
                calcDesc.textContent = impactData[amount].desc;
            }
        });
    });

    // ==========================================
    // 4. Contact Form Validation & Feedback
    // ==========================================
    const contactForm = document.getElementById('contact-form-v2');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending Message... ⏳';

            setTimeout(() => {
                alert('Thank you for connecting with Kumasi Heritage Virtual Leo-Lions Club! We will respond shortly.');
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1200);
        });
    }
});
