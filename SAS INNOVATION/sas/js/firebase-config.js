// ====================================================================
// Firebase Configuration Module
// ====================================================================
// Initializes Firebase with modular v9+ SDK
// Exports auth and db instances for use throughout the app

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC33i5BYOGABIuxeQu0oF0qaL7KJhVo0x8",
  authDomain: "invoice-8a62a.firebaseapp.com",
  databaseURL: "https://invoice-8a62a-default-rtdb.firebaseio.com",
  projectId: "invoice-8a62a",
  storageBucket: "invoice-8a62a.firebasestorage.app",
  messagingSenderId: "307582903461",
  appId: "1:307582903461:web:b171244d590554a052594c",
  measurementId: "G-HY20ZZKH9C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

try {
    // Initialize Firebase App
    app = initializeApp(firebaseConfig);
    
    // Get Auth service
    auth = getAuth(app);
    
    // Get Firestore Database service
    db = getFirestore(app);
    
    console.log("✅ Firebase initialized successfully");
    
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    throw new Error("Failed to initialize Firebase");
}

// ====================================================================
// Enable Emulator (Development Only)
// ====================================================================
// Uncomment the following lines to use Firebase Emulator Suite
// Make sure to start emulators with: firebase emulators:start

/*
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    try {
        // Connect to Auth Emulator (port 9099)
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        console.log("🧪 Auth Emulator connected");
        
        // Connect to Firestore Emulator (port 8080)
        connectFirestoreEmulator(db, "localhost", 8080);
        console.log("🧪 Firestore Emulator connected");
    } catch (error) {
        console.warn("Emulator connection error:", error.message);
    }
}
*/

// ====================================================================
// Exports
// ====================================================================
// These will be imported in other modules

export { app, auth, db };

// ====================================================================
// Helper: Get Current User
// ====================================================================
/**
 * Get currently authenticated user
 * @returns {User|null} Current user or null if not authenticated
 */
export function getCurrentUser() {
    return auth.currentUser;
}

// ====================================================================
// Helper: Check if User is Authenticated
// ====================================================================
/**
 * Check if user is currently authenticated
 * @returns {boolean} True if user is logged in
 */
export function isUserAuthenticated() {
    return !!auth.currentUser;
}

// ====================================================================
// Helper: Get Auth Instance
// ====================================================================
/**
 * Get Firebase Auth instance
 * Useful for accessing auth methods directly
 * @returns {Auth} Firebase Auth instance
 */
export function getAuthInstance() {
    return auth;
}

// ====================================================================
// Helper: Get Firestore Instance
// ====================================================================
/**
 * Get Firestore database instance
 * Useful for accessing database methods directly
 * @returns {Firestore} Firestore database instance
 */
export function getFirestoreInstance() {
    return db;
}

// ====================================================================
// Optional: Setup Authentication State Listener
// ====================================================================
/**
 * Listen for authentication state changes
 * This can be used throughout the app to sync UI with auth state
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function to remove listener
 */
export function onAuthStateChange(callback) {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        if (callback && typeof callback === 'function') {
            callback(user);
        }
    });
    return unsubscribe;
}
