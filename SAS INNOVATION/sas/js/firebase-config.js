// ====================================================================
// Firebase Configuration Module
// ====================================================================
// Initializes Firebase with modular v9+ SDK
// Exports auth and db instances for use throughout the app

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ====================================================================
// Firebase Configuration
// ====================================================================
// IMPORTANT: Replace these values with your Firebase project credentials
// Get these from: Firebase Console > Project Settings > Web App Config

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID" // Optional
};

// ====================================================================
// Initialize Firebase
// ====================================================================

let app;
let auth;
let db;

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