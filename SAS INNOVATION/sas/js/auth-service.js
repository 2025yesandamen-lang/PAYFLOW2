// ====================================================================
// Authentication Service Module
// ====================================================================
// Handles all authentication operations:
// - Signup
// - Login
// - Logout
// - Password reset
// - Email verification
// - Session management

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    deleteUser,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import { auth, getCurrentUser } from "./firebase-config.js";

// ====================================================================
// Constants
// ====================================================================
const PASSWORD_MIN_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ====================================================================
// Signup Function
// ====================================================================
/**
 * Create a new user account with email and password
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @param {string} fullName - User's full name
 * 
 * @returns {Promise<Object>} User object with uid, email, displayName
 * 
 * @throws {Error} Various Firebase Auth errors:
 * - auth/email-already-in-use
 * - auth/weak-password
 * - auth/invalid-email
 * - auth/operation-not-allowed
 * 
 * @example
 * try {
 *     const user = await signup('user@example.com', 'password123', 'John Doe');
 *     console.log('User created:', user.uid);
 * } catch (error) {
 *     console.error('Signup failed:', error.message);
 * }
 */
export async function signup(email, password, fullName) {
    try {
        // Validate inputs
        validateEmail(email);
        validatePassword(password);
        validateFullName(fullName);

        // Create user account with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user profile with full name
        await updateProfile(user, {
            displayName: fullName
        });

        console.log("✅ User created successfully:", user.uid);

        // Return user info
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.metadata.creationTime
        };

    } catch (error) {
        console.error("❌ Signup error:", error);
        throw formatAuthError(error);
    }
}

// ====================================================================
// Login Function
// ====================================================================
/**
 * Sign in user with email and password
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * 
 * @returns {Promise<Object>} User object with uid, email, displayName
 * 
 * @throws {Error} Various Firebase Auth errors:
 * - auth/user-not-found
 * - auth/wrong-password
 * - auth/invalid-email
 * - auth/user-disabled
 * 
 * @example
 * try {
 *     const user = await login('user@example.com', 'password123');
 *     console.log('Logged in as:', user.email);
 * } catch (error) {
 *     console.error('Login failed:', error.message);
 * }
 */
export async function login(email, password) {
    try {
        // Validate inputs
        validateEmail(email);
        if (!password) {
            throw new Error("Password is required");
        }

        // Sign in user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("✅ User logged in successfully:", user.email);

        // Return user info
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            lastSignInTime: user.metadata.lastSignInTime
        };

    } catch (error) {
        console.error("❌ Login error:", error);
        throw formatAuthError(error);
    }
}

// ====================================================================
// Logout Function
// ====================================================================
/**
 * Sign out the current user
 * 
 * @returns {Promise<void>}
 * 
 * @throws {Error} Firebase error if logout fails
 * 
 * @example
 * try {
 *     await logout();
 *     console.log('User logged out');
 *     window.location.href = 'login.html';
 * } catch (error) {
 *     console.error('Logout failed:', error.message);
 * }
 */
export async function logout() {
    try {
        // Sign out user
        await signOut(auth);

        console.log("✅ User logged out successfully");

        // Clear any cached user data
        clearUserCache();

        return true;

    } catch (error) {
        console.error("❌ Logout error:", error);
        throw formatAuthError(error);
    }
}

// ====================================================================
// Password Reset Function
// ====================================================================
/**
 * Send password reset email to user
 * 
 * @param {string} email - Email address to send reset link to
 * 
 * @returns {Promise<void>}
 * 
 * @throws {Error} Firebase error if email not found or other issues
 * 
 * @example
 * try {
 *     await sendPasswordReset('user@example.com');
 *     console.log('Password reset email sent');
 * } catch (error) {
 *     console.error('Failed to send reset email:', error.message);
 * }
 */
export async function sendPasswordReset(email) {
    try {
        // Validate email
        validateEmail(email);

        // Send password reset email
        await sendPasswordResetEmail(auth, email, {
            url: `${window.location.origin}/login.html`,
            handleCodeInApp: true
        });

        console.log("✅ Password reset email sent to:", email);

        return true;

    } catch (error) {
        console.error("❌ Password reset error:", error);
        throw formatAuthError(error);
    }
}

// ====================================================================
// Change Password Function
// ====================================================================
/**
 * Change password for currently authenticated user
 * Requires user to be logged in
 * 
 * @param {string} currentPassword - User's current password
 * @param {string} newPassword - New password (min 6 characters)
 * 
 * @returns {Promise<void>}
 * 
 * @throws {Error} Firebase error or validation error
 * 
 * @example
 * try {
 *     await changePassword('oldPassword123', 'newPassword456');
 *     console.log('Password changed successfully');
 * } catch (error) {
 *     console.error('Failed to change password:', error.message);
 * }
 */
export async function changePassword(currentPassword, newPassword) {
    try {
        const user = getCurrentUser();

        if (!user) {
            throw new Error("User must be logged in to change password");
        }

        // Validate new password
        validatePassword(newPassword);

        // Reauthenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        console.log("✅ Password changed successfully");

        return true;

    } catch (error) {
        console.error("❌ Change password error:", error);
        throw formatAuthError(error);
    }
}

// ====================================================================
// Update User Profile
// ====================================================================
/**
 * Update user profile information
 * 
 * @param {Object} profileData - Profile data to update
 * @param {string} profileData.displayName - User's display name (optional)
 * @param {string} profileData.photoURL - User's photo URL (optional)
 * 
 * @returns {Promise<Object>} Updated user data
 * 
 * @throws {Error} Firebase error if update fails
 * 
 * @example
 * try {
 *     const updated = await updateUserProfile({
 *         displayName: 'John Smith',
 *         photoURL: 'https://example.com/photo.jpg'
 *     });
 *     console.log('Profile updated:', updated);
 * } catch (error) {
 *     console.error('Failed to update profile:', error.message);
 * }
 */
export async function updateUserProfile(profileData) {
    try {
        const user = getCurrentUser();

        if (!user) {
            throw new Error("User must be logged in to update profile");
        }

        // Update profile
        await updateProfile(user, profileData);

        // Reload user info
        await user.reload();

        console.log("✅ User profile updated");

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };

    } catch (error) {
        console.error("❌ Update profile error:", error);
        throw formatAuthError(error);
    }
}

// ====================================================================
// Delete Account
// ====================================================================
/**
 * Permanently delete user account
 * WARNING: This action is permanent and cannot be undone
 * 
 * @returns {Promise<void>}
 * 
 * @throws {Error} Firebase error if deletion fails
 * 
 * @example
 * try {
 *     if (confirm('Are you sure? This action cannot be undone.')) {
 *         await deleteAccount();
 *         console.log('Account deleted');
 *         window.location.href = 'index.html';
 *     }
 * } catch (error) {
 *     console.error('Failed to delete account:', error.message);
 * }
 */
export async function deleteAccount() {
    try {
        const user = getCurrentUser();

        if (!user) {
            throw new Error("User must be logged in to delete account");
        }

        // Delete user
        await deleteUser(user);

        console.log("✅ User account deleted");

        // Clear cache
        clearUserCache();

        return true;

    } catch (error) {
        console.error("❌ Delete account error:", error);
        throw formatAuthError(error);
    }
}

// ====================================================================
// Get Current User
// ====================================================================
/**
 * Get currently authenticated user
 * 
 * @returns {User|null} Firebase User object or null if not logged in
 */
export function getCurrentAuthUser() {
    return getCurrentUser();
}

// ====================================================================
// On Auth State Changed
// ====================================================================
/**
 * Listen for authentication state changes
 * Useful for syncing UI with auth status
 * 
 * @param {Function} callback - Called with user object or null
 * 
 * @returns {Function} Unsubscribe function
 * 
 * @example
 * const unsubscribe = onAuthChange((user) => {
 *     if (user) {
 *         console.log('User logged in:', user.email);
 *     } else {
 *         console.log('User logged out');
 *     }
 * });
 * 
 * // Later: unsubscribe();
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// ====================================================================
// Validation Functions
// ====================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @throws {Error} If email is invalid
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        throw new Error("Email is required");
    }

    if (!EMAIL_REGEX.test(email)) {
        throw new Error("Invalid email format");
    }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @throws {Error} If password is weak
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error("Password is required");
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
}

/**
 * Validate full name
 * @param {string} fullName - Name to validate
 * @throws {Error} If name is invalid
 */
function validateFullName(fullName) {
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
        throw new Error("Full name is required");
    }

    if (fullName.length < 2) {
        throw new Error("Full name must be at least 2 characters");
    }

    if (fullName.length > 100) {
        throw new Error("Full name must be less than 100 characters");
    }
}

// ====================================================================
// Error Formatting
// ====================================================================

/**
 * Format Firebase authentication errors to user-friendly messages
 * @param {Error} error - Firebase error
 * @returns {Error} Formatted error with user-friendly message
 */
function formatAuthError(error) {
    console.error("Raw Firebase error:", error);

    let userMessage = "An error occurred. Please try again.";
    let errorDetails = error.message;

    // Map Firebase error codes to user-friendly messages
    switch (error.code) {
        case "auth/email-already-in-use":
            userMessage = "Email already in use";
            errorDetails = "This email is already registered. Please login or use a different email.";
            break;

        case "auth/weak-password":
            userMessage = "Password too weak";
            errorDetails = "Password must be at least 6 characters long.";
            break;

        case "auth/invalid-email":
            userMessage = "Invalid email";
            errorDetails = "Please enter a valid email address.";
            break;

        case "auth/user-not-found":
            userMessage = "User not found";
            errorDetails = "No account found with this email. Please sign up first.";
            break;

        case "auth/wrong-password":
            userMessage = "Wrong password";
            errorDetails = "The password you entered is incorrect. Please try again.";
            break;

        case "auth/user-disabled":
            userMessage = "Account disabled";
            errorDetails = "Your account has been disabled. Please contact support.";
            break;

        case "auth/operation-not-allowed":
            userMessage = "Operation not allowed";
            errorDetails = "Email/password authentication is not enabled. Please contact support.";
            break;

        case "auth/too-many-requests":
            userMessage = "Too many attempts";
            errorDetails = "Too many failed login attempts. Please try again later.";
            break;

        case "auth/network-request-failed":
            userMessage = "Network error";
            errorDetails = "Failed to connect to the server. Please check your internet connection.";
            break;

        case "auth/requires-recent-login":
            userMessage = "Please login again";
            errorDetails = "For security reasons, please login again before making this change.";
            break;

        default:
            userMessage = error.message || userMessage;
    }

    // Create a new error with formatted message
    const formattedError = new Error(userMessage);
    formattedError.details = errorDetails;
    formattedError.code = error.code;

    return formattedError;
}

// ====================================================================
// User Cache Management
// ====================================================================

/**
 * Clear user-related data from cache/storage
 * Called on logout or account deletion
 */
function clearUserCache() {
    try {
        // Clear localStorage
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_uid');

        // Clear sessionStorage
        sessionStorage.removeItem('auth_token');

        console.log("✅ User cache cleared");
    } catch (error) {
        console.warn("Error clearing cache:", error);
    }
}

/**
 * Store user data in cache for quick access
 * @param {User} user - Firebase user object
 */
export function cacheUserData(user) {
    if (user) {
        localStorage.setItem('user_email', user.email);
        localStorage.setItem('user_name', user.displayName || 'User');
        localStorage.setItem('user_uid', user.uid);
    }
}

// ====================================================================
// Session Management
// ====================================================================

/**
 * Check if user has valid session
 * @returns {boolean} True if user is authenticated
 */
export function hasValidSession() {
    return !!getCurrentUser();
}

/**
 * Get session info
 * @returns {Object|null} Session info or null if not logged in
 */
export function getSessionInfo() {
    const user = getCurrentUser();
    if (!user) return null;

    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime,
        isAnonymous: user.isAnonymous
    };
}