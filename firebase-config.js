// TODO: Add your Firebase project configuration here
const firebaseConfig = {
  apiKey: "AIzaSyDTAjEgyFixXk8yFLpWqwXTnTZPeqlWN-Y",
  authDomain: "ecommerce-70f46.firebaseapp.com",
  projectId: "ecommerce-70f46",
  storageBucket: "ecommerce-70f46.firebasestorage.app",
  messagingSenderId: "819563520513",
  appId: "1:819563520513:web:2d6eb65ab863806153d600",
  measurementId: "G-DJJLK89T9C"
};

// Initialize Firebase (this should ideally be done once)
// We'll handle the actual initialization within each script
// that needs it, checking if it's already initialized.

// Export the config for use in other scripts
// For browser environments, you might not use ES6 modules directly without a bundler.
// Instead, scripts will access firebaseConfig globally or it will be passed around.
// For simplicity here, we assume firebase-config.js is loaded first and
// firebaseConfig becomes a global variable.

console.log("Firebase config loaded (remember to replace placeholders).");

// It's good practice to wrap Firebase SDK calls.
// For now, we'll let auth.js and app.js initialize Firebase app and services themselves
// after checking if an app instance already exists.
// This avoids issues if scripts are loaded in an unexpected order or multiple times.

// Example of how other files might use it:
// if (typeof firebase !== 'undefined' && !firebase.apps.length) {
// firebase.initializeApp(firebaseConfig);
// }
// const auth = firebase.auth();
// const db = firebase.firestore();
