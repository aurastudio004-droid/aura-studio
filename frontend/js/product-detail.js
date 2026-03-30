// Product Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadProductDetail();
    initTabs();
});

let currentProduct = null;
let selectedSize = null;
let selectedColor = null;
let quantity = 1;

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
        window.location.href = 'products.html';
        return;
    }
    
    const container = document.getElementById('productDetail');
    const loading = document.getElementById('loading');
    
    try {
        const response = await fetch(`${API_URL}/products/slug/${slug}`);
        const product = await response.json();
        currentProduct = product;
        
        // Hide loading, show template
        if (loading) loading.style.display = 'none';
        
        renderProduct(product);
        loadRelatedProducts(product._id);
        
    } catch (error) {
        console.error('Error loading product:', error);
        container.innerHTML = '<p class="error">Product not found</p>';
    }
}

function renderProduct(product) {
    const template = document.getElementById('productTemplate');
    const container = document.getElementById('productDetail');
    
    // Clone template
    const content = template.content.cloneNode(true);
    
    // Set content
    content.getElementById('productTitle').textContent = product.name;
    content.getElementById('productCategory').textContent = product.category?.name || '';
    document.getElementById('productBreadcrumb').textContent = product.name;
    
    // Price
    const priceContainer = content.getElementById('productPrice');
    const hasDiscount = product.salePrice > 0 && product.salePrice < product.price;
    priceContainer.innerHTML = `
        <span class="current-price">Rs. ${hasDiscount ? product.salePrice : product.price}</span>
        ${hasDiscount ? `<span class="original-price">Rs. ${product.price}</span><span class="discount-percent">-${Math.round(((product.price - product.salePrice) / product.price) * 100)}%</span>` : ''}
    `;
    
    // Description
    content.getElementById('productDescription').textContent = product.description.substring(0, 200) + '...';
    document.getElementById('fullDescription').innerHTML = product.description.replace(/\n/g, '<br>');
    
    // Images
    const mainImage = content.getElementById('mainImage');
    const thumbnails = content.getElementById('thumbnails');
    
    if (product.images && product.images.length > 0) {
        mainImage.src = product.images[0];
        mainImage.alt = product.name;
        
        product.images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img;
            thumb.alt = product.name;
            thumb.className = index === 0 ? 'active' : '';
            thumb.onclick = () => changeImage(img, thumb);
            thumbnails.appendChild(thumb);
        });
    } else {
        mainImage.src = 'images/product-placeholder.jpg';
    }
    
    // Sizes
    const sizeOptions = content.getElementById('sizeOptions');
    if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach(size => {
            const label = document.createElement('label');
            label.className = 'size-option';
            label.innerHTML = `
                <input type="radio" name="size" value="${size}" onchange="selectSize('${size}')">
                <span>${size}</span>
            `;
            sizeOptions.appendChild(label);
        });
    } else {
        content.getElementById('sizeGroup').style.display = 'none';
    }
    
    // Colors
    const colorOptions = content.getElementById('colorOptions');
    if (product.colors && product.colors.length > 0) {
        product.colors.forEach(color => {
            const label = document.createElement('label');
            label.className = 'color-option';
            label.innerHTML = `
                <input type="radio" name="color" value="${color.name}" onchange="selectColor('${color.name}')">
                <span style="background-color: ${color.code}" title="${color.name}"></span>
            `;
            colorOptions.appendChild(label);
        });
    } else {
        content.getElementById('colorGroup').style.display = 'none';
    }
    
    // Stock
    const stockEl = content.getElementById('productStock');
    if (product.stock > 0) {
        stockEl.innerHTML = `<i class="fas fa-check-circle"></i> In Stock (${product.stock} available)`;
    } else {
        stockEl.innerHTML = `<i class="fas fa-times-circle"></i> Out of Stock`;
        stockEl.classList.add('out-of-stock');
        content.getElementById('addToCart').disabled = true;
        content.getElementById('buyNow').disabled = true;
    }
    
    // Meta
    content.getElementById('productSku').textContent = product.slug.toUpperCase();
    content.getElementById('productFabric').textContent = product.fabric || 'Premium Quality';
    content.getElementById('productCat').textContent = product.category?.name || '';
    
    // Quantity
    const qtyInput = content.getElementById('quantity');
    content.getElementById('qtyMinus').onclick = () => updateQty(-1);
    content.getElementById('qtyPlus').onclick = () => updateQty(1);
    
    function updateQty(change) {
        let newVal = parseInt(qtyInput.value) + change;
        if (newVal < 1) newVal = 1;
        if (newVal > product.stock) newVal = product.stock;
        qtyInput.value = newVal;
        quantity = newVal;
    }
    
    qtyInput.onchange = () => {
        quantity = parseInt(qtyInput.value) || 1;
    };
    
    // Buttons
    content.getElementById('addToCart').onclick = () => addToCartDetail();
    content.getElementById('buyNow').onclick = () => {
        addToCartDetail();
        window.location.href = 'checkout.html';
    };
    
    // Badges
    const badgesContainer = content.querySelector('.product-badges');
    if (product.isNewArrival) badgesContainer.innerHTML += '<span class="product-badge badge-new">New Arrival</span>';
    if (product.isFeatured) badgesContainer.innerHTML += '<span class="product-badge badge-featured">Featured</span>';
    if (product.isBestSeller) badgesContainer.innerHTML += '<span class="product-badge badge-bestseller">Best Seller</span>';
    
    container.innerHTML = '';
    container.appendChild(content);
}

function changeImage(src, thumb) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.thumbnail-images img').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

function selectSize(size) {
    selectedSize = size;
}

function selectColor(color) {
    selectedColor = color;
}

function addToCartDetail() {
    if (!currentProduct) return;
    
    if (currentProduct.sizes?.length > 0 && !selectedSize) {
        alert('Please select a size');
        return;
    }
    
    if (currentProduct.colors?.length > 0 && !selectedColor) {
        alert('Please select a color');
        return;
    }
    
    const product = {
        id: currentProduct._id,
        name: currentProduct.name,
        price: currentProduct.salePrice > 0 ? currentProduct.salePrice : currentProduct.price,
        image: currentProduct.images?.[0] || 'images/product-placeholder.jpg',
        quantity: quantity,
        size: selectedSize || 'Default',
        color: selectedColor || 'Default'
    };
    
    addToCart(product);
}

async function loadRelatedProducts(productId) {
    const container = document.getElementById('relatedProducts');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/products/related/${productId}`);
        const products = await response.json();
        
        container.innerHTML = products.map(product => {
            const image = product.images?.[0] || 'images/product-placeholder.jpg';
            return `
                <div class="product-card">
                    <div class="product-image">
                        <a href="product-detail.html?slug=${product.slug}">
                            <img src="${image}" alt="${product.name}">
                        </a>
                    </div>
                    <div class="product-info">
                        <h3 class="product-title"><a href="product-detail.html?slug=${product.slug}">${product.name}</a></h3>
                        <div class="product-price">
                            <span class="current-price">Rs. ${product.salePrice || product.price}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}