document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const contactForm = document.getElementById('contactForm');

    let lastScrollTop = 0;

    // ==================== CART FUNCTIONALITY ====================
    let cart = JSON.parse(localStorage.getItem('unarCart')) || [];
    const SHIPPING_COST = 50; // Free shipping above certain amount
    const FREE_SHIPPING_THRESHOLD = 1000;
    
    // RAZORPAY KEY - Replace with your actual key
    const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID'; // User will provide this

    // Cart Elements
    const cartIcon = document.getElementById('cartIcon');
    const cartCount = document.getElementById('cartCount');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartFooter = document.getElementById('cartFooter');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartShipping = document.getElementById('cartShipping');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const browseProducts = document.getElementById('browseProducts');

    // Checkout Elements
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutClose = document.getElementById('checkoutClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutSummary = document.getElementById('checkoutSummary');
    const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');

    // Initialize cart
    updateCartUI();

    // Open cart sidebar
    if (cartIcon) {
        cartIcon.addEventListener('click', function() {
            openCart();
        });
    }

    // Close cart sidebar
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    // Browse products button closes cart
    if (browseProducts) {
        browseProducts.addEventListener('click', closeCart);
    }

    function openCart() {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Add to cart functionality
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const name = this.dataset.name;
            const price = parseInt(this.dataset.price);
            const image = this.dataset.image;

            addToCart({ name, price, image });

            // Update button state immediately
            updateProductButtons();
        });
    });

    // Update product card buttons to reflect cart state
    function updateProductButtons() {
        addToCartBtns.forEach(btn => {
            const name = btn.dataset.name;
            const cartItem = cart.find(item => item.name === name);
            
            if (cartItem && cartItem.quantity > 0) {
                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> In Cart (${cartItem.quantity})`;
                btn.classList.add('added');
            } else {
                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> Add to Cart`;
                btn.classList.remove('added');
            }
        });
    }

    // Initialize button states on page load
    updateProductButtons();

    function addToCart(product) {
        const existingItem = cart.find(item => item.name === product.name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        saveCart();
        updateCartUI();
        showNotification(`${product.name} added to cart!`, 'success');
    }

    function removeFromCart(productName) {
        cart = cart.filter(item => item.name !== productName);
        saveCart();
        updateCartUI();
        updateProductButtons();
    }

    function updateQuantity(productName, change) {
        const item = cart.find(item => item.name === productName);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(productName);
            } else {
                saveCart();
                updateCartUI();
                updateProductButtons();
            }
        }
    }

    function saveCart() {
        localStorage.setItem('unarCart', JSON.stringify(cart));
    }

    function getCartTotal() {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    function getCartCount() {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }

    function updateCartUI() {
        const count = getCartCount();
        const subtotal = getCartTotal();
        const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        const total = subtotal + shipping;

        // Update cart count badge
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }

        // Update cart items
        if (cartItems && cartEmpty && cartFooter) {
            if (cart.length === 0) {
                cartEmpty.style.display = 'flex';
                cartFooter.style.display = 'none';
                // Remove all cart items except empty state
                const existingItems = cartItems.querySelectorAll('.cart-item');
                existingItems.forEach(item => item.remove());
            } else {
                cartEmpty.style.display = 'none';
                cartFooter.style.display = 'block';

                // Clear existing items
                const existingItems = cartItems.querySelectorAll('.cart-item');
                existingItems.forEach(item => item.remove());

                // Add cart items
                cart.forEach(item => {
                    const cartItemEl = document.createElement('div');
                    cartItemEl.className = 'cart-item';
                    cartItemEl.innerHTML = `
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${item.name}</h4>
                            <p class="cart-item-price">₹${item.price}</p>
                            <div class="cart-item-controls">
                                <button class="quantity-btn minus" data-name="${item.name}">−</button>
                                <span class="cart-item-quantity">${item.quantity}</span>
                                <button class="quantity-btn plus" data-name="${item.name}">+</button>
                                <button class="cart-item-remove" data-name="${item.name}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    `;
                    cartItems.appendChild(cartItemEl);
                });

                // Add event listeners to quantity buttons
                cartItems.querySelectorAll('.quantity-btn.minus').forEach(btn => {
                    btn.addEventListener('click', () => updateQuantity(btn.dataset.name, -1));
                });
                cartItems.querySelectorAll('.quantity-btn.plus').forEach(btn => {
                    btn.addEventListener('click', () => updateQuantity(btn.dataset.name, 1));
                });
                cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
                    btn.addEventListener('click', () => removeFromCart(btn.dataset.name));
                });
            }

            // Update totals
            if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal}`;
            if (cartShipping) {
                cartShipping.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
            }
            if (cartTotal) cartTotal.textContent = `₹${total}`;
        }
    }

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            closeCart();
            openCheckout();
        });
    }

    // Close checkout modal
    if (checkoutClose) {
        checkoutClose.addEventListener('click', closeCheckout);
    }
    if (checkoutModal) {
        checkoutModal.addEventListener('click', function(e) {
            if (e.target === checkoutModal) {
                closeCheckout();
            }
        });
    }

    function openCheckout() {
        if (cart.length === 0) return;

        const subtotal = getCartTotal();
        const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        const total = subtotal + shipping;

        // Build checkout summary
        if (checkoutSummary) {
            let summaryHTML = '';
            cart.forEach(item => {
                summaryHTML += `
                    <div class="checkout-summary-item">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>₹${item.price * item.quantity}</span>
                    </div>
                `;
            });
            summaryHTML += `
                <div class="checkout-summary-item">
                    <span>Shipping</span>
                    <span>${shipping === 0 ? 'FREE' : '₹' + shipping}</span>
                </div>
                <div class="checkout-summary-item">
                    <span>Total</span>
                    <span>₹${total}</span>
                </div>
            `;
            checkoutSummary.innerHTML = summaryHTML;
        }

        if (checkoutTotalAmount) {
            checkoutTotalAmount.textContent = `₹${total}`;
        }

        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCheckout() {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Checkout form submission with Razorpay
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(checkoutForm);
            const customerData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                pincode: formData.get('pincode')
            };

            const subtotal = getCartTotal();
            const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
            const total = subtotal + shipping;

            // Check if Razorpay key is configured
            if (RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID') {
                showNotification('Payment gateway not configured. Please contact support.', 'error');
                console.log('Order Details:', { customerData, cart, total });
                return;
            }

            // Initialize Razorpay
            const options = {
                key: RAZORPAY_KEY_ID,
                amount: total * 100, // Amount in paise
                currency: 'INR',
                name: 'Unar',
                description: 'Natural Solid Perfumes',
                image: 'assets/logo.png',
                handler: function(response) {
                    // Payment successful
                    handlePaymentSuccess(response, customerData, total);
                },
                prefill: {
                    name: customerData.name,
                    email: customerData.email,
                    contact: customerData.phone
                },
                notes: {
                    address: customerData.address,
                    pincode: customerData.pincode,
                    items: cart.map(item => `${item.name} x${item.quantity}`).join(', ')
                },
                theme: {
                    color: '#5a7c65'
                },
                modal: {
                    ondismiss: function() {
                        showNotification('Payment cancelled', 'error');
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
                showNotification('Payment failed. Please try again.', 'error');
                console.error('Payment failed:', response.error);
            });
            rzp.open();
        });
    }

    function handlePaymentSuccess(response, customerData, total) {
        // Close checkout modal
        closeCheckout();

        // Clear cart
        cart = [];
        saveCart();
        updateCartUI();
        updateProductButtons();

        // Show success message
        showNotification('Payment successful! Order confirmed.', 'success');

        // Log order details (in production, send to backend)
        console.log('Order Confirmed:', {
            paymentId: response.razorpay_payment_id,
            customer: customerData,
            items: cart,
            total: total
        });

        // Reset form
        checkoutForm.reset();
    }

    // ==================== END CART FUNCTIONALITY ====================

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

    // Sticky Sample Button - always visible, hide only when contact section is in view
    const stickySampleBtn = document.getElementById('stickySampleBtn');
    const contactSection = document.getElementById('contact');
    
    if (stickySampleBtn && contactSection) {
        const contactObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    stickySampleBtn.style.display = 'none';
                } else {
                    stickySampleBtn.style.display = 'flex';
                }
            });
        }, { threshold: 0.3 });
        contactObserver.observe(contactSection);
    }

    // Flip card functionality - prevent card flip when clicking buttons
    const flipCards = document.querySelectorAll('.flip-card');
    flipCards.forEach(card => {
        // Toggle flip on card click
        card.addEventListener('click', function(e) {
            // Don't flip if clicking on any button
            if (e.target.closest('.order-btn') || e.target.closest('.add-to-cart-btn')) {
                return;
            }
            this.classList.toggle('flipped');
        });
    });

    // Ensure order buttons work properly
    const orderBtns = document.querySelectorAll('.order-btn');
    orderBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent card flip
        });
    });
});

window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});
