document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Login State & Address
    const activeUserRaw = localStorage.getItem('tonka_active_user');
    if (!activeUserRaw) {
        window.location.href = 'login.html?requireAddress=true';
        return;
    }
    const activeUser = JSON.parse(activeUserRaw);
    if (!activeUser.address || activeUser.address.trim() === '') {
        window.location.href = 'login.html?requireAddress=true';
        return;
    }

    // Populate user email header if available
    const emailDisplay = document.getElementById('user-email-display');
    if (emailDisplay && activeUser.email) {
        emailDisplay.textContent = activeUser.email;
    }

    // United States Average Combined Sales Tax Rates (Approximate)
    const stateTaxRates = {
        'AL': 0.0924, 'AK': 0.0176, 'AZ': 0.0837, 'AR': 0.0945, 'CA': 0.0882,
        'CO': 0.0778, 'CT': 0.0635, 'DE': 0.0000, 'FL': 0.0701, 'GA': 0.0735,
        'HI': 0.0444, 'ID': 0.0603, 'IL': 0.0883, 'IN': 0.0700, 'IA': 0.0694,
        'KS': 0.0865, 'KY': 0.0600, 'LA': 0.0955, 'ME': 0.0550, 'MD': 0.0600,
        'MA': 0.0625, 'MI': 0.0600, 'MN': 0.0749, 'MS': 0.0707, 'MO': 0.0829,
        'MT': 0.0000, 'NE': 0.0694, 'NV': 0.0823, 'NH': 0.0000, 'NJ': 0.0660,
        'NM': 0.0784, 'NY': 0.0852, 'NC': 0.0699, 'ND': 0.0696, 'OH': 0.0722,
        'OK': 0.0898, 'OR': 0.0000, 'PA': 0.0634, 'RI': 0.0700, 'SC': 0.0743,
        'SD': 0.0640, 'TN': 0.0955, 'TX': 0.0820, 'UT': 0.0719, 'VT': 0.0624,
        'VA': 0.0575, 'WA': 0.0886, 'WV': 0.0655, 'WI': 0.0543, 'WY': 0.0536,
        'DC': 0.0600
    };

    // Pre-fill delivery form if user has saved data
    if (activeUser.address) {
        document.getElementById('address').value = activeUser.address;
    }
    if (activeUser.firstName) document.getElementById('firstName').value = activeUser.firstName;
    if (activeUser.lastName) document.getElementById('lastName').value = activeUser.lastName;
    if (activeUser.city) document.getElementById('city').value = activeUser.city;
    if (activeUser.state) document.getElementById('state').value = activeUser.state;
    if (activeUser.zipcode) document.getElementById('zipcode').value = activeUser.zipcode;

    // Fallback split name if no explicit first/last name
    if (activeUser.name && (!activeUser.firstName || !activeUser.lastName)) {
        const nameParts = activeUser.name.split(' ');
        document.getElementById('firstName').value = nameParts[0] || '';
        document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
    }

    // 2. Parse URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');
    const variantIndex = urlParams.get('variantIndex');
    const sizeIndex = urlParams.get('sizeIndex');
    const qtyRaw = urlParams.get('qty');
    const quantity = qtyRaw ? parseInt(qtyRaw, 10) : 1;

    // 3. Load Product Data
    const products = await window.getFirebaseProducts();
    const product = products.find(p => String(p.id) === String(productId));

    if (!product) {
        alert("Product not found. Returning to home.");
        window.location.href = 'index.html';
        return;
    }

    // Identify Variant/Size context
    let selectedVariant = null;
    let selectedSize = 'ONE SIZE';
    let itemPrice = product.salePrice > 0 ? product.salePrice : product.originalPrice;
    let itemImage = product.image;
    let finalStripeUrl = product.buyNowUrl;

    if (variantIndex !== null && product.variants && product.variants[variantIndex]) {
        selectedVariant = product.variants[variantIndex];
        itemPrice = selectedVariant.price;
        if (selectedVariant.image) itemImage = selectedVariant.image;
        if (selectedVariant.buyNowUrl && selectedVariant.buyNowUrl.trim() !== '') {
            finalStripeUrl = selectedVariant.buyNowUrl;
        }
    }

    if (sizeIndex !== null && product.sizes) {
        const sizesArray = product.sizes.split(',').map(s => s.trim());
        if (sizesArray[sizeIndex]) {
            selectedSize = sizesArray[sizeIndex];
        }
    }

    // Allow checkout to proceed even without a Stripe URL

    // 4. Update UI: Order Items Pane
    const itemsContainer = document.getElementById('checkout-items');
    const variantLabel = selectedVariant ? `${selectedVariant.name} / ${selectedSize}` : selectedSize;
    const lineTotal = itemPrice * quantity;

    itemsContainer.innerHTML = `
        <div class="checkout-item">
            <div class="item-thumbnail-wrapper">
                <img src="${itemImage}" alt="${product.title}" class="item-thumbnail">
                <div class="item-quantity">${quantity}</div>
            </div>
            <div class="item-info">
                <div class="item-title">${product.title}</div>
                <div class="item-variant">${variantLabel}</div>
            </div>
            <div class="item-price">$${lineTotal.toFixed(2)}</div>
        </div>
    `;

    // 5. Calculate Financials
    const subtotal = lineTotal;
    const shipping = parseFloat(product.shippingPrice) || 0.00;

    // Dynamic State Sales Tax calculation
    let taxRate = 0;
    if (activeUser.state && stateTaxRates[activeUser.state]) {
        taxRate = stateTaxRates[activeUser.state];
    }
    const taxAmount = subtotal * taxRate;

    const finalTotal = subtotal + shipping + taxAmount;

    // Update Summary UI
    document.getElementById('summary-subtotal').innerText = `$${subtotal.toFixed(2)}`;

    if (shipping === 0) {
        document.getElementById('summary-shipping').innerText = 'Free';
    } else {
        document.getElementById('summary-shipping').innerText = `$${shipping.toFixed(2)}`;
    }

    const taxLine = document.getElementById('tax-line');
    const taxLabel = document.getElementById('tax-label');
    if (taxAmount > 0) {
        taxLine.style.display = 'flex';
        taxLabel.innerText = `Estimated taxes (${(taxRate * 100).toFixed(2)}%)`;
        document.getElementById('summary-tax').innerText = `$${taxAmount.toFixed(2)}`;
    }

    document.getElementById('summary-total-final').innerText = finalTotal.toFixed(2);
    document.getElementById('btn-total-price').innerText = `$${finalTotal.toFixed(2)}`;


    // 6. Execute Checkout Immediately (bypassing form UI)
    document.body.innerHTML = `
        <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; color: #fff; font-family: 'Inter', sans-serif;">
            <h2 style="margin-bottom: 16px;">Processing Checkout...</h2>
            <p style="color: #888;">Please wait while we redirect you to secure payment.</p>
        </div>
    `;

    // Let's go to stripe or fallback to success
    if (finalStripeUrl && finalStripeUrl.trim() !== '') {
        window.location.href = finalStripeUrl;
    } else {
        let orders = localStorage.getItem('tonka_orders');
        orders = orders ? JSON.parse(orders) : [];
        const nextId = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.id) || 0), 1000) + 1 : 1001;

        const newOrder = {
            id: nextId.toString(),
            customerEmail: activeUser.email,
            customer: activeUser.email ? activeUser.email.split('@')[0] : 'Guest',
            customerName: (activeUser.firstName || '') + ' ' + (activeUser.lastName || ''),
            customerAddress: activeUser.address,
            date: new Date().toISOString(),
            total: finalTotal,
            status: 'Paid',
            fulfill: 'Pending',
            items: quantity,
            itemList: [{
                title: product.title,
                price: itemPrice,
                quantity: quantity,
                image: itemImage,
                variant: selectedVariant ? selectedVariant.name : 'Standard',
                size: selectedSize
            }]
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
                    ${activeUser.firstName || ''} ${activeUser.lastName || ''}<br>
                    ${activeUser.address || ''}<br>
                    ${activeUser.city || ''}, ${activeUser.state || ''} ${activeUser.zipcode || ''}
                </div>

                <p>Please carefully review it and press "Accept" or "Change". After you make these changes, you accept the no-refund policy terms.</p>
                
                <a href="${window.location.origin}/customer_dashboard.html" style="background:#000; color:#fff; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:4px; display:inline-block; margin-right:8px;">Accept Address</a>
                <a href="${window.location.origin}/customer_dashboard.html#address" style="background:#f4f4f4; border:1px solid #ddd; color:#000; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:4px; display:inline-block;">Change Address</a>
            </div>
        `;

        if (typeof emailjs !== 'undefined') {
            emailjs.send("service_nrvlrb7", "template_afw7f64", {
                to_email: activeUser.email,
                reply_to: "cheaplugz@gmail.com",
                subject: "ACTION REQUIRED: Verify Shipping Address",
                html_message: emailHtml
            }).then(() => {
                alert('Order placed! An address verification email has been sent to ' + activeUser.email + '. Please accept it within 24 hours.');
                window.location.href = "index.html";
            }).catch(err => {
                console.error("EmailJS Error: ", err);
                alert('Order placed successfully! Note: EmailJS is not configured so the verification email was not actually sent.');
                window.location.href = "index.html";
            });
        } else {
            alert('Order placed! Please check your email to verify your address within 24 hours.');
            window.location.href = "index.html";
        }
    }
});
