// Invoice Management Module
// Handles CRUD operations for invoices

import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";
import { showAlert } from "./auth.js";

// ===== DOM Elements =====
const createInvoiceBtn = document.getElementById("createInvoiceBtn");
const invoiceModal = document.getElementById("invoiceModal");
const invoiceForm = document.getElementById("invoiceForm");
const closeModalBtn = document.getElementById("closeModalBtn");
const invoicesList = document.getElementById("invoicesList");

const customerNameInput = document.getElementById("customerName");
const customerPhoneInput = document.getElementById("customerPhone");
const amountInput = document.getElementById("amount");
const dueDateInput = document.getElementById("dueDate");
const descriptionInput = document.getElementById("description");

// ===== Modal Management =====
/**
 * Open invoice creation modal
 */
if (createInvoiceBtn) {
    createInvoiceBtn.addEventListener("click", () => {
        invoiceModal.classList.remove("hidden");
        invoiceForm.reset();
    });
}

/**
 * Close invoice creation modal
 */
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        invoiceModal.classList.add("hidden");
    });
}

/**
 * Close modal when clicking outside of it
 */
if (invoiceModal) {
    invoiceModal.addEventListener("click", (e) => {
        if (e.target === invoiceModal) {
            invoiceModal.classList.add("hidden");
        }
    });
}

// ===== Invoice Form Submission =====
/**
 * Handle invoice form submission
 */
if (invoiceForm) {
    invoiceForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const currentUser = auth.currentUser;
        if (!currentUser) {
            showAlert("Please login first", "error");
            return;
        }

        try {
            // Get form values
            const customerName = customerNameInput.value.trim();
            const customerPhone = customerPhoneInput.value.trim();
            const amount = parseFloat(amountInput.value);
            const dueDate = dueDateInput.value;
            const description = descriptionInput.value.trim();

            // Validate inputs
            if (!customerName || !customerPhone || !amount || !dueDate) {
                showAlert("Please fill in all required fields", "error");
                return;
            }

            if (isNaN(amount) || amount <= 0) {
                showAlert("Amount must be a valid positive number", "error");
                return;
            }

            // Disable button during submission
            const submitBtn = invoiceForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Creating...";

            // Create invoice object
            const invoiceData = {
                userId: currentUser.uid,
                customerName,
                customerPhone,
                amount,
                dueDate: new Date(dueDate),
                description,
                status: "Pending", // Default status
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            // Add invoice to Firestore
            const invoicesRef = collection(db, "invoices");
            const docRef = await addDoc(invoicesRef, invoiceData);

            showAlert("Invoice created successfully!", "success");
            
            // Reset form and close modal
            invoiceForm.reset();
            invoiceModal.classList.add("hidden");
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = "Create Invoice";

        } catch (error) {
            console.error("Error creating invoice:", error);
            showAlert("Failed to create invoice. Please try again.", "error");
            const submitBtn = invoiceForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = "Create Invoice";
        }
    });
}

// ===== Load Invoices from Firestore =====
/**
 * Load and display user's invoices in real-time
 */
function loadInvoices() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
        // Create query for user's invoices
        const invoicesRef = collection(db, "invoices");
        const q = query(
            invoicesRef,
            where("userId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );

        // Real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            invoicesList.innerHTML = ""; // Clear list

            if (snapshot.empty) {
                invoicesList.innerHTML = `
                    <div class="px-6 py-8 text-center text-gray-500">
                        <p>No invoices yet. Create your first invoice to get started!</p>
                    </div>
                `;
                return;
            }

            // Display each invoice
            snapshot.forEach((doc) => {
                const invoice = doc.data();
                const invoiceId = doc.id;
                displayInvoice(invoice, invoiceId);
            });

        }, (error) => {
            console.error("Error loading invoices:", error);
            showAlert("Failed to load invoices", "error");
        });

        return unsubscribe;

    } catch (error) {
        console.error("Error setting up invoice listener:", error);
        showAlert("Error loading invoices", "error");
    }
}

// ===== Display Invoice Card =====
/**
 * Display individual invoice card
 * @param {Object} invoice - Invoice data
 * @param {string} invoiceId - Invoice document ID
 */
function displayInvoice(invoice, invoiceId) {
    const dueDateObj = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const dueDateStr = dueDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    const createdDateObj = invoice.createdAt.toDate?.() || new Date(invoice.createdAt);
    const createdDateStr = createdDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    // Determine if invoice is overdue
    const isOverdue = dueDateObj < new Date() && invoice.status === "Pending";

    // Create invoice card HTML
    const invoiceCard = document.createElement("div");
    invoiceCard.className = "invoice-card";
    invoiceCard.innerHTML = `
        <div class="invoice-card-header">
            <h4 class="invoice-card-title">${escapeHtml(invoice.customerName)}</h4>
            <span class="invoice-status ${invoice.status === "Paid" ? "status-paid" : "status-pending"}">
                ${invoice.status}${isOverdue ? " (Overdue)" : ""}
            </span>
        </div>

        <div class="invoice-details">
            <div class="invoice-detail-item">
                <div class="invoice-detail-label">Amount</div>
                <div class="invoice-detail-value">$${invoice.amount.toFixed(2)}</div>
            </div>
            <div class="invoice-detail-item">
                <div class="invoice-detail-label">Due Date</div>
                <div class="invoice-detail-value">${dueDateStr}</div>
            </div>
            <div class="invoice-detail-item">
                <div class="invoice-detail-label">Created</div>
                <div class="invoice-detail-value">${createdDateStr}</div>
            </div>
            <div class="invoice-detail-item">
                <div class="invoice-detail-label">Phone</div>
                <div class="invoice-detail-value">${escapeHtml(invoice.customerPhone)}</div>
            </div>
        </div>

        ${invoice.description ? `<div style="margin-bottom: 1rem; padding: 0.75rem; background-color: #f9fafb; border-radius: 0.25rem; font-size: 0.875rem; color: #4b5563;"><strong>Description:</strong> ${escapeHtml(invoice.description)}</div>` : ""}

        <div class="invoice-actions">
            <button class="btn btn-primary send-whatsapp-btn" data-invoice-id="${invoiceId}">
                📱 Send WhatsApp
            </button>
            ${invoice.status === "Pending" ? `
                <button class="btn btn-success mark-paid-btn" data-invoice-id="${invoiceId}">
                    ✓ Mark as Paid
                </button>
            ` : ""}
            <button class="btn btn-danger delete-invoice-btn" data-invoice-id="${invoiceId}">
                🗑️ Delete
            </button>
        </div>
    `;

    invoicesList.appendChild(invoiceCard);

    // Add event listeners for buttons
    const sendWhatsAppBtn = invoiceCard.querySelector(".send-whatsapp-btn");
    const markPaidBtn = invoiceCard.querySelector(".mark-paid-btn");
    const deleteBtn = invoiceCard.querySelector(".delete-invoice-btn");

    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener("click", () => {
            sendWhatsAppReminder(invoice, invoiceId);
        });
    }

    if (markPaidBtn) {
        markPaidBtn.addEventListener("click", () => {
            markInvoiceAsPaid(invoiceId);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            deleteInvoice(invoiceId);
        });
    }
}

// ===== Update Invoice Status =====
/**
 * Mark invoice as paid
 * @param {string} invoiceId - Invoice document ID
 */
async function markInvoiceAsPaid(invoiceId) {
    if (!confirm("Mark this invoice as paid?")) return;

    try {
        const invoiceRef = doc(db, "invoices", invoiceId);
        await updateDoc(invoiceRef, {
            status: "Paid",
            updatedAt: Timestamp.now()
        });

        showAlert("Invoice marked as paid!", "success");

    } catch (error) {
        console.error("Error updating invoice:", error);
        showAlert("Failed to update invoice", "error");
    }
}

// ===== Delete Invoice =====
/**
 * Delete an invoice
 * @param {string} invoiceId - Invoice document ID
 */
async function deleteInvoice(invoiceId) {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
        return;
    }

    try {
        const invoiceRef = doc(db, "invoices", invoiceId);
        await deleteDoc(invoiceRef);

        showAlert("Invoice deleted successfully!", "success");

    } catch (error) {
        console.error("Error deleting invoice:", error);
        showAlert("Failed to delete invoice", "error");
    }
}

// ===== Send WhatsApp Reminder =====
/**
 * Send WhatsApp reminder for invoice
 * @param {Object} invoice - Invoice data
 * @param {string} invoiceId - Invoice document ID
 */
function sendWhatsAppReminder(invoice, invoiceId) {
    // Import from whatsapp.js
    const message = generateInvoiceMessage(invoice);
    const whatsappLink = generateWhatsAppLink(invoice.customerPhone, message);
    
    // Open WhatsApp in new window
    window.open(whatsappLink, "_blank");
    
    showAlert("Opening WhatsApp in new window...", "success");
}

/**
 * Escape HTML special characters to prevent XSS
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

// ===== Initialize =====
/**
 * Initialize invoice module on page load
 */
function initInvoiceModule() {
    // Only run if we're on the dashboard
    if (invoicesList) {
        loadInvoices();
    }
}

// Run initialization when page loads
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInvoiceModule);
} else {
    initInvoiceModule();
}

// Export functions for use in other modules
export { sendWhatsAppReminder };