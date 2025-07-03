// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTAjEgyFixXk8yFLpWqwXTnTZPeqlWN-Y",
  authDomain: "ecommerce-70f46.firebaseapp.com",
  projectId: "ecommerce-70f46",
  storageBucket: "ecommerce-70f46.firebasestorage.app",
  messagingSenderId: "819563520513",
  appId: "1:819563520513:web:2d6eb65ab863806153d600",
  measurementId: "G-DJJLK89T9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);