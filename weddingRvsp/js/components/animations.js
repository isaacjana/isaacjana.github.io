export function initAnimations() {
    if (typeof gsap === 'undefined') return;

    const mainContent = document.getElementById('main-content');
    const loader = document.getElementById('loader');

    if (mainContent) {
        mainContent.style.display = 'block';
    }

    const tl = gsap.timeline();

    // Loader animation
    if (loader) {
        tl.to(".loader-logo", { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
            .to(".loader-line", { width: "200px", duration: 1, ease: "power2.inOut" })
            .to(loader, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.inOut",
                onComplete: () => {
                    loader.style.display = 'none';
                }
            }, "+=0.3");
    }

    // Content fade in
    if (mainContent) {
        tl.to(mainContent, { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.3");
    }

    // Hero elements stagger
    if (document.querySelector(".hero-content .fade-up")) {
        tl.from(".hero-content .fade-up", {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out"
        }, "-=0.3");
    }

    // Scroll-triggered animations
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.utils.toArray(".fade-up").forEach(el => {
            if (!el.closest('.hero-content')) {
                gsap.to(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power2.out"
                });
            }
        });
    }
}

export function initCursor() {
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (!cursor || !follower || typeof gsap === 'undefined') return;

    // Check for touch device
    if ('ontouchstart' in window) {
        cursor.style.display = 'none';
        follower.style.display = 'none';
        return;
    }

    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0 });
        gsap.to(follower, { x: mouseX, y: mouseY, duration: 0.15, ease: "power2.out" });
    });

    // Hover effects
    const hoverables = document.querySelectorAll('button, a, input, select, textarea, .client-card, [role="button"]');

    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
            follower.classList.add('cursor-hover');
        });

        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
            follower.classList.remove('cursor-hover');
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        follower.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        follower.style.opacity = '1';
    });
}
