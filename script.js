document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const contactForm = document.getElementById('contactForm');

    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
    });

    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        
        const spans = navToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translateY(7px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translateY(-7px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    const spans = navToggle.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.feature-card, .collection-card');
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // Terms and Conditions tooltip functionality
    const termsLink = document.getElementById('termsLink');
    const termsTooltip = document.getElementById('termsTooltip');
    const agreeTerms = document.getElementById('agreeTerms');
    const submitBtn = document.getElementById('submitBtn');

    if (termsLink && termsTooltip) {
        termsLink.addEventListener('mouseenter', function() {
            termsTooltip.classList.add('show');
        });

        termsLink.addEventListener('mouseleave', function() {
            setTimeout(() => {
                if (!termsTooltip.matches(':hover')) {
                    termsTooltip.classList.remove('show');
                }
            }, 200);
        });

        termsTooltip.addEventListener('mouseleave', function() {
            termsTooltip.classList.remove('show');
        });

        termsLink.addEventListener('click', function(e) {
            e.preventDefault();
            termsTooltip.classList.toggle('show');
        });
    }

    // Form validation - check all required fields (message is optional)
    function validateForm() {
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const fragrance = document.getElementById('fragrance');
        const termsChecked = agreeTerms ? agreeTerms.checked : false;

        const isValid = name && name.value.trim() && 
                       email && email.value.trim() && 
                       fragrance && fragrance.value && 
                       termsChecked;
        
        console.log('Form validation:', {
            name: name?.value,
            email: email?.value,
            fragrance: fragrance?.value,
            termsChecked,
            isValid
        });

        return isValid;
    }

    // Update submit button state
    function updateSubmitButton() {
        if (submitBtn) {
            if (validateForm()) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
        }
    }

    // Add event listeners to form fields
    if (contactForm) {
        const formInputs = contactForm.querySelectorAll('input[required], select[required], #agreeTerms');
        formInputs.forEach(input => {
            input.addEventListener('input', updateSubmitButton);
            input.addEventListener('change', updateSubmitButton);
        });

        // Initial button state
        updateSubmitButton();
    }

    // Google Sheets Web App URL - Replace with your deployed script URL
    const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycby1PbOkJZVBbk0SPiPkW64Q7lZFUp-pTRvH0H8FJWx-izJxNKFSfVObuuk-MDJZMj6E/exec';

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') || 'Not provided',
                fragrance: formData.get('fragrance'),
                message: formData.get('message'),
                termsChecked: formData.get('agreeTerms') === 'on',
                timestamp: new Date().toISOString()
            };

            try {
                const response = await fetch(GOOGLE_SHEETS_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                showNotification('Thank you for your message! We will get back to you soon.', 'success');
                contactForm.reset();
            } catch (error) {
                console.error('Error submitting form:', error);
                showNotification('Something went wrong. Please try again or email us directly.', 'error');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background-color: ${type === 'success' ? '#5a7c65' : '#e74c3c'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    const currentYear = new Date().getFullYear();
    const footerBottom = document.querySelector('.footer-bottom p');
    if (footerBottom) {
        footerBottom.innerHTML = footerBottom.innerHTML.replace('2024', currentYear);
    }

    document.querySelectorAll('a[href^="http"]').forEach(link => {
        if (!link.hostname.includes(window.location.hostname)) {
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
});

window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});
