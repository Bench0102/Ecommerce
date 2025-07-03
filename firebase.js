// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth }_from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // Optional: if you need analytics

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTAjEgyFixXk8yFLpWqwXTnTZPeqlWN-Y", // Replace with your actual API key
  authDomain: "ecommerce-70f46.firebaseapp.com",
  projectId: "ecommerce-70f46",
  storageBucket: "ecommerce-70f46.appspot.com", // Corrected: .appspot.com for storageBucket
  messagingSenderId: "819563520513",
  appId: "1:819563520513:web:2d6eb65ab863806153d600",
  measurementId: "G-DJJLK89T9C" // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app); // Optional

// Export the services for use in other modules
export { app, auth, db };

console.log("Firebase v9 SDK initialized and services exported (firebase.js).");
