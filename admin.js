// This script will handle the admin page functionality:
// - Adding new products
// - Listing existing products
// - Editing products (Placeholder for now)
// - Deleting products

document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
        console.error("Firebase or firebaseConfig is not defined. Make sure firebase-config.js is loaded first and configured.");
        alert("Error: Firebase configuration is missing for the admin panel. Please contact support.");
        return;
    }

    // Initialize Firebase if it hasn't been already
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized in admin.js");
        } catch (e) {
            console.error("Error initializing Firebase in admin.js: ", e);
            alert("Could not initialize Firebase for the admin panel. Please try again later.");
            return;
        }
    } else {
        firebase.app(); // if already initialized, use that one
        console.log("Firebase already initialized, using existing app in admin.js");
    }

    const db = firebase.firestore();
    const auth = firebase.auth();

    const addProductForm = document.getElementById('add-product-form');
    const adminProductListElement = document.getElementById('admin-product-list');
    const adminContentSection = document.getElementById('admin-content-section');
    const adminLoginSection = document.getElementById('admin-login-section');

    // Function to load and display products for admin
    async function loadAdminProducts() {
        if (!adminProductListElement) {
            console.log("Admin product list element not found on this page.");
            return;
        }
        // Ensure user is authenticated and (notionally) an admin
        // auth.js handles showing/hiding the admin content section
        const user = auth.currentUser;
        if (!user) {
            adminProductListElement.innerHTML = '<p>You must be logged in to manage products.</p>';
            return;
        }
        // TODO: Add actual role check here. For now, any logged-in user is admin.

        adminProductListElement.innerHTML = '<p>Loading products...</p>';
        try {
            const productsCollection = await db.collection('products').orderBy('name').get();
            if (productsCollection.empty) {
                adminProductListElement.innerHTML = '<p>No products found. Add some using the form above!</p>';
                return;
            }

            let productsHtml = '';
            productsCollection.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                productsHtml += `
                    <div class="admin-product-item" data-id="${productId}">
                        <p>
                            <strong>${product.name || 'N/A'}</strong> -
                            $${parseFloat(product.price || 0).toFixed(2)} <br>
                            <small>ID: ${productId}</small>
                        </p>
                        <div class="actions">
                            <button class="edit-button" data-id="${productId}">Edit</button>
                            <button class="delete-button" data-id="${productId}">Delete</button>
                        </div>
                    </div>
                `;
            });
            adminProductListElement.innerHTML = productsHtml;

            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', handleEditProduct);
            });
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', handleDeleteProduct);
            });

        } catch (error) {
            console.error("Error fetching admin products: ", error);
            adminProductListElement.innerHTML = '<p>Error loading products. Please try again later.</p>';
        }
    }

    // Handle Add Product Form Submission
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                alert("You must be logged in to add products.");
                return;
            }
            // TODO: Proper admin check

            const name = document.getElementById('product-name').value;
            const price = parseFloat(document.getElementById('product-price').value);
            const imageUrl = document.getElementById('product-image').value;
            const description = document.getElementById('product-description').value;

            if (!name || isNaN(price) || !imageUrl) {
                alert("Please fill in all required fields (Name, Price, Image URL).");
                return;
            }

            try {
                const newProductRef = await db.collection('products').add({
                    name: name,
                    price: price,
                    imageUrl: imageUrl,
                    description: description,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("Product added with ID: ", newProductRef.id);
                alert("Product added successfully!");
                addProductForm.reset();
                loadAdminProducts(); // Refresh the list
            } catch (error) {
                console.error("Error adding product: ", error);
                alert(`Error adding product: ${error.message}`);
            }
        });
    }

    // Handle Edit Product (Placeholder)
    function handleEditProduct(event) {
        const productId = event.target.dataset.id;
        alert(`Edit functionality for product ID: ${productId} is not yet implemented.\n\nTo edit, you could:\n1. Fetch product data by ID.\n2. Populate the 'Add Product' form (or a separate edit form) with this data.\n3. Change the form's submit handler to update the existing document instead of creating a new one.`);
        // Example:
        // const productRef = db.collection('products').doc(productId);
        // await productRef.update({ name: "New Name", price: 12.99 });
        // loadAdminProducts(); // Refresh
    }

    // Handle Delete Product
    async function handleDeleteProduct(event) {
        const productId = event.target.dataset.id;
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to delete products.");
            return;
        }
        // TODO: Proper admin check

        if (confirm(`Are you sure you want to delete product ID: ${productId}? This action cannot be undone.`)) {
            try {
                await db.collection('products').doc(productId).delete();
                console.log("Product deleted: ", productId);
                alert("Product deleted successfully.");
                loadAdminProducts(); // Refresh the list
            } catch (error) {
                console.error("Error deleting product: ", error);
                alert(`Error deleting product: ${error.message}`);
            }
        }
    }

    // Initial check: if on admin page and user is already logged in (handled by auth.js onAuthStateChanged)
    // we might want to call loadAdminProducts.
    // auth.js will call this if the user is an "admin"

    // Expose loadAdminProducts so auth.js can call it after successful login verification on admin page
    window.adminModule = {
        loadAdminProducts
    };

    // If the admin content is visible (i.e., user is logged in and "admin"), load products.
    // This is a fallback / initial load if auth.js hasn't triggered it yet or if page reloads.
    const checkAuthAndLoad = () => {
        const user = auth.currentUser;
        // The display style check is a proxy for "admin access granted" by auth.js
        if (user && adminContentSection && adminContentSection.style.display !== 'none') {
            loadAdminProducts();
        } else if (adminLoginSection && adminLoginSection.style.display !== 'none') {
             if(adminProductListElement) adminProductListElement.innerHTML = '<p>Please log in to manage products.</p>';
        }
    };

    // Listen for auth changes to reload products if necessary, e.g., after login on the admin page.
    auth.onAuthStateChanged(user => {
        if (window.location.pathname.includes('admin.html')) { // Only run on admin page
            if (user) {
                // Assuming auth.js handles showing/hiding adminContentSection
                // If adminContentSection is visible, it means user is considered admin
                if (adminContentSection && adminContentSection.style.display !== 'none') {
                    loadAdminProducts();
                }
            } else {
                // User logged out, clear list and show login prompt (auth.js also handles this)
                if (adminProductListElement) adminProductListElement.innerHTML = '<p>Please log in to manage products.</p>';
            }
        }
    });

    // Initial call if on admin page and content section is already visible
    // (e.g. user was already logged in)
    if (window.location.pathname.includes('admin.html')) {
       checkAuthAndLoad();
    }

});
