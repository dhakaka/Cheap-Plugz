// --- Modal & Navigation Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav Sidebar
    const navSidebar = document.getElementById('nav-sidebar');
    const openNavBtn = document.querySelector('.mobile-menu-btn');
    const closeNavBtn = document.getElementById('close-nav-btn');
    const navCartBtn = document.getElementById('nav-cart-btn');
    const navReviewsBtn = document.getElementById('nav-reviews-btn');

    if (openNavBtn) openNavBtn.addEventListener('click', () => navSidebar.classList.add('active'));
    if (closeNavBtn) closeNavBtn.addEventListener('click', () => navSidebar.classList.remove('active'));

    // Nav Cart Action (open existing cart)
    // Nav Cart Action (open existing cart) (Moved the actual open cart btn here)
    const headerCartBtn = document.getElementById('cart-open-btn');
    if (headerCartBtn) {
        headerCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const cartOverlay = document.getElementById('cart-overlay');
            const cartSidebar = document.getElementById('cart-sidebar');
            if (cartOverlay && cartSidebar) {
                cartOverlay.classList.add('active');
                cartSidebar.classList.add('active');
            }
        });
    }

    // Nav Sidebar Cart Link
    if (navCartBtn) {
        navCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navSidebar.classList.remove('active');
            const cartOverlay = document.getElementById('cart-overlay');
            const cartSidebar = document.getElementById('cart-sidebar');
            if (cartOverlay && cartSidebar) {
                cartOverlay.classList.add('active');
                cartSidebar.classList.add('active');
            }
        });
    }

    // Search Modal
    const searchModal = document.getElementById('search-modal');
    const openSearchBtn = document.querySelector('[aria-label="Search"]');
    const navSearchBtn = document.getElementById('nav-search-btn'); // Sidebar search btn
    const closeSearchBtn = document.getElementById('close-search-btn');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    const openSearchHandler = () => {
        // If sidebar is open, close it since search is a fullscreen modal
        navSidebar.classList.remove('active');
        searchModal.classList.add('active');
        searchInput.focus();
    };

    if (openSearchBtn) openSearchBtn.addEventListener('click', openSearchHandler);
    if (navSearchBtn) navSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSearchHandler();
    });

    if (closeSearchBtn) closeSearchBtn.addEventListener('click', () => searchModal.classList.remove('active'));

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.toLowerCase();
            const products = await window.getFirebaseProducts();
            const filtered = products.filter(p => p.title.toLowerCase().includes(query));

            searchResults.innerHTML = '';
            if (query.trim() === '') return;

            if (filtered.length === 0) {
                searchResults.innerHTML = '<p style="color:var(--text-secondary);">No products found.</p>';
            } else {
                filtered.forEach(p => {
                    searchResults.innerHTML += `
                        <a href="product.html?id=${p.id}" style="display:flex; align-items:center; gap:12px; text-decoration:none; color:#fff;">
                            <img src="${p.image}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;">
                            <span>${p.title}</span>
                        </a>
                    `;
                });
            }
        });
    }

    // Reviews Modals
    const reviewsErrorModal = document.getElementById('reviews-error-modal');
    const closeReviewsErrorBtn = document.getElementById('close-reviews-error-btn');
    const openWriteReviewBtn = document.getElementById('open-write-review-btn');

    const writeReviewModal = document.getElementById('write-review-modal');
    const closeWriteReviewBtn = document.getElementById('close-write-review-btn');

    const faqReviewsLink = document.getElementById('faq-reviews-link');

    const openReviewsHandler = (e) => {
        e.preventDefault();
        navSidebar.classList.remove('active');

        // Populate approved reviews
        const reviewsListContainer = document.getElementById('storefront-reviews-list');
        if (reviewsListContainer) {
            let allReviews = localStorage.getItem('tonka_reviews');
            allReviews = allReviews ? JSON.parse(allReviews) : [];

            const approvedReviews = allReviews.filter(r => r.status === 'Approved');
            const noReviewsMsg = document.getElementById('no-reviews-msg');

            // Clear existing injected reviews but keep the msg element around
            Array.from(reviewsListContainer.children).forEach(child => {
                if (child.id !== 'no-reviews-msg') {
                    child.remove();
                }
            });

            if (approvedReviews.length === 0) {
                if (noReviewsMsg) noReviewsMsg.style.display = 'block';
            } else {
                if (noReviewsMsg) noReviewsMsg.style.display = 'none';

                approvedReviews.forEach(r => {
                    let starsHtml = '';
                    const rating = r.rating || 5; // fallback 5
                    for (let i = 1; i <= 5; i++) {
                        starsHtml += `<i data-feather="star" style="width:14px; height:14px; fill:${i <= rating ? '#0055ff' : 'transparent'}; color:#0055ff;"></i>`;
                    }

                    let photoHtml = '';
                    const photosToRender = r.photos ? r.photos : (r.photo ? [r.photo] : []);
                    if (photosToRender.length > 0) {
                        photoHtml = '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">';
                        photosToRender.forEach(pData => {
                            photoHtml += `<img src="${pData}" style="max-width:100px; max-height:100px; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">`;
                        });
                        photoHtml += '</div>';
                    }

                    // Product links are now handled globally per-product at the bottom of the modal
                    const emailParts = r.email.split('@');
                    const anonEmail = emailParts.length === 2 ?
                        emailParts[0].substring(0, 2) + '***@' + emailParts[1] : 'Anonymous';

                    const dateStr = new Date(r.date).toLocaleDateString();

                    const reviewCard = document.createElement('div');
                    reviewCard.style.padding = '16px';
                    reviewCard.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    reviewCard.style.borderRadius = '8px';
                    reviewCard.style.border = '1px solid rgba(255,255,255,0.1)';

                    reviewCard.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                            <div>
                                <div style="font-weight:600; font-size:0.95rem;">${anonEmail}</div>
                                <div style="color:var(--text-secondary); font-size:0.8rem;">${dateStr}</div>
                            </div>
                            <div style="display:flex; gap:2px;">
                                ${starsHtml}
                            </div>
                        </div>
                        <div style="margin-bottom:12px;">${photoHtml}</div>
                        <p style="font-size:0.95rem; line-height:1.5;">${r.content}</p>
                        ${r.productUrl ? `<div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.1);"><a href="${r.productUrl}" style="color:var(--text-secondary); text-decoration:none; font-size:0.85rem;"><i data-feather="external-link" style="width:14px; height:14px; margin-right:4px; vertical-align:middle;"></i>Buy this product</a></div>` : ''}
                    `;
                    reviewsListContainer.insertBefore(reviewCard, noReviewsMsg);

                });
                if (window.feather) feather.replace();
            }
        }

        reviewsErrorModal.classList.add('active');
    };

    // Trigger from nav or FAQ link
    if (navReviewsBtn) navReviewsBtn.addEventListener('click', openReviewsHandler);
    if (faqReviewsLink) faqReviewsLink.addEventListener('click', openReviewsHandler);

    if (closeReviewsErrorBtn) closeReviewsErrorBtn.addEventListener('click', () => reviewsErrorModal.classList.remove('active'));

    if (openWriteReviewBtn) {
        openWriteReviewBtn.addEventListener('click', () => {
            reviewsErrorModal.classList.remove('active');
            writeReviewModal.classList.add('active');
        });
    }

    if (closeWriteReviewBtn) closeWriteReviewBtn.addEventListener('click', () => writeReviewModal.classList.remove('active'));

    const submitReviewVerificationBtn = document.getElementById('submit-review-verification-btn');
    const reviewOrderInput = document.getElementById('review-order-input');
    const reviewEmailInput = document.getElementById('review-email-input');
    const reviewContentInput = document.getElementById('review-content-input');

    // Star rating logic
    const starsContainer = document.getElementById('review-stars-container');
    const stars = document.querySelectorAll('.review-star');
    let currentRating = 0;

    if (starsContainer) {
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const val = parseInt(e.currentTarget.getAttribute('data-val'));
                currentRating = val;
                starsContainer.setAttribute('data-rating', val);

                // Update star colors
                stars.forEach((s, idx) => {
                    if (idx < val) s.style.fill = '#0055ff'; // Neon blue filled
                    else s.style.fill = 'transparent'; // Not filled
                    s.style.color = '#0055ff';
                });
            });
        });
    }

    const reviewPhotoInput = document.getElementById('review-photo-input');

    if (submitReviewVerificationBtn) {
        submitReviewVerificationBtn.addEventListener('click', () => {
            const orderValue = reviewOrderInput.value.trim();
            const emailValue = reviewEmailInput.value.trim();
            const contentValue = reviewContentInput.value.trim();

            if (!orderValue && !emailValue) {
                alert("Please provide an order number or verified email.");
                return;
            }

            if (!contentValue) {
                alert("Please write your review before submitting.");
                return;
            }

            if (currentRating === 0) {
                alert("Please select a star rating.");
                return;
            }

            const saveReview = (photosArray = []) => {
                let reviews = localStorage.getItem('tonka_reviews');
                reviews = reviews ? JSON.parse(reviews) : [];
                reviews.push({
                    orderId: orderValue || 'N/A',
                    email: emailValue || 'N/A',
                    content: contentValue,
                    rating: currentRating,
                    photos: photosArray,
                    status: 'Pending',
                    date: new Date().toISOString()
                });
                localStorage.setItem('tonka_reviews', JSON.stringify(reviews));

                // Reset and close
                reviewOrderInput.value = '';
                reviewEmailInput.value = '';
                reviewContentInput.value = '';
                if (reviewPhotoInput) reviewPhotoInput.value = '';
                currentRating = 0;
                starsContainer.setAttribute('data-rating', 0);
                stars.forEach(s => { s.style.fill = 'transparent'; });

                writeReviewModal.classList.remove('active');
                alert("Thank you! Your review has been submitted and is pending admin approval.");
            };

            // Process images if any
            if (reviewPhotoInput && reviewPhotoInput.files && reviewPhotoInput.files.length > 0) {
                const files = Array.from(reviewPhotoInput.files).slice(0, 4); // Max 4 photos to save space
                let readersCompleted = 0;
                let photosData = [];

                files.forEach(file => {
                    if (file.size > 2 * 1024 * 1024) {
                        alert("One or more photos are larger than 2MB and were skipped.");
                        readersCompleted++;
                        if (readersCompleted === files.length) saveReview(photosData);
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        photosData.push(e.target.result);
                        readersCompleted++;
                        if (readersCompleted === files.length) {
                            saveReview(photosData);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                saveReview([]);
            }
        });
    }
});


