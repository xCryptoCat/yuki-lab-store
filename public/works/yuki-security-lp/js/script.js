document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================
       Custom Cursor Logic
    ========================================= */
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    
    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Show cursor if hidden
        cursor.style.opacity = '1';
        follower.style.opacity = '1';
        
        // Main cursor follows instantly
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    // Hide cursor when leaving the window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        follower.style.opacity = '0';
    });
    
    // Follower has a slight delay (easing)
    function animateCursor() {
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Add hover states to links and buttons
    const hoverElements = document.querySelectorAll('a, button, .service-item__img-container, .strength-card');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => follower.classList.add('hover-active'));
        el.addEventListener('mouseleave', () => follower.classList.remove('hover-active'));
    });

    /* =========================================
       Parallax Effect (Background Typography & Images)
    ========================================= */
    const bgTypo = document.getElementById('bg-typo');
    const parallaxImages = document.querySelectorAll('.service-item__img-container');
    
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                
                // Move typography slightly upwards based on scroll
                if (bgTypo) {
                    bgTypo.style.transform = `translate(-50%, calc(-50% - ${scrolled * 0.15}px))`;
                }
                
                // Parallax for service images
                parallaxImages.forEach(img => {
                    // Check if element is in viewport to save performance
                    const rect = img.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        const speed = img.getAttribute('data-speed') || -0.1;
                        // Calculate offset relative to viewport center for smoother parallax
                        const offset = (rect.top - window.innerHeight / 2) * speed;
                        img.querySelector('.service-item__img').style.transform = `translateY(${offset}px) scale(1.1)`;
                    }
                });
                
                ticking = false;
            });
            ticking = true;
        }
    });

    /* =========================================
       Intersection Observer (Reveal Animations)
    ========================================= */
    // Wrap contents securely for reveal animation to fix multi-lang nesting bug
    const revealTexts = document.querySelectorAll('.reveal-text');
    revealTexts.forEach(el => {
        // If it doesn't have the animation wrapper, wrap its innerHTML
        if (!el.querySelector('.reveal-inner')) {
            const content = el.innerHTML;
            el.innerHTML = `<span class="reveal-inner">${content}</span>`;
        }
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // If it's a parent containing multiple reveal texts, trigger them with delay
                const childTexts = entry.target.querySelectorAll('.reveal-text');
                if (childTexts.length > 0) {
                    childTexts.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('is-visible');
                        }, index * 200); // 200ms stagger
                    });
                }
                
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe different types of elements
    document.querySelectorAll('.reveal-fade, .reveal-slide-up, .hero__title').forEach(el => {
        revealObserver.observe(el);
    });
    
    // Trigger hero text immediately after short delay
    setTimeout(() => {
        const heroTitle = document.querySelector('.hero__title');
        if (heroTitle) heroTitle.classList.add('is-visible');
        
        document.querySelectorAll('.hero .reveal-text').forEach((child, index) => {
            setTimeout(() => {
                child.classList.add('is-visible');
            }, index * 200);
        });
    }, 300);

    /* =========================================
       Language Switcher
    ========================================= */
    const langBtns = document.querySelectorAll('.lang-btn');
    const htmlTag = document.documentElement;

    function updateTitle(lang) {
        if (lang === 'ja') {
            document.title = '株式会社裕輝 | 地域の安全を守る警備のプロフェッショナル';
        } else {
            document.title = 'YUKI';
        }
    }

    // Set initial title based on current language
    updateTitle(htmlTag.getAttribute('lang') || 'ja');

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            
            // Set lang attribute
            htmlTag.setAttribute('lang', lang);
            updateTitle(lang);
            
            // Update active class
            langBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            
            // Re-trigger all reveal animations to ensure clean transition
            // Small delay to allow CSS display:none to apply
            setTimeout(() => {
                document.querySelectorAll('.reveal-text').forEach(el => {
                    // Only re-trigger if it was already visible
                    if (el.classList.contains('is-visible')) {
                        el.classList.remove('is-visible');
                        // Force reflow
                        void el.offsetWidth; 
                        el.classList.add('is-visible');
                    }
                });
            }, 10);
        });
    });

});
