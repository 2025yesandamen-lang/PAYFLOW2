// ====================================================================
// User Manager Module
// ====================================================================
// Handles user profile management:
// - Update user profile
// - Change password
// - Delete account
// - Manage settings

import {
    updateUserProfile,
    changePassword,
    deleteAccount,
    getCurrentAuthUser,
    logout,
    cacheUserData
} from "./auth-service.js";

// ====================================================================
// DOM Elements
// ====================================================================

// Profile Tab
const profileForm = document.getElementById("profileForm");
const fullNameInput = document.getElementById("fullNameInput");
const companyName = document.getElementById("companyName");
const phoneNumber = document.getElementById("phoneNumber");
const profileSuccessAlert = document.getElementById("successAlert");
const profileErrorAlert = document.getElementById("errorAlert");
const profileSuccessMessage = document.getElementById("successMessage");
const profileErrorMessage = document.getElementById("errorMessage");

// Security Tab
const profileTab = document.getElementById("profileTab");
const securityTab = document.getElementById("securityTab");
const notificationsTab = document.getElementById("notificationsTab");
const profileTabContent = document.getElementById("profileTabContent");
const securityTabContent = document.getElementById("securityTabContent");
const notificationsTabContent = document.getElementById("notificationsTabContent");
const changePasswordForm = document.getElementById("changePasswordForm");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

// ====================================================================
// Tab Navigation
// ====================================================================

if (profileTab) {
    profileTab.addEventListener("click", () => switchTab("profile"));
}

if (securityTab) {
    securityTab.addEventListener("click", () => switchTab("security"));
}

if (notificationsTab) {
    notificationsTab.addEventListener("click", () => switchTab("notifications"));
}

/**
 * Switch between settings tabs
 * @param {string} tab - Tab name (profile, security, notifications)
 */
function switchTab(tab) {
    // Hide all tabs
    if (profileTabContent) profileTabContent.classList.add("hidden");
    if (securityTabContent) securityTabContent.classList.add("hidden");
    if (notificationsTabContent) notificationsTabContent.classList.add("hidden");

    // Remove active state from buttons
    if (profileTab) profileTab.classList.remove("text-indigo-600", "border-b-2", "border-indigo-600");
    if (securityTab) securityTab.classList.remove("text-indigo-600", "border-b-2", "border-indigo-600");
    if (notificationsTab) notificationsTab.classList.remove("text-indigo-600", "border-b-2", "border-indigo-600");

    // Show selected tab
    if (tab === "profile") {
        if (profileTabContent) profileTabContent.classList.remove("hidden");
        if (profileTab) {
            profileTab.classList.add("text-indigo-600", "border-b-2", "border-indigo-600");
        }
    } else if (tab === "security") {
        if (securityTabContent) securityTabContent.classList.remove("hidden");
        if (securityTab) {
            securityTab.classList.add("text-indigo-600", "border-b-2", "border-indigo-600");
        }
    } else if (tab === "notifications") {
        if (notificationsTabContent) notificationsTabContent.classList.remove("hidden");
        if (notificationsTab) {
            notificationsTab.classList.add("text-indigo-600", "border-b-2", "border-indigo-600");
        }
    }
}

// ====================================================================
// Profile Form Handler
// ====================================================================

if (profileForm) {
    profileForm.addEventListener("submit", handleProfileUpdate);
}

/**
 * Handle profile form submission
 * @param {Event} e - Form submit event
 */
async function handleProfileUpdate(e) {
    e.preventDefault();

    const user = getCurrentAuthUser();
    if (!user) {
        showProfileError("User not authenticated");
        return;
    }

    try {
        // Show loading state
        const submitBtn = profileForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving...";
        }

        // Update profile
        const newDisplayName = fullNameInput?.value || user.displayName;

        await updateUserProfile({
            displayName: newDisplayName
        });

        // Update cache
        cacheUserData(getCurrentAuthUser());

        // Show success message
        showProfileSuccess("Profile updated successfully!");

        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Save Changes";
        }

    } catch (error) {
        console.error("Profile update error:", error);
        showProfileError(error.message);
        const submitBtn = profileForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Save Changes";
        }
    }
}

// ====================================================================
// Change Password Handler
// ====================================================================

if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", handleChangePassword);
}

/**
 * Handle change password form submission
 * @param {Event} e - Form submit event
 */
async function handleChangePassword(e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword")?.value || "";
    const newPassword = document.getElementById("newPassword")?.value || "";
    const confirmPassword = document.getElementById("confirmNewPassword")?.value || "";

    // Validate inputs
    if (!currentPassword) {
        showSecurityError("Current password is required");
        return;
    }

    if (!newPassword) {
        showSecurityError("New password is required");
        return;
    }

    if (newPassword.length < 6) {
        showSecurityError("New password must be at least 6 characters");
        return;
    }

    if (newPassword !== confirmPassword) {
        showSecurityError("Passwords do not match");
        return;
    }

    try {
        const submitBtn = changePasswordForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Updating...";
        }

        // Change password
        await changePassword(currentPassword, newPassword);

        // Show success message
        showSecuritySuccess("Password changed successfully!");

        // Reset form
        changePasswordForm.reset();

        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Update Password";
        }

    } catch (error) {
        console.error("Change password error:", error);
        showSecurityError(error.message || error.details || "Failed to change password");
        const submitBtn = changePasswordForm.querySelector("button[type='submit']");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Update Password";
        }
    }
}

// ====================================================================
// Delete Account Handler
// ====================================================================

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", handleDeleteAccount);
}

/**
 * Handle delete account
 */
async function handleDeleteAccount() {
    // Show confirmation dialog
    const confirmed = confirm(
        "Are you sure you want to delete your account? " +
        "This action is permanent and cannot be undone. " +
        "All your data will be deleted."
    );

    if (!confirmed) return;

    // Ask for confirmation again
    const doubleConfirm = confirm(
        "This is your last chance. Click OK to permanently delete your account."
    );

    if (!doubleConfirm) return;

    try {
        const deleteBtn = deleteAccountBtn;
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.textContent = "Deleting...";
        }

        // Delete account
        await deleteAccount();

        // Show success message
        alert("Your account has been deleted. You will be redirected to the home page.");

        // Redirect to home
        window.location.href = "index.html";

    } catch (error) {
        console.error("Delete account error:", error);
        showSecurityError(error.message || error.details || "Failed to delete account");
        const deleteBtn = deleteAccountBtn;
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = "Delete Account Permanently";
        }
    }
}

// ====================================================================
// Alert Functions
// ====================================================================

/**
 * Show profile success alert
 * @param {string} message - Success message
 */
function showProfileSuccess(message) {
    if (profileSuccessAlert && profileSuccessMessage) {
        profileSuccessMessage.textContent = message;
        profileSuccessAlert.classList.remove("hidden");

        // Auto-hide after 5 seconds
        setTimeout(() => {
            profileSuccessAlert.classList.add("hidden");
        }, 5000);
    }
}

/**
 * Show profile error alert
 * @param {string} message - Error message
 */
function showProfileError(message) {
    if (profileErrorAlert && profileErrorMessage) {
        profileErrorMessage.textContent = message;
        profileErrorAlert.classList.remove("hidden");

        // Auto-hide after 5 seconds
        setTimeout(() => {
            profileErrorAlert.classList.add("hidden");
        }, 5000);
    }
}

/**
 * Show security success alert
 * @param {string} message - Success message
 */
function showSecuritySuccess(message) {
    // Create or use existing alert in security tab
    const securityForm = document.querySelector("#securityTabContent");
    if (securityForm) {
        const alert = securityForm.querySelector(".alert-success") || createAlert("success");
        if (alert) {
            alert.textContent = message;
            alert.classList.remove("hidden");

            setTimeout(() => {
                alert.classList.add("hidden");
            }, 5000);
        }
    }
}

/**
 * Show security error alert
 * @param {string} message - Error message
 */
function showSecurityError(message) {
    // Create or use existing alert in security tab
    const securityForm = document.querySelector("#securityTabContent");
    if (securityForm) {
        const alert = securityForm.querySelector(".alert-error") || createAlert("error");
        if (alert) {
            alert.textContent = message;
            alert.classList.remove("hidden");

            setTimeout(() => {
                alert.classList.add("hidden");
            }, 5000);
        }
    }
}

/**
 * Create alert element
 * @param {string} type - Alert type (success or error)
 * @returns {Element} Alert element
 */
function createAlert(type) {
    const alert = document.createElement("div");
    alert.className = type === "success" ? "alert alert-success" : "alert alert-error";
    alert.className += " mb-4 p-4 rounded-lg text-sm";

    const securityForm = document.querySelector("#securityTabContent");
    if (securityForm) {
        securityForm.insertBefore(alert, securityForm.firstChild);
    }

    return alert;
}

// ====================================================================
// Load User Data
// ====================================================================

/**
 * Load user data on settings page load
 */
export function loadUserSettings() {
    const user = getCurrentAuthUser();
    if (!user) return;

    // Load profile data
    if (fullNameInput) {
        fullNameInput.value = user.displayName || "";
    }

    // Load security info
    const loginTime = document.getElementById("loginTime");
    if (loginTime && user.metadata?.lastSignInTime) {
        const lastLogin = new Date(user.metadata.lastSignInTime);
        loginTime.textContent = `Last login: ${lastLogin.toLocaleDateString()} ${lastLogin.toLocaleTimeString()}`;
    }
}

// Load user settings on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadUserSettings);
} else {
    loadUserSettings();
}