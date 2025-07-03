// cart.js - Handles cart functionality using localStorage

const CART_STORAGE_KEY = 'myECommerceCart';

// Initialize cart module
function initCart() {
    updateCartIcon();
    setupCartModal();
    // Potentially load and display cart if modal is open on page load (e.g. from a cart page)
    // For now, cart is primarily managed via modal open/close
}

// Get cart from localStorage
function getCart() {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    return cartJson ? JSON.parse(cartJson) : []; // Returns an array of items
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartIcon();
    displayCartItems(); // Refresh cart display if modal is open
}

// Add an item to the cart
function addItemToCart(product) { // product = { id, name, price, imageUrl, quantity: 1 }
    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += product.quantity || 1;
    } else {
        cart.push({ ...product, quantity: product.quantity || 1 });
    }
    saveCart(cart);
    console.log(`${product.name} added/updated in cart. New cart:`, cart);
     // Provide feedback to the user (can be done in app.js or here)
    // For now, app.js handles immediate feedback on button click.
    // Consider opening cart modal or showing a more prominent notification.
}

// Remove an item from the cart
function removeItemFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    console.log(`Product ${productId} removed from cart. New cart:`, cart);
}

// Update quantity of an item in the cart
function updateCartItemQuantity(productId, quantity) {
    const cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
        if (quantity > 0) {
            cart[itemIndex].quantity = quantity;
        } else {
            // If quantity is 0 or less, remove the item
            cart.splice(itemIndex, 1);
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
        cartCountElement.style.display = itemCount > 0 ? 'inline-block' : 'none'; // Show/hide badge
    }
}


// --- Cart Modal Functionality ---
function setupCartModal() {
    const cartModal = document.getElementById('cart-modal');
    const openCartButton = document.getElementById('cart-button-header');
    const closeCartButton = document.querySelector('.close-button'); // Assuming one close button in modal

    if (openCartButton) {
        openCartButton.addEventListener('click', () => {
            if (cartModal) {
                displayCartItems(); // Refresh items when opening
                cartModal.style.display = 'block';
            }
        });
    }

    if (closeCartButton && cartModal) {
        closeCartButton.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    // Close modal if user clicks outside of the modal-content
    if (cartModal) {
        window.addEventListener('click', (event) => {
            if (event.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
    }

    // Handle checkout button
    const checkoutButton = document.getElementById('cart-checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }
}

// Display items in the cart modal
function displayCartItems() {
    const cart = getCart();
    const cartItemsListElement = document.getElementById('cart-items-list');
    const cartTotalElement = document.getElementById('cart-total');
    const emptyCartMessageElement = document.querySelector('.empty-cart-message');
    const checkoutButton = document.getElementById('cart-checkout-button');


    if (!cartItemsListElement || !cartTotalElement || !emptyCartMessageElement || !checkoutButton) {
        console.warn("Cart modal elements not found. Cannot display cart items.");
        return;
    }

    cartItemsListElement.innerHTML = ''; // Clear previous items

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
            itemElement.innerHTML = `
                <img src="${item.imageUrl || 'https://via.placeholder.com/60'}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>Price: $${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="button button-light quantity-decrease" data-id="${item.id}">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.id}" readonly>
                    <button class="button button-light quantity-increase" data-id="${item.id}">+</button>
                </div>
                <p class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</p>
                <button class="button button-danger remove-item-button" data-id="${item.id}">&times; Remove</button>
            `;
            cartItemsListElement.appendChild(itemElement);
        });

        // Add event listeners for quantity changes and remove buttons
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
                if (currentItem && currentItem.quantity > 1) {
                    updateCartItemQuantity(itemId, currentItem.quantity - 1);
                } else if (currentItem && currentItem.quantity === 1) {
                    // Optionally, confirm before removing or just remove
                    removeItemFromCart(itemId);
                }
            });
        });
        // Note: Direct input to quantity field is disabled (readonly) for simplicity,
        // could be enabled with a blur/change event listener.

        cartTotalElement.textContent = `Total: $${calculateCartTotal(cart).toFixed(2)}`;
    }
}

// Handle checkout process
function handleCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Please log in to proceed to checkout.");
        // Optionally, close cart modal and redirect to login or show login prompt
        const cartModal = document.getElementById('cart-modal');
        if(cartModal) cartModal.style.display = 'none';
        // Example: window.location.href = 'login.html';
        return;
    }

    // Simulate backend call for Stripe Checkout with cart items
    console.log(`User ${user.uid} is checking out with cart:`, cart);
    alert(`Simulating Stripe Checkout for ${cart.length} item(s).\nTotal: $${calculateCartTotal(cart).toFixed(2)}\nBackend integration needed.`);

    // After successful (simulated) checkout:
    // saveCart([]); // Clear the cart
    // const cartModal = document.getElementById('cart-modal');
    // if(cartModal) cartModal.style.display = 'none';
    // alert("Checkout successful (simulated)! Your cart has been cleared.");
}


// Expose functions to global scope or a module
window.cartModule = {
    addItemToCart,
    removeItemFromCart,
    updateCartItemQuantity,
    getCart,
    calculateCartTotal,
    updateCartIcon,
    displayCartItems,
    initCart
};

// Initialize cart on script load
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is loaded before initializing cart, as some cart functions might depend on it (e.g., user for checkout)
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        cartModule.initCart();
    } else {
        // Poll for Firebase initialization if it's not ready yet
        let firebaseCheckInterval = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                clearInterval(firebaseCheckInterval);
                cartModule.initCart();
            }
        }, 100);
    }
});
