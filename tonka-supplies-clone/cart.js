// cart.js
// Handles shared cart logic across pages

function getCart() {
    const saved = localStorage.getItem('tonka_cart');
    return saved ? JSON.parse(saved) : [];
}

function saveCart(cart) {
    localStorage.setItem('tonka_cart', JSON.stringify(cart));
}

window.checkoutCart = function () {
    const active = localStorage.getItem('tonka_active_user');
    if (!active) {
        window.location.href = 'login.html?requireAddress=true';
        return;
    }
    const user = JSON.parse(active);
    if (!user.address || user.address.trim() === '') {
        window.location.href = 'login.html?requireAddress=true';
        return;
    }
    const cart = getCart();
    if (cart.length === 0) return;

    let orders = localStorage.getItem('tonka_orders');
    orders = orders ? JSON.parse(orders) : [];
    const nextId = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.id) || 0), 1000) + 1 : 1001;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 0.08; // flat 8% for mock cart checkout
    const tax = subtotal * taxRate;
    const shipping = 4.00;
    const finalTotal = subtotal + tax + shipping;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const newOrder = {
        id: nextId.toString(),
        customerEmail: user.email,
        customer: user.email ? user.email.split('@')[0] : 'Guest',
        customerName: (user.firstName || '') + ' ' + (user.lastName || ''),
        customerAddress: user.address,
        date: new Date().toISOString(),
        total: finalTotal,
        status: 'Paid',
        fulfill: 'Pending',
        items: totalItems,
        itemList: cart.map(item => ({
            title: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            variant: item.variantName || 'Standard',
            size: item.size
        }))
    };
    orders.unshift(newOrder);
    localStorage.setItem('tonka_orders', JSON.stringify(orders));

    // Address Verification Mock Email
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2>Verify Your Delivery Address - Cheap Plugz</h2>
            <p>Thank you for your order! Before we ship, we need to verify your address information is correct. <b>If your address information is not correct, we cannot refund you.</b></p>
            <p>You have 24 hours to confirm or update this info before the link expires and your package is sealed.</p>
            
            <div style="background:#f4f4f4; padding:16px; margin: 16px 0; border-radius:8px;">
                <strong>Current Address on File:</strong><br>
                ${user.firstName || ''} ${user.lastName || ''}<br>
                ${user.address || ''}<br>
            </div>

            <p>Please carefully review it and press "Accept" or "Change". After you make these changes, you accept the no-refund policy terms.</p>
            
            <a href="${window.location.origin}/customer_dashboard.html" style="background:#000; color:#fff; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:4px; display:inline-block; margin-right:8px;">Accept Address</a>
            <a href="${window.location.origin}/customer_dashboard.html#address" style="background:#f4f4f4; border:1px solid #ddd; color:#000; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:4px; display:inline-block;">Change Address</a>
        </div>
    `;

    if (typeof emailjs !== 'undefined') {
        emailjs.send("service_nrvlrb7", "template_afw7f64", {
            to_email: user.email,
            reply_to: "cheaplugz@gmail.com",
            subject: "ACTION REQUIRED: Verify Shipping Address",
            html_message: emailHtml
        }).then(() => {
            alert('Order placed! An address verification email has been sent to ' + user.email + '. Please accept it within 24 hours.');
            localStorage.removeItem('tonka_cart');
            window.location.href = "index.html";
        }).catch(err => {
            console.error("EmailJS Error: ", err);
            alert('Order placed successfully! Note: EmailJS is not configured so the verification email was not actually sent.');
            localStorage.removeItem('tonka_cart');
            window.location.href = "index.html";
        });
    } else {
        alert('Order placed! Please check your email to verify your address within 24 hours.');
        localStorage.removeItem('tonka_cart');
        window.location.href = "index.html";
    }
}

function renderCartUI() {
    const cart = getCart();
    const emptyState = document.getElementById('cart-empty-state');

    if (!emptyState) return;

    if (cart.length === 0) {
        emptyState.innerHTML = `
            <h2>Your cart is empty</h2>
            <button class="cart-continue-btn" id="cart-continue-btn">Continue shopping</button>
            <div class="cart-login-prompt">
                <h3>Have an account?</h3>
                <p style="margin-top:8px;"><a href="login.html">Log in</a> to check out faster.</p>
            </div>
        `;
        document.getElementById('cart-continue-btn')?.addEventListener('click', closeCart);
    } else {
        const itemsHtml = cart.map((item, index) => `
            <div style="display:flex; gap:16px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:16px; position:relative;">
                <button onclick="removeFromCart(${index})" style="position:absolute; top:0; right:0; background:none; border:none; color:var(--text-secondary); cursor:pointer;" title="Remove Item">
                    <i data-feather="x" style="width:16px; height:16px;"></i>
                </button>
                <img src="${item.image}" alt="${item.name}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; background:#111;">
                <div style="flex:1; padding-right:24px;">
                    <h4 style="font-size:0.9rem; margin-bottom:4px;">${item.name}</h4>
                    <p style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:8px;">Size: ${item.size} ${item.variantName ? ' | ' + item.variantName : ''}</p>
                    <p style="font-weight:600;">$${item.price.toFixed(2)}  x ${item.quantity}</p>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        emptyState.innerHTML = `
            <div style="flex:1; width:100%; overflow-y:auto; padding-right:8px; text-align:left;">
                <h2 style="font-size:1.5rem; margin-bottom:24px;">Your cart</h2>
                ${itemsHtml}
            </div>
            <div style="width:100%; padding-top:24px; border-top:1px solid rgba(255,255,255,0.1); text-align:left;">
                <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-weight:700; font-size:1.1rem;">
                    <span>Subtotal</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
                <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:24px;">Shipping and taxes calculated at checkout.</p>
                <button onclick="checkoutCart()" style="width:100%; background:#fff; color:#000; border:none; padding:16px; border-radius:50px; font-weight:700; text-transform:uppercase; cursor:pointer; font-size:1rem;">Checkout</button>
            </div>
        `;
        if (window.feather) feather.replace();
    }
}

window.removeFromCart = function (index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartUI();
};

function openCart() {
    const overlay = document.getElementById('cart-overlay');
    const sidebar = document.getElementById('cart-sidebar');
    if (overlay && sidebar) {
        overlay.classList.add('active');
        sidebar.classList.add('active');
        renderCartUI();
    }
}

function closeCart() {
    const overlay = document.getElementById('cart-overlay');
    const sidebar = document.getElementById('cart-sidebar');
    if (overlay && sidebar) {
        overlay.classList.remove('active');
        sidebar.classList.remove('active');
    }
}

// Global hook for product.js to add to cart
window.addToCartAction = function (product, variant, size, quantity, price, image) {
    const cart = getCart();
    // Check if same item/variant/size exists
    const existing = cart.find(i => i.id === product.id && i.size === size && i.variantName === (variant?.name || ''));
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.title,
            variantName: variant ? variant.name : '',
            size: size,
            quantity: quantity,
            price: price,
            image: image
        });
    }
    saveCart(cart);
    openCart();
};

document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('cart-open-btn');
    const closeBtn = document.getElementById('cart-close-btn');
    const overlay = document.getElementById('cart-overlay');

    if (openBtn) openBtn.addEventListener('click', openCart);
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    if (overlay) overlay.addEventListener('click', closeCart);

    // Initial render
    renderCartUI();
});
