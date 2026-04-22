// ====================================================================
// Dashboard Service Module
// ====================================================================
// Handles real-time invoice fetching and statistics

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { db, getCurrentUser } from "./firebase-config.js";

// ====================================================================
// Real-time Invoice Listener
// ====================================================================

/**
 * Set up real-time listener for user's invoices
 * Uses onSnapshot for live updates
 * 
 * @param {Function} onDataReceived - Callback when data changes
 * @param {Function} onError - Callback for errors
 * @returns {Function} Unsubscribe function
 * 
 * @example
 * const unsubscribe = setupRealtimeInvoiceListener(
 *     (invoices) => { displayInvoices(invoices); },
 *     (error) => { console.error(error); }
 * );
 * 
 * // Later: unsubscribe();
 */
export function setupRealtimeInvoiceListener(onDataReceived, onError) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error("User must be logged in");
        }

        const invoicesRef = collection(db, "invoices");
        const q = query(
            invoicesRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        // Set up real-time listener with onSnapshot
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const invoices = [];
                
                snapshot.forEach((doc) => {
                    invoices.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                console.log(`✅ Real-time update: ${invoices.length} invoices loaded`);
                onDataReceived(invoices);

            },
            (error) => {
                console.error("❌ Real-time listener error:", error);
                if (onError) {
                    onError(error);
                }
            }
        );

        return unsubscribe;

    } catch (error) {
        console.error("❌ Error setting up listener:", error);
        throw error;
    }
}

// ====================================================================
// Calculate Dashboard Statistics
// ====================================================================

/**
 * Calculate statistics from invoices
 * 
 * @param {Array} invoices - Array of invoice objects
 * @returns {Object} Statistics object
 * 
 * @example
 * const stats = calculateStatistics(invoices);
 * console.log(stats);
 * // {
 * //   total: 10,
 * //   pending: 5,
 * //   paid: 4,
 * //   overdue: 1,
 * //   totalAmount: 5000,
 * //   pendingAmount: 2500,
 * //   paidAmount: 2000,
 * //   overdueAmount: 500,
 * //   averageAmount: 500
 * // }
 */
export function calculateStatistics(invoices) {
    if (!invoices || invoices.length === 0) {
        return {
            total: 0,
            pending: 0,
            paid: 0,
            overdue: 0,
            cancelled: 0,
            totalAmount: 0,
            pendingAmount: 0,
            paidAmount: 0,
            overdueAmount: 0,
            averageAmount: 0,
            byStatus: {},
            byMonth: {}
        };
    }

    let stats = {
        total: 0,
        pending: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        byStatus: {
            Pending: 0,
            Paid: 0,
            Overdue: 0,
            Cancelled: 0
        },
        byMonth: {},
        daysUntilDue: []
    };

    const now = new Date();

    invoices.forEach((invoice) => {
        stats.total++;
        stats.totalAmount += invoice.amount;

        const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
        const isOverdue = dueDate < now && invoice.status === "Pending";

        // Status counting
        if (invoice.status === "Pending") {
            stats.pending++;
            stats.pendingAmount += invoice.amount;

            if (isOverdue) {
                stats.overdue++;
                stats.overdueAmount += invoice.amount;
            }
        } else if (invoice.status === "Paid") {
            stats.paid++;
            stats.paidAmount += invoice.amount;
        } else if (invoice.status === "Cancelled") {
            stats.cancelled++;
        }

        // Count by status
        stats.byStatus[invoice.status] = (stats.byStatus[invoice.status] || 0) + 1;

        // Count by month
        const createdDate = invoice.createdAt.toDate?.() || new Date(invoice.createdAt);
        const monthKey = createdDate.toLocaleString("en-US", { year: "numeric", month: "short" });
        stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;

        // Calculate days until due
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        if (invoice.status === "Pending") {
            stats.daysUntilDue.push({
                invoiceId: invoice.id,
                daysLeft,
                amount: invoice.amount
            });
        }
    });

    stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;

    return stats;
}

// ====================================================================
// Get Invoices by Status
// ====================================================================

/**
 * Get invoices filtered by status
 * 
 * @param {Array} invoices - All invoices
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered invoices
 */
export function getInvoicesByStatus(invoices, status) {
    return invoices.filter(invoice => invoice.status === status);
}

// ====================================================================
// Get Overdue Invoices
// ====================================================================

/**
 * Get overdue invoices
 * 
 * @param {Array} invoices - All invoices
 * @returns {Array} Overdue invoices
 */
export function getOverdueInvoices(invoices) {
    const now = new Date();
    
    return invoices.filter(invoice => {
        if (invoice.status !== "Pending") {
            return false;
        }

        const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
        return dueDate < now;
    });
}

// ====================================================================
// Get Recent Invoices
// ====================================================================

/**
 * Get recent invoices (limited count)
 * 
 * @param {Array} invoices - All invoices
 * @param {number} limit - Number of invoices to return
 * @returns {Array} Recent invoices
 */
export function getRecentInvoices(invoices, limit = 10) {
    return invoices.slice(0, limit);
}

// ====================================================================
// Sort Invoices
// ====================================================================

/**
 * Sort invoices by various criteria
 * 
 * @param {Array} invoices - Invoices to sort
 * @param {string} sortBy - Sort criteria (date, amount, dueDate, status)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted invoices
 */
export function sortInvoices(invoices, sortBy = "date", order = "desc") {
    const sorted = [...invoices];

    switch (sortBy) {
        case "date":
            sorted.sort((a, b) => {
                const dateA = a.createdAt.toDate?.() || new Date(a.createdAt);
                const dateB = b.createdAt.toDate?.() || new Date(b.createdAt);
                return order === "desc" ? dateB - dateA : dateA - dateB;
            });
            break;

        case "amount":
            sorted.sort((a, b) => {
                return order === "desc" ? b.amount - a.amount : a.amount - b.amount;
            });
            break;

        case "dueDate":
            sorted.sort((a, b) => {
                const dueA = a.dueDate.toDate?.() || new Date(a.dueDate);
                const dueB = b.dueDate.toDate?.() || new Date(b.dueDate);
                return order === "desc" ? dueB - dueA : dueA - dueB;
            });
            break;

        case "status":
            sorted.sort((a, b) => {
                return order === "desc" 
                    ? b.status.localeCompare(a.status)
                    : a.status.localeCompare(b.status);
            });
            break;

        default:
            break;
    }

    return sorted;
}

// ====================================================================
// Calculate Days Until Due
// ====================================================================

/**
 * Calculate days until invoice is due
 * 
 * @param {Object} invoice - Invoice object
 * @returns {number} Number of days (negative if overdue)
 */
export function getDaysUntilDue(invoice) {
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ====================================================================
// Get Status Color
// ====================================================================

/**
 * Get CSS class for invoice status badge
 * 
 * @param {Object} invoice - Invoice object
 * @returns {string} CSS class for status
 */
export function getStatusBadgeClass(invoice) {
    const daysLeft = getDaysUntilDue(invoice);
    
    if (invoice.status === "Paid") {
        return "bg-green-100 text-green-800";
    } else if (invoice.status === "Cancelled") {
        return "bg-gray-100 text-gray-800";
    } else if (invoice.status === "Pending") {
        if (daysLeft < 0) {
            return "bg-red-100 text-red-800";
        } else if (daysLeft < 3) {
            return "bg-orange-100 text-orange-800";
        } else {
            return "bg-yellow-100 text-yellow-800";
        }
    }

    return "bg-gray-100 text-gray-800";
}

// ====================================================================
// Search Invoices
// ====================================================================

/**
 * Search invoices by customer name or amount
 * 
 * @param {Array} invoices - Invoices to search
 * @param {string} query - Search query
 * @returns {Array} Matching invoices
 */
export function searchInvoices(invoices, query) {
    const lowerQuery = query.toLowerCase();

    return invoices.filter(invoice => {
        return invoice.customerName.toLowerCase().includes(lowerQuery) ||
               invoice.customerPhone.includes(query) ||
               invoice.customerEmail?.toLowerCase().includes(lowerQuery);
    });
}

// ====================================================================
// Get Monthly Stats
// ====================================================================

/**
 * Get invoice statistics by month
 * 
 * @param {Array} invoices - All invoices
 * @returns {Object} Monthly statistics
 */
export function getMonthlyStats(invoices) {
    const stats = {};
    const now = new Date();
    
    // Get last 12 months
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString("en-US", { year: "numeric", month: "short" });
        stats[monthKey] = { count: 0, amount: 0 };
    }

    invoices.forEach(invoice => {
        const createdDate = invoice.createdAt.toDate?.() || new Date(invoice.createdAt);
        const monthKey = createdDate.toLocaleString("en-US", { year: "numeric", month: "short" });
        
        if (stats[monthKey]) {
            stats[monthKey].count++;
            stats[monthKey].amount += invoice.amount;
        }
    });

    return stats;
}

// ====================================================================
// Export All Functions
// ====================================================================

export {
    calculateStatistics,
    getInvoicesByStatus,
    getOverdueInvoices,
    getRecentInvoices,
    sortInvoices,
    getDaysUntilDue,
    getStatusBadgeClass,
    searchInvoices,
    getMonthlyStats
};