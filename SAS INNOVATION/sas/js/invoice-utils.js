// ====================================================================
// Invoice Utilities Module
// ====================================================================
// Helper functions for invoice operations

// ====================================================================
// Phone Number Validation & Formatting
// ====================================================================

/**
 * Validate phone number format
 * Must include country code and have at least 10 digits
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 * 
 * @example
 * validatePhoneNumber("+12345678900") // true
 * validatePhoneNumber("+1-234-567-8900") // true
 * validatePhoneNumber("12345678900") // false (no country code)
 */
export function validatePhoneNumber(phoneNumber) {
    // Remove all non-digit characters except leading +
    const cleaned = phoneNumber.replace(/[^\d+]/g, "");

    // Must start with + and have at least 10 digits
    if (!cleaned.startsWith("+")) {
        return false;
    }

    // Extract just the digits
    const digitsOnly = cleaned.slice(1);

    // Must have between 10-15 digits (international standard)
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Format phone number to standard format
 * Removes spaces, dashes, parentheses, keeps country code
 * 
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except leading +
    return phoneNumber.replace(/[^\d+]/g, "");
}

/**
 * Display phone number in readable format
 * 
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted for display
 */
export function displayPhoneNumber(phoneNumber) {
    if (!phoneNumber) return "";

    const cleaned = phoneNumber.replace(/[^\d+]/g, "");

    // If less than 15 characters, format based on length
    if (cleaned.length <= 12) {
        return cleaned.replace(/(\d{1,3})(\d{1,3})(\d{1,4})/, "+$1 $2 $3");
    }

    return cleaned;
}

// ====================================================================
// Email Validation
// ====================================================================

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ====================================================================
// Currency Formatting
// ====================================================================

/**
 * Format number as currency (USD)
 * 
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1500.5) // "$1,500.50"
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Parse currency string to number
 * 
 * @param {string} currencyString - Currency string like "$1,500.00"
 * @returns {number} Parsed amount
 */
export function parseCurrency(currencyString) {
    return parseFloat(currencyString.replace(/[^\d.-]/g, ""));
}

// ====================================================================
// Date Formatting
// ====================================================================

/**
 * Format date to readable string
 * 
 * @param {Date} date - Date to format
 * @param {string} format - Format style (short, long, iso)
 * @returns {string} Formatted date
 * 
 * @example
 * formatDate(new Date()) // "Jan 15, 2024"
 * formatDate(new Date(), "long") // "January 15, 2024"
 * formatDate(new Date(), "iso") // "2024-01-15"
 */
export function formatDate(date, format = "short") {
    if (!date || !(date instanceof Date)) {
        return "";
    }

    if (format === "iso") {
        return date.toISOString().split("T")[0];
    }

    const options = format === "long" 
        ? { year: "numeric", month: "long", day: "numeric" }
        : { year: "numeric", month: "short", day: "numeric" };

    return date.toLocaleDateString("en-US", options);
}

/**
 * Get current date as YYYY-MM-DD string
 * 
 * @returns {string} Today's date in ISO format
 */
export function getCurrentDateString() {
    return new Date().toISOString().split("T")[0];
}

/**
 * Get date N days from now
 * 
 * @param {number} days - Number of days to add
 * @returns {Date} Date N days from now
 */
export function getDateAfterDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

/**
 * Calculate days until date
 * 
 * @param {Date} date - Target date
 * @returns {number} Number of days until date (negative if date is in past)
 */
export function daysUntilDate(date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ====================================================================
// Invoice Status
// ====================================================================

/**
 * Get CSS class for invoice status badge
 * 
 * @param {string} status - Invoice status (Pending, Paid, Overdue, Cancelled)
 * @param {boolean} overdue - Is invoice overdue
 * @returns {string} CSS class string
 */
export function getInvoiceStatusColor(status, overdue = false) {
    if (overdue && status === "Pending") {
        return "bg-red-100 text-red-800";
    }

    switch (status) {
        case "Paid":
            return "bg-green-100 text-green-800";
        case "Pending":
            return "bg-yellow-100 text-yellow-800";
        case "Overdue":
            return "bg-red-100 text-red-800";
        case "Cancelled":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

/**
 * Get human-readable status text
 * 
 * @param {string} status - Invoice status
 * @param {boolean} overdue - Is invoice overdue
 * @returns {string} Status text
 */
export function getInvoiceStatusText(status, overdue = false) {
    if (overdue && status === "Pending") {
        return "Overdue";
    }
    return status || "Unknown";
}

/**
 * Check if invoice is overdue
 * 
 * @param {Object} invoice - Invoice object with dueDate
 * @returns {boolean} True if invoice is overdue
 */
export function isInvoiceOverdue(invoice) {
    if (invoice.status !== "Pending") {
        return false;
    }

    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const now = new Date();

    return dueDate < now;
}

// ====================================================================
// Invoice Calculations
// ====================================================================

/**
 * Calculate total from line items
 * 
 * @param {Array} items - Array of invoice items
 * @returns {number} Total amount
 */
export function calculateInvoiceTotal(items) {
    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce((total, item) => {
        return total + ((item.quantity || 0) * (item.rate || 0));
    }, 0);
}

/**
 * Calculate tax amount
 * 
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate as percentage (e.g., 8.5 for 8.5%)
 * @returns {number} Tax amount
 */
export function calculateTax(subtotal, taxRate = 0) {
    return (subtotal * taxRate) / 100;
}

/**
 * Calculate grand total with tax
 * 
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate as percentage
 * @param {number} discount - Discount amount (optional)
 * @returns {number} Grand total
 */
export function calculateGrandTotal(subtotal, taxRate = 0, discount = 0) {
    const tax = calculateTax(subtotal, taxRate);
    return subtotal + tax - discount;
}

// ====================================================================
// Invoice PDF/Print
// ====================================================================

/**
 * Generate invoice HTML for printing
 * 
 * @param {Object} invoice - Invoice data
 * @param {Object} company - Company info
 * @returns {string} HTML string
 */
export function generateInvoiceHTML(invoice, company = {}) {
    const invoiceDate = invoice.invoiceDate.toDate?.() || new Date(invoice.invoiceDate);
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${invoice.id}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-title { font-size: 32px; font-weight: bold; }
                .info-section { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                .total-row { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1 class="invoice-title">INVOICE</h1>
                    <p>Invoice ID: ${invoice.id}</p>
                </div>
                <div>
                    <h2>${company.name || 'Your Company'}</h2>
                </div>
            </div>

            <div style="display: flex; gap: 40px;">
                <div class="info-section">
                    <h4>BILL TO:</h4>
                    <p>${invoice.customerName}</p>
                    <p>${invoice.customerPhone}</p>
                    <p>${invoice.customerEmail}</p>
                </div>
                <div class="info-section">
                    <p><strong>Invoice Date:</strong> ${formatDate(invoiceDate)}</p>
                    <p><strong>Due Date:</strong> ${formatDate(dueDate)}</p>
                </div>
            </div>

            ${invoice.items ? `
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: right;">Quantity</th>
                            <th style="text-align: right;">Rate</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td style="text-align: right;">${item.quantity}</td>
                                <td style="text-align: right;">${formatCurrency(item.rate)}</td>
                                <td style="text-align: right;">${formatCurrency(item.amount)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            ` : ""}

            <div style="text-align: right; margin-top: 20px;">
                <table style="width: 200px; margin-left: auto;">
                    <tr class="total-row">
                        <td>Total:</td>
                        <td style="text-align: right;">${formatCurrency(invoice.amount)}</td>
                    </tr>
                </table>
            </div>

            ${invoice.description ? `
                <div style="margin-top: 30px;">
                    <h4>Notes:</h4>
                    <p>${invoice.description}</p>
                </div>
            ` : ""}
        </body>
        </html>
    `;
}

/**
 * Print invoice
 * 
 * @param {Object} invoice - Invoice data
 * @param {Object} company - Company info
 */
export function printInvoice(invoice, company = {}) {
    const html = generateInvoiceHTML(invoice, company);
    const printWindow = window.open("", "", "width=900,height=600");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

// ====================================================================
// Export All
// ====================================================================

export {
    validatePhoneNumber,
    formatPhoneNumber,
    displayPhoneNumber,
    validateEmail,
    formatCurrency,
    parseCurrency,
    formatDate,
    getCurrentDateString,
    getDateAfterDays,
    daysUntilDate,
    getInvoiceStatusColor,
    getInvoiceStatusText,
    isInvoiceOverdue,
    calculateInvoiceTotal,
    calculateTax,
    calculateGrandTotal,
    generateInvoiceHTML,
    printInvoice
};