// Cart Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    renderCart();
});

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    
    if (!cartItems) return;
    
    const cart = getCart();
    
    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartContent) cartContent.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'grid';
    
    cartItems.innerHTML = cart.map((item, index) => `
        <tr>
            <td>
                <div class="cart-product">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-product-info">
                        <h4>${item.name}</h4>
                        ${item.size !== 'Default' ? `<p>Size: ${item.size}</p>` : ''}
                        ${item.color !== 'Default' ? `<p>Color: ${item.color}</p>` : ''}
                    </div>
                </div>
            </td>
            <td>Rs. ${item.price.toLocaleString()}</td>
            <td>
                <div class="quantity-selector">
                    <button class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" readonly>
                    <button class="qty-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                </div>
            </td>
            <td>Rs. ${(item.price * item.quantity).toLocaleString()}</td>
            <td>
                <button class="remove-item" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    updateCartSummary();
}

function updateCartSummary() {
    const { subtotal, shipping, total } = calculateTotal();
    
    const subtotalEl = document.getElementById('cartSubtotal');
    const shippingEl = document.getElementById('cartShipping');
    const totalEl = document.getElementById('cartTotal');
    
    if (subtotalEl) subtotalEl.textContent = 'Rs. ' + subtotal.toLocaleString();
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : 'Rs. ' + shipping.toLocaleString();
    if (totalEl) totalEl.textContent = 'Rs. ' + total.toLocaleString();
    
    // Disable checkout if cart is empty
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = getCart().length === 0;
    }
}

// Clear cart button
document.getElementById('clearCart')?.addEventListener('click', clearCart);