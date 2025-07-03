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

    // Function to fetch and display products
    async function fetchAndDisplayProducts() {
        if (!productListElement) {
            console.log("Product list element not found on this page.");
            return;
        }
        productListElement.innerHTML = '<p>Loading products...</p>'; // Show loading state

        try {
            const productsCollection = await db.collection('products').get();
            if (productsCollection.empty) {
                productListElement.innerHTML = '<p>No products found.</p>';
                return;
            }

            let productsHtml = '';
            productsCollection.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                productsHtml += `
                    <div class="product-card" data-id="${productId}">
                        <img src="${product.imageUrl || 'https://via.placeholder.com/200'}" alt="${product.name}">
                        <h3>${product.name || 'Unnamed Product'}</h3>
                        <p class="price">$${parseFloat(product.price || 0).toFixed(2)}</p>
                        <p class="description">${product.description || 'No description available.'}</p>
                        <button class="buy-now-button" data-product-id="${productId}">Buy Now</button>
                    </div>
                `;
            });
            productListElement.innerHTML = productsHtml;

            // Add event listeners to "Buy Now" buttons
            document.querySelectorAll('.buy-now-button').forEach(button => {
                button.addEventListener('click', handleBuyNow);
            });

        } catch (error) {
            console.error("Error fetching products: ", error);
            productListElement.innerHTML = '<p>Error loading products. Please try again later.</p>';
        }
    }

    // Handle "Buy Now" button click
    async function handleBuyNow(event) {
        const productId = event.target.dataset.productId;
        if (!productId) {
            console.error("Product ID missing from Buy Now button.");
            alert("Could not process purchase: Product ID is missing.");
            return;
        }

        // 1. Check if user is logged in (using auth.js functionality if available)
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("Please log in to purchase items.");
            // Optionally redirect to login page or show login modal
            // For now, we assume auth.js handles the login button and user status display
            // If login.html is used, redirect: window.location.href = 'login.html';
            return;
        }

        // 2. Call backend to create Stripe Checkout session
        // This requires a backend endpoint.
        // For now, we'll simulate this and log to console.
        console.log(`User ${user.uid} wants to buy product ${productId}.`);
        alert(`Simulating Stripe Checkout for product ID: ${productId}\nBackend integration needed.`);

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
