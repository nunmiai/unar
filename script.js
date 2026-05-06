document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const contactForm = document.getElementById('contactForm');

    let lastScrollTop = 0;

    // ==================== USER AUTHENTICATION ====================
    const unarUser = JSON.parse(localStorage.getItem('unarUser'));
    
    function updateAuthUI() {
        const authLink = document.getElementById('authLink');
        const ordersLink = document.getElementById('ordersLink');
        
        if (authLink) {
            if (unarUser && unarUser.email) {
                const firstName = unarUser.name ? unarUser.name.split(' ')[0] : unarUser.email.split('@')[0];
                authLink.innerHTML = `
                    <span class="user-greeting">Hi, ${firstName}</span>
                    <a href="#" onclick="logoutUser()" class="logout-link">Logout</a>
                `;
                // Show orders link when logged in
                if (ordersLink) {
                    ordersLink.style.display = 'list-item';
                }
            } else {
                authLink.innerHTML = '<a href="login.html" class="nav-link">Login</a>';
                // Hide orders link when not logged in
                if (ordersLink) {
                    ordersLink.style.display = 'none';
                }
            }
        }
    }
    
    updateAuthUI();

    // ==================== CART FUNCTIONALITY ====================
    let cart = JSON.parse(localStorage.getItem('unarCart')) || [];
    const SHIPPING_COST = 80; // Default shipping cost
    const FREE_SHIPPING_THRESHOLD = 1000; // Free shipping above this amount
    
    // Lambda API URL for payment processing
    const LAMBDA_API_URL = 'https://vfl2536p7nvialuiwcgt22s6iu0noirr.lambda-url.us-east-1.on.aws';

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
    const couponInput = document.getElementById('couponInput');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponMessage = document.getElementById('couponMessage');

    // Coupon state
    const VALID_COUPONS = { 'MOM25': 25 };
    const COUPON_ELIGIBLE = { 'MOM25': ['Champa', 'Jasmine'] };
    let appliedDiscount = 0;
    let appliedCouponCode = '';

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

    function getEligibleDiscountAmount() {
        if (!appliedCouponCode || appliedDiscount === 0) return 0;
        const eligible = COUPON_ELIGIBLE[appliedCouponCode];
        const base = eligible
            ? cart.filter(i => eligible.includes(i.name)).reduce((s, i) => s + i.price * i.quantity, 0)
            : getCartTotal();
        return Math.round(base * appliedDiscount / 100);
    }

    function updateCheckoutSummary() {
        const subtotal = getCartTotal();
        const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        const eligible = appliedCouponCode ? (COUPON_ELIGIBLE[appliedCouponCode] || null) : null;
        const discountAmount = getEligibleDiscountAmount();
        const total = subtotal + shipping - discountAmount;

        // Render cart items with images (highlight eligible items)
        if (checkoutSummary) {
            let summaryHTML = '';
            cart.forEach(item => {
                const itemDiscount = (eligible && eligible.includes(item.name) && appliedDiscount > 0)
                    ? Math.round(item.price * item.quantity * appliedDiscount / 100)
                    : 0;
                summaryHTML += `
                    <div class="checkout-summary-item${itemDiscount > 0 ? ' eligible-item' : ''}">
                        <div class="summary-item-img">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="summary-item-info">
                            <span class="summary-item-name">${item.name}</span>
                            <div class="summary-qty-ctrl">
                                <button class="sq-btn sq-minus" data-name="${item.name}">−</button>
                                <span class="sq-count">${item.quantity}</span>
                                <button class="sq-btn sq-plus" data-name="${item.name}">+</button>
                            </div>
                            ${itemDiscount > 0 ? `<span class="item-discount-badge">-₹${itemDiscount}</span>` : ''}
                        </div>
                        <div class="summary-item-right">
                            <span class="summary-item-price">₹${item.price * item.quantity}</span>
                            <button class="sq-remove" data-name="${item.name}" title="Remove">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                        </div>
                    </div>
                `;
            });
            checkoutSummary.innerHTML = summaryHTML;
        }

        // Update totals separately
        const subtotalEl = document.getElementById('checkoutSubtotal');
        const shippingEl = document.getElementById('checkoutShipping');
        const discountRow = document.getElementById('discountRow');
        const discountEl = document.getElementById('checkoutDiscount');
        const discountLabel = document.getElementById('discountLabel');

        if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
        if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;

        if (discountRow) {
            if (appliedDiscount > 0 && discountAmount > 0) {
                discountRow.style.display = 'flex';
                const eligibleNames = eligible ? eligible.join(' & ') : 'all items';
                if (discountLabel) discountLabel.textContent = `Discount (${appliedDiscount}% on ${eligibleNames})`;
                if (discountEl) discountEl.textContent = `-₹${discountAmount}`;
            } else {
                discountRow.style.display = 'none';
            }
        }

        if (checkoutTotalAmount) {
            checkoutTotalAmount.textContent = `₹${total}`;
        }
    }

    function openCheckout() {
        if (cart.length === 0) return;

        // Reset coupon state on each open
        appliedDiscount = 0;
        appliedCouponCode = '';
        if (couponInput) { couponInput.value = ''; couponInput.disabled = false; }
        if (couponMessage) { couponMessage.textContent = ''; couponMessage.className = 'coupon-message'; }
        if (applyCouponBtn) { applyCouponBtn.textContent = 'Apply'; applyCouponBtn.disabled = false; }
        const useCouponBtnEl = document.getElementById('useCouponBtn');
        if (useCouponBtnEl) { useCouponBtnEl.textContent = 'Use Coupon'; useCouponBtnEl.classList.remove('applied', 'remove-mode'); useCouponBtnEl.disabled = false; }

        updateCheckoutSummary();

        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCheckout() {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Checkout quantity controls (event delegation)
    if (checkoutSummary) {
        checkoutSummary.addEventListener('click', function(e) {
            const plusBtn  = e.target.closest('.sq-plus');
            const minusBtn = e.target.closest('.sq-minus');
            const removeBtn = e.target.closest('.sq-remove');

            if (plusBtn) {
                const name = plusBtn.dataset.name;
                const item = cart.find(i => i.name === name);
                if (item) { item.quantity += 1; saveCart(); updateCartUI(); updateCheckoutSummary(); }
            } else if (minusBtn) {
                const name = minusBtn.dataset.name;
                const item = cart.find(i => i.name === name);
                if (item) {
                    item.quantity -= 1;
                    if (item.quantity <= 0) cart = cart.filter(i => i.name !== name);
                    saveCart(); updateCartUI(); updateProductButtons();
                    if (cart.length === 0) { closeCheckout(); return; }
                    updateCheckoutSummary();
                }
            } else if (removeBtn) {
                const name = removeBtn.dataset.name;
                cart = cart.filter(i => i.name !== name);
                saveCart(); updateCartUI(); updateProductButtons();
                if (cart.length === 0) { closeCheckout(); return; }
                updateCheckoutSummary();
            }
        });
    }

    // "Use" coupon chip button - auto-fills and applies
    const useCouponBtn = document.getElementById('useCouponBtn');
    if (useCouponBtn) {
        useCouponBtn.addEventListener('click', function() {
            if (appliedCouponCode) {
                unapplyCoupon();
            } else {
                if (couponInput) { couponInput.value = 'MOM25'; couponInput.disabled = false; }
                applyCurrentCoupon();
            }
        });
    }

    function unapplyCoupon() {
        appliedDiscount = 0;
        appliedCouponCode = '';
        if (couponInput) { couponInput.value = ''; couponInput.disabled = false; }
        if (couponMessage) { couponMessage.textContent = ''; couponMessage.className = 'coupon-message'; }
        if (applyCouponBtn) { applyCouponBtn.textContent = 'Apply'; applyCouponBtn.disabled = false; }
        if (useCouponBtn) { useCouponBtn.textContent = 'Use Coupon'; useCouponBtn.classList.remove('applied', 'remove-mode'); useCouponBtn.disabled = false; }
        updateCheckoutSummary();
    }

    function applyCurrentCoupon() {
        const code = couponInput.value.trim().toUpperCase();
        if (VALID_COUPONS[code] !== undefined) {
            const eligible = COUPON_ELIGIBLE[code];
            if (eligible) {
                const hasEligible = cart.some(i => eligible.includes(i.name));
                if (!hasEligible) {
                    couponMessage.textContent = `❌ This coupon applies only to ${eligible.join(' & ')} products.`;
                    couponMessage.className = 'coupon-message error';
                    return;
                }
            }
            appliedDiscount = VALID_COUPONS[code];
            appliedCouponCode = code;
            const eligibleNames = eligible ? eligible.join(' & ') : 'all items';
            couponMessage.textContent = `✅ Applied! ${appliedDiscount}% off on ${eligibleNames}.`;
            couponMessage.className = 'coupon-message success';
            applyCouponBtn.textContent = 'Applied ✓';
            applyCouponBtn.disabled = true;
            couponInput.disabled = true;
            if (useCouponBtn) { useCouponBtn.textContent = 'Remove'; useCouponBtn.classList.add('applied', 'remove-mode'); useCouponBtn.disabled = false; }
            updateCheckoutSummary();
        } else {
            appliedDiscount = 0;
            appliedCouponCode = '';
            couponMessage.textContent = '❌ Invalid coupon code.';
            couponMessage.className = 'coupon-message error';
            updateCheckoutSummary();
        }
    }

    // Coupon apply logic
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', function() {
            if (!couponInput.value.trim()) {
                couponMessage.textContent = 'Please enter a coupon code.';
                couponMessage.className = 'coupon-message error';
                return;
            }
            applyCurrentCoupon();
        });
    }

    // Checkout form submission with Razorpay via Lambda
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(checkoutForm);
            const customerData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                pincode: formData.get('pincode')
            };

            // Validate phone number (required for order tracking)
            if (!customerData.phone || customerData.phone.trim().length < 10) {
                showNotification('Please enter a valid phone number', 'error');
                return;
            }

            const subtotal = getCartTotal();
            const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
            const discountAmount = getEligibleDiscountAmount();
            const total = subtotal + shipping - discountAmount;

            // Disable pay button during processing
            const payBtn = document.getElementById('payNowBtn');
            const originalBtnText = payBtn.textContent;
            payBtn.textContent = 'Processing...';
            payBtn.disabled = true;

            try {
                // Get user ID if logged in
                const unarUser = JSON.parse(localStorage.getItem('unarUser') || '{}');
                const userId = unarUser.cognito_user_id || null;

                // Step 1: Create order via Lambda
                const orderResponse = await fetch(`${LAMBDA_API_URL}/create-order`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: total,
                        currency: 'INR',
                        receipt: `unar_${Date.now()}`,
                        customer: customerData,
                        items: cart,
                        user_id: userId,
                        notes: {
                            customer_name: customerData.name,
                            customer_email: customerData.email,
                            customer_phone: customerData.phone,
                            address: customerData.address,
                            pincode: customerData.pincode,
                            items: cart.map(item => `${item.name} x${item.quantity}`).join(', ')
                        }
                    })
                });

                const orderData = await orderResponse.json();

                if (!orderData.success) {
                    throw new Error(orderData.error || 'Failed to create order');
                }

                // Step 2: Open Razorpay checkout
                const options = {
                    key: orderData.key_id,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    order_id: orderData.order_id,
                    name: 'Unar',
                    description: 'Natural Solid Perfumes',
                    image: 'assets/logo.png',
                    handler: async function(response) {
                        // Step 3: Verify payment via Lambda
                        try {
                            const verifyResponse = await fetch(`${LAMBDA_API_URL}/verify-payment`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    order_details: {
                                        customer: customerData,
                                        items: cart,
                                        subtotal: subtotal,
                                        shipping: shipping,
                                        total: total
                                    }
                                })
                            });

                            const verifyData = await verifyResponse.json();

                            if (verifyData.success) {
                                handlePaymentSuccess(response, customerData, total);
                            } else {
                                showNotification('Payment verification failed. Please contact support.', 'error');
                            }
                        } catch (verifyError) {
                            console.error('Verification error:', verifyError);
                            showNotification('Payment verification failed. Please contact support.', 'error');
                        }
                    },
                    prefill: {
                        name: customerData.name,
                        email: customerData.email,
                        contact: customerData.phone
                    },
                    theme: {
                        color: '#5a7c65'
                    },
                    modal: {
                        ondismiss: function() {
                            showNotification('Payment cancelled', 'error');
                            payBtn.textContent = originalBtnText;
                            payBtn.disabled = false;
                        }
                    }
                };

                const rzp = new Razorpay(options);
                rzp.on('payment.failed', function(response) {
                    showNotification('Payment failed. Please try again.', 'error');
                    console.error('Payment failed:', response.error);
                    payBtn.textContent = originalBtnText;
                    payBtn.disabled = false;
                });
                rzp.open();

            } catch (error) {
                console.error('Checkout error:', error);
                showNotification(error.message || 'Something went wrong. Please try again.', 'error');
                payBtn.textContent = originalBtnText;
                payBtn.disabled = false;
            }
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
            const targetId = this.getAttribute('href');
            
            // Only handle anchor links (starting with #), let other links navigate normally
            if (!targetId || !targetId.startsWith('#')) {
                return; // Allow normal navigation for non-anchor links
            }
            
            e.preventDefault();
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

// Logout function (global scope for onclick)
async function logoutUser() {
    const AUTH_API_URL = 'https://hxr7qp46qicsvrlnale5v7z34m0crgjm.lambda-url.us-east-1.on.aws/'; // Same as in login.html
    
    try {
        const tokens = JSON.parse(localStorage.getItem('unarTokens') || '{}');
        
        if (tokens.access_token) {
            await fetch(`${AUTH_API_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: tokens.access_token })
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('unarUser');
    localStorage.removeItem('unarTokens');
    window.location.href = 'login.html';
}
