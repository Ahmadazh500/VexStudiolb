document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lenis (Smooth Scroll)
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);


    // 2. GSAP & ScrollTrigger Setup
    gsap.registerPlugin(ScrollTrigger);

    // Initial Flash Prevention
    gsap.to("body", { opacity: 1, duration: 0.5, ease: "power2.inOut" });

    // 3. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let lastScrollY = window.scrollY;
        navbar.style.transition = 'transform 0.3s ease, opacity 0.3s ease, background 0.3s ease, padding 0.3s ease';
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
                navbar.style.opacity = '0';
            } else {
                navbar.style.transform = 'translateY(0)';
                navbar.style.opacity = '1';
            }
            
            if (currentScrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            lastScrollY = currentScrollY;
        });
    }

    // 4. Hero Animations
    // Split Text for Hero Title (Using our wrappers manually, so splitText less needed for lines, but useful for chars inside words if desired. Using simple stagger here)
    // We will animate .word spans directly

    const tlHero = gsap.timeline();

    tlHero
        .from(".hero-title .word", {
            duration: 1.2,
            y: "100%",
            opacity: 0,
            rotation: 5,
            stagger: 0.1,
            ease: "power4.out",
            delay: 0.2
        })
        .from(".hero-subtitle", {
            duration: 1,
            y: 20,
            opacity: 0,
            ease: "power3.out"
        }, "-=0.8")
        .from(".hero-actions .btn", {
            duration: 0.8,
            y: 20,
            opacity: 0,
            stagger: 0.1,
            ease: "power3.out"
        }, "-=0.6");


    // --- Live WebGL Background Animation ---
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 0.5;
                this.alpha = Math.random() * 0.5 + 0.1;
                this.t = Math.random() * Math.PI * 2;
            }

            update() {
                this.t += 0.01;
                this.x += this.vx + Math.cos(this.t) * 0.2;
                this.y += this.vy + Math.sin(this.t) * 0.2;

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw() {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }

        // Connections
        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            // Draw connections first
            ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
            ctx.lineWidth = 0.5;

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        // Make lines visible only near mouse could be cool, but ambient is 'alive' enough given requests
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();
    }


    // 5. Work Section Horizontal Scroll (CodePen Style)
    const workSection = document.querySelector('.work-section-horizontal');
    const wrapper = document.querySelector('.horizontal-scroll-wrapper');

    if (workSection && wrapper) {
        const panels = gsap.utils.toArray('.work-panel');
        gsap.to(panels, {
            xPercent: -100 * (panels.length - 1),
            ease: "none",
            scrollTrigger: {
                trigger: workSection,
                pin: true,
                scrub: 1,
                end: () => "+=" + wrapper.offsetWidth,
                invalidateOnRefresh: true,
                anticipatePin: 1
            }
        });
    }


    // 6. Expertise List Reveal
    const expertiseItems = gsap.utils.toArray('.expertise-item');
    if (expertiseItems.length) {
        expertiseItems.forEach((item, i) => {
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                },
                x: -30,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
                delay: i * 0.1
            });
        });
    }

    // 7. Agency Statement Text Reveal
    const quoteSplit = new SimpleSplitText("blockquote", { type: "words, lines" });
    gsap.from(quoteSplit.words, {
        scrollTrigger: {
            trigger: "blockquote",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        y: 20,
        opacity: 0,
        stagger: 0.05,
        duration: 0.8,
        ease: "power2.out"
    });

    // 8. Cursor Follower (Optional)
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (cursorDot && cursorOutline && window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener("mousemove", function (e) {
            const posX = e.clientX;
            const posY = e.clientY;

            // Dot follows instantly
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Outline follows with slight delay (animation)
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Hover effects
        const links = document.querySelectorAll('a, button, .project-card-large, .expertise-item');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            link.addEventListener('mouseleave', () => {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }
    // 9. Outstanding 3D Tilt Effect for Project Cards
    const projectCards = document.querySelectorAll('.project-card-large');

    projectCards.forEach(card => {
        // Find image inside (might be wrapped differently now)
        const imageWrapper = card.querySelector('.project-image-large');
        const image = card.querySelector('img');
        const info = card.querySelector('.project-info-large');

        if (!imageWrapper || !image) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element.
            const y = e.clientY - rect.top;  // y position within the element.

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Reduced rotation for large cards
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            gsap.to(imageWrapper, {
                duration: 0.5,
                rotateX: rotateX,
                rotateY: rotateY,
                transformPerspective: 1000,
                ease: "power1.out"
            });

            // Info parallax
            if (info) {
                gsap.to(info, {
                    duration: 0.5,
                    x: (x - centerX) * 0.02,
                    y: (y - centerY) * 0.02,
                    ease: "power1.out"
                });
            }

            // Custom cursor Text update
            if (cursorOutline) {
                cursorOutline.style.width = '80px';
                cursorOutline.style.height = '80px';
                cursorOutline.innerHTML = '<span style="font-size:10px; font-weight:bold; color:white;">OPEN</span>';
                cursorOutline.style.display = 'flex';
                cursorOutline.style.alignItems = 'center';
                cursorOutline.style.justifyContent = 'center';
                cursorOutline.style.mixBlendMode = 'difference';
            }
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(imageWrapper, {
                duration: 0.8,
                rotateX: 0,
                rotateY: 0,
                ease: "elastic.out(1, 0.5)"
            });

            if (info) {
                gsap.to(info, {
                    duration: 0.8,
                    x: 0,
                    y: 0,
                    ease: "power2.out"
                });
            }

            if (cursorOutline) {
                cursorOutline.style.width = '40px';
                cursorOutline.style.height = '40px';
                cursorOutline.innerHTML = '';
                cursorOutline.style.mixBlendMode = 'normal';
            }
        });
    });

    // 10. Contact Form Logic
    const contactForm = document.getElementById('project-form');
    const successMessage = document.getElementById('success-message');

    if (contactForm && successMessage) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Basic Validation (HTML5 handles most)
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Securing Data...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            const formData = new FormData(contactForm);

            fetch('send_mail.php', {
                method: 'POST',
                body: formData
            })
                .then(async response => {
                    const data = await response.json().catch(() => null);
                    if (!response.ok) {
                        const errorMsg = data && data.message ? data.message : 'Network response was not ok';
                        throw new Error(errorMsg);
                    }
                    return data;
                })
                .then(data => {
                    if (data.status === 'success') {
                        // Success Animation
                        gsap.to(contactForm, {
                            opacity: 0,
                            y: -20,
                            duration: 0.5,
                            onComplete: () => {
                                contactForm.style.display = 'none';
                                successMessage.style.display = 'flex';
                                gsap.from(successMessage, {
                                    opacity: 0,
                                    y: 20,
                                    duration: 0.5
                                });
                            }
                        });
                    } else {
                        alert('Error: ' + data.message);
                        resetButton();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Submission failed: ' + error.message + '\n\nIf you are running this locally without a PHP server, the email form will not work.');
                    resetButton();
                });

            function resetButton() {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        });
    }
});
