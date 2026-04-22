// Authentication Module
// Handles user signup, login, and logout

import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

// ===== State Management =====
let isSignupMode = true; // Track current auth mode

// ===== DOM Elements =====
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authButton = document.getElementById("authButton");
const toggleButton = document.getElementById("toggleButton");
const authTitle = document.getElementById("authTitle");
const toggleText = document.getElementById("toggleText");
const alertBox = document.getElementById("alertBox");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");

// ===== Form Toggle =====
/**
 * Toggle between signup and login modes
 */
if (toggleButton) {
    toggleButton.addEventListener("click", () => {
        isSignupMode = !isSignupMode;
        updateAuthUI();
    });
}

/**
 * Update UI based on current auth mode
 */
function updateAuthUI() {
    if (isSignupMode) {
        authTitle.textContent = "Create Account";
        authButton.textContent = "Sign Up";
        toggleText.textContent = "Already have an account?";
        toggleButton.textContent = "Login";
    } else {
        authTitle.textContent = "Welcome Back";
        authButton.textContent = "Login";
        toggleText.textContent = "Don't have an account?";
        toggleButton.textContent = "Sign Up";
    }
    // Clear form when toggling
    authForm.reset();
    hideAlert();
}

// Check URL parameter for mode (if on login page)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode");
if (mode === "login") {
    isSignupMode = false;
    updateAuthUI();
}

// ===== Alert Management =====
/**
 * Display alert message to user
 * @param {string} message - Alert message
 * @param {string} type - 'success' or 'error'
 */
function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = type === "error" ? "alert alert-error" : "alert alert-success";
    alertBox.classList.remove("hidden");
}

/**
 * Hide alert message
 */
function hideAlert() {
    alertBox.classList.add("hidden");
}

// ===== Authentication Functions =====
/**
 * Handle user signup
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function handleSignup(email, password) {
    try {
        authButton.disabled = true;
        authButton.textContent = "Creating account...";

        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        showAlert("Account created successfully! Redirecting...", "success");
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
            window.location.href = "../dashboard/index.html";
        }, 1500);

    } catch (error) {
        console.error("Signup error:", error);
        
        // Handle specific errors
        let errorMessage = "Failed to create account";
        if (error.code === "auth/email-already-in-use") {
            errorMessage = "Email already in use. Please login instead.";
        } else if (error.code === "auth/weak-password") {
            errorMessage = "Password should be at least 6 characters.";
        } else if (error.code === "auth/invalid-email") {
            errorMessage = "Invalid email address.";
        }
        
        showAlert(errorMessage, "error");
        authButton.disabled = false;
        authButton.textContent = "Sign Up";
    }
}

/**
 * Handle user login
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function handleLogin(email, password) {
    try {
        authButton.disabled = true;
        authButton.textContent = "Logging in...";

        // Sign in user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        showAlert("Login successful! Redirecting...", "success");
        
        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
            window.location.href = "../dashboard/index.html";
        }, 1500);

    } catch (error) {
        console.error("Login error:", error);
        
        // Handle specific errors
        let errorMessage = "Failed to login";
        if (error.code === "auth/user-not-found") {
            errorMessage = "User not found. Please create an account.";
        } else if (error.code === "auth/wrong-password") {
            errorMessage = "Incorrect password.";
        } else if (error.code === "auth/invalid-email") {
            errorMessage = "Invalid email address.";
        }
        
        showAlert(errorMessage, "error");
        authButton.disabled = false;
        authButton.textContent = "Login";
    }
}

// ===== Form Submission =====
/**
 * Handle form submission
 */
if (authForm) {
    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Validate inputs
        if (!email || !password) {
            showAlert("Please fill in all fields.", "error");
            return;
        }

        if (password.length < 6) {
            showAlert("Password must be at least 6 characters.", "error");
            return;
        }

        // Call appropriate function based on mode
        if (isSignupMode) {
            await handleSignup(email, password);
        } else {
            await handleLogin(email, password);
        }
    });
}

// ===== Logout Functionality =====
/**
 * Handle logout
 */
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            logoutBtn.disabled = true;
            logoutBtn.textContent = "Logging out...";

            await signOut(auth);
            
            // Redirect to home page
            window.location.href = "../index.html";

        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout");
            logoutBtn.disabled = false;
            logoutBtn.textContent = "Logout";
        }
    });
}

// ===== Auth State Management =====
/**
 * Monitor authentication state changes
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        if (userEmail) {
            userEmail.textContent = user.email;
        }
        
        // Redirect to dashboard if on login page
        if (window.location.pathname.includes("auth/login.html")) {
            window.location.href = "../dashboard/index.html";
        }

    } else {
        // User is logged out
        
        // Redirect to login if on dashboard
        if (window.location.pathname.includes("dashboard")) {
            window.location.href = "../auth/login.html";
        }
    }
});

// Export for use in other modules
export { showAlert, hideAlert };