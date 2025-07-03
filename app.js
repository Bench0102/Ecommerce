// This script will handle fetching products for the homepage
// and the "Buy Now" functionality.

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
        console.error("Firebase or firebaseConfig is not defined. Make sure firebase-config.js is loaded first and configured.");
        alert("Error: Firebase configuration is missing. Please contact support.");
        return;
    }

    // Initialize Firebase if it hasn't been already
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized in app.js");
        } catch (e) {
            console.error("Error initializing Firebase in app.js: ", e);
            alert("Could not initialize Firebase. Please try again later.");
            return;
        }
    } else {
        firebase.app(); // if already initialized, use that one
        console.log("Firebase already initialized, using existing app in app.js");
    }

    const db = firebase.firestore();
    const productListElement = document.getElementById('product-list');
    const messageArea = document.getElementById('message-area-home'); // For displaying messages

    function displayMessage(text, type = 'info') {
        if (!messageArea) return;
        messageArea.innerHTML = `<div class="${type}-message">${text}</div>`;
    }
    function clearMessages() {
        if (messageArea) messageArea.innerHTML = '';
    }

    // Function to fetch and display products
    async function fetchAndDisplayProducts() {
        if (!productListElement) {
            console.log("Product list element not found on this page.");
            return;
        }
        clearMessages();
        productListElement.innerHTML = '<div class="loading-message">Loading products...</div>';

        try {
            const productsCollection = await db.collection('products').get();
            if (productsCollection.empty) {
                productListElement.innerHTML = '<div class="info-message">No products found. Check back later!</div>';
                return;
            }

            let productsHtml = '';
            productsCollection.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                productsHtml += `
                    <div class="product-card" data-id="${productId}">
                        <img src="${product.imageUrl || 'https://via.placeholder.com/220/CCCCCC/4F4F4F?Text=No+Image'}" alt="${product.name || 'Product Image'}">
                        <div class="product-card-content">
                            <h3>${product.name || 'Unnamed Product'}</h3>
                            <p class="description">${product.description || 'No description available.'}</p>
                            <p class="price">$${parseFloat(product.price || 0).toFixed(2)}</p>
                            <button class="button button-primary action-button add-to-cart-button" data-product-id="${productId}" data-product-name="${product.name || 'Unnamed Product'}" data-product-price="${parseFloat(product.price || 0).toFixed(2)}" data-product-image="${product.imageUrl || 'https://via.placeholder.com/220/CCCCCC/4F4F4F?Text=No+Image'}">Add to Cart</button>
                        </div>
                    </div>
                `;
            });
            productListElement.innerHTML = productsHtml;

            // Add event listeners to "Add to Cart" buttons
            document.querySelectorAll('.add-to-cart-button').forEach(button => {
                button.addEventListener('click', handleAddToCart);
            });

        } catch (error) {
            console.error("Error fetching products: ", error);
            productListElement.innerHTML = '<div class="error-message">Error loading products. Please try again later.</div>';
        }
    }

    // Handle "Add to Cart" button click
    function handleAddToCart(event) {
        const button = event.target;
        const productId = button.dataset.productId;
        const productName = button.dataset.productName;
        const productPrice = parseFloat(button.dataset.productPrice);
        const productImage = button.dataset.productImage;

        if (!productId) {
            console.error("Product ID missing from Add to Cart button.");
            displayMessage("Could not add to cart: Product ID is missing.", "error");
            return;
        }

        if (window.cartModule && typeof window.cartModule.addItemToCart === 'function') {
            window.cartModule.addItemToCart({
                id: productId,
                name: productName,
                price: productPrice,
                imageUrl: productImage,
                quantity: 1
            });
            displayMessage(`"${productName}" added to your cart!`, "success");
            // Optionally, briefly change button text or show animation
            button.textContent = 'Added!';
            button.classList.remove('button-primary');
            button.classList.add('button-success');
            setTimeout(() => {
                button.textContent = 'Add to Cart';
                button.classList.remove('button-success');
                button.classList.add('button-primary');
            }, 1500);
        } else {
            console.error("Cart module or addItemToCart function is not available.");
            displayMessage("Error: Could not add item to cart. Cart system unavailable.", "error");
        }

        // OLD "Buy Now" logic (will be removed or adapted for a cart checkout later)
        // const user = firebase.auth().currentUser;
        // if (!user) {
        //     displayMessage("Please log in to purchase items.", "info");
        //     // Optionally redirect to login page or show login modal
        //     // If login.html is used, redirect: window.location.href = 'login.html';
        //     return;
        // }
        // console.log(`User ${user.uid} wants to buy product ${productId}.`);
        // alert(`Simulating Stripe Checkout for product ID: ${productId}\nBackend integration needed.`);
        // Example of what you'd do if you had a backend:
        /*
        try {
            // Replace with your actual backend endpoint
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include Bearer token if your backend expects it for auth
                    // 'Authorization': `Bearer ${await user.getIdToken()}`
                },
                body: JSON.stringify({ productId: productId, userId: user.uid })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create checkout session.');
            }

            const session = await response.json(); // Expects { id: STRIPE_SESSION_ID }

            // Redirect to Stripe Checkout
            // const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY'); // Load Stripe.js
            // await stripe.redirectToCheckout({ sessionId: session.id });

        } catch (error) {
            console.error("Error creating Stripe checkout session:", error);
            alert(`Error: ${error.message}`);
        }
        */
    }

    // Initial call to load products if on the right page
    if (productListElement) {
        fetchAndDisplayProducts();
    }

    // Expose functions if needed by other scripts (though typically not for app.js)
    // window.appModule = { fetchAndDisplayProducts };
});
