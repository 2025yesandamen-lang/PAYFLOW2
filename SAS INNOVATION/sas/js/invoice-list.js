// ====================================================================
// Invoice List Module
// ====================================================================
// Handles displaying, filtering, and managing invoices

import {
    getUserInvoices,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoiceStats,
    searchInvoices
} from "./invoice-service.js";

import {
    formatCurrency,
    formatDate,
    getInvoiceStatusColor,
    isInvoiceOverdue
} from "./invoice-utils.js";

// ====================================================================
// DOM Elements
// ====================================================================

const invoicesTableBody = document.getElementById("invoicesTableBody");
const invoicesCardView = document.getElementById("invoicesCardView");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortFilter = document.getElementById("sortFilter");

// Stats elements
const totalInvoices = document.getElementById("totalInvoices");
const pendingCount = document.getElementById("pendingCount");
const paidCount = document.getElementById("paidCount");
const totalValue = document.getElementById("totalValue");

// ====================================================================
// State
// ====================================================================

let allInvoices = [];
let unsubscribeListener = null;

// ====================================================================
// Initialize Invoice List
// ====================================================================

/**
 * Initialize invoice list
 */
export function initInvoiceList() {
    console.log("📋 Initializing invoice list...");

    // Load invoices
    loadInvoices();

    // Setup event listeners
    setupEventListeners();

    // Load stats
    loadInvoiceStats();
}

/**
 * Load invoices from Firestore
 */
function loadInvoices() {
    try {
        // Set up real-time listener
        unsubscribeListener = getUserInvoices(
            (invoices) => {
                if (invoices) {
                    allInvoices = invoices;
                    displayInvoices(invoices);
                    loadInvoiceStats();
                }
            },
            {
                sortBy: "createdAt",
                order: "desc"
            }
        );

    } catch (error) {
        console.error("❌ Error loading invoices:", error);
        showEmptyState();
    }
}

// ====================================================================
// Display Invoices
// ====================================================================

/**
 * Display invoices in table and card format
 * @param {Array} invoices - Invoices to display
 */
function displayInvoices(invoices) {
    if (!invoices || invoices.length === 0) {
        showEmptyState();
        return;
    }

    // Display in table (desktop)
    displayInvoicesTable(invoices);

    // Display in cards (mobile)
    displayInvoicesCards(invoices);
}

/**
 * Display invoices in table format
 * @param {Array} invoices - Invoices to display
 */
function displayInvoicesTable(invoices) {
    if (!invoicesTableBody) return;

    invoicesTableBody.innerHTML = "";

    invoices.forEach((invoice) => {
        const row = createInvoiceTableRow(invoice);
        invoicesTableBody.appendChild(row);
    });
}

/**
 * Display invoices in card format
 * @param {Array} invoices - Invoices to display
 */
function displayInvoicesCards(invoices) {
    if (!invoicesCardView) return;

    invoicesCardView.innerHTML = "";

    invoices.forEach((invoice) => {
        const card = createInvoiceCard(invoice);
        invoicesCardView.appendChild(card);
    });
}

/**
 * Create invoice table row
 * @param {Object} invoice - Invoice data
 * @returns {Element} Table row element
 */
function createInvoiceTableRow(invoice) {
    const row = document.createElement("tr");
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const createdDate = invoice.createdAt.toDate?.() || new Date(invoice.createdAt);
    const overdue = isInvoiceOverdue(invoice);

    const statusColor = getInvoiceStatusColor(invoice.status, overdue);

    row.innerHTML = `
        <td class="px-6 py-4">
            <div>
                <p class="font-medium text-gray-900">${escapeHtml(invoice.customerName)}</p>
                <p class="text-sm text-gray-600">${escapeHtml(invoice.customerPhone)}</p>
            </div>
        </td>
        <td class="px-6 py-4 font-semibold text-gray-900">
            ${formatCurrency(invoice.amount)}
        </td>
        <td class="px-6 py-4 text-gray-600">
            ${formatDate(dueDate)}
            ${overdue ? '<span class="text-red-600 text-sm ml-2">(Overdue)</span>' : ''}
        </td>
        <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
                ${invoice.status}${overdue && invoice.status === 'Pending' ? ' (Overdue)' : ''}
            </span>
        </td>
        <td class="px-6 py-4 text-gray-600">
            ${formatDate(createdDate)}
        </td>
        <td class="px-6 py-4">
            <div class="flex space-x-2">
                <button class="view-invoice text-indigo-600 hover:text-indigo-900 font-medium text-sm" data-invoice-id="${invoice.id}">
                    View
                </button>
                <button class="edit-invoice text-blue-600 hover:text-blue-900 font-medium text-sm" data-invoice-id="${invoice.id}">
                    Edit
                </button>
                <button class="delete-invoice text-red-600 hover:text-red-900 font-medium text-sm" data-invoice-id="${invoice.id}">
                    Delete
                </button>
                ${invoice.status === 'Pending' ? `
                    <button class="mark-paid text-green-600 hover:text-green-900 font-medium text-sm" data-invoice-id="${invoice.id}">
                        Mark Paid
                    </button>
                ` : ''}
            </div>
        </td>
    `;

    // Add event listeners
    addRowEventListeners(row, invoice);

    return row;
}

/**
 * Create invoice card (mobile view)
 * @param {Object} invoice - Invoice data
 * @returns {Element} Card element
 */
function createInvoiceCard(invoice) {
    const card = document.createElement("div");
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const overdue = isInvoiceOverdue(invoice);
    const statusColor = getInvoiceStatusColor(invoice.status, overdue);

    card.className = "p-4 border-b border-gray-200";
    card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <div>
                <p class="font-semibold text-gray-900">${escapeHtml(invoice.customerName)}</p>
                <p class="text-sm text-gray-600">${escapeHtml(invoice.customerPhone)}</p>
            </div>
            <span class="px-2 py-1 rounded text-xs font-medium ${statusColor}">
                ${invoice.status}
            </span>
        </div>
        <div class="grid grid-cols-3 gap-2 mb-3 text-sm">
            <div>
                <p class="text-gray-600">Amount</p>
                <p class="font-semibold">${formatCurrency(invoice.amount)}</p>
            </div>
            <div>
                <p class="text-gray-600">Due</p>
                <p class="font-semibold">${formatDate(dueDate)}</p>
            </div>
            <div>
                <p class="text-gray-600">Status</p>
                <p class="font-semibold">${overdue ? 'Overdue' : 'On Time'}</p>
            </div>
        </div>
        <div class="flex space-x-2">
            <button class="view-invoice flex-1 text-indigo-600 text-sm font-medium py-2 border border-indigo-600 rounded" data-invoice-id="${invoice.id}">
                View
            </button>
            <button class="delete-invoice flex-1 text-red-600 text-sm font-medium py-2 border border-red-600 rounded" data-invoice-id="${invoice.id}">
                Delete
            </button>
        </div>
    `;

    // Add event listeners
    card.querySelector(".view-invoice")?.addEventListener("click", () => {
        viewInvoice(invoice.id);
    });

    card.querySelector(".delete-invoice")?.addEventListener("click", () => {
        handleDeleteInvoice(invoice.id);
    });

    return card;
}

/**
 * Add event listeners to table row
 * @param {Element} row - Table row
 * @param {Object} invoice - Invoice data
 */
function addRowEventListeners(row, invoice) {
    row.querySelector(".view-invoice")?.addEventListener("click", () => {
        viewInvoice(invoice.id);
    });

    row.querySelector(".edit-invoice")?.addEventListener("click", () => {
        editInvoice(invoice.id);
    });

    row.querySelector(".delete-invoice")?.addEventListener("click", () => {
        handleDeleteInvoice(invoice.id);
    });

    row.querySelector(".mark-paid")?.addEventListener("click", () => {
        handleMarkPaid(invoice.id);
    });
}

// ====================================================================
// Invoice Actions
// ====================================================================

/**
 * View invoice details
 * @param {string} invoiceId - Invoice ID
 */
function viewInvoice(invoiceId) {
    console.log("👁️ Viewing invoice:", invoiceId);
    // TODO: Implement view invoice functionality
    window.location.href = `view-invoice.html?id=${invoiceId}`;
}

/**
 * Edit invoice
 * @param {string} invoiceId - Invoice ID
 */
function editInvoice(invoiceId) {
    console.log("✏️ Editing invoice:", invoiceId);
    // TODO: Implement edit functionality
    alert("Edit functionality coming soon");
}

/**
 * Delete invoice
 * @param {string} invoiceId - Invoice ID
 */
async function handleDeleteInvoice(invoiceId) {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
        return;
    }

    try {
        await deleteInvoice(invoiceId);
        showNotification("Invoice deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting invoice:", error);
        showNotification(error.message || "Failed to delete invoice", "error");
    }
}

/**
 * Mark invoice as paid
 * @param {string} invoiceId - Invoice ID
 */
async function handleMarkPaid(invoiceId) {
    try {
        await updateInvoiceStatus(invoiceId, "Paid");
        showNotification("Invoice marked as paid", "success");
    } catch (error) {
        console.error("Error updating invoice:", error);
        showNotification(error.message || "Failed to update invoice", "error");
    }
}

// ====================================================================
// Filter & Search
// ====================================================================

/**
 * Setup event listeners for filters
 */
function setupEventListeners() {
    // Search
    searchInput?.addEventListener("input", handleSearch);

    // Status filter
    statusFilter?.addEventListener("change", handleStatusFilter);

    // Sort filter
    sortFilter?.addEventListener("change", handleSortFilter);
}

/**
 * Handle search
 */
async function handleSearch() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        displayInvoices(allInvoices);
        return;
    }

    try {
        const results = await searchInvoices(searchTerm);
        displayInvoices(results);
    } catch (error) {
        console.error("Search error:", error);
    }
}

/**
 * Handle status filter
 */
function handleStatusFilter() {
    const status = statusFilter.value;

    let filtered = allInvoices;

    if (status) {
        filtered = allInvoices.filter(invoice => invoice.status === status);
    }

    displayInvoices(filtered);
}

/**
 * Handle sort filter
 */
function handleSortFilter() {
    const sortBy = sortFilter.value;
    let sorted = [...allInvoices];

    switch (sortBy) {
        case "newest":
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;

        case "oldest":
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;

        case "amount-high":
            sorted.sort((a, b) => b.amount - a.amount);
            break;

        case "amount-low":
            sorted.sort((a, b) => a.amount - b.amount);
            break;

        case "due-soon":
            sorted.sort((a, b) => {
                const dueDateA = a.dueDate.toDate?.() || new Date(a.dueDate);
                const dueDateB = b.dueDate.toDate?.() || new Date(b.dueDate);
                return dueDateA - dueDateB;
            });
            break;
    }

    displayInvoices(sorted);
}

// ====================================================================
// Statistics
// ====================================================================

/**
 * Load and display invoice statistics
 */
async function loadInvoiceStats() {
    try {
        const stats = await getInvoiceStats();

        if (totalInvoices) totalInvoices.textContent = stats.total;
        if (pendingCount) pendingCount.textContent = stats.pending;
        if (paidCount) paidCount.textContent = stats.paid;
        if (totalValue) totalValue.textContent = formatCurrency(stats.totalAmount);

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// ====================================================================
// UI Helpers
// ====================================================================

/**
 * Show empty state
 */
function showEmptyState() {
    if (invoicesTableBody) {
        invoicesTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <p class="text-lg font-medium mb-2">No invoices yet</p>
                    <p class="text-sm">Create your first invoice to get started</p>
                </td>
            </tr>
        `;
    }

    if (invoicesCardView) {
        invoicesCardView.innerHTML = `
            <div class="px-6 py-8 text-center text-gray-500">
                <p class="text-lg font-medium mb-2">No invoices yet</p>
                <p class="text-sm">Create your first invoice to get started</p>
            </div>
        `;
    }
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning)
 */
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white font-medium z-50 animate-slideInRight ${
        type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-yellow-600"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.remove();
    }, 4000);
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
// Cleanup
// ====================================================================

/**
 * Cleanup on page unload
 */
window.addEventListener("beforeunload", () => {
    if (unsubscribeListener) {
        unsubscribeListener();
    }
});

// ====================================================================
// Export
// ====================================================================

export { initInvoiceList };

// Initialize on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInvoiceList);
} else {
    initInvoiceList();
}