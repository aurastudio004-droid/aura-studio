// Checkout Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadOrderSummary();
    initPaymentMethods();
    initFileUpload();
    initForm();
});

function loadOrderSummary() {
    const cart = getCart();
    const container = document.getElementById('orderItems');
    
    if (!container || cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="order-item-info">
                <h4>${item.name}</h4>
                <p>Qty: ${item.quantity}</p>
                ${item.size !== 'Default' ? `<p>Size: ${item.size}</p>` : ''}
            </div>
            <div class="order-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `).join('');
    
    const { subtotal, shipping, total } = calculateTotal();
    
    document.getElementById('orderSubtotal').textContent = 'Rs. ' + subtotal.toLocaleString();
    document.getElementById('orderShipping').textContent = shipping === 0 ? 'FREE' : 'Rs. ' + shipping.toLocaleString();
    document.getElementById('orderTotal').textContent = 'Rs. ' + total.toLocaleString();
}

function initPaymentMethods() {
    const paymentOptions = document.querySelectorAll('input[name="paymentMethod"]');
    const paymentDetails = document.getElementById('paymentDetails');
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', () => {
            const method = option.value;
            paymentDetails.style.display = 'block';
            
            // Hide all info cards
            document.getElementById('easypaisaInfo').style.display = 'none';
            document.getElementById('jazzcashInfo').style.display = 'none';
            document.getElementById('bankInfo').style.display = 'none';
            
            // Show selected
            document.getElementById(method + 'Info').style.display = 'block';
        });
    });
}

function initFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('paymentScreenshot');
    const preview = document.getElementById('uploadPreview');
    const previewImg = document.getElementById('previewImage');
    const removeBtn = document.getElementById('removeImage');
    
    if (!fileInput) return;
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
                uploadArea.querySelector('.upload-placeholder').style.display = 'none';
                uploadArea.classList.add('has-file');
            };
            reader.readAsDataURL(file);
        }
    });
    
    removeBtn?.addEventListener('click', () => {
        fileInput.value = '';
        preview.style.display = 'none';
        uploadArea.querySelector('.upload-placeholder').style.display = 'block';
        uploadArea.classList.remove('has-file');
    });
    
    // Drag and drop
    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });
    
    uploadArea?.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });
    
    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
}

function initForm() {
    const form = document.getElementById('checkoutForm');
    
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cart = getCart();
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        const formData = new FormData(form);
        
        // Add cart items
        const items = cart.map(item => ({
            product: item.id,
            productName: item.name,
            productImage: item.image,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            subtotal: item.price * item.quantity
        }));
        
        formData.append('items', JSON.stringify(items));
        
        const { subtotal, shipping, total } = calculateTotal();
        formData.append('subtotal', subtotal);
        formData.append('shippingCost', shipping);
        formData.append('total', total);
        
        const submitBtn = document.getElementById('placeOrderBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear cart
                localStorage.removeItem('aura_cart');
                updateCartCount();
                
                // Show success modal
                document.getElementById('successOrderNumber').textContent = data.order.orderNumber;
                document.getElementById('orderSuccessModal').classList.add('active');
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            alert('Error placing order: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order';
        }
    });
}

// Copy to clipboard function for checkout page
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Account number copied!');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Account number copied!');
    });
}