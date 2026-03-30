// Aura Studio - Main JavaScript
// © 2026 Aura Studio

const API_URL = 'http://localhost:5000/api';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initCart();
    loadCategories();
    updateCartCount();
    initBackToTop();
    initSearchToggle();
    initMobileMenu();
});

// Navigation
function initNavigation() {
    const nav = document.querySelector('.nav-menu');
    const links = nav.querySelectorAll('a');
    
    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add('active');
        }
    });
}

// Mobile Menu
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const sidebar = document.getElementById('shopSidebar');
    const filterToggle = document.getElementById('filterToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    if (filterToggle && sidebar) {
        filterToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }
    
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (navMenu && !navMenu.contains(e.target) && !menuBtn?.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
}

// Search Toggle
function initSearchToggle() {
    const searchToggle = document.getElementById('searchToggle');
    const searchBar = document.getElementById('searchBar');
    
    if (searchToggle && searchBar) {
        searchToggle.addEventListener('click', (e) => {
            e.preventDefault();
            searchBar.classList.toggle('active');
            if (searchBar.classList.contains('active')) {
                searchBar.querySelector('input').focus();
            }
        });
    }
}

// Cart Management
let cart = JSON.parse(localStorage.getItem('aura_cart')) || [];

function initCart() {
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.clearCart = clearCart;
}

function addToCart(product) {
    const existingItem = cart.find(item => 
        item.id === product.id && 
        item.size === product.size && 
        item.color === product.color
    );
    
    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }
    
    saveCart();
    updateCartCount();
    showNotification('Product added to cart!');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    renderCart();
}

function updateQuantity(index, quantity) {
    if (quantity <= 0) {
        removeFromCart(index);
        return;
    }
    cart[index].quantity = quantity;
    saveCart();
    updateCartCount();
    renderCart();
}

function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        updateCartCount();
        renderCart();
    }
}

function saveCart() {
    localStorage.setItem('aura_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const countElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    countElements.forEach(el => el.textContent = totalItems);
}

function getCart() {
    return cart;
}

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 200;
    return { subtotal, shipping, total: subtotal + shipping };
}

// Load Categories
async function loadCategories() {
    const dropdowns = document.querySelectorAll('#categoryDropdown');
    const footerCategories = document.getElementById('footerCategories');
    const filterCategories = document.getElementById('filterCategories');
    const categoriesGrid = document.getElementById('categoriesGrid');
    
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        // Header dropdown
        dropdowns.forEach(dropdown => {
            if (dropdown) {
                categories.forEach(cat => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="products.html?category=${cat.slug}">${cat.name}</a>`;
                    dropdown.appendChild(li);
                });
            }
        });
        
        // Footer categories
        if (footerCategories) {
            footerCategories.innerHTML = categories.map(cat => 
                `<li><a href="products.html?category=${cat.slug}">${cat.name}</a></li>`
            ).join('');
        }
        
        // Filter categories
        if (filterCategories) {
            categories.forEach(cat => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <label>
                        <input type="radio" name="category" value="${cat.slug}">
                        <span>${cat.name}</span>
                    </label>
                `;
                filterCategories.appendChild(li);
            });
        }
        
        // Categories grid on homepage
        if (categoriesGrid) {
            categoriesGrid.innerHTML = categories.map(cat => `
                <a href="products.html?category=${cat.slug}" class="category-card">
                    <img src="${cat.image || 'images/category-placeholder.jpg'}" alt="${cat.name}">
                    <div class="category-info">
                        <h3>${cat.name}</h3>
                        <p>${cat.description || 'Explore Collection'}</p>
                    </div>
                </a>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Back to Top
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility Functions
function formatPrice(price) {
    return 'Rs. ' + price.toLocaleString('en-PK');
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Hero Slider
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.querySelector('.hero-dots');
    let currentSlide = 0;
    
    if (slides.length === 0) return;
    
    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'hero-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    const dots = document.querySelectorAll('.hero-dot');
    
    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }
    
    function nextSlide() {
        goToSlide((currentSlide + 1) % slides.length);
    }
    
    function prevSlide() {
        goToSlide((currentSlide - 1 + slides.length) % slides.length);
    }
    
    document.querySelector('.hero-next')?.addEventListener('click', nextSlide);
    document.querySelector('.hero-prev')?.addEventListener('click', prevSlide);
    
    setInterval(nextSlide, 5000);
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!');
    });
}

// Initialize hero slider if on homepage
if (document.querySelector('.hero-slider')) {
    initHeroSlider();
}