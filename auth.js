import { app, auth, db } from './firebase.js'; // Assuming firebase.js is in the same directory
import {
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut as firebaseSignOut // Alias to avoid conflict with any local signOut variable
} from 'firebase/auth';

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleSignInButton = document.getElementById('google-signin-button');

const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const showRegisterLink = document.getElementById('show-register-link');
const showLoginLink = document.getElementById('show-login-link');

const loginMessageArea = document.getElementById('login-message-area');
const registerMessageArea = document.getElementById('register-message-area');

const userStatusElement = document.getElementById('user-status');
const loginButtonHeader = document.getElementById('login-button-header'); // Used for Login/Logout text

const adminContentSection = document.getElementById('admin-content-section'); // On admin.html
const adminLoginSection = document.getElementById('admin-login-section');   // On admin.html


// --- Utility functions for displaying messages ---
function displayAuthMessage(area, message, type = 'error') {
    if (area) {
        area.innerHTML = `<div class="${type}-message">${message}</div>`;
    }
}

// --- Toggle between Login and Register forms ---
if (showRegisterLink && registerSection && loginSection) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        if (loginMessageArea) loginMessageArea.innerHTML = ''; // Clear previous messages
    });
}

if (showLoginLink && registerSection && loginSection) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.style.display = 'none';
        loginSection.style.display = 'block';
        if (registerMessageArea) registerMessageArea.innerHTML = ''; // Clear previous messages
    });
}

// --- Google Sign-In ---
if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            console.log("Google Sign-In successful:", result.user);
            displayAuthMessage(loginMessageArea, `Welcome, ${result.user.displayName}! Redirecting...`, 'success');
            // onAuthStateChanged will handle redirect or UI updates
        } catch (error) {
            console.error("Google Sign-In error:", error);
            displayAuthMessage(loginMessageArea, `Google Sign-In failed: ${error.message}`, 'error');
        }
    });
}

// --- Email/Password Registration ---
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (registerMessageArea) registerMessageArea.innerHTML = ''; // Clear previous messages

        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            displayAuthMessage(registerMessageArea, "Passwords do not match.", 'error');
            return;
        }
        if (password.length < 6) {
            displayAuthMessage(registerMessageArea, "Password should be at least 6 characters.", 'error');
            return;
        }

        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Registering...';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Registration successful:", userCredential.user);
            displayAuthMessage(registerMessageArea, "Registration successful! You can now log in.", 'success');
            // onAuthStateChanged will handle redirect or UI updates, or redirect manually after a delay
             setTimeout(() => {
                // Show login form after successful registration
                if (registerSection && loginSection) {
                    registerSection.style.display = 'none';
                    loginSection.style.display = 'block';
                }
                registerForm.reset();
            }, 2000);

        } catch (error) {
            console.error("Registration error:", error);
            let message = `Registration failed: ${error.message}`;
            if (error.code === 'auth/email-already-in-use') {
                message = "This email is already registered. Please try logging in.";
            }
            displayAuthMessage(registerMessageArea, message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Register';
        }
    });
}

// --- Email/Password Login ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (loginMessageArea) loginMessageArea.innerHTML = ''; // Clear previous messages

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful:", userCredential.user);
            displayAuthMessage(loginMessageArea, "Login successful! Redirecting...", 'success');
            // onAuthStateChanged will handle redirect or UI updates
        } catch (error) {
            console.error("Login error:", error);
            let message = `Login failed: ${error.message}`;
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = "Invalid email or password. Please try again.";
            }
            displayAuthMessage(loginMessageArea, message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
}

// --- Sign Out ---
async function handleSignOut() {
    try {
        await firebaseSignOut(auth);
        console.log("User signed out.");
        // UI updates handled by onAuthStateChanged
    } catch (error) {
        console.error("Sign out error:", error);
        // Display error in a general message area if available, or alert
        alert(`Sign out failed: ${error.message}`);
    }
}

// --- Auth State Listener ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("User is signed in:", user);
        if (userStatusElement) {
            userStatusElement.textContent = `Logged in as ${user.displayName || user.email}`;
        }
        if (loginButtonHeader) {
            loginButtonHeader.textContent = 'Logout';
            loginButtonHeader.className = 'button button-secondary';
            loginButtonHeader.onclick = handleSignOut;
        }

        // If on login page, redirect to home
        if (window.location.pathname.includes('login.html')) {
            // Display message only if loginMessageArea is available from a direct login/register action
            if (!loginMessageArea || loginMessageArea.innerHTML === '') {
                 // Only redirect if not already showing a specific login/register success message
                const authContainer = document.getElementById('auth-container');
                if (authContainer) { // Check if on the actual login page structure
                     displayAuthMessage(loginMessageArea || authContainer.querySelector('.auth-message-area'), "Already logged in. Redirecting...", 'info');
                }
            }
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        }

        // Admin page specific logic
        if (window.location.pathname.includes('admin.html')) {
            if (adminContentSection) adminContentSection.style.display = 'block';
            if (adminLoginSection) adminLoginSection.style.display = 'none';
            // Trigger loading of admin products if the function is available from admin.js (now an ES module)
            // This requires admin.js to export loadAdminProducts and be imported here, or use custom events.
            // For now, admin.js has its own onAuthStateChanged listener to handle this.
        }

    } else {
        // User is signed out
        console.log("User is signed out.");
        if (userStatusElement) {
            userStatusElement.textContent = 'Logged out';
        }
        if (loginButtonHeader) {
            loginButtonHeader.textContent = 'Login';
            loginButtonHeader.className = 'button button-primary';
            loginButtonHeader.onclick = () => {
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                // If already on login.html, button click does nothing here, form submission is separate
            };
        }

        // Admin page specific logic
        if (window.location.pathname.includes('admin.html')) {
            if (adminContentSection) adminContentSection.style.display = 'none';
            if (adminLoginSection) adminLoginSection.style.display = 'block';
            const adminProductList = document.getElementById('admin-product-list');
            if (adminProductList) {
                adminProductList.innerHTML = '<div class="info-message">Please log in to manage products.</div>';
            }
        }
    }
    // Update cart icon regardless of auth state (cart can be used by guests)
    if (window.cartModule && typeof window.cartModule.updateCartIcon === 'function') {
        window.cartModule.updateCartIcon();
    }
});

// Initial check in case script loads after DOM and auth state is already known
// (though onAuthStateChanged usually handles this well)
// For example, if already on login.html and logged in, redirect.
if (auth.currentUser && window.location.pathname.includes('login.html')) {
    console.log("Already logged in on login page, redirecting...");
    const authContainer = document.getElementById('auth-container');
     if (authContainer) { // Check if on the actual login page structure
        displayAuthMessage(loginMessageArea || authContainer.querySelector('.auth-message-area'), "Already logged in. Redirecting...", 'info');
    }
    setTimeout(() => { window.location.href = 'index.html'; }, 500); // Quicker redirect if already known
}

console.log("auth.js (v9) loaded and event listeners attached.");

// Note: Since this is a module, `window.authModule` is no longer used.
// Functionality is self-contained or handled by direct imports if needed elsewhere.
// The inline script on login.html that used window.authModule was removed.
// Interactions like admin.js loading products on auth change needs to be handled
// within admin.js's own onAuthStateChanged listener or via imports/events if more complex coordination is needed.
// For simplicity, each main page script (app, admin) can have its own onAuthStateChanged if it needs to react to it.
// Alternatively, custom events could be dispatched on auth changes.
// The current admin.js has an onAuthStateChanged which should still work.
