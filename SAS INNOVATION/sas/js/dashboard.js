// ====================================================================
// Dashboard Module
// ====================================================================
// Main dashboard logic, UI management, and real-time updates

import { getCurrentAuthUser, logout } from "./auth-service.js";
import {
    setupRealtimeInvoiceListener,
    calculateStatistics,
    getRecentInvoices,
    sortInvoices,
    getDaysUntilDue,
    getStatusBadgeClass,
    getOverdueInvoices,
    getMonthlyStats
} from "./dashboard-service.js";

import {
    formatCurrency,
    formatDate,
    formatPhoneNumber
} from "./invoice-utils.js";

// ====================================================================
// DOM Elements
// ====================================================================

// Navigation
const userNameNav = document.getElementById("userNameNav");
const userEmailNav = document.getElementById("userEmailNav");
const userName = document.getElementById("userName");
const avatarNav = document.getElementById("avatarNav");
const logoutBtn = document.getElementById("logoutBtn");

// Statistics
const statTotalInvoices = document.getElementById("statTotalInvoices");
const statPending = document.getElementById("statPending");
const statPaid = document.getElementById("statPaid");
const statOverdue = document.getElementById("statOverdue");
const statTotalValue = document.getElementById("statTotalValue");

// View Controls
const toggleViewBtn = document.getElementById("toggleViewBtn");
const tableViewBtn = document.getElementById("tableViewBtn");
const cardViewBtn = document.getElementById("cardViewBtn");
const tableViewContainer = document.getElementById("tableViewContainer");
const cardViewContainer = document.getElementById("cardViewContainer");

// Data Containers
const invoicesTableBody = document.getElementById("invoicesTableBody");
const invoicesCardView = document.getElementById("invoicesCardView");
const emptyState = document.getElementById("emptyState");

// Charts
const statusChart = document.getElementById("statusChart");
const monthlyChart = document.getElementById("monthlyChart");

// Modal
const markPaidModal = document.getElementById("markPaidModal");
const confirmMarkPaidBtn = document.getElementById("confirmMarkPaidBtn");
const cancelMarkPaidBtn = document.getElementById("cancelMarkPaidBtn");
const modalCustomerName = document.getElementById("modalCustomerName");
const modalAmount = document.getElementById("modalAmount");
const modalDueDate = document.getElementById("modalDueDate");

// Buttons
const refreshBtn = document.getElementById("refreshBtn");

// Notification
const notificationToast = document.getElementById("notificationToast");

// ====================================================================
// State
// ====================================================================

let allInvoices = [];
let currentView = "table"; // "table" or "card"
let unsubscribeListener = null;
let selectedInvoiceForPayment = null;

// ====================================================================
// Initialization
// ====================================================================

/**
 * Initialize dashboard
 */
export function initDashboard() {
    console.log("📊 Initializing dashboard...");

    // Setup user info
    setupUserInfo();

    // Setup event listeners
    setupEventListeners();

    // Setup real-time listener
    setupRealtimeListener();

    console.log("✅ Dashboard initialized");
}

// ====================================================================
// User Information
// ====================================================================

/**
 * Setup and display user information
 */
function setupUserInfo() {
    const user = getCurrentAuthUser();

    if (user) {
        const displayName = user.displayName || "User";
        const firstName = displayName.split(" ")[0];

        // Update UI with user info
        if (userName) userName.textContent = firstName;
        if (userNameNav) userNameNav.textContent = displayName;
        if (userEmailNav) userEmailNav.textContent = user.email;

        // Update avatar
        if (avatarNav) {
            const initials = getInitials(displayName);
            avatarNav.textContent = initials;
        }

        console.log(`👤 User logged in: ${user.email}`);
    }
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Two-letter initials
 */
function getInitials(name) {
    const parts = name.split(" ");
    if (parts.length > 1) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ====================================================================
// Event Listeners
// ====================================================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    // View toggle
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener("click", toggleView);
    }

    if (tableViewBtn) {
        tableViewBtn.addEventListener("click", () => switchView("table"));
    }

    if (cardViewBtn) {
        cardViewBtn.addEventListener("click", () => switchView("card"));
    }

    // Modal
    if (confirmMarkPaidBtn) {
        confirmMarkPaidBtn.addEventListener("click", confirmMarkPaid);
    }

    if (cancelMarkPaidBtn) {
        cancelMarkPaidBtn.addEventListener("click", closeMarkPaidModal);
    }

    // Refresh
    if (refreshBtn) {
        refreshBtn.addEventListener("click", refreshData);
    }

    // Close modal on escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeMarkPaidModal();
        }
    });
}

/**
 * Handle logout
 */
async function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        try {
            await logout();
            window.location.href = "index.html";
        } catch (error) {
            console.error("Logout error:", error);
            showNotification("Logout failed", "error");
        }
    }
}

// ====================================================================
// Real-time Listener
// ====================================================================

/**
 * Setup real-time invoice listener
 */
function setupRealtimeListener() {
    try {
        unsubscribeListener = setupRealtimeInvoiceListener(
            (invoices) => {
                allInvoices = invoices;
                updateDashboard(invoices);
            },
            (error) => {
                console.error("Listener error:", error);
                showNotification("Failed to load invoices", "error");
            }
        );

        console.log("✅ Real-time listener active");

    } catch (error) {
        console.error("Error setting up listener:", error);
        showNotification("Failed to setup real-time updates", "error");
    }
}

/**
 * Refresh data manually
 */
function refreshData() {
    console.log("🔄 Refreshing data...");
    refreshBtn.disabled = true;
    refreshBtn.style.opacity = "0.5";

    // Simulate refresh delay
    setTimeout(() => {
        refreshBtn.disabled = false;
        refreshBtn.style.opacity = "1";
        showNotification("Data refreshed", "success");
    }, 1000);
}

// ====================================================================
// Update Dashboard
// ====================================================================

/**
 * Update entire dashboard with new data
 * @param {Array} invoices - Invoice data
 */
function updateDashboard(invoices) {
    console.log(`📊 Updating dashboard with ${invoices.length} invoices`);

    if (invoices.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    // Update statistics
    updateStatistics(invoices);

    // Update invoices display
    if (currentView === "table") {
        displayInvoicesTable(invoices);
    } else {
        displayInvoicesCards(invoices);
    }

    // Update charts
    updateCharts(invoices);
}

// ====================================================================
// Statistics
// ====================================================================

/**
 * Update statistics cards
 * @param {Array} invoices - Invoice data
 */
function updateStatistics(invoices) {
    const stats = calculateStatistics(invoices);

    if (statTotalInvoices) statTotalInvoices.textContent = stats.total;
    if (statPending) statPending.textContent = stats.pending;
    if (statPaid) statPaid.textContent = stats.paid;
    if (statOverdue) statOverdue.textContent = stats.overdue;
    if (statTotalValue) statTotalValue.textContent = formatCurrency(stats.totalAmount);

    console.log("📊 Stats updated:", stats);
}

// ====================================================================
// Display Invoices - Table View
// ====================================================================

/**
 * Display invoices in table format
 * @param {Array} invoices - Invoices to display
 */
function displayInvoicesTable(invoices) {
    const recent = getRecentInvoices(invoices, 10);

    if (!invoicesTableBody) return;

    invoicesTableBody.innerHTML = "";

    recent.forEach((invoice) => {
        const row = createTableRow(invoice);
        invoicesTableBody.appendChild(row);
    });

    console.log(`📋 Table view updated with ${recent.length} invoices`);
}

/**
 * Create invoice table row
 * @param {Object} invoice - Invoice data
 * @returns {Element} Table row
 */
function createTableRow(invoice) {
    const row = document.createElement("tr");
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const daysLeft = getDaysUntilDue(invoice);
    const badgeClass = getStatusBadgeClass(invoice);

    row.innerHTML = `
        <td class="px-6 py-4">
            <div>
                <p class="font-semibold text-gray-900">${escapeHtml(invoice.customerName)}</p>
                <p class="text-sm text-gray-600">${formatPhoneNumber(invoice.customerPhone)}</p>
            </div>
        </td>
        <td class="px-6 py-4 font-bold text-gray-900">
            ${formatCurrency(invoice.amount)}
        </td>
        <td class="px-6 py-4 text-gray-600">
            ${formatDate(dueDate)}
        </td>
        <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-sm font-medium ${badgeClass}">
                ${getStatusLabel(invoice)}
            </span>
        </td>
        <td class="px-6 py-4">
            <span class="text-sm font-medium ${getDaysLeftColor(daysLeft)}">
                ${formatDaysLeft(daysLeft)}
            </span>
        </td>
        <td class="px-6 py-4">
            <div class="flex space-x-2">
                <button class="view-btn text-indigo-600 hover:text-indigo-900 font-medium text-sm" data-invoice-id="${invoice.id}" title="View invoice">
                    View
                </button>
                ${invoice.status === "Pending" ? `
                    <button class="mark-paid-btn text-green-600 hover:text-green-900 font-medium text-sm" data-invoice-id="${invoice.id}" title="Mark as paid">
                        Pay
                    </button>
                ` : ""}
                <button class="delete-btn text-red-600 hover:text-red-900 font-medium text-sm" data-invoice-id="${invoice.id}" title="Delete invoice">
                    Delete
                </button>
            </div>
        </td>
    `;

    // Add event listeners
    addRowEventListeners(row, invoice);

    return row;
}

/**
 * Add event listeners to table row
 * @param {Element} row - Table row
 * @param {Object} invoice - Invoice data
 */
function addRowEventListeners(row, invoice) {
    row.querySelector(".view-btn")?.addEventListener("click", () => {
        window.location.href = `view-invoice.html?id=${invoice.id}`;
    });

    row.querySelector(".mark-paid-btn")?.addEventListener("click", () => {
        openMarkPaidModal(invoice);
    });

    row.querySelector(".delete-btn")?.addEventListener("click", () => {
        handleDeleteInvoice(invoice);
    });
}

// ====================================================================
// Display Invoices - Card View
// ====================================================================

/**
 * Display invoices in card format
 * @param {Array} invoices - Invoices to display
 */
function displayInvoicesCards(invoices) {
    const recent = getRecentInvoices(invoices, 10);

    if (!invoicesCardView) return;

    invoicesCardView.innerHTML = "";

    recent.forEach((invoice) => {
        const card = createInvoiceCard(invoice);
        invoicesCardView.appendChild(card);
    });

    console.log(`🎴 Card view updated with ${recent.length} invoices`);
}

/**
 * Create invoice card
 * @param {Object} invoice - Invoice data
 * @returns {Element} Card element
 */
function createInvoiceCard(invoice) {
    const card = document.createElement("div");
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const daysLeft = getDaysUntilDue(invoice);
    const badgeClass = getStatusBadgeClass(invoice);

    card.className = "border border-gray-200 rounded-lg p-4 hover:shadow-lg transition";
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <p class="font-semibold text-gray-900">${escapeHtml(invoice.customerName)}</p>
                <p class="text-sm text-gray-600">${formatPhoneNumber(invoice.customerPhone)}</p>
            </div>
            <span class="px-2 py-1 rounded text-xs font-medium ${badgeClass}">
                ${getStatusLabel(invoice)}
            </span>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-4 text-sm border-t border-b py-2">
            <div>
                <p class="text-gray-600">Amount</p>
                <p class="font-bold text-indigo-600">${formatCurrency(invoice.amount)}</p>
            </div>
            <div>
                <p class="text-gray-600">Due</p>
                <p class="font-bold">${formatDate(dueDate)}</p>
            </div>
            <div>
                <p class="text-gray-600">Days Left</p>
                <p class="font-bold ${getDaysLeftColor(daysLeft)}">${formatDaysLeft(daysLeft)}</p>
            </div>
        </div>

        <div class="flex gap-2">
            <button class="view-btn flex-1 text-indigo-600 border border-indigo-600 rounded py-2 text-sm font-medium hover:bg-indigo-50" data-invoice-id="${invoice.id}">
                View
            </button>
            ${invoice.status === "Pending" ? `
                <button class="mark-paid-btn flex-1 text-green-600 border border-green-600 rounded py-2 text-sm font-medium hover:bg-green-50" data-invoice-id="${invoice.id}">
                    Pay
                </button>
            ` : ""}
            <button class="delete-btn flex-1 text-red-600 border border-red-600 rounded py-2 text-sm font-medium hover:bg-red-50" data-invoice-id="${invoice.id}">
                Delete
            </button>
        </div>
    `;

    // Add event listeners
    card.querySelector(".view-btn")?.addEventListener("click", () => {
        window.location.href = `view-invoice.html?id=${invoice.id}`;
    });

    card.querySelector(".mark-paid-btn")?.addEventListener("click", () => {
        openMarkPaidModal(invoice);
    });

    card.querySelector(".delete-btn")?.addEventListener("click", () => {
        handleDeleteInvoice(invoice);
    });

    return card;
}

// ====================================================================
// View Toggle
// ====================================================================

/**
 * Toggle between table and card views
 */
function toggleView() {
    currentView = currentView === "table" ? "card" : "table";
    switchView(currentView);
}

/**
 * Switch to specific view
 * @param {string} view - View type ("table" or "card")
 */
function switchView(view) {
    currentView = view;

    if (view === "table") {
        // Show table, hide cards
        if (tableViewContainer) tableViewContainer.classList.remove("hidden");
        if (cardViewContainer) cardViewContainer.classList.add("hidden");

        // Update button states
        if (tableViewBtn) {
            tableViewBtn.classList.add("bg-indigo-600", "text-white");
            tableViewBtn.classList.remove("bg-gray-200", "text-gray-800");
        }
        if (cardViewBtn) {
            cardViewBtn.classList.remove("bg-indigo-600", "text-white");
            cardViewBtn.classList.add("bg-gray-200", "text-gray-800");
        }

        // Update toggle button
        if (toggleViewBtn) {
            document.getElementById("viewToggleIcon").textContent = "🎴";
            document.getElementById("viewToggleText").textContent = "Card View";
        }

        displayInvoicesTable(allInvoices);

    } else {
        // Show cards, hide table
        if (tableViewContainer) tableViewContainer.classList.add("hidden");
        if (cardViewContainer) cardViewContainer.classList.remove("hidden");

        // Update button states
        if (tableViewBtn) {
            tableViewBtn.classList.remove("bg-indigo-600", "text-white");
            tableViewBtn.classList.add("bg-gray-200", "text-gray-800");
        }
        if (cardViewBtn) {
            cardViewBtn.classList.add("bg-indigo-600", "text-white");
            cardViewBtn.classList.remove("bg-gray-200", "text-gray-800");
        }

        // Update toggle button
        if (toggleViewBtn) {
            document.getElementById("viewToggleIcon").textContent = "📊";
            document.getElementById("viewToggleText").textContent = "Table View";
        }

        displayInvoicesCards(allInvoices);
    }

    console.log(`👁️ Switched to ${view} view`);
}

// ====================================================================
// Mark as Paid Modal
// ====================================================================

/**
 * Open mark as paid modal
 * @param {Object} invoice - Invoice to mark as paid
 */
function openMarkPaidModal(invoice) {
    selectedInvoiceForPayment = invoice;
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);

    if (modalCustomerName) modalCustomerName.textContent = invoice.customerName;
    if (modalAmount) modalAmount.textContent = formatCurrency(invoice.amount);
    if (modalDueDate) modalDueDate.textContent = `Due: ${formatDate(dueDate)}`;

    if (markPaidModal) {
        markPaidModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

/**
 * Close mark as paid modal
 */
function closeMarkPaidModal() {
    if (markPaidModal) {
        markPaidModal.classList.add("hidden");
        document.body.style.overflow = "auto";
    }
    selectedInvoiceForPayment = null;
}

/**
 * Confirm mark as paid
 */
async function confirmMarkPaid() {
    if (!selectedInvoiceForPayment) return;

    try {
        // Update invoice status in Firestore
        const { updateInvoiceStatus } = await import("./invoice-service.js");
        await updateInvoiceStatus(selectedInvoiceForPayment.id, "Paid");

        showNotification("✅ Invoice marked as paid", "success");
        closeMarkPaidModal();

        // The real-time listener will automatically update the dashboard

    } catch (error) {
        console.error("Error marking invoice as paid:", error);
        showNotification("Failed to mark invoice as paid", "error");
    }
}

// ====================================================================
// Invoice Actions
// ====================================================================

/**
 * Handle delete invoice
 * @param {Object} invoice - Invoice to delete
 */
async function handleDeleteInvoice(invoice) {
    if (!confirm(`Are you sure you want to delete the invoice for ${invoice.customerName}?`)) {
        return;
    }

    try {
        const { deleteInvoice } = await import("./invoice-service.js");
        await deleteInvoice(invoice.id);

        showNotification("✅ Invoice deleted", "success");
        // Real-time listener will update the dashboard

    } catch (error) {
        console.error("Error deleting invoice:", error);
        showNotification("Failed to delete invoice", "error");
    }
}

// ====================================================================
// Charts
// ====================================================================

/**
 * Update dashboard charts
 * @param {Array} invoices - Invoice data
 */
function updateCharts(invoices) {
    updateStatusChart(invoices);
    updateMonthlyChart(invoices);
}

/**
 * Update status distribution chart
 * @param {Array} invoices - Invoice data
 */
function updateStatusChart(invoices) {
    if (!statusChart) return;

    const stats = calculateStatistics(invoices);
    const total = stats.total;

    statusChart.innerHTML = `
        <div class="space-y-2">
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">Pending</span>
                    <span class="text-sm font-bold text-gray-900">${stats.pending} (${Math.round((stats.pending / total) * 100)}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-yellow-500 h-2 rounded-full" style="width: ${(stats.pending / total) * 100}%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">Paid</span>
                    <span class="text-sm font-bold text-gray-900">${stats.paid} (${Math.round((stats.paid / total) * 100)}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" style="width: ${(stats.paid / total) * 100}%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">Overdue</span>
                    <span class="text-sm font-bold text-gray-900">${stats.overdue} (${Math.round((stats.overdue / total) * 100)}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-red-500 h-2 rounded-full" style="width: ${(stats.overdue / total) * 100}%"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Update monthly chart
 * @param {Array} invoices - Invoice data
 */
function updateMonthlyChart(invoices) {
    if (!monthlyChart) return;

    const stats = getMonthlyStats(invoices);
    const months = Object.keys(stats).slice(0, 6).reverse(); // Last 6 months

    let chartHTML = `<div class="space-y-2">`;

    months.forEach(month => {
        const { count, amount } = stats[month];
        const maxCount = Math.max(...months.map(m => stats[m].count), 1);

        chartHTML += `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">${month}</span>
                    <span class="text-sm font-bold text-gray-900">${count} (${formatCurrency(amount)})</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-indigo-500 h-2 rounded-full" style="width: ${(count / maxCount) * 100}%"></div>
                </div>
            </div>
        `;
    });

    chartHTML += `</div>`;
    monthlyChart.innerHTML = chartHTML;
}

// ====================================================================
// Empty State
// ====================================================================

/**
 * Show empty state
 */
function showEmptyState() {
    if (emptyState) emptyState.classList.remove("hidden");
    if (invoicesTableBody) invoicesTableBody.innerHTML = "";
    if (invoicesCardView) invoicesCardView.innerHTML = "";
}

/**
 * Hide empty state
 */
function hideEmptyState() {
    if (emptyState) emptyState.classList.add("hidden");
}

// ====================================================================
// Helpers
// ====================================================================

/**
 * Get invoice status label
 * @param {Object} invoice - Invoice
 * @returns {string} Status label
 */
function getStatusLabel(invoice) {
    const daysLeft = getDaysUntilDue(invoice);

    if (invoice.status === "Paid") {
        return "Paid ✓";
    } else if (daysLeft < 0) {
        return "Overdue";
    }

    return invoice.status;
}

/**
 * Format days left for display
 * @param {number} daysLeft - Days left
 * @returns {string} Formatted string
 */
function formatDaysLeft(daysLeft) {
    if (daysLeft < 0) {
        return `${Math.abs(daysLeft)}d overdue`;
    } else if (daysLeft === 0) {
        return "Due today";
    } else if (daysLeft === 1) {
        return "Due tomorrow";
    } else {
        return `${daysLeft}d left`;
    }
}

/**
 * Get color class for days left
 * @param {number} daysLeft - Days left
 * @returns {string} CSS class
 */
function getDaysLeftColor(daysLeft) {
    if (daysLeft < 0) return "text-red-600";
    if (daysLeft < 3) return "text-orange-600";
    return "text-green-600";
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}

// ====================================================================
// Notifications
// ====================================================================

/**
 * Show notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type (success, error, info)
 */
function showNotification(message, type = "info") {
    if (!notificationToast) return;

    const colors = {
        success: "bg-green-600",
        error: "bg-red-600",
        info: "bg-blue-600"
    };

    notificationToast.textContent = message;
    notificationToast.className = `fixed bottom-4 right-4 p-4 rounded-lg text-white font-medium shadow-lg z-50 animate-slideInRight ${colors[type]}`;
    notificationToast.classList.remove("hidden");

    // Auto-hide after 4 seconds
    setTimeout(() => {
        notificationToast.classList.add("hidden");
    }, 4000);
}

// ====================================================================
// Cleanup
// ====================================================================

/**
 * Cleanup on page unload
 */
window.addEventListener("beforeunload", () => {
    if (unsubscribeListener) {
        unsubscribeListener();
        console.log("🔌 Real-time listener unsubscribed");
    }
});

// ====================================================================
// Export
// ====================================================================

export { initDashboard };

// ====================================================================
// Initialize on Page Load
// ====================================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
} else {
    initDashboard();
}