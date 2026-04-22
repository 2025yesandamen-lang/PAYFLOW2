// ====================================================================
// Route Protection Module
// ====================================================================
// Protects dashboard and settings pages
// Redirects unauthenticated users to login page
// Only authenticated users can access protected routes

import { onAuthChange } from "./auth-service.js";

// ====================================================================
// Protected Routes Configuration
// ====================================================================

const PROTECTED_ROUTES = [
    "dashboard.html",
    "settings.html"
];

const AUTH_ROUTES = [
    "login.html",
    "signup.html"
];

const PUBLIC_ROUTES = [
    "index.html",
    "forgot-password.html"
];

// ====================================================================
// Check Current Route
// ====================================================================

/**
 * Get current page filename
 * @returns {string} Current page filename
 */
function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1) || "index.html";
}

/**
 * Check if current page is protected
 * @returns {boolean} True if page is protected
 */
function isProtectedRoute() {
    const currentPage = getCurrentPage();
    return PROTECTED_ROUTES.some(route => currentPage.includes(route));
}

/**
 * Check if current page is auth page
 * @returns {boolean} True if page is auth page
 */
function isAuthRoute() {
    const currentPage = getCurrentPage();
    return AUTH_ROUTES.some(route => currentPage.includes(route));
}

// ====================================================================
// Route Protection Logic
// ====================================================================

/**
 * Protect routes based on authentication status
 */
export function initRouteProtection() {
    // Listen for auth state changes
    onAuthChange((user) => {
        const isProtected = isProtectedRoute();
        const isAuth = isAuthRoute();

        if (user) {
            // User is logged in
            
            if (isAuth) {
                // Redirect from auth pages to dashboard
                console.log("🔄 User already logged in, redirecting to dashboard");
                window.location.href = "dashboard.html";
            }

            // User can access protected routes
            // Update UI to show logged-in state
            updateUIForLoggedInUser(user);

        } else {
            // User is not logged in

            if (isProtected) {
                // Redirect from protected pages to login
                console.log("🔒 Access denied, redirecting to login");
                window.location.href = "login.html";
            }

            // Update UI to show logged-out state
            updateUIForLoggedOutUser();
        }
    });
}

// ====================================================================
// UI Update Functions
// ====================================================================

/**
 * Update UI when user is logged in
 * @param {User} user - Firebase user object
 */
function updateUIForLoggedInUser(user) {
    // Show user menu, hide auth links
    const userMenu = document.getElementById("userMenu");
    const navLinks = document.getElementById("navLinks");

    if (userMenu) {
        userMenu.classList.remove("hidden");
        userMenu.classList.add("flex");
    }

    if (navLinks) {
        navLinks.classList.add("hidden");
    }

    // Update user info in navigation
    const userEmailNav = document.getElementById("userEmailNav");
    const userEmailNav2 = document.getElementById("userEmailNav2");
    const userNameNav = document.getElementById("userNameNav");
    const avatarNav = document.getElementById("avatarNav");

    if (userEmailNav) {
        userEmailNav.textContent = user.email;
    }

    if (userEmailNav2) {
        userEmailNav2.textContent = user.email;
    }

    if (userNameNav) {
        userNameNav.textContent = user.displayName || "User";
    }

    // Update avatar with user initials
    if (avatarNav) {
        const initials = getInitials(user.displayName || user.email);
        avatarNav.textContent = initials;
        avatarNav.setAttribute("title", user.displayName || user.email);
    }

    // Update dashboard greeting
    const userName = document.getElementById("userName");
    if (userName) {
        userName.textContent = user.displayName ? user.displayName.split(" ")[0] : "User";
    }

    // Update profile fields
    const fullNameInput = document.getElementById("fullNameInput");
    const emailInput = document.getElementById("emailInput");

    if (fullNameInput && user.displayName) {
        fullNameInput.value = user.displayName;
    }

    if (emailInput) {
        emailInput.value = user.email;
    }

    // Update user profile avatar display
    const userProfileAvatar = document.getElementById("avatarDisplay");
    if (userProfileAvatar) {
        const initials = getInitials(user.displayName || user.email);
        userProfileAvatar.textContent = initials;
    }
}

/**
 * Update UI when user is logged out
 */
function updateUIForLoggedOutUser() {
    // Show auth links, hide user menu
    const userMenu = document.getElementById("userMenu");
    const navLinks = document.getElementById("navLinks");

    if (userMenu) {
        userMenu.classList.add("hidden");
        userMenu.classList.remove("flex");
    }

    if (navLinks) {
        navLinks.classList.remove("hidden");
    }

    // Clear user info
    const userEmailNav = document.getElementById("userEmailNav");
    const userNameNav = document.getElementById("userNameNav");
    const avatarNav = document.getElementById("avatarNav");

    if (userEmailNav) {
        userEmailNav.textContent = "";
    }

    if (userNameNav) {
        userNameNav.textContent = "";
    }

    if (avatarNav) {
        avatarNav.textContent = "";
    }
}

// ====================================================================
// Helper Functions
// ====================================================================

/**
 * Get user initials from name or email
 * @param {string} nameOrEmail - User name or email
 * @returns {string} Two-letter initials
 */
function getInitials(nameOrEmail) {
    if (!nameOrEmail) return "U";

    const parts = nameOrEmail.split(" ");

    if (parts.length > 1) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }

    // If email, return first two letters
    return nameOrEmail.substring(0, 2).toUpperCase();
}

/**
 * Redirect to login page with callback
 * Stores the current page to redirect back after login
 */
export function redirectToLogin() {
    const currentPage = getCurrentPage();

    if (!AUTH_ROUTES.includes(currentPage) && !PUBLIC_ROUTES.includes(currentPage)) {
        // Store redirect URL in session storage
        sessionStorage.setItem("redirectAfterLogin", currentPage);
    }

    window.location.href = "login.html";
}

/**
 * Handle post-login redirect
 * If user was redirected to login, send them back to original page
 */
export function handlePostLoginRedirect() {
    const redirectUrl = sessionStorage.getItem("redirectAfterLogin");

    if (redirectUrl && !redirectUrl.includes("login") && !redirectUrl.includes("signup")) {
        sessionStorage.removeItem("redirectAfterLogin");
        window.location.href = redirectUrl;
    } else {
        window.location.href = "dashboard.html";
    }
}

// ====================================================================
// Export Functions
// ====================================================================

export {
    isProtectedRoute,
    isAuthRoute,
    getCurrentPage
};