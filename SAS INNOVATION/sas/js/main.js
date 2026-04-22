// ====================================================================
// Main Initialization Module
// ====================================================================
// Initializes the application and coordinates all modules

import { initRouteProtection } from "./route-protection.js";

// ====================================================================
// Application Initialization
// ====================================================================

/**
 * Initialize the entire application
 */
function initializeApp() {
    console.log("🚀 Initializing PayFlow application...");

    // Initialize route protection
    // This must be called first to protect routes and update UI
    initRouteProtection();

    // Set up global error handler
    setupGlobalErrorHandler();

    // Check browser compatibility
    checkBrowserCompatibility();

    console.log("✅ Application initialized successfully");
}

// ====================================================================
// Global Error Handler
// ====================================================================

/**
 * Setup global error handler for uncaught errors
 */
function setupGlobalErrorHandler() {
    window.addEventListener("error", (event) => {
        console.error("❌ Uncaught error:", event.error);
        // You can send this to a logging service
    });

    window.addEventListener("unhandledrejection", (event) => {
        console.error("❌ Unhandled promise rejection:", event.reason);
        // You can send this to a logging service
    });
}

// ====================================================================
// Browser Compatibility Check
// ====================================================================

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    // Check for required APIs
    const requiredAPIs = {
        "localStorage": typeof Storage !== "undefined",
        "Promise": typeof Promise !== "undefined",
        "fetch": typeof fetch !== "undefined"
    };

    const unsupported = Object.keys(requiredAPIs).filter(api => !requiredAPIs[api]);

    if (unsupported.length > 0) {
        console.warn("⚠️ Your browser is missing support for:", unsupported.join(", "));
        alert("Your browser is not fully compatible with this application. Please upgrade your browser.");
    }
}

// ====================================================================
// Initialize on Page Load
// ====================================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// ====================================================================
// Export Functions
// ====================================================================

export { initializeApp };