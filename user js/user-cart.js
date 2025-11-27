// user-cart.js - Shopping cart management

const CART_KEY = 'cart';
const WISHLIST_KEY = 'wishlist';

// Get cart from localStorage
export function getCart() {
    try {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error('Error getting cart:', error);
        return [];
    }
}

// Save cart to localStorage
export function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
        return true;
    } catch (error) {
        console.error('Error saving cart:', error);
        return false;
    }
}

// Add item to cart
export function addToCart(productId, productName, price, quantity = 1, productData = {}) {
    try {
        let cart = getCart();
        
        // Check if item already exists
        const existingIndex = cart.findIndex(item => item.id === productId);
        
        if (existingIndex !== -1) {
            // Update quantity if item exists
            cart[existingIndex].quantity += quantity;
        } else {
            // Add new item
            cart.push({
                id: productId,
                name: productName,
                price: price,
                quantity: quantity,
                addedAt: new Date().toISOString(),
                ...productData
            });
        }
        
        saveCart(cart);
        
        return {
            success: true,
            message: 'Produk ditambahkan ke keranjang',
            cart: cart
        };
    } catch (error) {
        console.error('Error adding to cart:', error);
        return {
            success: false,
            message: 'Gagal menambahkan ke keranjang'
        };
    }
}

// Remove item from cart
export function removeFromCart(productId) {
    try {
        let cart = getCart();
        cart = cart.filter(item => item.id !== productId);
        saveCart(cart);
        
        return {
            success: true,
            message: 'Produk dihapus dari keranjang',
            cart: cart
        };
    } catch (error) {
        console.error('Error removing from cart:', error);
        return {
            success: false,
            message: 'Gagal menghapus dari keranjang'
        };
    }
}

// Update item quantity
export function updateQuantity(productId, newQuantity) {
    try {
        let cart = getCart();
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex !== -1) {
            if (newQuantity <= 0) {
                // Remove item if quantity is 0 or less
                return removeFromCart(productId);
            } else {
                cart[itemIndex].quantity = newQuantity;
                saveCart(cart);
                
                return {
                    success: true,
                    message: 'Jumlah diperbarui',
                    cart: cart
                };
            }
        }
        
        return {
            success: false,
            message: 'Produk tidak ditemukan'
        };
    } catch (error) {
        console.error('Error updating quantity:', error);
        return {
            success: false,
            message: 'Gagal memperbarui jumlah'
        };
    }
}

// Clear entire cart
export function clearCart() {
    try {
        localStorage.removeItem(CART_KEY);
        updateCartBadge();
        
        return {
            success: true,
            message: 'Keranjang dikosongkan'
        };
    } catch (error) {
        console.error('Error clearing cart:', error);
        return {
            success: false,
            message: 'Gagal mengosongkan keranjang'
        };
    }
}

// Get cart total
export function getCartTotal() {
    const cart = getCart();
    
    const subtotal = cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    const itemCount = cart.reduce((count, item) => {
        return count + item.quantity;
    }, 0);
    
    // Calculate shipping (example: free shipping over 200000)
    const shipping = subtotal >= 200000 ? 0 : 15000;
    
    // Calculate discount (can be customized)
    const discount = 0;
    
    const total = subtotal + shipping - discount;
    
    return {
        subtotal: subtotal,
        shipping: shipping,
        discount: discount,
        total: total,
        itemCount: itemCount
    };
}

// Update cart badge count
export function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const badges = document.querySelectorAll('.cart-badge, #cartCount');
    badges.forEach(badge => {
        badge.textContent = totalItems;
    });
}

// Get item count in cart
export function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

// Check if product is in cart
export function isInCart(productId) {
    const cart = getCart();
    return cart.some(item => item.id === productId);
}

// Get specific item from cart
export function getCartItem(productId) {
    const cart = getCart();
    return cart.find(item => item.id === productId);
}

// === WISHLIST FUNCTIONS ===

// Get wishlist
export function getWishlist() {
    try {
        const wishlist = localStorage.getItem(WISHLIST_KEY);
        return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
        console.error('Error getting wishlist:', error);
        return [];
    }
}

// Save wishlist
export function saveWishlist(wishlist) {
    try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
        return true;
    } catch (error) {
        console.error('Error saving wishlist:', error);
        return false;
    }
}

// Add to wishlist
export function addToWishlist(productId, productData = {}) {
    try {
        let wishlist = getWishlist();
        
        // Check if already in wishlist
        if (!wishlist.find(item => item.id === productId)) {
            wishlist.push({
                id: productId,
                addedAt: new Date().toISOString(),
                ...productData
            });
            
            saveWishlist(wishlist);
            
            return {
                success: true,
                message: 'Ditambahkan ke wishlist'
            };
        }
        
        return {
            success: false,
            message: 'Sudah ada di wishlist'
        };
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return {
            success: false,
            message: 'Gagal menambahkan ke wishlist'
        };
    }
}

// Remove from wishlist
export function removeFromWishlist(productId) {
    try {
        let wishlist = getWishlist();
        wishlist = wishlist.filter(item => item.id !== productId);
        saveWishlist(wishlist);
        
        return {
            success: true,
            message: 'Dihapus dari wishlist'
        };
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return {
            success: false,
            message: 'Gagal menghapus dari wishlist'
        };
    }
}

// Check if product is in wishlist
export function isInWishlist(productId) {
    const wishlist = getWishlist();
    return wishlist.some(item => item.id === productId);
}

// === PROMO CODE FUNCTIONS ===

const PROMO_CODES = {
    'HIJAB10': { discount: 10000, type: 'fixed', minPurchase: 100000 },
    'DISCOUNT15': { discount: 15000, type: 'fixed', minPurchase: 150000 },
    'PROMO20': { discount: 20000, type: 'fixed', minPurchase: 200000 },
    'NEWUSER': { discount: 25000, type: 'fixed', minPurchase: 0 },
    'PERCENT10': { discount: 10, type: 'percentage', minPurchase: 100000 }
};

// Validate promo code
export function validatePromoCode(code, cartTotal) {
    const upperCode = code.toUpperCase();
    const promo = PROMO_CODES[upperCode];
    
    if (!promo) {
        return {
            valid: false,
            message: 'Kode promo tidak valid'
        };
    }
    
    if (cartTotal < promo.minPurchase) {
        return {
            valid: false,
            message: `Minimal pembelian Rp ${promo.minPurchase.toLocaleString('id-ID')}`
        };
    }
    
    let discountAmount = 0;
    if (promo.type === 'fixed') {
        discountAmount = promo.discount;
    } else if (promo.type === 'percentage') {
        discountAmount = Math.floor(cartTotal * (promo.discount / 100));
    }
    
    return {
        valid: true,
        code: upperCode,
        discount: discountAmount,
        message: `Diskon Rp ${discountAmount.toLocaleString('id-ID')} diterapkan`
    };
}

// === ORDER FUNCTIONS ===

// Create order from cart
export function createOrder(orderData = {}) {
    try {
        const cart = getCart();
        
        if (cart.length === 0) {
            return {
                success: false,
                message: 'Keranjang kosong'
            };
        }
        
        const totals = getCartTotal();
        
        const order = {
            id: 'ORD-' + Date.now(),
            items: cart,
            subtotal: totals.subtotal,
            shipping: totals.shipping,
            discount: totals.discount,
            total: totals.total,
            status: 'pending',
            createdAt: new Date().toISOString(),
            ...orderData
        };
        
        // Save to orders (in real app, save to Firestore)
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.unshift(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Clear cart after order
        clearCart();
        
        return {
            success: true,
            message: 'Pesanan berhasil dibuat',
            order: order
        };
    } catch (error) {
        console.error('Error creating order:', error);
        return {
            success: false,
            message: 'Gagal membuat pesanan'
        };
    }
}

// Get user orders
export function getUserOrders() {
    try {
        const orders = localStorage.getItem('orders');
        return orders ? JSON.parse(orders) : [];
    } catch (error) {
        console.error('Error getting orders:', error);
        return [];
    }
}

// Format currency
export function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Initialize cart on page load
export function initCart() {
    updateCartBadge();
}

// Auto-initialize
if (typeof window !== 'undefined') {
    initCart();
}