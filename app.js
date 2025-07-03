import { db } from './firebase.js'; // Import Firestore instance
import { collection, getDocs, orderBy, query } from 'firebase/firestore'; // Import v9 functions

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const productListElement = document.getElementById('product-list');
    const messageArea = document.getElementById('message-area-home'); // For displaying messages

    function displayMessage(text, type = 'info') {
        if (!messageArea) {
            console.warn("Message area not found for app.js");
            // Fallback alert for critical messages if area is missing
            if (type === 'error') alert(`Error: ${text}`);
            return;
        }
        messageArea.innerHTML = `<div class="${type}-message">${text}</div>`;
    }
    function clearMessages() {
        if (messageArea) messageArea.innerHTML = '';
    }

    // Function to fetch and display products
    async function fetchAndDisplayProducts() {
        if (!productListElement) {
            // This can happen if app.js is loaded on pages without #product-list (e.g. login.html)
            // console.log("Product list element not found on this page (app.js).");
            return;
        }
        clearMessages();
        productListElement.innerHTML = '<div class="loading-message">Loading products...</div>';

        try {
            const productsQuery = query(collection(db, 'products'), orderBy('name')); // Example: order by name
            const querySnapshot = await getDocs(productsQuery);

            if (querySnapshot.empty) {
                productListElement.innerHTML = '<div class="info-message">No products found. Check back later!</div>';
                return;
            }

            let productsHtml = '';
            querySnapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                productsHtml += `
                    <div class="product-card" data-id="${productId}">
                        <img src="${product.imageUrl || 'https://via.placeholder.com/220/CCCCCC/4F4F4F?Text=No+Image'}" alt="${product.name || 'Product Image'}">
                        <div class="product-card-content">
                            <h3>${product.name || 'Unnamed Product'}</h3>
                            <p class="description">${product.description || 'No description available.'}</p>
                            <p class="price">$${parseFloat(product.price || 0).toFixed(2)}</p>
                            <button class="button button-primary action-button add-to-cart-button"
                                data-product-id="${productId}"
                                data-product-name="${product.name || 'Unnamed Product'}"
                                data-product-price="${parseFloat(product.price || 0).toFixed(2)}"
                                data-product-image="${product.imageUrl || 'https://via.placeholder.com/220/CCCCCC/4F4F4F?Text=No+Image'}">
                                Add to Cart
                            </button>
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
            console.error("Error fetching products (app.js): ", error);
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

            button.textContent = 'Added!';
            button.classList.remove('button-primary');
            button.classList.add('button-success');
            // Consider if button should be disabled temporarily
            // button.disabled = true;
            setTimeout(() => {
                button.textContent = 'Add to Cart';
                button.classList.remove('button-success');
                button.classList.add('button-primary');
                // button.disabled = false;
            }, 1500);
        } else {
            console.error("Cart module or addItemToCart function is not available.");
            displayMessage("Error: Could not add item to cart. Cart system unavailable.", "error");
        }
    }

    // Initial call to load products if on a page with product list
    if (productListElement) {
        fetchAndDisplayProducts();
    }

    console.log("app.js (v9) loaded.");
});
