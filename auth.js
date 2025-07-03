// This script will handle Firebase Authentication (Google Sign-In)

document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') {
        console.error("Firebase or firebaseConfig is not defined. Make sure firebase-config.js is loaded first and configured.");
        // Attempt to inform the user on pages that rely heavily on auth
        const userStatusElement = document.getElementById('user-status');
        if (userStatusElement) userStatusElement.textContent = "Error: Auth system failed.";
        return;
    }

    // Initialize Firebase if it hasn't been already
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized in auth.js");
        } catch (e) {
            console.error("Error initializing Firebase in auth.js: ", e);
            alert("Could not initialize Firebase authentication. Please try again later.");
            return;
        }
    } else {
        firebase.app(); // if already initialized, use that one
        console.log("Firebase already initialized, using existing app in auth.js");
    }

    const auth = firebase.auth();
    const loginButton = document.getElementById('login-button'); // In header
    const googleSignInButton = document.getElementById('google-signin-button'); // On login.html
    const userStatusElement = document.getElementById('user-status'); // In header
    const loginStatusMessageElement = document.getElementById('login-status-message'); // On login.html

    const adminContentSection = document.getElementById('admin-content-section');
    const adminLoginSection = document.getElementById('admin-login-section');

    // Google Sign-In provider
    const provider = new firebase.auth.GoogleAuthProvider();

    // Function to sign in with Google
    async function signInWithGoogle() {
        try {
            const result = await auth.signInWithPopup(provider);
            // This gives you a Google Access Token. You can use it to access the Google API.
            // const credential = result.credential;
            // const token = credential.accessToken;
            // const user = result.user;
            console.log("Signed in user:", result.user.displayName);
            if (loginStatusMessageElement) loginStatusMessageElement.textContent = `Welcome, ${result.user.displayName}! Redirecting...`;

            // Redirect to homepage after login, or stay if on admin and admin conditions met
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Error during Google Sign-In:", error);
            if (loginStatusMessageElement) {
                loginStatusMessageElement.textContent = `Login failed: ${error.message}`;
            } else if (userStatusElement) {
                userStatusElement.textContent = `Login failed.`;
            }
            alert(`Login Error: ${error.code} - ${error.message}`);
        }
    }

    // Function to sign out
    async function signOut() {
        try {
            await auth.signOut();
            console.log("User signed out.");
            // If on admin page, hide admin content and show login prompt
            if (adminContentSection && adminLoginSection) {
                adminContentSection.style.display = 'none';
                adminLoginSection.style.display = 'block';
            }
            // Potentially redirect to home or login page
            // if (window.location.pathname.includes('admin.html')) {
            //     window.location.href = 'index.html';
            // }
        } catch (error) {
            console.error("Error signing out:", error);
            alert("Error signing out. Please try again.");
        }
    }

    // Update UI based on auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            if (userStatusElement) {
                userStatusElement.textContent = `Logged in as ${user.displayName || user.email}`;
            }
            if (loginButton) {
                loginButton.textContent = 'Logout';
                loginButton.onclick = signOut; // Change action to sign out
            }
            if (googleSignInButton) { // On login.html, if user gets there while logged in
                googleSignInButton.style.display = 'none';
                if (loginStatusMessageElement) loginStatusMessageElement.textContent = `You are already logged in as ${user.displayName}.`;
            }

            // Admin page specific logic
            if (window.location.pathname.includes('admin.html')) {
                // For simplicity, any logged-in user can see admin content.
                // TODO: Implement actual admin role check (e.g., via Firestore custom claims or a list of admin UIDs)
                if (adminContentSection) adminContentSection.style.display = 'block';
                if (adminLoginSection) adminLoginSection.style.display = 'none';
                // Trigger loading of admin products if the function is available from admin.js
                if (window.adminModule && typeof window.adminModule.loadAdminProducts === 'function') {
                    window.adminModule.loadAdminProducts();
                }
            }

        } else {
            // User is signed out
            if (userStatusElement) {
                userStatusElement.textContent = 'Logged out';
            }
            if (loginButton) {
                loginButton.textContent = 'Login';
                loginButton.onclick = () => { // Change action to go to login page or trigger sign-in
                    // If a dedicated login page exists:
                    if (window.location.pathname !== '/login.html') {
                         window.location.href = 'login.html';
                    } else {
                        // If on login.html itself, or if we want a popup directly
                        signInWithGoogle();
                    }
                };
            }
            if (googleSignInButton) { // On login.html
                googleSignInButton.style.display = 'block';
                googleSignInButton.onclick = signInWithGoogle;
                if (loginStatusMessageElement) loginStatusMessageElement.textContent = 'Please sign in to continue.';
            }

            // Admin page specific logic
            if (window.location.pathname.includes('admin.html')) {
                if (adminContentSection) adminContentSection.style.display = 'none';
                if (adminLoginSection) adminLoginSection.style.display = 'block';
                 if (document.getElementById('admin-product-list')) {
                    document.getElementById('admin-product-list').innerHTML = '<p>Please log in to manage products.</p>';
                }
            }
        }
    });

    // Attach event listener for the main login button in the header
    // The onAuthStateChanged handles its text and action, but if it's clicked when text is "Login"
    if (loginButton && loginButton.textContent === 'Login') {
         loginButton.addEventListener('click', () => {
            // This logic is mostly handled by onAuthStateChanged now by setting onclick
            // If not on login.html, redirect there. Otherwise, directly attempt sign-in.
            if (window.location.pathname.includes('login.html')) {
                signInWithGoogle();
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // Attach event listener for the Google Sign-In button on the login page
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', signInWithGoogle);
    }

    // Expose functions for other modules or inline scripts if necessary
    // e.g. for the inline script in login.html
    window.authModule = {
        signInWithGoogle,
        signOut,
        redirectToHomeIfLoggedIn: () => {
            if (auth.currentUser && window.location.pathname.includes('login.html')) {
                window.location.href = 'index.html';
            }
        }
    };
    // Perform initial redirect check if on login page
    if (window.location.pathname.includes('login.html')) {
        window.authModule.redirectToHomeIfLoggedIn();
    }

});
