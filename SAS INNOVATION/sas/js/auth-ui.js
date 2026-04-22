// ====================================================================
// Authentication UI Module
// ====================================================================
// Handles all authentication UI interactions:
// - Form validation
// - Form submission
// - Error/success display
// - Loading states
// - Password visibility toggle

import {
    signup,
    login,
    logout,
    sendPasswordReset,
    changePassword,
    onAuthChange,
    cacheUserData
} from "./auth-service.js";

// ====================================================================
// DOM Elements - Signup
// ====================================================================
const signupForm = document.getElementById("signupForm");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const confirmPassword = document.getElementById("confirmPassword");
const fullName = document.getElementById("fullName");
const signupButton = document.getElementById("signupButton");
const errorAlert = document.getElementById("errorAlert");
const errorMessage = document.getElementById("errorMessage");
const errorDetails = document.getElementById("errorDetails");
const successAlert = document.getElementById("successAlert");
const successMessage = document.getElementById("successMessage");

// ====================================================================
// DOM Elements - Login
// ====================================================================
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const rememberMe = document.getElementById("rememberMe");
const loginButton = document.getElementById("loginButton");
const loginErrorAlert = document.getElementById("errorAlert");
const loginErrorMessage = document.getElementById("errorMessage");
const loginSuccessAlert = document.getElementById("successAlert");
const loginSuccessMessage = document.getElementById("successMessage");

// ====================================================================
// Signup Form Handler
// ====================================================================

if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
}

/**
 * Handle signup form submission
 * @param {Event} e - Form submit event
 */
async function handleSignupSubmit(e) {
    e.preventDefault();

    // Clear alerts
    hideAlerts();

    // Get form values
    const email = signupEmail?.value.trim() || "";
    const password = signupPassword?.value || "";
    const confirmPwd = confirmPassword?.value || "";
    const name = fullName?.value.trim() || "";

    // Validate form
    if (!validateSignupForm(email, password, confirmPwd, name)) {
        return;
    }

    try {
        // Show loading state
        setSignupLoading(true);

        // Call signup service
        const user = await signup(email, password, name);

        // Show success message
        showSuccess(successAlert, successMessage, "Account created successfully! Redirecting to dashboard...");

        // Cache user data
        cacheUserData(user);

        // Redirect after delay
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } catch (error) {
        console.error("Signup error:", error);
        showError(errorAlert, errorMessage, errorDetails, error);
        setSignupLoading(false);
    }
}

/**
 * Validate signup form inputs
 * @param {string} email - Email input
 * @param {string} password - Password input
 * @param {string} confirmPwd - Confirm password input
 * @param {string} name - Full name input
 * @returns {boolean} True if form is valid
 */
function validateSignupForm(email, password, confirmPwd, name) {
    const errors = [];

    // Validate name
    if (!name) {
        errors.push("fullName", "Full name is required");
    } else if (name.length < 2) {
        errors.push("fullName", "Full name must be at least 2 characters");
    }

    // Validate email
    if (!email) {
        errors.push("signupEmail", "Email is required");
    } else if (!isValidEmail(email)) {
        errors.push("signupEmail", "Valid email is required");
    }

    // Validate password
    if (!password) {
        errors.push("signupPassword", "Password is required");
    } else if (password.length < 6) {
        errors.push("signupPassword", "Password must be at least 6 characters");
    }

    // Validate password match
    if (password !== confirmPwd) {
        errors.push("confirmPassword", "Passwords must match");
    }

    // Display errors
    if (errors.length > 0) {
        for (let i = 0; i < errors.length; i += 2) {
            const elementId = errors[i];
            const errorMsg = errors[i + 1];
            const element = document.getElementById(elementId);
            if (element) {
                const errorText = element.nextElementSibling;
                if (errorText?.classList.contains("error-text")) {
                    errorText.textContent = errorMsg;
                    errorText.classList.remove("hidden");
                    element.classList.add("border-red-500");
                }
            }
        }
        return false;
    }

    return true;
}

// ====================================================================
// Login Form Handler
// ====================================================================

if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLoginSubmit(e) {
    e.preventDefault();

    // Clear alerts
    hideAlerts();

    // Get form values
    const email = loginEmail?.value.trim() || "";
    const password = loginPassword?.value || "";

    // Validate form
    if (!validateLoginForm(email, password)) {
        return;
    }

    try {
        // Show loading state
        setLoginLoading(true);

        // Call login service
        const user = await login(email, password);

        // Save remember me preference
        if (rememberMe?.checked) {
            localStorage.setItem("rememberEmail", email);
        }

        // Show success message
        showSuccess(loginSuccessAlert, loginSuccessMessage, "Login successful! Redirecting to dashboard...");

        // Cache user data
        cacheUserData(user);

        // Redirect after delay
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1500);

    } catch (error) {
        console.error("Login error:", error);
        showError(loginErrorAlert, loginErrorMessage, loginErrorMessage, error);
        setLoginLoading(false);
    }
}

/**
 * Validate login form inputs
 * @param {string} email - Email input
 * @param {string} password - Password input
 * @returns {boolean} True if form is valid
 */
function validateLoginForm(email, password) {
    const errors = [];

    // Validate email
    if (!email) {
        errors.push("loginEmail", "Email is required");
    } else if (!isValidEmail(email)) {
        errors.push("loginEmail", "Valid email is required");
    }

    // Validate password
    if (!password) {
        errors.push("loginPassword", "Password is required");
    }

    // Display errors
    if (errors.length > 0) {
        for (let i = 0; i < errors.length; i += 2) {
            const elementId = errors[i];
            const errorMsg = errors[i + 1];
            const element = document.getElementById(elementId);
            if (element) {
                const errorText = element.nextElementSibling;
                if (errorText?.classList.contains("error-text")) {
                    errorText.textContent = errorMsg;
                    errorText.classList.remove("hidden");
                    element.classList.add("border-red-500");
                }
            }
        }
        return false;
    }

    return true;
}

// ====================================================================
// Password Visibility Toggle
// ====================================================================

// Setup password visibility toggles
document.querySelectorAll(".togglePassword").forEach(btn => {
    btn.addEventListener("click", togglePasswordVisibility);
});

/**
 * Toggle password input visibility
 * @param {Event} e - Click event
 */
function togglePasswordVisibility(e) {
    e.preventDefault();

    const target = this.getAttribute("data-target");
    const input = document.querySelector(target);

    if (input) {
        if (input.type === "password") {
            input.type = "text";
            this.textContent = "🙈";
        } else {
            input.type = "password";
            this.textContent = "👁️";
        }
    }
}

// ====================================================================
// Password Strength Indicator
// ====================================================================

if (signupPassword) {
    signupPassword.addEventListener("input", updatePasswordStrength);
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength(e) {
    const password = e.target.value;
    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("passwordStrength");

    if (!strengthBar) return;

    let strength = 0;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    const isLongEnough = password.length >= 8;

    if (hasLowerCase) strength += 20;
    if (hasUpperCase) strength += 20;
    if (hasNumbers) strength += 20;
    if (hasSpecialChar) strength += 20;
    if (isLongEnough) strength += 20;

    // Update bar color and text
    strengthBar.style.width = strength + "%";
    strengthBar.className = "inline-block h-1 rounded mt-1";

    if (strength < 40) {
        strengthBar.classList.add("bg-red-500");
        strengthBar.classList.remove("bg-yellow-500", "bg-green-500");
        strengthText.textContent = "Password strength: Weak";
    } else if (strength < 70) {
        strengthBar.classList.add("bg-yellow-500");
        strengthBar.classList.remove("bg-red-500", "bg-green-500");
        strengthText.textContent = "Password strength: Fair";
    } else {
        strengthBar.classList.add("bg-green-500");
        strengthBar.classList.remove("bg-red-500", "bg-yellow-500");
        strengthText.textContent = "Password strength: Strong";
    }
}

// ====================================================================
// Load Remembered Email
// ====================================================================

if (loginEmail && localStorage.getItem("rememberEmail")) {
    loginEmail.value = localStorage.getItem("rememberEmail");
    if (rememberMe) rememberMe.checked = true;
}

// ====================================================================
// Logout Handler
// ====================================================================

const logoutBtn = document.getElementById("logoutBtn");
const logoutNavBtn = document.getElementById("logoutNavBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
}

if (logoutNavBtn) {
    logoutNavBtn.addEventListener("click", handleLogout);
}

/**
 * Handle logout button click
 */
async function handleLogout() {
    try {
        if (confirm("Are you sure you want to logout?")) {
            await logout();
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to logout: " + error.message);
    }
}

// ====================================================================
// Alert Functions
// ====================================================================

/**
 * Show error alert
 * @param {Element} alertElement - Alert container
 * @param {Element} messageElement - Message display element
 * @param {Element} detailsElement - Details display element
 * @param {Error} error - Error object
 */
function showError(alertElement, messageElement, detailsElement, error) {
    if (alertElement && messageElement) {
        alertElement.classList.remove("hidden");
        messageElement.textContent = error.message || "An error occurred";

        if (detailsElement && error.details) {
            detailsElement.textContent = error.details;
        }
    }
}

/**
 * Show success alert
 * @param {Element} alertElement - Alert container
 * @param {Element} messageElement - Message display element
 * @param {string} message - Success message
 */
function showSuccess(alertElement, messageElement, message) {
    if (alertElement && messageElement) {
        alertElement.classList.remove("hidden");
        messageElement.textContent = message;
    }
}

/**
 * Hide all alerts
 */
function hideAlerts() {
    const alerts = document.querySelectorAll("[id*='Alert']");
    alerts.forEach(alert => {
        alert.classList.add("hidden");
    });
}

// ====================================================================
// Loading State Functions
// ====================================================================

/**
 * Set signup button loading state
 * @param {boolean} isLoading - Loading state
 */
function setSignupLoading(isLoading) {
    if (signupButton) {
        signupButton.disabled = isLoading;
        const buttonText = document.getElementById("signupButtonText");
        const spinner = document.getElementById("signupSpinner");

        if (isLoading) {
            buttonText.textContent = "Creating account...";
            spinner.classList.remove("hidden");
        } else {
            buttonText.textContent = "Create Account";
            spinner.classList.add("hidden");
        }
    }
}

/**
 * Set login button loading state
 * @param {boolean} isLoading - Loading state
 */
function setLoginLoading(isLoading) {
    if (loginButton) {
        loginButton.disabled = isLoading;
        const buttonText = document.getElementById("loginButtonText");
        const spinner = document.getElementById("loginSpinner");

        if (isLoading) {
            buttonText.textContent = "Signing in...";
            spinner.classList.remove("hidden");
        } else {
            buttonText.textContent = "Sign In";
            spinner.classList.add("hidden");
        }
    }
}

// ====================================================================
// Email Validation Helper
// ====================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ====================================================================
// Real-time Form Validation
// ====================================================================

// Remove error styling on input
document.querySelectorAll("input[type='text'], input[type='email'], input[type='password']").forEach(input => {
    input.addEventListener("focus", function() {
        this.classList.remove("border-red-500");
        const errorText = this.nextElementSibling;
        if (errorText?.classList.contains("error-text")) {
            errorText.classList.add("hidden");
        }
    });
});