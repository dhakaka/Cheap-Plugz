async function getProductById(id) {
    const products = await window.getFirebaseProducts();
    if (!products || products.length === 0) return null;
    return products.find(p => String(p.id) === String(id));
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const product = await getProductById(productId);

    const mainContent = document.getElementById('product-page-content');

    if (!product) {
        mainContent.innerHTML = `<div style="text-align:center; grid-column:1/-1;"><h2>Product not found</h2><a href="/" style="color:#fff;">Return Home</a></div>`;
        return;
    }

    // Default price to show
    let displayOriginalPrice = product.originalPrice;
    let displaySalePrice = product.salePrice;
    let displayImage = product.image;

    // Check if variants exist to pre-select the first one
    let variantsList = product.variants && product.variants.length > 0 ? product.variants : null;
    let activeVariantIndex = variantsList ? 0 : -1;
    if (variantsList) {
        displayImage = variantsList[0].image || product.image;
        if (variantsList[0].price > 0) {
            displaySalePrice = variantsList[0].price;
            displayOriginalPrice = variantsList[0].price * 1.5; // Faux original price
        }
    }

    let sizesList = product.sizes ? product.sizes.split(',').map(s => s.trim()) : ["ONE SIZE"];
    let activeSizeIndex = 0;
    let quantity = 1;

    function renderPage() {
        // Build Tags HTML
        let tagsHTML = '';
        if (product.customStatus) {
            tagsHTML = '<div class="tags-container" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">';
            product.customStatus.split(',').forEach(tag => {
                tagsHTML += `<span class="product-tag" style="background-color: rgba(40, 40, 40, 0.8); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.2); width: fit-content;">${tag.trim()}</span>`;
            });
            tagsHTML += '</div>';
        }

        // Build price HTML
        let priceHTML = '';
        if ((displaySalePrice > 0 && displayOriginalPrice > displaySalePrice)) {
            priceHTML = `
                <span style="text-decoration:line-through; color:var(--text-secondary); font-size:1rem; font-weight:400;">$${displayOriginalPrice.toFixed(2)}</span>
                <span>$${displaySalePrice.toFixed(2)}</span>
            `;
        } else {
            priceHTML = `<span>$${displayOriginalPrice.toFixed(2)}</span>`;
        }

        // Build Variants HTML
        let variantsHTML = '';
        if (variantsList) {
            let pills = variantsList.map((v, idx) => {
                return `<button class="pill ${idx === activeVariantIndex ? 'active' : ''}" onclick="selectVariant(${idx})">${v.name}</button>`;
            }).join('');

            variantsHTML = `
                <div class="selector-section">
                    <span class="selector-label">VERSION</span>
                    <div class="pill-grid">
                        ${pills}
                    </div>
                </div>
            `;
        }

        // Build Sizes HTML
        let sizesHTML = '';
        if (sizesList.length > 0 && sizesList[0] !== "") {
            let pills = sizesList.map((s, idx) => {
                return `<button class="pill ${idx === activeSizeIndex ? 'active' : ''}" onclick="selectSize(${idx})">${s}</button>`;
            }).join('');

            sizesHTML = `
                <div class="selector-section">
                    <span class="selector-label">SIZE</span>
                    <div class="pill-grid">
                        ${pills}
                    </div>
                </div>
            `;
        }

        mainContent.innerHTML = `
            <div class="product-image-large">
                <img src="${displayImage}" alt="${product.title}">
            </div>
            
            <div class="product-details">
                <div class="stars" style="display:flex; gap:4px; align-items:center;">
                    <i data-feather="star" style="width:16px; height:16px; fill:transparent; color:#fff;"></i>
                    <i data-feather="star" style="width:16px; height:16px; fill:transparent; color:#fff;"></i>
                    <i data-feather="star" style="width:16px; height:16px; fill:transparent; color:#fff;"></i>
                    <i data-feather="star" style="width:16px; height:16px; fill:transparent; color:#fff;"></i>
                    <i data-feather="star" style="width:16px; height:16px; fill:transparent; color:#fff;"></i>
                    <span style="margin-left:8px; font-size:0.9rem; color:var(--text-secondary);">(7)</span>
                </div>
                
                <h1 style="font-size:2rem; font-weight:800; margin-top:8px;">${product.title}</h1>
                ${tagsHTML}
                ${product.description ? `<p style="color:var(--text-secondary); line-height:1.5; margin-top:12px; white-space:pre-wrap;">${product.description}</p>` : ''}
                
                <div class="price-row" style="margin-top: 12px;">
                    ${priceHTML}
                </div>
                
                ${variantsHTML}
                ${sizesHTML}
                
                <div class="selector-section" style="margin-top:12px;">
                    <span class="selector-label">Quantity</span>
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="updateQuantity(-1)">-</button>
                        <input type="text" readonly value="${quantity}" class="quantity-input">
                        <button class="quantity-btn" onclick="updateQuantity(1)">+</button>
                    </div>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
                    <button class="add-to-cart-btn" onclick="addToCart()">Add to cart</button>
                    <button class="buy-now-btn" onclick="buyNow()">Buy Now with <strong>Stripe</strong></button>
                </div>
            </div>
        `;

        if (window.feather) feather.replace();
    }

    // Handlers
    window.selectVariant = function (index) {
        activeVariantIndex = index;
        const v = variantsList[index];
        if (v.image) displayImage = v.image;
        if (v.price > 0) {
            displaySalePrice = v.price;
            displayOriginalPrice = v.price * 1.5; // faux original price update
        }
        renderPage();
    };

    window.selectSize = function (index) {
        activeSizeIndex = index;
        renderPage();
    };

    window.updateQuantity = function (change) {
        if (quantity + change > 0) {
            quantity += change;
            renderPage();
        }
    };

    window.enforceLogin = function () {
        const active = localStorage.getItem('tonka_active_user');
        if (!active) {
            window.location.href = 'login.html?requireAddress=true';
            return false;
        }
        const user = JSON.parse(active);
        if (!user.address || user.address.trim() === '') {
            window.location.href = 'login.html?requireAddress=true';
            return false;
        }
        return true;
    }

    window.addToCart = function () {
        if (!window.enforceLogin()) return;
        const variant = variantsList ? variantsList[activeVariantIndex] : null;
        const size = sizesList[activeSizeIndex] || 'ONE SIZE';
        if (window.addToCartAction) {
            window.addToCartAction(product, variant, size, quantity, displaySalePrice, displayImage);
        }
    };

    window.buyNow = function () {
        if (!window.enforceLogin()) return;

        // Build the URL parameters to pass to the custom checkout page
        const params = new URLSearchParams({
            productId: product.id,
            qty: quantity
        });

        if (activeVariantIndex >= 0) {
            params.append('variantIndex', activeVariantIndex);
        }
        if (activeSizeIndex >= 0) {
            params.append('sizeIndex', activeSizeIndex);
        }

        window.location.href = `checkout.html?${params.toString()}`;
    };

    // Initial render
    renderPage();
});
