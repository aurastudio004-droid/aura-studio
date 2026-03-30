// Products Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    initFilters();
    initSorting();
    initViewToggle();
});

let currentPage = 1;
let currentFilters = {};

async function loadProducts(page = 1) {
    const grid = document.getElementById('productsGrid');
    const loading = document.getElementById('loading');
    const noProducts = document.getElementById('noProducts');
    const pagination = document.getElementById('pagination');
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');
    const featured = urlParams.get('featured');
    const newArrivals = urlParams.get('newArrivals');
    const bestSeller = urlParams.get('bestSeller');
    const sort = urlParams.get('sort') || document.getElementById('sortBy')?.value || 'newest';
    
    // Update page title
    updatePageTitle({ category, search, featured, newArrivals, bestSeller });
    
    // Show loading
    if (loading) loading.style.display = 'block';
    if (noProducts) noProducts.style.display = 'none';
    if (grid) grid.style.display = 'none';
    
    try {
        let url = `${API_URL}/products?page=${page}&limit=12&sort=${sort}`;
        
        if (category) url += `&category=${category}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (featured) url += `&featured=true`;
        if (newArrivals) url += `&newArrivals=true`;
        if (bestSeller) url += `&bestSeller=true`;
        
        // Add price filters
        const minPrice = document.getElementById('minPrice')?.value;
        const maxPrice = document.getElementById('maxPrice')?.value;
        if (minPrice) url += `&minPrice=${minPrice}`;
        if (maxPrice) url += `&maxPrice=${maxPrice}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (loading) loading.style.display = 'none';
        
        if (data.products.length === 0) {
            if (noProducts) noProducts.style.display = 'block';
            if (pagination) pagination.innerHTML = '';
            return;
        }
        
        if (grid) {
            grid.style.display = 'grid';
            grid.innerHTML = data.products.map(product => createProductCard(product)).join('');
        }
        
        // Update product count
        const countElement = document.getElementById('productCount');
        if (countElement) countElement.textContent = `${data.total} Products`;
        
        // Render pagination
        renderPagination(data.page, data.pages);
        
    } catch (error) {
        console.error('Error loading products:', error);
        if (loading) loading.style.display = 'none';
    }
}

function createProductCard(product) {
    const hasDiscount = product.salePrice > 0 && product.salePrice < product.price;
    const discountPercent = hasDiscount ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
    
    let badges = '';
    if (product.isNewArrival) badges += '<span class="product-badge badge-new">New</span>';
    if (hasDiscount) badges += `<span class="product-badge badge-sale">-${discountPercent}%</span>`;
    if (product.isFeatured) badges += '<span class="product-badge badge-featured">Featured</span>';
    if (product.isBestSeller) badges += '<span class="product-badge badge-bestseller">Best Seller</span>';
    
    const image = product.images && product.images.length > 0 ? product.images[0] : 'images/product-placeholder.jpg';
    
    return `
        <div class="product-card">
            <div class="product-image">
                <a href="product-detail.html?slug=${product.slug}">
                    <img src="${image}" alt="${product.name}" loading="lazy">
                </a>
                <div class="product-badges">
                    ${badges}
                </div>
                <div class="product-actions">
                    <button class="product-action-btn" onclick="quickView('${product._id}')" title="Quick View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="product-action-btn" onclick="addToCartFromListing('${product._id}', '${product.name}', ${hasDiscount ? product.salePrice : product.price}, '${image}')" title="Add to Cart">
                        <i class="fas fa-shopping-bag"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category?.name || 'Uncategorized'}</div>
                <h3 class="product-title">
                    <a href="product-detail.html?slug=${product.slug}">${product.name}</a>
                </h3>
                <div class="product-price">
                    <span class="current-price">Rs. ${hasDiscount ? product.salePrice : product.price}</span>
                    ${hasDiscount ? `<span class="original-price">Rs. ${product.price}</span>` : ''}
                </div>
                <button class="add-to-cart-btn" onclick="addToCartFromListing('${product._id}', '${product.name}', ${hasDiscount ? product.salePrice : product.price}, '${image}')">
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

function addToCartFromListing(id, name, price, image) {
    const product = {
        id: id,
        name: name,
        price: price,
        image: image,
        quantity: 1,
        size: 'M', // Default size
        color: 'Default'
    };
    addToCart(product);
}

function updatePageTitle(filters) {
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
    
    let title = 'Our Products';
    
    if (filters.search) title = `Search: ${filters.search}`;
    else if (filters.category) title = filters.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    else if (filters.featured) title = 'Featured Products';
    else if (filters.newArrivals) title = 'New Arrivals';
    else if (filters.bestSeller) title = 'Best Sellers';
    
    if (pageTitle) pageTitle.textContent = title;
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;
}

function renderPagination(current, total) {
    const pagination = document.getElementById('pagination');
    if (!pagination || total <= 1) return;
    
    let html = '';
    
    // Previous
    html += `<button class="page-btn" onclick="loadProducts(${current - 1})" ${current === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
            html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadProducts(${i})">${i}</button>`;
        } else if (i === current - 2 || i === current + 2) {
            html += `<span>...</span>`;
        }
    }
    
    // Next
    html += `<button class="page-btn" onclick="loadProducts(${current + 1})" ${current === total ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    pagination.innerHTML = html;
}

function initFilters() {
    // Category filters
    const categoryInputs = document.querySelectorAll('input[name="category"]');
    categoryInputs.forEach(input => {
        input.addEventListener('change', () => {
            const value = input.value;
            if (value) {
                window.location.href = `products.html?category=${value}`;
            } else {
                window.location.href = 'products.html';
            }
        });
    });
    
    // Price filter
    const applyPriceBtn = document.getElementById('applyPrice');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', () => {
            loadProducts(1);
        });
    }
    
    // Clear filters
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            window.location.href = 'products.html';
        });
    }
}

function initSorting() {
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            loadProducts(1);
        });
    }
}

function initViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const grid = document.getElementById('productsGrid');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            if (grid) {
                if (view === 'list') {
                    grid.style.gridTemplateColumns = '1fr';
                } else {
                    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
                }
            }
        });
    });
}

function quickView(productId) {
    // Implement quick view modal
    alert('Quick view for product: ' + productId);
}