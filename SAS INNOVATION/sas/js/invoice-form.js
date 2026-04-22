// ====================================================================
// Invoice Form Module
// ====================================================================
// Handles invoice form UI, validation, and submission

import {
    createInvoice,
    updateInvoice
} from "./invoice-service.js";

import {
    validatePhoneNumber,
    validateEmail,
    formatPhoneNumber,
    getCurrentDateString,
    getDateAfterDays
} from "./invoice-utils.js";

// ====================================================================
// DOM Elements
// ====================================================================

const createInvoiceBtn = document.getElementById("createInvoiceBtn");
const invoiceModal = document.getElementById("invoiceModal");
const closeInvoiceModal = document.getElementById("closeInvoiceModal");
const cancelInvoiceBtn = document.getElementById("cancelInvoiceBtn");
const invoiceForm = document.getElementById("invoiceForm");
const formAlert = document.getElementById("formAlert");
const submitInvoiceBtn = document.getElementById("submitInvoiceBtn");
const submitBtnText = document.getElementById("submitBtnText");
const submitSpinner = document.getElementById("submitSpinner");

// Form fields
const customerName = document.getElementById("customerName");
const customerEmail = document.getElementById("customerEmail");
const customerPhone = document.getElementById("customerPhone");
const amount = document.getElementById("amount");
const invoiceDate = document.getElementById("invoiceDate");
const dueDate = document.getElementById("dueDate");
const description = document.getElementById("description");
const addItemBtn = document.getElementById("addItemBtn");
const invoiceItems = document.getElementById("invoiceItems");

// ====================================================================
// Modal Management
// ====================================================================

/**
 * Open create invoice modal
 */
if (createInvoiceBtn) {
    createInvoiceBtn.addEventListener("click", openInvoiceModal);
}

/**
 * Close invoice modal
 */
if (closeInvoiceModal) {
    closeInvoiceModal.addEventListener("click", closeInvoiceModal_);
}

if (cancelInvoiceBtn) {
    cancelInvoiceBtn.addEventListener("click", closeInvoiceModal_);
}

/**
 * Close modal when clicking outside
 */
if (invoiceModal) {
    invoiceModal.addEventListener("click", (e) => {
        if (e.target === invoiceModal) {
            closeInvoiceModal_();
        }
    });
}

/**
 * Open invoice modal
 */
function openInvoiceModal() {
    invoiceForm.reset();
    clearFormErrors();
    hideAlert();

    // Set today's date as invoice date
    invoiceDate.valueAsDate = new Date();

    // Set default due date (30 days from today)
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    dueDate.valueAsDate = defaultDueDate;

    invoiceModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

/**
 * Close invoice modal
 */
function closeInvoiceModal_() {
    invoiceModal.classList.add("hidden");
    document.body.style.overflow = "auto";
    invoiceForm.reset();
    clearFormErrors();
    hideAlert();
}

// ====================================================================
// Form Submission
// ====================================================================

if (invoiceForm) {
    invoiceForm.addEventListener("submit", handleInvoiceSubmit);
}

/**
 * Handle invoice form submission
 * @param {Event} e - Form submit event
 */
async function handleInvoiceSubmit(e) {
    e.preventDefault();

    // Clear previous alerts and errors
    hideAlert();
    clearFormErrors();

    // Validate form
    if (!validateInvoiceForm()) {
        return;
    }

    try {
        // Show loading state
        setFormLoading(true);

        // Collect form data
        const formData = {
            customerName: customerName.value.trim(),
            customerEmail: customerEmail.value.trim() || "",
            customerPhone: formatPhoneNumber(customerPhone.value.trim()),
            amount: parseFloat(amount.value),
            invoiceDate: new Date(invoiceDate.value),
            dueDate: new Date(dueDate.value),
            description: description.value.trim() || ""
        };

        // Collect invoice items
        const items = collectInvoiceItems();
        if (items.length > 0) {
            formData.items = items;
        }

        // Create invoice
        const invoice = await createInvoice(formData);

        // Show success message
        showAlert(
            `Invoice created successfully! Invoice ID: ${invoice.id}`,
            "success"
        );

        // Reset form
        invoiceForm.reset();
        invoiceItems.innerHTML = "";

        // Close modal after 2 seconds
        setTimeout(() => {
            closeInvoiceModal_();
        }, 2000);

    } catch (error) {
        console.error("Form submission error:", error);
        showAlert(error.message || "Failed to create invoice", "error");
        setFormLoading(false);
    }
}

// ====================================================================
// Form Validation
// ====================================================================

/**
 * Validate entire invoice form
 * @returns {boolean} True if form is valid
 */
function validateInvoiceForm() {
    let isValid = true;

    // Validate customer name
    if (!validateField(customerName, "Customer name is required")) {
        isValid = false;
    }

    // Validate customer phone
    if (!validateField(customerPhone, "Phone number is required")) {
        isValid = false;
    } else if (!validatePhoneNumber(customerPhone.value)) {
        showFieldError(customerPhone, "Enter a valid phone number (include country code)");
        isValid = false;
    }

    // Validate email if provided
    if (customerEmail.value && !validateEmail(customerEmail.value)) {
        showFieldError(customerEmail, "Enter a valid email address");
        isValid = false;
    }

    // Validate amount
    if (!validateField(amount, "Amount is required")) {
        isValid = false;
    } else {
        const amountValue = parseFloat(amount.value);
        if (isNaN(amountValue) || amountValue <= 0) {
            showFieldError(amount, "Amount must be a positive number");
            isValid = false;
        }
    }

    // Validate invoice date
    if (!validateField(invoiceDate, "Invoice date is required")) {
        isValid = false;
    }

    // Validate due date
    if (!validateField(dueDate, "Due date is required")) {
        isValid = false;
    } else {
        // Check if due date is after invoice date
        const invDate = new Date(invoiceDate.value);
        const dueDateTime = new Date(dueDate.value);

        if (dueDateTime < invDate) {
            showFieldError(dueDate, "Due date must be after invoice date");
            isValid = false;
        }
    }

    return isValid;
}

/**
 * Validate individual field
 * @param {Element} field - Field element
 * @param {string} errorMsg - Error message
 * @returns {boolean} True if field is valid
 */
function validateField(field, errorMsg) {
    const value = field.value.trim();

    if (!value) {
        showFieldError(field, errorMsg);
        return false;
    }

    clearFieldError(field);
    return true;
}

/**
 * Show field error
 * @param {Element} field - Field element
 * @param {string} errorMsg - Error message
 */
function showFieldError(field, errorMsg) {
    field.classList.add("border-red-500");
    const errorText = field.nextElementSibling;

    if (errorText?.classList.contains("error-text")) {
        errorText.textContent = errorMsg;
        errorText.classList.remove("hidden");
    }
}

/**
 * Clear field error
 * @param {Element} field - Field element
 */
function clearFieldError(field) {
    field.classList.remove("border-red-500");
    const errorText = field.nextElementSibling;

    if (errorText?.classList.contains("error-text")) {
        errorText.classList.add("hidden");
        errorText.textContent = "";
    }
}

/**
 * Clear all form errors
 */
function clearFormErrors() {
    document.querySelectorAll(".error-text").forEach(error => {
        error.classList.add("hidden");
        error.textContent = "";
    });

    document.querySelectorAll("input, textarea").forEach(field => {
        field.classList.remove("border-red-500");
    });
}

// ====================================================================
// Real-time Field Validation
// ====================================================================

// Remove error on input
customerName?.addEventListener("input", function() {
    clearFieldError(this);
});

customerPhone?.addEventListener("input", function() {
    clearFieldError(this);
});

customerEmail?.addEventListener("input", function() {
    clearFieldError(this);
});

amount?.addEventListener("input", function() {
    clearFieldError(this);
});

invoiceDate?.addEventListener("change", function() {
    clearFieldError(this);
});

dueDate?.addEventListener("change", function() {
    clearFieldError(this);
});

// ====================================================================
// Invoice Items Management
// ====================================================================

if (addItemBtn) {
    addItemBtn.addEventListener("click", addInvoiceItem);
}

/**
 * Add invoice line item
 */
function addInvoiceItem() {
    const itemCount = invoiceItems.children.length;
    const itemHTML = `
        <div class="invoice-item border border-gray-300 rounded-lg p-4" data-item-index="${itemCount}">
            <div class="grid md:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-gray-700 font-medium text-sm mb-1">Description</label>
                    <input 
                        type="text" 
                        class="item-description w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Item or service description"
                    >
                </div>
                <div>
                    <label class="block text-gray-700 font-medium text-sm mb-1">Qty</label>
                    <input 
                        type="number" 
                        class="item-quantity w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="1"
                        value="1"
                        min="1"
                    >
                </div>
                <div>
                    <label class="block text-gray-700 font-medium text-sm mb-1">Rate</label>
                    <input 
                        type="number" 
                        class="item-rate w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                    >
                </div>
                <div>
                    <label class="block text-gray-700 font-medium text-sm mb-1">Amount</label>
                    <input 
                        type="text" 
                        class="item-amount w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                        placeholder="0.00"
                        readonly
                    >
                </div>
            </div>
            <button 
                type="button" 
                class="remove-item text-red-600 hover:text-red-800 text-sm font-medium mt-2"
            >
                Remove Item
            </button>
        </div>
    `;

    const itemDiv = document.createElement("div");
    itemDiv.innerHTML = itemHTML;
    invoiceItems.appendChild(itemDiv);

    // Setup event listeners for this item
    setupItemEventListeners(itemDiv);
}

/**
 * Setup event listeners for invoice item
 * @param {Element} itemDiv - Item container
 */
function setupItemEventListeners(itemDiv) {
    const quantityInput = itemDiv.querySelector(".item-quantity");
    const rateInput = itemDiv.querySelector(".item-rate");
    const amountInput = itemDiv.querySelector(".item-amount");
    const removeBtn = itemDiv.querySelector(".remove-item");

    // Update amount when quantity or rate changes
    const updateAmount = () => {
        const qty = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const total = qty * rate;

        amountInput.value = total.toFixed(2);
        updateInvoiceTotal();
    };

    quantityInput?.addEventListener("input", updateAmount);
    rateInput?.addEventListener("input", updateAmount);

    // Remove item
    removeBtn?.addEventListener("click", () => {
        itemDiv.remove();
        updateInvoiceTotal();
    });
}

/**
 * Collect invoice items from form
 * @returns {Array} Invoice items
 */
function collectInvoiceItems() {
    const items = [];

    document.querySelectorAll(".invoice-item").forEach(itemDiv => {
        const description = itemDiv.querySelector(".item-description")?.value;
        const quantity = parseFloat(itemDiv.querySelector(".item-quantity")?.value) || 0;
        const rate = parseFloat(itemDiv.querySelector(".item-rate")?.value) || 0;

        if (description && quantity > 0 && rate > 0) {
            items.push({
                description,
                quantity,
                rate,
                amount: quantity * rate
            });
        }
    });

    return items;
}

/**
 * Update invoice total from items
 */
function updateInvoiceTotal() {
    const items = collectInvoiceItems();
    const total = items.reduce((sum, item) => sum + item.amount, 0);

    if (amount && total > 0) {
        amount.value = total.toFixed(2);
    }
}

// ====================================================================
// Alert Management
// ====================================================================

/**
 * Show form alert
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, warning)
 */
function showAlert(message, type) {
    if (!formAlert) return;

    const icons = {
        success: "✅",
        error: "⚠️",
        warning: "⚠️"
    };

    const colorClasses = {
        success: "bg-green-50 border-green-200 text-green-700",
        error: "bg-red-50 border-red-200 text-red-700",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-700"
    };

    formAlert.innerHTML = `
        <span class="text-lg leading-none">${icons[type]}</span>
        <p class="font-medium">${message}</p>
    `;

    formAlert.className = `flex items-start space-x-2 p-4 rounded-lg text-sm border ${colorClasses[type]}`;
    formAlert.classList.remove("hidden");

    // Auto-hide after 5 seconds
    if (type === "success") {
        setTimeout(() => {
            hideAlert();
        }, 5000);
    }
}

/**
 * Hide form alert
 */
function hideAlert() {
    if (formAlert) {
        formAlert.classList.add("hidden");
    }
}

// ====================================================================
// Loading State
// ====================================================================

/**
 * Set form loading state
 * @param {boolean} isLoading - Loading state
 */
function setFormLoading(isLoading) {
    if (submitInvoiceBtn) {
        submitInvoiceBtn.disabled = isLoading;

        if (isLoading) {
            submitBtnText.textContent = "Creating Invoice...";
            submitSpinner.classList.remove("hidden");
        } else {
            submitBtnText.textContent = "Create Invoice";
            submitSpinner.classList.add("hidden");
        }
    }
}