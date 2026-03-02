const defaultProducts = [
    {
        id: 1,
        title: "COLOGNES",
        image: "https://images.unsplash.com/photo-1523293115678-d29062e24dc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 99.99,
        salePrice: 40.99,
        customStatus: "Sale"
    },
    {
        id: 2,
        title: "DESIGNER SUNGLASSES",
        image: "https://images.unsplash.com/photo-1577803645773-f96470509666?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 69.99,
        salePrice: 34.99,
        customStatus: "Sale"
    },
    {
        id: 3,
        title: "EARBUDS PRO 2",
        image: "https://images.unsplash.com/photo-1606220838315-056192d5e927?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 149.99,
        salePrice: 30.99,
        customStatus: "Sale"
    },
    {
        id: 4,
        title: "SPIIDER HOODIES",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 99.99,
        salePrice: 59.99,
        customStatus: "Sale"
    },
    {
        id: 5,
        title: "MONCLUR PUFFER",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 199.99,
        salePrice: 129.99,
        customStatus: "Sale"
    },
    {
        id: 6,
        title: "CHRODE HARTS",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 89.99,
        salePrice: 45.99,
        customStatus: "Sale"
    },
    {
        id: 7,
        title: "BAP ZIP UPS",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 119.99,
        salePrice: 65.99,
        customStatus: "Sale"
    },
    {
        id: 8,
        title: "WATCHES",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        originalPrice: 159.99,
        salePrice: 89.99,
        customStatus: "Sale"
    }
];

// Initialize Firebase if empty
async function initializeProducts() {
    const products = await window.getFirebaseProducts();
    if (!products || products.length === 0) {
        await window.saveFirebaseProducts(defaultProducts);
    }
}

// Get current products
async function getProducts() {
    return await window.getFirebaseProducts();
}

function renderProducts(products) {
    const mainContent = document.querySelector('.main-content');

    // Clear content first in case of re-render
    mainContent.innerHTML = '';

    // Create Hero Section
    const heroSection = document.createElement('section');
    heroSection.className = 'hero container';
    heroSection.innerHTML = `<h1 class="section-title">BEST SELLERS!</h1>`;

    // Create Product Grid
    const productGrid = document.createElement('div');
    productGrid.className = 'product-grid';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        let priceHTML = '';
        if (product.salePrice > 0) {
            priceHTML = `
                <span class="original-price">$${product.originalPrice}</span>
                <span class="sale-price">From $${product.salePrice}</span>
            `;
        } else {
            priceHTML = `<span class="sale-price">$${product.originalPrice}</span>`;
        }

        let badgeHTML = '';
        if (product.customStatus) {
            badgeHTML = '<div class="tags-container" style="position:absolute; top:10px; left:10px; display:flex; flex-direction:column; gap:6px; z-index:10;">';
            product.customStatus.split(',').forEach(tag => {
                badgeHTML += `<span class="product-tag" style="background-color: rgba(40, 40, 40, 0.8); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.2); width: fit-content;">${tag.trim()}</span>`;
            });
            badgeHTML += '</div>';
        }

        productCard.innerHTML = `
            <a href="product.html?id=${product.id}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; gap:12px;">
                <div class="image-wrapper">
                    ${badgeHTML}
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <div class="price-container">
                        ${priceHTML}
                    </div>
                </div>
            </a>
        `;
        productGrid.appendChild(productCard);
    });

    heroSection.appendChild(productGrid);
    mainContent.appendChild(heroSection);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Handle Loading Screen
    const loader = document.getElementById('page-loader');
    const progressBar = document.getElementById('loader-progress');
    if (loader && progressBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                progressBar.style.width = '100%';
                setTimeout(() => {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.style.display = 'none', 500);
                }, 400);
            } else {
                progressBar.style.width = progress + '%';
            }
        }, 80);
    }

    await initializeProducts();
    const products = await getProducts();
    renderProducts(products);

    // Listen to real-time sync from admin changes
    if (window.onProductsUpdate) {
        window.onProductsUpdate((newProducts) => {
            if (newProducts && newProducts.length > 0) {
                renderProducts(newProducts);
            }
        });
    }

    initReviewPopups();
});

// --- Review Popups Logic ---
function initReviewPopups() {
    let reviews = localStorage.getItem('tonka_reviews');
    if (!reviews) return;

    reviews = JSON.parse(reviews);

    // Filter to only approved reviews that have at least one photo
    const popupReviews = reviews.filter(r => {
        const hasPhoto = (r.photos && r.photos.length > 0) || r.photo;
        return r.status === 'Approved' && hasPhoto;
    });

    if (popupReviews.length === 0) return;

    // Create popup container
    const popup = document.createElement('a');
    popup.className = 'review-popup';
    popup.href = '#';

    // Internal HTML Structure
    popup.innerHTML = `
        <img src="" class="review-popup-img" alt="Review Image">
        <div class="review-popup-content">
            <div class="review-popup-header">
                <span class="review-popup-name"></span>
                <span class="review-popup-time">Recently</span>
            </div>
            <div class="review-popup-stars"></div>
            <div class="review-popup-text"></div>
            <span class="review-popup-link" style="display:none;">View Product</span>
        </div>
    `;

    document.body.appendChild(popup);

    const imgEl = popup.querySelector('.review-popup-img');
    const nameEl = popup.querySelector('.review-popup-name');
    const starsEl = popup.querySelector('.review-popup-stars');
    const textEl = popup.querySelector('.review-popup-text');
    const linkEl = popup.querySelector('.review-popup-link');

    let currentIndex = 0;

    function showNextReview() {
        const r = popupReviews[currentIndex];

        // 1. Set Image
        const photo = r.photos && r.photos.length > 0 ? r.photos[0] : r.photo;
        imgEl.src = photo;

        // 2. Set Name (Anonymous format)
        let anonName = "Anonymous";
        if (r.email && r.email.includes('@')) {
            const parts = r.email.split('@');
            if (parts[0].length >= 2) {
                anonName = parts[0].substring(0, 2) + '***@' + parts[1];
            }
        }
        nameEl.textContent = anonName;

        // 3. Set Stars
        starsEl.innerHTML = '';
        const rating = r.rating || 5;
        for (let i = 0; i < 5; i++) {
            if (i < rating) {
                // Solid star
                starsEl.innerHTML += '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            } else {
                // Outline star
                starsEl.innerHTML += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
            }
        }

        // 4. Set Text
        textEl.textContent = r.content;

        // 5. Set Link Target
        if (r.productUrl && r.productUrl.trim() !== '') {
            popup.href = r.productUrl;
            linkEl.style.display = 'block';
            popup.style.pointerEvents = 'auto';
        } else {
            popup.removeAttribute('href');
            linkEl.style.display = 'none';
            popup.style.pointerEvents = 'none';
        }

        // Show Popup
        popup.classList.add('active');

        // Hide after 6 seconds
        setTimeout(() => {
            popup.classList.remove('active');

            // Move to next review
            currentIndex = (currentIndex + 1) % popupReviews.length;
        }, 6000);
    }

    // Start rotation: Show first after 2 seconds, then every 12 seconds
    setTimeout(() => {
        showNextReview();
        setInterval(showNextReview, 12000); // 12s interval (6s show + 6s hidden)
    }, 2000);
}
