// ====================================================================
// Invoice Service Module
// ====================================================================
// Handles all Firestore operations for invoices:
// - Create invoice
// - Read invoices
// - Update invoice
// - Delete invoice
// - Query invoices

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    Timestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { db, getCurrentUser } from "./firebase-config.js";

// ====================================================================
// Constants
// ====================================================================

const INVOICES_COLLECTION = "invoices";
const INVOICE_ITEMS_COLLECTION = "invoice_items";

// ====================================================================
// Create Invoice
// ====================================================================

/**
 * Create a new invoice in Firestore
 * 
 * @param {Object} invoiceData - Invoice data
 * @param {string} invoiceData.customerName - Customer name (required)
 * @param {string} invoiceData.customerEmail - Customer email (optional)
 * @param {string} invoiceData.customerPhone - Customer phone (required)
 * @param {number} invoiceData.amount - Invoice amount (required)
 * @param {Date} invoiceData.invoiceDate - Invoice creation date (required)
 * @param {Date} invoiceData.dueDate - Invoice due date (required)
 * @param {string} invoiceData.description - Invoice description (optional)
 * @param {Array} invoiceData.items - Invoice line items (optional)
 * 
 * @returns {Promise<Object>} Created invoice with ID
 * 
 * @throws {Error} Firestore error if creation fails
 * 
 * @example
 * const invoice = await createInvoice({
 *     customerName: 'John Doe',
 *     customerPhone: '+12345678900',
 *     amount: 500,
 *     invoiceDate: new Date(),
 *     dueDate: new Date(Date.now() + 30*24*60*60*1000),
 *     description: 'Website Design Services'
 * });
 */
export async function createInvoice(invoiceData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error("User must be logged in to create invoice");
        }

        // Validate required fields
        validateInvoiceData(invoiceData);

        // Prepare invoice data for Firestore
        const data = {
            userId: user.uid,
            customerName: invoiceData.customerName.trim(),
            customerEmail: invoiceData.customerEmail?.trim() || "",
            customerPhone: invoiceData.customerPhone.trim(),
            amount: parseFloat(invoiceData.amount),
            invoiceDate: Timestamp.fromDate(invoiceData.invoiceDate),
            dueDate: Timestamp.fromDate(invoiceData.dueDate),
            description: invoiceData.description?.trim() || "",
            status: "Pending", // Default status
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        // Add invoice to collection
        const invoicesRef = collection(db, INVOICES_COLLECTION);
        const docRef = await addDoc(invoicesRef, data);

        console.log("✅ Invoice created successfully:", docRef.id);

        // If items exist, create them separately
        if (invoiceData.items && invoiceData.items.length > 0) {
            await createInvoiceItems(docRef.id, invoiceData.items);
        }

        return {
            id: docRef.id,
            ...data
        };

    } catch (error) {
        console.error("❌ Error creating invoice:", error);
        throw formatInvoiceError(error);
    }
}

// ====================================================================
// Get User Invoices (Real-time)
// ====================================================================

/**
 * Get all invoices for current user (real-time listener)
 * 
 * @param {Function} callback - Callback function that receives invoices array
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status (optional)
 * @param {string} options.sortBy - Sort field (createdAt, dueDate, amount)
 * @param {string} options.order - Sort order (asc, desc)
 * 
 * @returns {Function} Unsubscribe function to stop listening
 * 
 * @example
 * const unsubscribe = getUserInvoices((invoices) => {
 *     console.log('Invoices:', invoices);
 *     displayInvoices(invoices);
 * }, { status: 'Pending', sortBy: 'dueDate', order: 'asc' });
 * 
 * // Later: unsubscribe();
 */
export function getUserInvoices(callback, options = {}) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error("User must be logged in");
        }

        const invoicesRef = collection(db, INVOICES_COLLECTION);
        
        // Build query constraints
        const constraints = [where("userId", "==", user.uid)];

        // Add status filter if provided
        if (options.status) {
            constraints.push(where("status", "==", options.status));
        }

        // Add ordering
        const sortBy = options.sortBy || "createdAt";
        const order = options.order || "desc";
        constraints.push(orderBy(sortBy, order));

        // Create query
        const q = query(invoicesRef, ...constraints);

        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const invoices = [];
            snapshot.forEach((doc) => {
                invoices.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            callback(invoices);

        }, (error) => {
            console.error("❌ Error fetching invoices:", error);
            callback(null);
        });

        return unsubscribe;

    } catch (error) {
        console.error("❌ Error setting up invoice listener:", error);
        throw error;
    }
}

// ====================================================================
// Get Single Invoice
// ====================================================================

/**
 * Get a single invoice by ID
 * 
 * @param {string} invoiceId - Invoice document ID
 * 
 * @returns {Promise<Object>} Invoice data with ID
 * 
 * @throws {Error} If invoice not found
 */
export async function getInvoiceById(invoiceId) {
    try {
        const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
            throw new Error("Invoice not found");
        }

        // Get items if they exist
        const items = await getInvoiceItems(invoiceId);

        return {
            id: invoiceSnap.id,
            ...invoiceSnap.data(),
            items
        };

    } catch (error) {
        console.error("❌ Error fetching invoice:", error);
        throw error;
    }
}

// ====================================================================
// Update Invoice
// ====================================================================

/**
 * Update an existing invoice
 * 
 * @param {string} invoiceId - Invoice document ID
 * @param {Object} updates - Fields to update
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * await updateInvoice('invoiceId123', {
 *     status: 'Paid',
 *     amount: 550
 * });
 */
export async function updateInvoice(invoiceId, updates) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error("User must be logged in");
        }

        // Prepare update data
        const updateData = {
            ...updates,
            updatedAt: Timestamp.now()
        };

        // Convert Date objects to Timestamp
        if (updates.invoiceDate instanceof Date) {
            updateData.invoiceDate = Timestamp.fromDate(updates.invoiceDate);
        }
        if (updates.dueDate instanceof Date) {
            updateData.dueDate = Timestamp.fromDate(updates.dueDate);
        }

        // Update invoice
        const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
        await updateDoc(invoiceRef, updateData);

        console.log("✅ Invoice updated successfully");

        return true;

    } catch (error) {
        console.error("❌ Error updating invoice:", error);
        throw formatInvoiceError(error);
    }
}

// ====================================================================
// Update Invoice Status
// ====================================================================

/**
 * Update invoice status
 * 
 * @param {string} invoiceId - Invoice document ID
 * @param {string} status - New status (Pending, Paid, Overdue, Cancelled)
 * 
 * @returns {Promise<void>}
 */
export async function updateInvoiceStatus(invoiceId, status) {
    const validStatuses = ["Pending", "Paid", "Overdue", "Cancelled"];

    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    return updateInvoice(invoiceId, { status });
}

// ====================================================================
// Delete Invoice
// ====================================================================

/**
 * Delete an invoice and its items
 * 
 * @param {string} invoiceId - Invoice document ID
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * await deleteInvoice('invoiceId123');
 */
export async function deleteInvoice(invoiceId) {
    try {
        const batch = writeBatch(db);

        // Delete invoice document
        const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
        batch.delete(invoiceRef);

        // Delete associated items
        const itemsRef = collection(db, INVOICE_ITEMS_COLLECTION);
        const itemsQuery = query(itemsRef, where("invoiceId", "==", invoiceId));
        const itemsSnap = await getDocs(itemsQuery);

        itemsSnap.forEach((itemDoc) => {
            batch.delete(itemDoc.ref);
        });

        // Commit batch
        await batch.commit();

        console.log("✅ Invoice deleted successfully");

        return true;

    } catch (error) {
        console.error("❌ Error deleting invoice:", error);
        throw formatInvoiceError(error);
    }
}

// ====================================================================
// Invoice Items
// ====================================================================

/**
 * Create invoice line items
 * 
 * @param {string} invoiceId - Invoice document ID
 * @param {Array} items - Array of item objects
 * 
 * @returns {Promise<void>}
 */
export async function createInvoiceItems(invoiceId, items) {
    try {
        const itemsRef = collection(db, INVOICE_ITEMS_COLLECTION);
        const batch = writeBatch(db);

        items.forEach((item, index) => {
            const itemData = {
                invoiceId,
                description: item.description,
                quantity: item.quantity || 1,
                rate: item.rate || 0,
                amount: (item.quantity || 1) * (item.rate || 0),
                order: index,
                createdAt: Timestamp.now()
            };

            batch.set(doc(itemsRef), itemData);
        });

        await batch.commit();

        console.log("✅ Invoice items created");

        return true;

    } catch (error) {
        console.error("❌ Error creating invoice items:", error);
        throw error;
    }
}

/**
 * Get invoice line items
 * 
 * @param {string} invoiceId - Invoice document ID
 * 
 * @returns {Promise<Array>} Array of items
 */
export async function getInvoiceItems(invoiceId) {
    try {
        const itemsRef = collection(db, INVOICE_ITEMS_COLLECTION);
        const q = query(
            itemsRef,
            where("invoiceId", "==", invoiceId),
            orderBy("order", "asc")
        );

        const itemsSnap = await getDocs(q);
        const items = [];

        itemsSnap.forEach((doc) => {
            items.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return items;

    } catch (error) {
        console.error("❌ Error fetching items:", error);
        return [];
    }
}

// ====================================================================
// Search & Filter Invoices
// ====================================================================

/**
 * Search invoices by customer name or email
 * 
 * @param {string} searchTerm - Search term
 * 
 * @returns {Promise<Array>} Matching invoices
 */
export async function searchInvoices(searchTerm) {
    try {
        const user = getCurrentUser();
        if (!user) return [];

        const invoicesRef = collection(db, INVOICES_COLLECTION);
        const q = query(
            invoicesRef,
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const querySnap = await getDocs(q);
        const results = [];

        querySnap.forEach((doc) => {
            const invoice = doc.data();
            const term = searchTerm.toLowerCase();

            if (invoice.customerName.toLowerCase().includes(term) ||
                invoice.customerEmail.toLowerCase().includes(term)) {
                results.push({
                    id: doc.id,
                    ...invoice
                });
            }
        });

        return results;

    } catch (error) {
        console.error("❌ Error searching invoices:", error);
        return [];
    }
}

// ====================================================================
// Get Invoice Statistics
// ====================================================================

/**
 * Get invoice statistics for current user
 * 
 * @returns {Promise<Object>} Statistics object
 */
export async function getInvoiceStats() {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error("User must be logged in");
        }

        const invoicesRef = collection(db, INVOICES_COLLECTION);
        const q = query(invoicesRef, where("userId", "==", user.uid));
        const querySnap = await getDocs(q);

        let total = 0;
        let pending = 0;
        let paid = 0;
        let overdue = 0;
        let totalAmount = 0;
        let pendingAmount = 0;
        let paidAmount = 0;

        const now = new Date();

        querySnap.forEach((doc) => {
            const invoice = doc.data();
            total++;
            totalAmount += invoice.amount;

            if (invoice.status === "Pending") {
                pending++;
                pendingAmount += invoice.amount;

                // Check if overdue
                const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
                if (dueDate < now) {
                    overdue++;
                }

            } else if (invoice.status === "Paid") {
                paid++;
                paidAmount += invoice.amount;
            }
        });

        return {
            total,
            pending,
            paid,
            overdue,
            totalAmount,
            pendingAmount,
            paidAmount,
            averageAmount: total > 0 ? totalAmount / total : 0
        };

    } catch (error) {
        console.error("❌ Error getting statistics:", error);
        return {
            total: 0,
            pending: 0,
            paid: 0,
            overdue: 0,
            totalAmount: 0,
            pendingAmount: 0,
            paidAmount: 0,
            averageAmount: 0
        };
    }
}

// ====================================================================
// Validation
// ====================================================================

/**
 * Validate invoice data
 * 
 * @param {Object} data - Invoice data to validate
 * 
 * @throws {Error} If validation fails
 */
function validateInvoiceData(data) {
    if (!data.customerName || !data.customerName.trim()) {
        throw new Error("Customer name is required");
    }

    if (!data.customerPhone || !data.customerPhone.trim()) {
        throw new Error("Customer phone is required");
    }

    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        throw new Error("Amount must be a positive number");
    }

    if (!data.invoiceDate || !(data.invoiceDate instanceof Date)) {
        throw new Error("Invoice date is required");
    }

    if (!data.dueDate || !(data.dueDate instanceof Date)) {
        throw new Error("Due date is required");
    }

    if (data.dueDate < data.invoiceDate) {
        throw new Error("Due date cannot be before invoice date");
    }
}

// ====================================================================
// Error Formatting
// ====================================================================

/**
 * Format Firestore errors to user-friendly messages
 * 
 * @param {Error} error - Firebase error
 * 
 * @returns {Error} Formatted error
 */
function formatInvoiceError(error) {
    console.error("Raw Firestore error:", error);

    let userMessage = "An error occurred. Please try again.";

    switch (error.code) {
        case "permission-denied":
            userMessage = "You don't have permission to perform this action";
            break;

        case "not-found":
            userMessage = "Invoice not found";
            break;

        case "failed-precondition":
            userMessage = "Failed to complete operation";
            break;

        case "unavailable":
            userMessage = "Service is temporarily unavailable. Please try again.";
            break;

        default:
            userMessage = error.message || userMessage;
    }

    const formattedError = new Error(userMessage);
    formattedError.code = error.code;

    return formattedError;
}

// ====================================================================
// Export All Functions
// ====================================================================

export {
    validateInvoiceData,
    formatInvoiceError
};