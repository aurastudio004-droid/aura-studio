// ===================================
// AURA STUDIO - ADMIN PANEL JAVASCRIPT
// © 2026 Aura Studio
// ===================================

const API_URL = 'http://localhost:5000/api';

// Check Authentication
document.addEventListener('DOMContentLoaded', function() {
    // Skip auth check for login page
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load admin info
    const admin = JSON.parse(localStorage.getItem('admin_user') || '{}');
    const adminNameElements = document.querySelectorAll('#adminName');
    adminNameElements.forEach(el => {
        el.textContent = admin.name || 'Admin';
    });
    
    // Initialize sidebar
    initSidebar();
    
    // Initialize logout
    initLogout();
});

// Sidebar Toggle
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobileSidebarToggle');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    // Mobile toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Close button inside sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (!sidebar.contains(e.target) && !mobileToggle?.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

// Logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                window.location.href = 'login.html';
            }
        });
    }
}

// API Helper Functions
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('admin_token');
    
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    
    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData)) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'login.html';
        return;
    }
    
    return response;
}

// Format Price
function formatPrice(price) {
    return 'Rs. ' + Number(price).toLocaleString('en-PK');
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format DateTime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Confirm Dialog
function confirmDialog(message) {
    return confirm(message);
}

// Handle Image Preview
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', function(e) {
        preview.innerHTML = '';
        
        Array.from(e.target.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'image-preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-preview" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                preview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });
}

// Handle Form Validation
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    
    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    
    for (const [field, validation] of Object.entries(rules)) {
        const input = form.querySelector(`[name="${field}"]`);
        if (!input) continue;
        
        let value = input.value.trim();
        let error = '';
        
        if (validation.required && !value) {
            error = validation.message || 'This field is required';
        } else if (validation.min && value.length < validation.min) {
            error = `Minimum ${validation.min} characters required`;
        } else if (validation.email && value && !isValidEmail(value)) {
            error = 'Please enter a valid email address';
        } else if (validation.number && value && isNaN(value)) {
            error = 'Please enter a valid number';
        }
        
        if (error) {
            isValid = false;
            input.classList.add('input-error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = error;
            input.parentNode.appendChild(errorDiv);
        }
    }
    
    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global use
window.API_URL = API_URL;
window.apiRequest = apiRequest;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.showNotification = showNotification;
window.confirmDialog = confirmDialog;
window.setupImagePreview = setupImagePreview;
window.validateForm = validateForm;
window.debounce = debounce;