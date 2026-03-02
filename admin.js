// --- Migration Script for Sequential Orders ---
(function migrateOrderIds() {
    if (localStorage.getItem('tonka_order_migrated_1001')) return;

    let orders = localStorage.getItem('tonka_orders');
    if (!orders) return;
    orders = JSON.parse(orders);

    if (orders.length > 0) {
        // Sort orders oldest to newest
        orders.sort((a, b) => new Date(a.date) - new Date(b.date));

        let currentId = 1001;
        orders.forEach(o => {
            o.id = currentId.toString();
            currentId++;
        });

        // Reverse them back so newest is first (descending)
        orders.reverse();

        localStorage.setItem('tonka_orders', JSON.stringify(orders));
    }
    localStorage.setItem('tonka_order_migrated_1001', 'true');
})();

// Initialize Firebase logic from app.js equivalent
async function getProducts() {
    return await window.getFirebaseProducts();
}

async function saveProducts(products) {
    await window.saveFirebaseProducts(products);
}

// DOM Elements
const form = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const idInput = document.getElementById('product-id');
const titleInput = document.getElementById('title');
const imageInput = document.getElementById('image-upload');
const imageB64Input = document.getElementById('image-b64');
const originalPriceInput = document.getElementById('originalPrice');
const salePriceInput = document.getElementById('salePrice');
const shippingPriceInput = document.getElementById('shippingPrice');
const customStatusInput = document.getElementById('customStatus');
const descriptionInput = document.getElementById('description');
const imagePreview = document.getElementById('image-preview');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const inventoryList = document.getElementById('inventory-list');
const variantsContainer = document.getElementById('variants-container');
const addVariantBtn = document.getElementById('add-variant-btn');
const sizesInput = document.getElementById('sizes');
const buyNowUrlInput = document.getElementById('buyNowUrl');

let currentVariants = [];

function renderVariantsForm() {
    variantsContainer.innerHTML = '';
    currentVariants.forEach((v, index) => {
        const row = document.createElement('div');
        row.style.cssText = "display:grid; grid-template-columns: 1fr 1fr auto; gap:12px; align-items:end; background:#111; padding:16px; border:1px solid rgba(255,255,255,0.1); border-radius:8px;";
        row.innerHTML = `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; grid-column: span 2;">
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.75rem;">Name</label>
                    <input type="text" class="var-name" value="${v.name}" placeholder="e.g. PINK" required>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:0.75rem;">Price ($)</label>
                    <input type="number" class="var-price" value="${v.price}" step="0.01" required>
                </div>
                <div class="form-group" style="margin-bottom:0; grid-column: span 2;">
                    <label style="font-size:0.75rem;">Variant Image</label>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <input type="file" accept="image/*" onchange="window.handleVariantImageUpload(event, ${index})" style="flex-grow:1; padding:8px;" class="input-field">
                        ${v.image ? `<img src="${v.image}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; border:1px solid rgba(255,255,255,0.2);">` : `<div style="width:40px; height:40px; border-radius:4px; border:1px dashed rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:0.6rem; color:var(--text-secondary);">None</div>`}
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:0; grid-column: span 2;">
                    <label style="font-size:0.75rem;">Buy Now URL (Optional)</label>
                    <input type="url" class="var-buy-url" value="${v.buyNowUrl || ''}" placeholder="https://buy.stripe.com/...">
                </div>
            </div>
            <button type="button" class="btn-icon delete" onclick="removeVariant(${index})" style="margin-bottom:8px; align-self:start; justify-self:end;">
                <i data-feather="x"></i>
            </button>
        `;
        variantsContainer.appendChild(row);
    });
    if (window.feather) feather.replace();
}

function syncVariantsFromDOM() {
    const varNames = variantsContainer.querySelectorAll('.var-name');
    const varPrices = variantsContainer.querySelectorAll('.var-price');
    const varBuyUrls = variantsContainer.querySelectorAll('.var-buy-url');
    for (let i = 0; i < varNames.length; i++) {
        if (currentVariants[i]) {
            currentVariants[i].name = varNames[i].value;
            currentVariants[i].price = parseFloat(varPrices[i].value) || 0;
            if (varBuyUrls[i]) currentVariants[i].buyNowUrl = varBuyUrls[i].value;
        }
    }
}

addVariantBtn.addEventListener('click', () => {
    syncVariantsFromDOM();
    currentVariants.push({ name: '', image: '', price: 0, buyNowUrl: '' });
    renderVariantsForm();
});

window.removeVariant = function (index) {
    syncVariantsFromDOM();
    currentVariants.splice(index, 1);
    renderVariantsForm();
};

window.handleVariantImageUpload = function (event, index) {
    syncVariantsFromDOM();
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; // variants don't need to be massive
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                // Save it to the array
                currentVariants[index].image = dataUrl;
                // Re-render to show thumbnail preview immediately
                renderVariantsForm();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// Image File Handler & Compressor
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                imageB64Input.value = dataUrl;
                imagePreview.style.backgroundImage = `url(${dataUrl})`;
                imagePreview.innerHTML = ``;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        imageB64Input.value = '';
        imagePreview.style.backgroundImage = `none`;
        imagePreview.innerHTML = `<span style="background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; pointer-events: none;">Image Preview</span>`;
    }
});

// Render the Table
async function renderTable() {
    const products = await getProducts();
    inventoryList.innerHTML = '';

    if (products.length === 0) {
        inventoryList.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px;">No products found. Adds one above!</td></tr>`;
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');

        // Status badge
        const statusHTML = product.customStatus
            ? product.customStatus.split(',').map(tag => `<span style="color:#00ff00; font-size:0.8rem; border:1px solid #00ff00; padding:2px 8px; border-radius:10px; margin-right:4px;">${tag.trim()}</span>`).join('')
            : `<span style="color:#888; font-size:0.8rem; border:1px solid #888; padding:2px 8px; border-radius:10px;">None</span>`;

        // Price display
        const priceDisplay = (product.salePrice > 0)
            ? `<span style="text-decoration:line-through; color:#888; margin-right:8px;">$${Number(product.originalPrice).toFixed(2)}</span> $${Number(product.salePrice).toFixed(2)}`
            : `$${Number(product.originalPrice).toFixed(2)}`;

        // Buy Now Button view
        const buyNowHtml = product.buyNowUrl
            ? `<a href="${product.buyNowUrl}" target="_blank" style="color:var(--primary-color); font-size:0.85rem;"><i data-feather="external-link" style="width:14px; height:14px;"></i> Link</a>`
            : `<span style="color:#666; font-size:0.85rem;">None</span>`;

        tr.innerHTML = `
            <td><img src="${product.image}" class="thumb-img" alt="${product.title}"></td>
            <td style="font-weight:600;">${product.title}</td>
            <td>${priceDisplay}</td>
            <td>${buyNowHtml}</td>
            <td>${statusHTML}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="editProduct(${product.id})" title="Edit">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteProduct(${product.id})" title="Delete">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        inventoryList.appendChild(tr);
    });

    // Re-initialize feather icons for newly added DOM elements
    if (window.feather) feather.replace();
}



// Handle Form Submission (Add or Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let products = await getProducts();
    const editingId = idInput.value;

    // Gather variants
    const varNames = variantsContainer.querySelectorAll('.var-name');
    const varPrices = variantsContainer.querySelectorAll('.var-price');
    const varBuyUrls = variantsContainer.querySelectorAll('.var-buy-url');
    const variantsToSave = [];
    for (let i = 0; i < varNames.length; i++) {
        variantsToSave.push({
            name: varNames[i].value.trim(),
            // Pull the base64 image string cleanly out of the internal tracking array
            image: currentVariants[i] ? currentVariants[i].image : '',
            price: parseFloat(varPrices[i].value) || 0,
            buyNowUrl: varBuyUrls[i] ? varBuyUrls[i].value.trim() : ''
        });
    }

    const newProductData = {
        title: titleInput.value.trim(),
        image: imageB64Input.value,
        originalPrice: parseFloat(originalPriceInput.value),
        salePrice: parseFloat(salePriceInput.value) || 0,
        shippingPrice: parseFloat(shippingPriceInput.value) || 0,
        customStatus: customStatusInput.value.trim(),
        description: descriptionInput.value.trim(),
        sizes: sizesInput.value.trim(),
        buyNowUrl: buyNowUrlInput ? buyNowUrlInput.value.trim() : '',
        variants: variantsToSave
    };

    if (editingId) {
        // UPDATE Existing Product
        const index = products.findIndex(p => p.id == editingId);
        if (index !== -1) {
            products[index] = { ...products[index], ...newProductData };
        }
    } else {
        // ADD New Product
        // Generate a simple ID based on timestamp
        newProductData.id = Date.now();
        products.push(newProductData);
    }

    await saveProducts(products);
    resetForm();
    await renderTable();
});

// Edit Product
window.editProduct = async function (id) {
    const products = await getProducts();
    const product = products.find(p => p.id == id);
    if (!product) return;

    // Populate form
    idInput.value = product.id;
    titleInput.value = product.title;
    imageInput.value = '';
    imageB64Input.value = product.image || '';
    if (product.image) {
        imagePreview.style.backgroundImage = `url(${product.image})`;
        imagePreview.innerHTML = ``;
    } else {
        imagePreview.style.backgroundImage = `none`;
        imagePreview.innerHTML = `<span style="background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; pointer-events: none;">Image Preview</span>`;
    }

    originalPriceInput.value = product.originalPrice;
    salePriceInput.value = product.salePrice || '';
    shippingPriceInput.value = product.shippingPrice || '0.00';
    customStatusInput.value = product.customStatus || '';
    descriptionInput.value = product.description || '';
    sizesInput.value = product.sizes || '';
    if (buyNowUrlInput) buyNowUrlInput.value = product.buyNowUrl || '';

    currentVariants = product.variants ? [...product.variants] : [];
    renderVariantsForm();

    // Update UI states
    formTitle.innerText = "Edit Product";
    saveBtn.innerText = "Save Changes";
    cancelBtn.classList.remove('hidden');

    // Smooth scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Delete Product
window.deleteProduct = async function (id) {
    if (confirm("Are you sure you want to delete this product? This cannot be undone.")) {
        let products = await getProducts();
        products = products.filter(p => p.id != id);
        await saveProducts(products);
        await renderTable();

        // If we were editing the deleted product, reset the form
        if (idInput.value == id) {
            resetForm();
        }
    }
};

// Reset Form
function resetForm() {
    form.reset();
    idInput.value = '';
    imageInput.value = '';
    imageB64Input.value = '';
    imagePreview.style.backgroundImage = `none`;
    imagePreview.innerHTML = `<span style="background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; pointer-events: none;">Image Preview</span>`;
    formTitle.innerText = "Add New Product";
    saveBtn.innerText = "Add Product";
    cancelBtn.classList.add('hidden');
    customStatusInput.value = '';
    descriptionInput.value = '';
    shippingPriceInput.value = '0.00';
    sizesInput.value = '';
    if (buyNowUrlInput) buyNowUrlInput.value = '';
    currentVariants = [];
    renderVariantsForm();
}

// Cancel Edit
cancelBtn.addEventListener('click', resetForm);

// Add Tracking
window.addTracking = function (id) {
    const tracking = prompt("Enter tracking number:");
    if (tracking !== null) {
        let orders = localStorage.getItem('tonka_orders');
        orders = orders ? JSON.parse(orders) : [];
        const idx = orders.findIndex(o => o.id == id);
        if (idx !== -1) {
            orders[idx].trackingNumber = tracking.trim();
            localStorage.setItem('tonka_orders', JSON.stringify(orders));
            renderOrders();
            if (window.feather) { feather.replace(); }
        }
    }
}

// Render Customers
function renderCustomers() {
    const customersList = document.getElementById('customers-list');
    if (!customersList) return;

    let customers = localStorage.getItem('tonka_customers');
    customers = customers ? JSON.parse(customers) : [];

    customersList.innerHTML = '';

    if (customers.length === 0) {
        customersList.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px;">No registered customers yet.</td></tr>`;
        return;
    }

    customers.forEach(c => {
        const tr = document.createElement('tr');
        tr.className = 'clickable-row';
        tr.onclick = () => viewCustomerDetails(c);
        const dateStr = new Date(c.joined).toLocaleDateString();
        tr.innerHTML = `
            <td style="font-weight:600;">${c.fullName}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>${dateStr}</td>
        `;
        customersList.appendChild(tr);
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const overlay = document.getElementById('admin-auth-overlay');
    const authUserInput = document.getElementById('admin-user-input');
    const authEmailInput = document.getElementById('admin-email-input');
    const authPassInput = document.getElementById('admin-pass-input');
    const authBtn = document.getElementById('admin-auth-btn');
    const authError = document.getElementById('admin-auth-error');
    const authRememberCheckbox = document.getElementById('admin-remember-me');

    // Bypass check
    if (localStorage.getItem('admin_remembered') === 'true') {
        overlay.style.display = 'none';
        renderTable();
        renderCustomers();
        renderOrders();
        renderReviews();
        initChart();
        return;
    }

    const checkAuth = () => {
        const userValue = authUserInput.value.trim();
        const emailValue = authEmailInput.value.trim();
        const passValue = authPassInput.value;

        if (userValue === 'cheaplugz' && emailValue === 'cheaplugz@gmail.com' && passValue === 'Rebekah21$90') {
            if (authRememberCheckbox && authRememberCheckbox.checked) {
                localStorage.setItem('admin_remembered', 'true');
            }
            overlay.style.display = 'none';
            renderTable();
            renderCustomers();
            renderOrders();
            renderReviews();
            initChart();
        } else {
            authError.style.display = 'block';
        }
    };

    authBtn.addEventListener('click', checkAuth);
    authPassInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAuth();
    });
});

// --- Tabs Logic ---
const navItems = document.querySelectorAll('.nav-item[data-tab]');
const tabs = document.querySelectorAll('.admin-tab');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const tabId = item.getAttribute('data-tab');
        if (!tabId) return;
        e.preventDefault();

        // Update active nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update active tab
        tabs.forEach(tab => tab.classList.remove('active'));
        const targetTab = document.getElementById(tabId);
        if (targetTab) targetTab.classList.add('active');
    });
});

// --- Mock Orders Logic ---
async function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    const productSelect = document.getElementById('manual-product-select');
    if (!ordersList) return;

    // Populate manual orders product dropdown
    if (productSelect) {
        let products = await getProducts();
        if (products.length === 0) {
            productSelect.innerHTML = `<option value="">No products available</option>`;
        } else {
            productSelect.innerHTML = `<option value="">-- Select a Product --</option>` + products.map(p => `<option value="${p.id}">${p.title} - $${(p.salePrice || p.originalPrice).toFixed(2)}</option>`).join('');
        }
    }

    let mockOrders = localStorage.getItem('tonka_orders');
    mockOrders = mockOrders ? JSON.parse(mockOrders) : [];

    if (mockOrders.length === 0) {
        ordersList.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px;">No orders yet.</td></tr>`;
        return;
    }

    ordersList.innerHTML = mockOrders.map(o => {
        const colorStatus = o.status === 'Refunded' ? '#ff5555' : (o.status === 'Paid' ? '#00ff00' : '#ffff00');
        const colorFulfill = o.fulfill === 'Completed' || o.fulfill === 'Fulfilled' ? '#00ff00' : '#ffff00';

        let customerInfo = `<div>${o.customerEmail || o.customer || 'Unknown'}</div>`;
        if (o.customerName) {
            customerInfo += `<div style="font-size:0.8rem; color:var(--text-secondary);">${o.customerName}</div>`;
        }
        if (o.customerAddress) {
            customerInfo += `<div style="font-size:0.8rem; color:var(--text-secondary);">${o.customerAddress}</div>`;
        }

        let paidBtnHtml = o.status !== 'Paid' ? `<button onclick="window.markOrderPaid('${o.id}', event)" style="margin-left:8px; background:rgba(255,255,255,0.1); color:#fff; padding:4px 8px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; font-size:0.7rem; cursor:pointer;">Mark Paid</button>` : '';
        let completedBtnHtml = (o.fulfill !== 'Completed' && o.fulfill !== 'Fulfilled') ? `<button onclick="window.markOrderCompleted('${o.id}', event)" style="margin-left:8px; background:rgba(255,255,255,0.1); color:#fff; padding:4px 8px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; font-size:0.7rem; cursor:pointer;">Mark Completed</button>` : '';

        return `
            <tr onclick="window.viewOrderDetails('${o.id}')" style="cursor:pointer;" class="order-row-hover">
                <td style="font-weight:600;">${o.id}</td>
                <td style="color:var(--text-secondary);">${o.date}</td>
                <td>${customerInfo}</td>
                <td>$${o.total.toFixed(2)}</td>
                <td>
                    <span style="background:rgba(255,255,255,0.1); color:${colorStatus}; padding:4px 8px; border-radius:12px; font-size:0.8rem;">${o.status}</span>
                    ${paidBtnHtml}
                </td>
                <td>
                    <span style="background:rgba(255,255,255,0.1); color:${colorFulfill}; padding:4px 8px; border-radius:12px; font-size:0.8rem;">${o.fulfill}</span>
                    ${completedBtnHtml}
                </td>
                <td>${o.items} item(s)</td>
                <td>
                    ${o.trackingNumber ?
                `<span style="color:#00ff00; font-size:0.9rem;">${o.trackingNumber}</span> <button onclick="window.addTracking('${o.id}', event)" style="background:none; color:var(--text-secondary); border:none; cursor:pointer; margin-left:8px;" title="Edit Tracking"><i data-feather="edit-2" style="width:14px; height:14px;"></i></button>` :
                `<button onclick="window.addTracking('${o.id}', event)" style="background:#fff; color:#000; padding:4px 8px; border:none; border-radius:4px; font-size:0.8rem; cursor:pointer;">Add Tracking</button>`
            }
                </td>
            </tr>
        `;
    }).join('');
    feather.replace();
}

window.addTracking = function (id, e) {
    if (e) e.stopPropagation();
    const trackingNum = prompt("Enter tracking number:");
    if (trackingNum === null) return; // cancelled

    let orders = localStorage.getItem('tonka_orders');
    if (!orders) return;
    orders = JSON.parse(orders);

    // id could be string or number, depending on how it's passed/saved
    const orderIndex = orders.findIndex(o => String(o.id) === String(id));
    if (orderIndex !== -1) {
        orders[orderIndex].trackingNumber = trackingNum.trim();
        localStorage.setItem('tonka_orders', JSON.stringify(orders));
        renderOrders();
    }
};

window.markOrderPaid = function (id, e) {
    if (e) e.stopPropagation();
    let orders = localStorage.getItem('tonka_orders');
    if (!orders) return;
    orders = JSON.parse(orders);
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'Paid';
        localStorage.setItem('tonka_orders', JSON.stringify(orders));
        renderOrders();
    }
};

window.markOrderCompleted = function (id, e) {
    if (e) e.stopPropagation();
    let orders = localStorage.getItem('tonka_orders');
    if (!orders) return;
    orders = JSON.parse(orders);
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex !== -1) {
        orders[orderIndex].fulfill = 'Completed';
        localStorage.setItem('tonka_orders', JSON.stringify(orders));
        renderOrders();
    }
};

window.viewOrderDetails = function (id) {
    let orders = localStorage.getItem('tonka_orders');
    if (!orders) return;
    orders = JSON.parse(orders);
    const order = orders.find(o => String(o.id) === String(id));
    if (!order) return;

    document.getElementById('modal-order-id').innerText = '#' + order.id;
    document.getElementById('modal-order-date').innerText = new Date(order.date).toLocaleString();

    document.getElementById('modal-customer-name').innerText = order.customerName || order.customer || 'Unknown';
    document.getElementById('modal-customer-email').innerText = order.customerEmail || 'No Email Provided';
    document.getElementById('modal-customer-address').innerText = order.customerAddress || 'No Address Provided';

    const itemsContainer = document.getElementById('modal-order-items');
    itemsContainer.innerHTML = '';

    let totalComputed = 0;
    if (order.itemList && Array.isArray(order.itemList)) {
        order.itemList.forEach(item => {
            const itemTotal = (item.price * item.quantity);
            totalComputed += itemTotal;
            itemsContainer.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${item.image}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; background:#000;">
                        <div>
                            <div style="font-weight:600; font-size:0.95rem;">${item.title}</div>
                            <div style="color:var(--text-secondary); font-size:0.8rem;">${item.variant} / ${item.size}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:600;">$${itemTotal.toFixed(2)}</div>
                        <div style="color:var(--text-secondary); font-size:0.8rem;">$${Number(item.price).toFixed(2)} &times; ${item.quantity}</div>
                    </div>
                </div>
            `;
        });
    }

    // Add Shipping display line
    const shippingCost = order.total - totalComputed;
    if (shippingCost > 0) {
        itemsContainer.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                <div style="color:var(--text-secondary);">Shipping</div>
                <div>$${shippingCost.toFixed(2)}</div>
            </div>
        `;
    }

    document.getElementById('modal-order-total').innerText = '$' + order.total.toFixed(2);
    document.getElementById('order-details-modal').style.display = 'flex';
};

window.closeOrderDetails = function () {
    document.getElementById('order-details-modal').style.display = 'none';
};

// --- Manual Order Submission ---
const manualOrderForm = document.getElementById('manual-order-form');
if (manualOrderForm) {
    manualOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('manual-customer-email').value.trim();
        const productId = document.getElementById('manual-product-select').value;
        const qty = parseInt(document.getElementById('manual-quantity').value);
        const priceOverride = document.getElementById('manual-price-override').value;
        const sendEmailJS = document.getElementById('send-emailjs-toggle').checked;

        if (!productId) {
            alert('Please select a product.');
            return;
        }

        const product = (await getProducts()).find(p => p.id == productId);
        if (!product) return;

        const effectivePrice = priceOverride ? parseFloat(priceOverride) : (product.salePrice > 0 ? product.salePrice : product.originalPrice);
        const subtotal = effectivePrice * qty;
        const total = subtotal + 4.00; // adding fake $4 shipping for realism

        let orders = localStorage.getItem('tonka_orders');
        orders = orders ? JSON.parse(orders) : [];

        let nextId = 1001;
        if (orders.length > 0) {
            // Find max numeric ID
            const numericIds = orders.map(o => {
                const num = parseInt(String(o.id).replace(/\D/g, ''), 10);
                return isNaN(num) ? 0 : num;
            });
            nextId = Math.max(...numericIds, 1000) + 1;
        }
        const newOrderId = nextId.toString();

        const dateObj = new Date();
        const futureDate = new Date(dateObj.getTime() + (2 * 24 * 60 * 60 * 1000)); // +2 days reserved

        let users = localStorage.getItem('tonka_users');
        users = users ? JSON.parse(users) : [];
        const matchedUser = users.find(u => u.email === email);

        const newOrder = {
            id: newOrderId,
            customerEmail: email,
            customer: email.split('@')[0], // username approx
            customerName: matchedUser ? matchedUser.fullName : '',
            customerAddress: matchedUser ? matchedUser.address : 'Pending Address',
            date: dateObj.toISOString(),
            total: total,
            status: 'Unpaid',
            fulfill: 'Pending',
            items: qty,
            itemList: [{
                title: product.title,
                price: effectivePrice,
                quantity: qty,
                image: product.image,
                variant: 'Standard',
                size: product.sizes ? product.sizes.split(',')[0].trim() : 'One Size'
            }]
        };

        orders.unshift(newOrder); // Add to top
        localStorage.setItem('tonka_orders', JSON.stringify(orders));
        renderOrders();
        manualOrderForm.reset();

        // --- Generate Invoice HTML ---
        const invoiceHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #000; padding: 20px; text-align: left; display: inline-block;">
                    <img src="data:image/png;base64,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" style="height:50px;" alt="Cheap Plugz Logo">
                </div>
                <div style="float: right; margin-top: 20px; color: #888; font-size: 14px;">
                    INVOICE #${newOrderId}
                </div>
                <div style="clear: both; margin-top: 40px;">
                    <h2 style="font-size: 22px; margin-bottom: 10px;">Review and confirm to complete your order</h2>
                    <p style="color: #666; font-size: 14px; margin-bottom: 24px;">These items will be reserved for you until ${futureDate.toLocaleDateString()} at ${futureDate.toLocaleTimeString()}.</p>
                    
                    <a href="${window.location.origin}/product.html?id=${product.id}" style="background-color: #000; color: #fff; padding: 14px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; margin-right: 16px;">Complete your purchase</a>
                    <span style="font-size: 14px;">or <a href="${window.location.origin}/" style="color: #000; text-decoration: none;">Visit our store</a></span>
                </div>

                <div style="margin-top: 60px;">
                    <h3 style="font-size: 18px; margin-bottom: 20px;">Order summary</h3>
                    <div style="display: flex; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 20px;">
                        <img src="${product.image}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #000; margin-right: 16px;">
                        <div style="flex: 1;">
                            <p style="margin: 0; font-weight: bold; font-size: 14px;">${product.title} &times; ${qty}</p>
                        </div>
                        <div style="font-weight: bold;">$${subtotal.toFixed(2)}</div>
                    </div>
                    
                    <div style="margin-top: 20px; float: right; width: 250px; font-size: 14px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Subtotal</span>
                            <span style="font-weight: bold;">$${subtotal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #666;">Shipping</span>
                            <span style="font-weight: bold;">$4.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
                            <span style="color: #666;">Estimated taxes</span>
                            <span style="font-weight: bold;">$0.00</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 18px;">
                            <span style="color: #666;">Total due today</span>
                            <span style="font-weight: bold;">$${total.toFixed(2)} USD</span>
                        </div>
                    </div>
                </div>
                
                <div style="clear: both; margin-top: 100px;">
                    <h3 style="font-size: 18px; margin-bottom: 20px;">Customer information</h3>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; color: #555; line-height: 1.6;">
                        <div style="width: 48%;">
                            <strong style="color: #333;">Shipping address</strong><br>
                            Pending Checkout<br>
                            ---<br>
                            United States
                        </div>
                        <div style="width: 48%;">
                            <strong style="color: #333;">Billing address</strong><br>
                            Pending Checkout<br>
                            ---<br>
                            United States
                        </div>
                    </div>
                </div>
            </div>
        `;

        // If EmailJS setup is selected
        if (sendEmailJS && typeof emailjs !== 'undefined') {
            // NOTE: The user must configure EmailJS for this to actually send an email.
            // Replace these strings with real Service ID and Template ID.
            const serviceID = "service_nrvlrb7";
            const templateID = "template_afw7f64";

            emailjs.send(serviceID, templateID, {
                to_email: email,
                reply_to: "cheaplugz@gmail.com",
                subject: "Your Order Confirmation from Cheap Plugz",
                html_message: invoiceHTML
            }).then(() => {
                alert('Invoice email sent to ' + email + ' via EmailJS!');
            }).catch(err => {
                console.error("EmailJS Error (Setup required): ", err);
                alert('EmailJS is not configured yet. Opening invoice preview in new tab instead.');
                openInvoicePreview(invoiceHTML);
            });
        } else {
            openInvoicePreview(invoiceHTML);
        }
    });
}

function openInvoicePreview(htmlContent) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

// For customer detail clicks
window.viewCustomerDetails = function (c) {
    // Switch to details tab
    navItems.forEach(nav => nav.classList.remove('active')); // clear highlights
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-customer-details').classList.add('active');

    // Populate data
    document.getElementById('detail-customer-name').innerText = c.fullName;
    document.getElementById('detail-since').innerText = new Date(c.joined).toLocaleDateString();

    document.getElementById('detail-email').innerText = c.email || 'No email provided';
    document.getElementById('detail-phone').innerText = c.phone || 'No phone provided';
    document.getElementById('detail-address').innerText = c.address || 'No address provided';

    let orders = localStorage.getItem('tonka_orders');
    orders = orders ? JSON.parse(orders) : [];

    // Find all orders for this customer email
    const customerOrders = orders.filter(o => o.customerEmail === c.email);

    let lastOrderHTML = '';

    if (customerOrders.length === 0) {
        lastOrderHTML = `<p style="color:var(--text-secondary); padding:20px 0; text-align:center;">No available order history for this customer.</p>`;
    } else {
        // Sort descending by date usually, we'll just show all of them but name the section "Order History"
        customerOrders.forEach(order => {
            const dateStr = new Date(order.date).toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            let itemsHtml = '';
            order.items.forEach(item => {
                const imgStr = item.image
                    ? `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`
                    : `Img`;

                itemsHtml += `
                    <div style="display:flex; gap:16px; align-items:center; margin-bottom:12px;">
                        <div style="width:40px; height:40px; background:#222; border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); overflow:hidden;">
                            ${imgStr}
                        </div>
                        <div>
                            <p style="font-size:0.9rem; font-weight:600;">${item.title.toUpperCase()}</p>
                            <p style="font-size:0.8rem; color:var(--text-secondary);">${item.variant} / ${item.size}</p>
                        </div>
                        <span style="margin-left:auto; font-size:0.9rem;">x ${item.quantity}</span>
                        <span style="font-weight:600; font-size:0.9rem; margin-left:16px;">$${item.price.toFixed(2)}</span>
                    </div>
                `;
            });

            lastOrderHTML += `
                <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:16px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <div>
                            <span style="font-weight:600;">#${order.id}</span> 
                            <span style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:12px; font-size:0.75rem; margin:0 4px;">Paid</span>
                            <span style="background:rgba(0,255,0,0.1); color:#00ff00; padding:2px 6px; border-radius:12px; font-size:0.75rem;">Fulfilled</span>
                        </div>
                        <span style="font-weight:600;">$${order.total.toFixed(2)}</span>
                    </div>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">${dateStr} from <span style="color:#00ff00;">Online Store</span></p>
                    ${itemsHtml}
                </div>
            `;
        });
    }

    // Also update the card header text from "Last order placed" to "Order History"
    const orderHeader = document.querySelector('#detail-last-order').previousElementSibling;
    if (orderHeader && orderHeader.tagName === 'H3') {
        orderHeader.innerText = 'Order History';
    }

    document.getElementById('detail-last-order').innerHTML = lastOrderHTML;

    if (window.feather) feather.replace();
};

window.createCustomerInvoice = function () {
    const email = document.getElementById('detail-email').innerText;
    if (!email || email === 'No email provided') return;

    // Switch to Orders Tab safely mimicking the nav click
    const ordersNav = document.querySelector('[data-tab="tab-orders"]');
    if (ordersNav) ordersNav.click();

    // Populate target email onto the form
    const emailField = document.getElementById('manual-customer-email');
    if (emailField) {
        emailField.value = email;
        emailField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

document.getElementById('back-to-customers').addEventListener('click', () => {
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-customers').classList.add('active');

    // reset nav highlight
    document.querySelector('.nav-item[data-tab="tab-customers"]').classList.add('active');
});

// --- Chart.js Initialization ---
function initChart() {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            datasets: [{
                label: 'Store Traffic',
                data: [0, 0, 0, 0, 0], // Starting at zero
                borderColor: '#ffffff', // White
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'var(--text-secondary)' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'var(--text-secondary)' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
}

// --- Reviews Logic ---
function renderReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    let reviews = localStorage.getItem('tonka_reviews');
    reviews = reviews ? JSON.parse(reviews) : [];

    reviewsList.innerHTML = '';

    if (reviews.length === 0) {
        reviewsList.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px;">No reviews pending.</td></tr>`;
        return;
    }

    reviews.forEach((r, index) => {
        const tr = document.createElement('tr');
        const contentPreview = r.content.length > 50 ? r.content.substring(0, 50) + '...' : r.content;
        const statusColor = r.status === 'Approved' ? '#00ff00' : (r.status === 'Rejected' ? '#ff5555' : '#ffff00');

        // Render Stars
        let starsHtml = '';
        const rating = r.rating || 0;
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<i data-feather="star" style="width:14px; height:14px; fill:${i <= rating ? '#0055ff' : 'transparent'}; color:#0055ff;"></i>`;
        }

        // Render Photo Thumbnails
        let photoHtml = '';
        const photosToRender = r.photos ? r.photos : (r.photo ? [r.photo] : []);
        if (photosToRender.length > 0) {
            photoHtml = '<div style="display:flex; flex-wrap:wrap; gap:4px; max-width:140px;">';
            photosToRender.forEach(pData => {
                photoHtml += `<a href="${pData}" target="_blank"><img src="${pData}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid rgba(255,255,255,0.2);"></a>`;
            });
            photoHtml += '</div>';
        } else {
            photoHtml = `<span style="color:var(--text-secondary); font-size:0.8rem;">None</span>`;
        }

        tr.innerHTML = `
            <td>${r.email}</td>
            <td>${r.orderId}</td>
            <td><div style="display:flex; gap:2px;">${starsHtml}</div></td>
            <td>${photoHtml}</td>
            <td title="${r.content}">${contentPreview}</td>
            <td><span style="background:rgba(255,255,255,0.1); color:${statusColor}; padding:4px 8px; border-radius:12px; font-size:0.8rem;">${r.status}</span></td>
            <td>
                <div class="action-btns" style="display:flex; flex-direction:column; gap:8px;">
                    ${r.status === 'Pending' ? `
                    <input type="url" id="review-link-${index}" placeholder="Product link..." style="padding:4px 8px; font-size:0.8rem; background:#111; border:1px solid rgba(255,255,255,0.2); color:#fff; border-radius:4px; width:120px;" title="Link to the product page to show on the storefront">
                    <div style="display:flex; gap:8px;">
                        <button class="btn-icon" onclick="updateReviewStatus(${index}, 'Approved')" title="Approve">
                            <i data-feather="check" style="color:#00ff00;"></i>
                        </button>
                        <button class="btn-icon delete" onclick="updateReviewStatus(${index}, 'Rejected')" title="Reject">
                            <i data-feather="x" style="color:#ff5555;"></i>
                        </button>
                    </div>
                    ` : (r.productUrl ? `<a href="${r.productUrl}" target="_blank" style="font-size:0.8rem; color:var(--primary-color);">Product Link</a>` : '')}
                </div>
            </td>
        `;
        reviewsList.appendChild(tr);
    });

    if (window.feather) feather.replace();
}

window.updateReviewStatus = function (index, newStatus) {
    let reviews = JSON.parse(localStorage.getItem('tonka_reviews') || '[]');
    if (reviews[index]) {
        if (newStatus === 'Approved') {
            const linkInput = document.getElementById('review-link-' + index);
            if (linkInput && linkInput.value.trim() !== '') {
                reviews[index].productUrl = linkInput.value.trim();
            }
        }
        reviews[index].status = newStatus;
        localStorage.setItem('tonka_reviews', JSON.stringify(reviews));
        renderReviews();
    }
}

// --- AI Prompts Logic ---
window.editingAiIndex = null;

async function renderAiPrompts() {
    const list = document.getElementById('ai-prompts-list');
    if (!list) return;

    let prompts = JSON.parse(localStorage.getItem('tonka_ai_prompts') || '[]');
    list.innerHTML = '';

    if (prompts.length === 0) {
        list.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 24px;">No custom prompts defined.</td></tr>`;
        return;
    }

    const products = await getProducts();

    prompts.forEach((p, index) => {
        let productLabel = "";
        if (p.productId) {
            const prod = products.find(pr => String(pr.id) === String(p.productId));
            if (prod) {
                productLabel = `<div style="font-size:0.8rem; color:#00ff00; margin-top:4px; display:inline-flex; align-items:center; gap:4px;"><i data-feather="package" style="width:12px; height:12px;"></i> Attached: ${prod.title}</div>`;
            }
        }

        let linkLabel = "";
        if (p.linkUrl) {
            linkLabel = `<div style="font-size:0.8rem; color:#5a31f4; margin-top:4px; display:inline-flex; align-items:center; gap:4px;"><i data-feather="link" style="width:12px; height:12px;"></i> Link: ${p.linkText || p.linkUrl}</div>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--primary-color);">${p.trigger}</td>
            <td style="color:var(--text-secondary);">${p.response}${productLabel}${linkLabel}</td>
            <td style="text-align:right;">
                <button class="btn-icon edit" onclick="window.editAiPrompt(${index})" style="margin-right:8px;" title="Edit Prompt">
                    <i data-feather="edit-2"></i>
                </button>
                <button class="btn-icon delete" onclick="window.deleteAiPrompt(${index})" title="Delete Prompt">
                    <i data-feather="trash-2"></i>
                </button>
            </td>
        `;
        list.appendChild(tr);
    });

    if (window.feather) feather.replace();
}

window.addAiPrompt = function (event) {
    event.preventDefault();
    const triggerInput = document.getElementById('ai-trigger');
    const responseInput = document.getElementById('ai-response');
    const productSelect = document.getElementById('ai-product-select');
    const linkTextInput = document.getElementById('ai-link-text');
    const linkUrlInput = document.getElementById('ai-link-url');
    const submitBtn = document.getElementById('ai-submit-btn');

    const trigger = triggerInput.value.trim();
    const response = responseInput.value.trim();
    const productId = productSelect ? productSelect.value : "";
    const linkText = linkTextInput ? linkTextInput.value.trim() : "";
    const linkUrl = linkUrlInput ? linkUrlInput.value.trim() : "";

    if (trigger && response) {
        let prompts = JSON.parse(localStorage.getItem('tonka_ai_prompts') || '[]');

        if (window.editingAiIndex !== null && window.editingAiIndex !== undefined) {
            prompts[window.editingAiIndex] = { trigger, response, productId, linkText, linkUrl };
            window.editingAiIndex = null;
            if (submitBtn) submitBtn.innerText = "Save Prompt";
        } else {
            prompts.push({ trigger, response, productId, linkText, linkUrl });
        }

        localStorage.setItem('tonka_ai_prompts', JSON.stringify(prompts));

        triggerInput.value = '';
        responseInput.value = '';
        if (productSelect) productSelect.value = '';
        if (linkTextInput) linkTextInput.value = '';
        if (linkUrlInput) linkUrlInput.value = '';

        renderAiPrompts();
    }
};

window.editAiPrompt = function (index) {
    let prompts = JSON.parse(localStorage.getItem('tonka_ai_prompts') || '[]');
    const p = prompts[index];
    if (!p) return;

    document.getElementById('ai-trigger').value = p.trigger || '';
    document.getElementById('ai-response').value = p.response || '';

    const productSelect = document.getElementById('ai-product-select');
    if (productSelect) productSelect.value = p.productId || '';

    const linkTextInput = document.getElementById('ai-link-text');
    if (linkTextInput) linkTextInput.value = p.linkText || '';

    const linkUrlInput = document.getElementById('ai-link-url');
    if (linkUrlInput) linkUrlInput.value = p.linkUrl || '';

    window.editingAiIndex = index;
    const submitBtn = document.getElementById('ai-submit-btn');
    if (submitBtn) submitBtn.innerText = "Update Prompt";

    document.getElementById('ai-prompt-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

async function renderAiProductOptions() {
    let products = await getProducts();
    let html = `<option value="">-- No Product Attached --</option>`;

    products.forEach(p => {
        let dispPrice = p.salePrice || p.originalPrice || 0;
        html += `<option value="${p.id}">${p.title} ($${dispPrice.toFixed(2)})</option>`;
    });

    const aiSelect = document.getElementById('ai-product-select');
    if (aiSelect) aiSelect.innerHTML = html;

    const blastSelect = document.getElementById('blast-product-select');
    if (blastSelect) blastSelect.innerHTML = html;
}

window.deleteAiPrompt = async function (index) {
    if (confirm('Are you sure you want to delete this custom AI response?')) {
        let prompts = JSON.parse(localStorage.getItem('tonka_ai_prompts') || '[]');
        prompts.splice(index, 1);
        localStorage.setItem('tonka_ai_prompts', JSON.stringify(prompts));
        await renderAiPrompts();
    }
};

// Initial Renders
renderTable();
renderCustomers();
renderOrders();
renderReviews();
renderAiPrompts();
renderAiProductOptions();
renderAiPrompts();

// --- Countdown Logic ---
function loadCountdownConfig() {
    const configStr = localStorage.getItem('tonka_countdown_config');
    if (configStr) {
        const config = JSON.parse(configStr);
        const titleInput = document.getElementById('cd-title-input');
        const dtInput = document.getElementById('cd-datetime');
        const activeSelect = document.getElementById('cd-active');

        if (titleInput) titleInput.value = config.title || '';
        if (dtInput) dtInput.value = config.endTime || '';
        if (activeSelect) activeSelect.value = config.active ? 'true' : 'false';

        const autoEmail = document.getElementById('cd-auto-email');
        const emailSubj = document.getElementById('cd-email-subject');
        const emailBody = document.getElementById('cd-email-body');
        if (autoEmail) autoEmail.checked = !!config.autoEmail;
        if (emailSubj) emailSubj.value = config.emailSubject || '';
        if (emailBody) emailBody.value = config.emailBody || '';
    }
}

window.saveCountdownConfig = function () {
    const titleInput = document.getElementById('cd-title-input').value.trim();
    const dtInput = document.getElementById('cd-datetime').value;
    const activeSelect = document.getElementById('cd-active').value === 'true';

    if (!titleInput || !dtInput) {
        alert("Please provide both a Title and a Target Date/Time.");
        return;
    }

    // Validate datetime
    if (new Date(dtInput).getTime() < new Date().getTime()) {
        alert("Target time must be in the future!");
        return;
    }

    const existingStr = localStorage.getItem('tonka_countdown_config');
    let existingConfig = {};
    if (existingStr) existingConfig = JSON.parse(existingStr);

    let isNewTimer = (existingConfig.endTime !== dtInput);

    const autoEmail = document.getElementById('cd-auto-email') ? document.getElementById('cd-auto-email').checked : false;
    const emailSubject = document.getElementById('cd-email-subject') ? document.getElementById('cd-email-subject').value.trim() : '';
    const emailBody = document.getElementById('cd-email-body') ? document.getElementById('cd-email-body').value.trim() : '';

    const config = {
        title: titleInput,
        endTime: dtInput,
        active: activeSelect,
        autoEmail: autoEmail,
        emailSubject: emailSubject,
        emailBody: emailBody,
        emailsSent: isNewTimer ? false : (existingConfig.emailsSent || false)
    };

    localStorage.setItem('tonka_countdown_config', JSON.stringify(config));
    alert("Countdown settings saved successfully!");
};

loadCountdownConfig();

// --- Mass Email Blast Logic ---
window.toggleBlastSelection = function (type) {
    const container = document.getElementById('blast-specific-container');
    if (type === 'all') {
        container.style.display = 'none';
    } else {
        container.style.display = 'block';
        renderBlastCustomers();
    }
};

function renderBlastCustomers() {
    const container = document.getElementById('blast-specific-container');
    const rawCustomers = JSON.parse(localStorage.getItem('tonka_customers') || '[]');
    const validCustomers = rawCustomers.filter(c => c.email && c.email.includes('@') && !c.email.includes('example.com'));

    const uniqueEmails = new Set();
    const finalRecipients = [];
    validCustomers.forEach(c => {
        if (!uniqueEmails.has(c.email)) {
            uniqueEmails.add(c.email);
            finalRecipients.push(c);
        }
    });

    if (finalRecipients.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); margin:0;">No verified customers found.</p>';
        return;
    }

    let html = `
    <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
        <span style="font-weight:600;">Select Customers (${finalRecipients.length} available)</span>
        <label style="cursor:pointer; display:flex; align-items:center; gap:4px; font-size:0.85rem; color:#00ff00;">
            <input type="checkbox" id="blast-select-all-cb" checked onchange="window.toggleAllBlastCheckboxes(this)" style="accent-color:var(--primary-color);"> Select All
        </label>
    </div>
    <div style="display:grid; gap:8px;">`;

    finalRecipients.forEach((c) => {
        html += `
            <label style="display:flex; align-items:center; gap:12px; cursor:pointer; padding:8px; background:rgba(255,255,255,0.02); border-radius:4px; transition: background 0.2s;">
                <input type="checkbox" class="blast-customer-cb" value="${c.email}" checked style="width:16px; height:16px; accent-color:var(--primary-color);">
                <div>
                    <div style="font-weight:600; font-size:0.9rem;">${c.fullName || 'Customer'}</div>
                    <div style="color:var(--text-secondary); font-size:0.8rem;">${c.email}</div>
                </div>
            </label>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

window.toggleAllBlastCheckboxes = function (masterCb) {
    const cbs = document.querySelectorAll('.blast-customer-cb');
    cbs.forEach(cb => cb.checked = masterCb.checked);
};

window.sendMassEmail = async function (event) {
    event.preventDefault();
    if (typeof emailjs === 'undefined') {
        alert("EmailJS is not configured or loaded. Cannot send mass emails.");
        return;
    }

    const btn = document.getElementById('blast-send-btn');
    const btnText = document.getElementById('blast-btn-text');
    const originalText = btnText.innerText;

    const subject = document.getElementById('blast-subject').value.trim();
    const messageBody = document.getElementById('blast-message').value.trim();

    const targetEl = document.querySelector('input[name="blastTarget"]:checked');
    const targetType = targetEl ? targetEl.value : 'all';

    const rawCustomers = JSON.parse(localStorage.getItem('tonka_customers') || '[]');
    const validCustomers = rawCustomers.filter(c => c.email && c.email.includes('@') && !c.email.includes('example.com'));

    const uniqueEmails = new Set();
    let finalRecipients = [];
    validCustomers.forEach(c => {
        if (!uniqueEmails.has(c.email)) {
            uniqueEmails.add(c.email);
            finalRecipients.push(c);
        }
    });

    if (targetType === 'specific') {
        const checkedBoxes = Array.from(document.querySelectorAll('.blast-customer-cb:checked')).map(cb => cb.value);
        if (checkedBoxes.length === 0) {
            alert("Please select at least one customer, or switch to 'All Customers'.");
            return;
        }
        finalRecipients = finalRecipients.filter(c => checkedBoxes.includes(c.email));
    }

    if (finalRecipients.length === 0) {
        alert("No valid customers found to email in the database.");
        return;
    }

    if (confirm(`Are you sure you want to send this email blast to ${finalRecipients.length} customer(s)?\n\nSubject: ${subject}`)) {
        btn.disabled = true;
        btnText.innerText = `Sending (0/${finalRecipients.length})...`;
        let sentCount = 0;
        let errors = 0;

        const mediaUrl = document.getElementById('blast-media').value.trim();
        const productId = document.getElementById('blast-product-select').value;
        const btnLinkText = document.getElementById('blast-link-text').value.trim() || 'Visit Link';
        const btnUrl = document.getElementById('blast-link-url').value.trim();

        const formattedMessage = messageBody.replace(/\n/g, '<br>');

        let htmlPayload = `<div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">`;
        htmlPayload += `<div>${formattedMessage}</div>`;

        if (mediaUrl) {
            htmlPayload += `<div style="margin-top: 24px; text-align: center;"><img src="${mediaUrl}" alt="Media Attachment" style="max-width: 100%; border-radius: 8px;"></div>`;
        }

        if (productId) {
            const products = await getProducts();
            const prod = products.find(p => String(p.id) === String(productId));
            if (prod) {
                let dispPrice = prod.salePrice || prod.originalPrice || 0;
                const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', '');

                htmlPayload += `
                    <div style="margin-top: 32px; padding: 20px; border: 1px solid #ddd; border-radius: 12px; text-align: center; background: #fafafa;">
                        <img src="${prod.image}" alt="${prod.title}" style="max-width: 250px; border-radius: 6px; margin-bottom: 16px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700;">${prod.title}</h3>
                        <div style="font-weight: 800; color: #000; font-size: 18px; margin-bottom: 24px;">$${Number(dispPrice).toFixed(2)}</div>
                        <a href="${baseUrl}product.html?id=${prod.id}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Product</a>
                    </div>
                `;
            }
        }

        if (btnUrl) {
            htmlPayload += `
                <div style="margin-top: 40px; text-align: center;">
                    <a href="${btnUrl}" style="display: inline-block; padding: 14px 28px; background: #270082; color: #fff; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">${btnLinkText}</a>
                </div>
            `;
        }

        htmlPayload += `</div>`;

        finalRecipients.forEach(c => {
            emailjs.send("service_nrvlrb7", "template_afw7f64", {
                to_email: c.email,
                reply_to: "cheaplugz@gmail.com",
                subject: subject,
                html_message: htmlPayload
            }).then(() => {
                sentCount++;
                checkDone();
            }).catch(err => {
                console.error("Failed sending to", c.email, err);
                errors++;
                checkDone();
            });
        });

        function checkDone() {
            btnText.innerText = `Sending (${sentCount + errors}/${finalRecipients.length})...`;
            if (sentCount + errors === finalRecipients.length) {
                alert(`Mass email blast complete!\n\nSent: ${sentCount}\nErrors: ${errors}`);
                btn.disabled = false;
                btnText.innerText = originalText;
                document.getElementById('blast-subject').value = '';
                document.getElementById('blast-message').value = '';
                document.getElementById('blast-media').value = '';
                document.getElementById('blast-product-select').value = '';
                document.getElementById('blast-link-text').value = '';
                document.getElementById('blast-link-url').value = '';
            }
        }
    }
};

// --- Review Requests Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const autoReviewToggle = document.getElementById('global-auto-review-toggle');
    if (autoReviewToggle) {
        autoReviewToggle.checked = localStorage.getItem('tonka_auto_review') === 'true';
    }
});

window.saveAutoReviewConfig = function (e) {
    localStorage.setItem('tonka_auto_review', e.target.checked);
    if (e.target.checked) {
        alert("Automated review requests enabled! Customers will receive an email automatically after placing an order.");
    } else {
        alert("Automated review requests disabled.");
    }
};

window.sendManualReviewRequest = function (e) {
    e.preventDefault();
    const email = document.getElementById('manual-review-email').value.trim();
    if (!email) return;

    const subject = "We'd love to hear your thoughts!";
    const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; text-align:center;">
            <img src="https://i.imgur.com/gO0wQ6Y.png" alt="Cheap Plugz Logo" style="height:60px; margin-bottom:24px;">
            <h2 style="margin-bottom: 24px;">How did we do?</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 24px; line-height:1.5;">Thank you for shopping at Cheap Plugz! We'd love it if you could take a moment to leave a review of your recent purchase. Your feedback helps us improve and helps other customers make better decisions.</p>
            <a href="${window.location.origin}/product.html" style="background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size:16px;">Leave a Review</a>
        </div>
    `;

    if (typeof emailjs !== 'undefined') {
        const serviceID = "service_nrvlrb7";
        const templateID = "template_afw7f64";

        emailjs.send(serviceID, templateID, {
            to_email: email,
            reply_to: "cheaplugz@gmail.com",
            subject: subject,
            html_message: htmlMessage
        }).then(() => {
            alert('Review request sent to ' + email + ' via EmailJS!');
            document.getElementById('manual-review-request-form').reset();
        }).catch(err => {
            console.error("EmailJS Error: ", err);
            alert('EmailJS is not configured yet. Review request simulated to ' + email + '!');
            document.getElementById('manual-review-request-form').reset();
        });
    } else {
        alert('Review request simulated to ' + email + '!');
        document.getElementById('manual-review-request-form').reset();
    }
};
