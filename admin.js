import { db, auth } from './firebase.js'; // Import Firestore and Auth instances
import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    orderBy,
    query
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // For admin page auth handling

document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('add-product-form');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productImageInput = document.getElementById('product-image');
    const productDescriptionInput = document.getElementById('product-description');
    const formSubmitButton = addProductForm ? addProductForm.querySelector('button[type="submit"]') : null;
    const adminProductListElement = document.getElementById('admin-product-list');

    const adminContentSection = document.getElementById('admin-content-section');
    const adminLoginSection = document.getElementById('admin-login-section');
    const messageAreaAdmin = document.getElementById('message-area-admin');

    let editingProductId = null;

    function displayAdminMessage(text, type = 'info') {
        if (!messageAreaAdmin) {
            const targetElement = adminProductListElement || addProductForm || document.body;
            if (!targetElement) return; // Should not happen if on admin page
            const tempMessage = document.createElement('div');
            tempMessage.className = `${type}-message global-admin-message`; // Add a class for potential global styling/removal
            tempMessage.textContent = text;
            targetElement.prepend(tempMessage);
            setTimeout(() => tempMessage.remove(), 5000);
            return;
        }
        messageAreaAdmin.innerHTML = `<div class="${type}-message">${text}</div>`;
    }

    function clearAdminMessages() {
        if (messageAreaAdmin) messageAreaAdmin.innerHTML = '';
        // Remove any globally prepended messages
        document.querySelectorAll('.global-admin-message').forEach(el => el.remove());
    }

    async function loadAdminProducts() {
        if (!adminProductListElement) {
            // console.log("Admin product list element not found on this page (admin.js).");
            return;
        }
        clearAdminMessages();

        const user = auth.currentUser;
        if (!user) { // This check is also in onAuthStateChanged, but good for direct calls
            adminProductListElement.innerHTML = '<div class="info-message">You must be logged in to manage products.</div>';
            return;
        }
        // TODO: Implement actual admin role check here if needed.

        adminProductListElement.innerHTML = '<div class="loading-message">Loading products...</div>';
        try {
            const productsQuery = query(collection(db, 'products'), orderBy('name'));
            const querySnapshot = await getDocs(productsQuery);

            if (querySnapshot.empty) {
                adminProductListElement.innerHTML = '<div class="info-message">No products found. Add some using the form above!</div>';
                return;
            }

            let productsHtml = '';
            querySnapshot.forEach(docSnapshot => { // Renamed doc to docSnapshot to avoid conflict
                const product = docSnapshot.data();
                const productId = docSnapshot.id;
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

            document.querySelectorAll('.edit-button').forEach(button => {
                button.addEventListener('click', handleEditProduct);
            });
            document.querySelectorAll('.delete-button').forEach(button => {
                button.addEventListener('click', handleDeleteProduct);
            });

        } catch (error) {
            console.error("Error fetching admin products (admin.js): ", error);
            adminProductListElement.innerHTML = '<div class="error-message">Error loading products. Please try again later.</div>';
        }
    }

    function resetProductForm() {
        if (addProductForm) addProductForm.reset();
        editingProductId = null;
        if (formSubmitButton) {
            formSubmitButton.textContent = 'Add Product';
            formSubmitButton.classList.remove('button-warning');
            formSubmitButton.classList.add('button-success');
        }

        const existingCancelButton = document.getElementById('cancel-edit-button');
        if (existingCancelButton) {
            existingCancelButton.remove();
        }
        if (productNameInput) productNameInput.focus();
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAdminMessages();
            const user = auth.currentUser;
            if (!user) {
                displayAdminMessage("You must be logged in to modify products.", "error");
                return;
            }

            const name = productNameInput.value.trim();
            const price = parseFloat(productPriceInput.value);
            const imageUrl = productImageInput.value.trim();
            const description = productDescriptionInput.value.trim();

            if (!name || isNaN(price) || price <= 0 || !imageUrl) {
                displayAdminMessage("Please fill in all required fields with valid data (Name, valid Price, Image URL).", "error");
                return;
            }

            formSubmitButton.disabled = true;
            formSubmitButton.textContent = editingProductId ? 'Updating...' : 'Adding...';

            const productData = {
                name,
                price,
                imageUrl,
                description,
                updatedAt: serverTimestamp() // Firestore server timestamp
            };

            try {
                if (editingProductId) {
                    const productRef = doc(db, 'products', editingProductId);
                    await updateDoc(productRef, productData);
                    displayAdminMessage("Product updated successfully!", "success");
                } else {
                    productData.createdAt = serverTimestamp(); // Add createdAt for new products
                    const productsCollectionRef = collection(db, 'products');
                    const newDocRef = await addDoc(productsCollectionRef, productData);
                    console.log("Product added with ID: ", newDocRef.id);
                    displayAdminMessage("Product added successfully!", "success");
                }
                resetProductForm();
                loadAdminProducts();
            } catch (error) {
                console.error(`Error ${editingProductId ? 'updating' : 'adding'} product: `, error);
                displayAdminMessage(`Error ${editingProductId ? 'updating' : 'adding'} product: ${error.message}`, "error");
            } finally {
                if (formSubmitButton) { // Check if formSubmitButton still exists (not removed by DOM change)
                    formSubmitButton.disabled = false;
                     // Text content is reset by resetProductForm on success
                    if (editingProductId && formSubmitButton.textContent === 'Updating...') {
                         formSubmitButton.textContent = 'Update Product';
                    } else if (!editingProductId && formSubmitButton.textContent === 'Adding...') {
                        formSubmitButton.textContent = 'Add Product';
                    }
                }
            }
        });
    }

    async function handleEditProduct(event) {
        clearAdminMessages();
        const productId = event.target.dataset.id;
        try {
            const productRef = doc(db, 'products', productId);
            const docSnapshot = await getDoc(productRef); // Renamed doc to docSnapshot

            if (!docSnapshot.exists()) {
                displayAdminMessage("Product not found. It might have been deleted.", "error");
                return;
            }

            const product = docSnapshot.data();
            productNameInput.value = product.name || '';
            productPriceInput.value = product.price || '';
            productImageInput.value = product.imageUrl || '';
            productDescriptionInput.value = product.description || '';

            editingProductId = productId;

            formSubmitButton.textContent = 'Update Product';
            formSubmitButton.classList.remove('button-success');
            formSubmitButton.classList.add('button-warning');

            if (!document.getElementById('cancel-edit-button')) {
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.id = 'cancel-edit-button';
                cancelButton.textContent = 'Cancel Edit';
                cancelButton.classList.add('button', 'button-light');
                cancelButton.style.marginLeft = '10px';
                cancelButton.onclick = resetProductForm;
                if (formSubmitButton && formSubmitButton.parentNode) { // Ensure parentNode exists
                    formSubmitButton.parentNode.insertBefore(cancelButton, formSubmitButton.nextSibling);
                }
            }

            productNameInput.focus();
            if (addProductForm) { // Check if addProductForm exists
                 window.scrollTo({ top: addProductForm.offsetTop - 20, behavior: 'smooth' });
            }

        } catch (error) {
            console.error("Error fetching product for edit: ", error);
            displayAdminMessage("Error fetching product details. Please try again.", "error");
        }
    }

    async function handleDeleteProduct(event) {
        clearAdminMessages();
        const productId = event.target.dataset.id;
        const user = auth.currentUser;
        if (!user) {
            displayAdminMessage("You must be logged in to delete products.", "error");
            return;
        }

        if (confirm(`Are you sure you want to delete product ID: ${productId}? This action cannot be undone.`)) {
            const deleteButton = event.target;
            deleteButton.disabled = true;
            deleteButton.textContent = 'Deleting...';

            try {
                const productRef = doc(db, 'products', productId);
                await deleteDoc(productRef);
                console.log("Product deleted: ", productId);
                displayAdminMessage("Product deleted successfully.", "success");
                loadAdminProducts();
            } catch (error) {
                console.error("Error deleting product: ", error);
                displayAdminMessage(`Error deleting product: ${error.message}`, "error");
                deleteButton.disabled = false;
                deleteButton.textContent = 'Delete';
            }
        }
    }

    // Handle Auth State for Admin Page
    onAuthStateChanged(auth, (user) => {
        if (window.location.pathname.includes('admin.html')) { // Only run on admin page
            if (user) {
                // User is signed in - show admin content, load products
                if (adminContentSection) adminContentSection.style.display = 'block';
                if (adminLoginSection) adminLoginSection.style.display = 'none';
                loadAdminProducts(); // Load products for the logged-in user
            } else {
                // User is signed out - show login prompt
                if (adminContentSection) adminContentSection.style.display = 'none';
                if (adminLoginSection) adminLoginSection.style.display = 'block';
                if (adminProductListElement) {
                    adminProductListElement.innerHTML = '<div class="info-message">Please log in to manage products.</div>';
                }
            }
        }
    });

    console.log("admin.js (v9) loaded.");
});
