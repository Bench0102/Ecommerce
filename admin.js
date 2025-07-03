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
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');
    const productDescriptionInput = document.getElementById('product-description');
    const formSubmitButton = addProductForm.querySelector('button[type="submit"]');
    const adminProductListElement = document.getElementById('admin-product-list');
    const adminContentSection = document.getElementById('admin-content-section');
    const adminLoginSection = document.getElementById('admin-login-section');
    const messageAreaAdmin = document.getElementById('message-area-admin');

    let editingProductId = null; // Variable to store the ID of the product being edited

    function displayAdminMessage(text, type = 'info') {
        if (!messageAreaAdmin) {
            // Fallback for critical messages if messageAreaAdmin is not found
            const targetElement = adminProductListElement || addProductForm || document.body;
            const tempMessage = document.createElement('div');
            tempMessage.className = `${type}-message`;
            tempMessage.textContent = text;
            targetElement.prepend(tempMessage);
            setTimeout(() => tempMessage.remove(), 5000);
            return;
        }
        messageAreaAdmin.innerHTML = `<div class="${type}-message">${text}</div>`;
    }
    function clearAdminMessages() {
        if (messageAreaAdmin) messageAreaAdmin.innerHTML = '';
    }


    // Function to load and display products for admin
    async function loadAdminProducts() {
        if (!adminProductListElement) {
            console.log("Admin product list element not found on this page.");
            return;
        }
        clearAdminMessages();
        // Ensure user is authenticated and (notionally) an admin
        // auth.js handles showing/hiding the admin content section
        const user = auth.currentUser;
        if (!user) {
            adminProductListElement.innerHTML = '<div class="info-message">You must be logged in to manage products.</div>';
            return;
        }
        // TODO: Add actual role check here. For now, any logged-in user is admin.

        adminProductListElement.innerHTML = '<div class="loading-message">Loading products...</div>';
        try {
            const productsCollection = await db.collection('products').orderBy('name').get();
            if (productsCollection.empty) {
                adminProductListElement.innerHTML = '<div class="info-message">No products found. Add some using the form above!</div>';
                return;
            }

            let productsHtml = '';
            productsCollection.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                productsHtml += `
                    <div class="admin-product-item" data-id="${productId}">
                        <div class="admin-product-item-info">
                            <p><strong>${product.name || 'N/A'}</strong></p>
                            <p>$${parseFloat(product.price || 0).toFixed(2)}</p>
                            <p><small>ID: ${productId}</small></p>
                        </div>
                        <div class="actions">
                            <button class="button button-warning edit-button" data-id="${productId}">Edit</button>
                            <button class="button button-danger delete-button" data-id="${productId}">Delete</button>
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
            adminProductListElement.innerHTML = '<div class="error-message">Error loading products. Please try again later.</div>';
        }
    }

    // Function to reset the product form and editing state
    function resetProductForm() {
        addProductForm.reset();
        editingProductId = null;
        formSubmitButton.textContent = 'Add Product';
        formSubmitButton.classList.remove('button-warning');
        formSubmitButton.classList.add('button-success');

        // Remove cancel button if it exists
        const existingCancelButton = document.getElementById('cancel-edit-button');
        if (existingCancelButton) {
            existingCancelButton.remove();
        }
        productNameInput.focus(); // Focus on the first field
    }

    // Handle Add Product Form Submission (Create or Update)
    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAdminMessages();
            const user = auth.currentUser;
            if (!user) {
                displayAdminMessage("You must be logged in to modify products.", "error");
                return;
            }
            // TODO: Proper admin check

            const name = productNameInput.value.trim();
            const price = parseFloat(productPriceInput.value);
            const imageUrl = productImageInput.value.trim();
            const description = productDescriptionInput.value.trim();

            if (!name || isNaN(price) || price <= 0 || !imageUrl) {
                displayAdminMessage("Please fill in all required fields with valid data (Name, valid Price, Image URL).", "error");
                return;
            }

            formSubmitButton.disabled = true;
            const originalButtonText = formSubmitButton.textContent;
            formSubmitButton.textContent = editingProductId ? 'Updating...' : 'Adding...';

            const productData = {
                name,
                price,
                imageUrl,
                description,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp() // For both add and update
            };

            try {
                if (editingProductId) {
                    // Update existing product
                    await db.collection('products').doc(editingProductId).update(productData);
                    displayAdminMessage("Product updated successfully!", "success");
                } else {
                    // Add new product
                    productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    const newProductRef = await db.collection('products').add(productData);
                    console.log("Product added with ID: ", newProductRef.id);
                    displayAdminMessage("Product added successfully!", "success");
                }
                resetProductForm();
                loadAdminProducts(); // Refresh the list
            } catch (error) {
                console.error(`Error ${editingProductId ? 'updating' : 'adding'} product: `, error);
                displayAdminMessage(`Error ${editingProductId ? 'updating' : 'adding'} product: ${error.message}`, "error");
            } finally {
                formSubmitButton.disabled = false;
                // Text content is reset by resetProductForm on success, otherwise set it back
                if (editingProductId && formSubmitButton.textContent === 'Updating...') {
                     formSubmitButton.textContent = 'Update Product'; // In case of error during update
                } else if (!editingProductId && formSubmitButton.textContent === 'Adding...') {
                    formSubmitButton.textContent = 'Add Product'; // In case of error during add
                }
            }
        });
    }

    // Handle Edit Product Button Click
    async function handleEditProduct(event) {
        clearAdminMessages();
        const productId = event.target.dataset.id;
        try {
            const productRef = db.collection('products').doc(productId);
            const doc = await productRef.get();

            if (!doc.exists) {
                displayAdminMessage("Product not found. It might have been deleted.", "error");
                return;
            }

            const product = doc.data();
            productNameInput.value = product.name || '';
            productPriceInput.value = product.price || '';
            productImageInput.value = product.imageUrl || '';
            productDescriptionInput.value = product.description || '';

            editingProductId = productId; // Set the editing state

            formSubmitButton.textContent = 'Update Product';
            formSubmitButton.classList.remove('button-success');
            formSubmitButton.classList.add('button-warning'); // Change button color for update

            // Add a "Cancel Edit" button if it doesn't exist
            if (!document.getElementById('cancel-edit-button')) {
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button'; // Important: prevent form submission
                cancelButton.id = 'cancel-edit-button';
                cancelButton.textContent = 'Cancel Edit';
                cancelButton.classList.add('button', 'button-light'); // Style as needed
                cancelButton.style.marginLeft = '10px';
                cancelButton.onclick = resetProductForm; // Reset form on cancel
                formSubmitButton.parentNode.insertBefore(cancelButton, formSubmitButton.nextSibling);
            }

            productNameInput.focus(); // Focus on the first field
            window.scrollTo({ top: addProductForm.offsetTop - 20, behavior: 'smooth' }); // Scroll to form

        } catch (error) {
            console.error("Error fetching product for edit: ", error);
            displayAdminMessage("Error fetching product details. Please try again.", "error");
        }
    }

    // Handle Delete Product
    async function handleDeleteProduct(event) {
        const productId = event.target.dataset.id;
        const user = auth.currentUser;
        if (!user) {
            displayAdminMessage("You must be logged in to delete products.", "error");
            return;
        }
        // TODO: Proper admin check

        if (confirm(`Are you sure you want to delete product ID: ${productId}? This action cannot be undone.`)) {
            const deleteButton = event.target;
            deleteButton.disabled = true;
            deleteButton.textContent = 'Deleting...';

            try {
                await db.collection('products').doc(productId).delete();
                console.log("Product deleted: ", productId);
                displayAdminMessage("Product deleted successfully.", "success");
                loadAdminProducts(); // Refresh the list
            } catch (error) {
                console.error("Error deleting product: ", error);
                displayAdminMessage(`Error deleting product: ${error.message}`, "error");
                deleteButton.disabled = false;
                deleteButton.textContent = 'Delete';
            }
            // No finally needed here for button text if loadAdminProducts() re-renders it
            // or if the item is removed. If error, it's reset above.
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
