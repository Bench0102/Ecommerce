// cart.js - Handles cart functionality using localStorage
import { auth } from './firebase.js'; // Import auth for user check during checkout

const CART_STORAGE_KEY = 'myECommerceCart';

// Initialize cart module
function initCart() {
    updateCartIcon(); // Update icon on initial load
    setupCartModal(); // Setup modal event listeners
    // If cart modal is intended to be open by default on a specific cart page,
    // displayCartItems() would be called here too.
}

// Get cart from localStorage
function getCart() {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    try {
        // Ensure what's in localStorage is a valid array
        const parsed = cartJson ? JSON.parse(cartJson) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Error parsing cart from localStorage:", e);
        return []; // Return empty cart on error
    }
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartIcon();
    displayCartItems(); // Refresh cart display (if modal is open or visible)
}

// Add an item to the cart
function addItemToCart(product) { // product = { id, name, price, imageUrl, quantity: 1 }
    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += (product.quantity || 1);
    } else {
        // Ensure basic product structure
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            imageUrl: product.imageUrl,
            quantity: product.quantity || 1
        });
    }
    saveCart(cart);
    console.log(`${product.name} added/updated in cart. New cart:`, cart);
}

// Remove an item from the cart
function removeItemFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    console.log(`Product ${productId} removed from cart. New cart:`, cart);
}

// Update quantity of an item in the cart
function updateCartItemQuantity(productId, newQuantity) {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);
    const quantity = parseInt(newQuantity, 10);


    if (itemIndex > -1) {
        if (quantity > 0) {
            cart[itemIndex].quantity = quantity;
        } else {
            cart.splice(itemIndex, 1); // Remove if quantity is 0 or less
        }
        saveCart(cart);
        console.log(`Quantity for ${productId} updated to ${quantity}. New cart:`, cart);
    }
}

// Calculate total price of the cart
function calculateCartTotal(cart) {
    if (!cart || cart.length === 0) return 0;
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Update the cart icon with item count
function updateCartIcon() {
    const cart = getCart();
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = itemCount;
        cartCountElement.style.display = itemCount > 0 ? 'inline-block' : 'none';
    }
}

// --- Cart Modal Functionality ---
function setupCartModal() {
    const cartModal = document.getElementById('cart-modal');
    const openCartButton = document.getElementById('cart-button-header');
    // Query for close button within the modal, in case multiple modals exist on other pages
    const closeCartButton = cartModal ? cartModal.querySelector('.close-button') : null;

    if (openCartButton) {
        openCartButton.addEventListener('click', () => {
            if (cartModal) {
                displayCartItems();
                cartModal.style.display = 'block';
                // Focus on the close button or first interactive element in the modal for accessibility
                if(closeCartButton) closeCartButton.focus();
            }
        });
    }

    if (closeCartButton && cartModal) {
        closeCartButton.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    if (cartModal) {
        window.addEventListener('click', (event) => {
            if (event.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
        // Close modal on 'Escape' key press
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && cartModal.style.display === 'block') {
                cartModal.style.display = 'none';
            }
        });
    }

    const checkoutButton = document.getElementById('cart-checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }
}

function displayCartItems() {
    const cart = getCart();
    const cartItemsListElement = document.getElementById('cart-items-list');
    const cartTotalElement = document.getElementById('cart-total');
    // Ensure these elements are scoped within the cart modal if one exists
    const cartModal = document.getElementById('cart-modal');
    const emptyCartMessageElement = cartModal ? cartModal.querySelector('.empty-cart-message') : null;
    const checkoutButton = document.getElementById('cart-checkout-button');

    if (!cartItemsListElement || !cartTotalElement || !emptyCartMessageElement || !checkoutButton) {
        // console.warn("Cart modal elements not found. Cannot display cart items.");
        return;
    }

    cartItemsListElement.innerHTML = '';

    if (cart.length === 0) {
        emptyCartMessageElement.style.display = 'block';
        checkoutButton.style.display = 'none';
        cartTotalElement.textContent = 'Total: $0.00';
    } else {
        emptyCartMessageElement.style.display = 'none';
        checkoutButton.style.display = 'block';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            // Ensure price and quantity are numbers before calculation
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity, 10);
            const subtotal = (price * quantity).toFixed(2);

            itemElement.innerHTML = `
                <img src="${item.imageUrl || 'https://via.placeholder.com/60'}" alt="${item.name || 'Item'}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name || 'Unnamed Item'}</h4>
                    <p>Price: $${price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="button button-light quantity-decrease" data-id="${item.id}" aria-label="Decrease quantity of ${item.name}">-</button>
                    <input type="number" value="${quantity}" min="1" class="quantity-input" data-id="${item.id}" aria-label="Quantity for ${item.name}" readonly>
                    <button class="button button-light quantity-increase" data-id="${item.id}" aria-label="Increase quantity of ${item.name}">+</button>
                </div>
                <p class="cart-item-subtotal">$${subtotal}</p>
                <button class="button button-danger button-small remove-item-button" data-id="${item.id}" aria-label="Remove ${item.name} from cart">&times;</button>
            `; // Added button-small for remove button
            cartItemsListElement.appendChild(itemElement);
        });

        cartItemsListElement.querySelectorAll('.remove-item-button').forEach(button => {
            button.addEventListener('click', (e) => removeItemFromCart(e.target.dataset.id));
        });
        cartItemsListElement.querySelectorAll('.quantity-increase').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                const currentItem = getCart().find(ci => ci.id === itemId);
                if (currentItem) updateCartItemQuantity(itemId, currentItem.quantity + 1);
            });
        });
        cartItemsListElement.querySelectorAll('.quantity-decrease').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                const currentItem = getCart().find(ci => ci.id === itemId);
                if (currentItem) { // No need to check quantity > 1, updateCartItemQuantity handles removal if 0 or less
                    updateCartItemQuantity(itemId, currentItem.quantity - 1);
                }
            });
        });
        cartTotalElement.textContent = `Total: $${calculateCartTotal(cart).toFixed(2)}`;
    }
}

function handleCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const user = auth.currentUser; // Use imported auth instance
    if (!user) {
        alert("Please log in to proceed to checkout.");
        const cartModal = document.getElementById('cart-modal');
        if(cartModal) cartModal.style.display = 'none';
        // Consider redirecting to login page if not on it
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html?redirect=checkout'; // Optional redirect query
        }
        return;
    }

    console.log(`User ${user.uid} is checking out with cart:`, cart);
    alert(`Simulating Stripe Checkout for ${cart.length} item(s).\nTotal: $${calculateCartTotal(cart).toFixed(2)}\nBackend integration needed.`);

    // Example: After successful (simulated) checkout:
    // saveCart([]);
    // const cartModal = document.getElementById('cart-modal');
    // if(cartModal) cartModal.style.display = 'none';
    // alert("Checkout successful (simulated)! Your cart has been cleared.");
}

// Expose functions to global scope for app.js to call addItemToCart
// This is okay for this project's scale. For larger apps, consider event emitters or state management.
window.cartModule = {
    addItemToCart,
    // removeItemFromCart, // Not directly called from outside currently
    // updateCartItemQuantity, // Not directly called from outside
    // getCart, // Not directly called from outside
    // calculateCartTotal, // Not directly called from outside
    updateCartIcon, // Might be called by auth.js on login/logout if cart persists across users
    // displayCartItems, // Called internally or on modal open
    initCart // Called on DOMContentLoaded
};

document.addEventListener('DOMContentLoaded', () => {
    // No longer need to poll for Firebase, as firebase.js should be resolved by the time this runs
    // if scripts are ordered correctly or modules handle dependencies.
    // auth.js also initializes, which imports firebase.js.
    // If cart.js is loaded before auth.js, auth might not be ready for immediate use in initCart,
    // but initCart itself doesn't use auth. Only handleCheckout does.
    initCart();
    console.log("cart.js (v9 user check) loaded.");
});
