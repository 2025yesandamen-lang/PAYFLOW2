// ====================================================================
// WhatsApp Service Module
// ====================================================================
// Handles WhatsApp message generation, link creation, and encoding

import { formatCurrency, formatDate } from "./invoice-utils.js";

// ====================================================================
// Message Templates
// ====================================================================

/**
 * WhatsApp Message Templates
 */
const MESSAGE_TEMPLATES = {
    STANDARD: `Hello {customerName}, your invoice of ₦{amount} is due on {dueDate}. Please make payment. Thank you.`,
    
    DETAILED: `Hi {customerName},

I wanted to remind you about your pending invoice:

💰 Amount: ₦{amount}
📅 Due Date: {dueDate}
{description}

Please arrange payment at your earliest convenience.

Thank you for your business!`,
    
    PROFESSIONAL: `Dear {customerName},

This is a payment reminder for your pending invoice:

Invoice Details:
• Amount: ₦{amount}
• Due Date: {dueDate}
• Invoice ID: {invoiceId}

Please proceed with payment as soon as possible.

Best regards`,
    
    URGENT: `⚠️ URGENT: Hi {customerName}, your invoice of ₦{amount} is now OVERDUE (Due: {dueDate}). Please prioritize this payment immediately. Contact us if you need clarification. Thank you.`,
    
    PAYMENT_RECEIVED: `✅ Thank you {customerName}! We have received your payment of ₦{amount}. Your invoice has been marked as paid. We appreciate your business!`,
    
    CUSTOM: `{message}`
};

// ====================================================================
// Generate WhatsApp Message
// ====================================================================

/**
 * Generate WhatsApp message from invoice data
 * 
 * @param {Object} invoice - Invoice object with customerName, amount, dueDate, etc.
 * @param {Object} options - Configuration options
 * @param {string} options.template - Message template to use (STANDARD, DETAILED, PROFESSIONAL, URGENT, PAYMENT_RECEIVED, CUSTOM)
 * @param {string} options.customMessage - Custom message text (if template is CUSTOM)
 * @param {boolean} options.includeEmoji - Include emoji in message (default: true)
 * 
 * @returns {string} Formatted WhatsApp message
 * 
 * @throws {Error} If invoice data is invalid
 * 
 * @example
 * const message = generateWhatsAppMessage(invoice, {
 *     template: 'STANDARD'
 * });
 * console.log(message);
 * // "Hello John Doe, your invoice of ₦50,000.00 is due on 15 Jan 2024. Please make payment. Thank you."
 */
export function generateWhatsAppMessage(invoice, options = {}) {
    try {
        // Validate invoice data
        if (!invoice) {
            throw new Error("Invoice object is required");
        }

        if (!invoice.customerName || !invoice.amount) {
            throw new Error("Invoice must have customerName and amount");
        }

        const {
            template = 'STANDARD',
            customMessage = '',
            includeEmoji = true
        } = options;

        // Format date for display
        const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
        const formattedDueDate = formatDateForMessage(dueDate);

        // Format amount with currency symbol
        const formattedAmount = formatAmountForMessage(invoice.amount);

        // Format description
        const description = invoice.description 
            ? `📝 ${sanitizeText(invoice.description)}`
            : '';

        // Get the message template
        let messageTemplate = MESSAGE_TEMPLATES[template] || MESSAGE_TEMPLATES.STANDARD;

        // Replace all placeholders
        let message = messageTemplate
            .replace(/{customerName}/g, sanitizeText(invoice.customerName))
            .replace(/{amount}/g, formattedAmount.replace('₦', '').trim())
            .replace(/{dueDate}/g, formattedDueDate)
            .replace(/{description}/g, description)
            .replace(/{invoiceId}/g, invoice.id || "N/A")
            .replace(/{message}/g, customMessage);

        console.log("✅ WhatsApp message generated successfully");
        return message;

    } catch (error) {
        console.error("❌ Error generating WhatsApp message:", error);
        throw new Error(`Failed to generate message: ${error.message}`);
    }
}

// ====================================================================
// Generate WhatsApp Link
// ====================================================================

/**
 * Generate WhatsApp "Click to Chat" link
 * Uses wa.me endpoint for direct messaging
 * Properly encodes message for URL safety
 * 
 * @param {string} phoneNumber - Customer phone number with country code (e.g., "+2348012345678")
 * @param {string} message - Message text to send
 * 
 * @returns {string} Complete WhatsApp URL
 * 
 * @throws {Error} If phone number or message is invalid
 * 
 * @example
 * const link = generateWhatsAppLink("+2348012345678", "Hello!");
 * // Returns: https://wa.me/2348012345678?text=Hello%21
 * 
 * window.open(link, '_blank');
 */
export function generateWhatsAppLink(phoneNumber, message) {
    try {
        // Validate inputs
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            throw new Error("Phone number must be a non-empty string");
        }

        if (!message || typeof message !== 'string') {
            throw new Error("Message must be a non-empty string");
        }

        // Clean phone number - remove spaces, dashes, parentheses
        const cleanedPhone = cleanPhoneNumber(phoneNumber);

        // Validate phone number format
        if (!validatePhoneNumber(cleanedPhone)) {
            throw new Error("Invalid phone number format. Must include country code (e.g., +234)");
        }

        // Remove the leading + for WhatsApp API (wa.me accepts without +)
        const phoneWithoutPlus = cleanedPhone.replace("+", "");

        // Encode message for URL - WhatsApp requires proper URL encoding
        // encodeURIComponent handles all special characters
        const encodedMessage = encodeURIComponent(message);

        // Construct WhatsApp link
        const whatsappLink = `https://wa.me/${phoneWithoutPlus}?text=${encodedMessage}`;

        console.log("✅ WhatsApp link generated successfully");
        console.log("📱 Phone:", phoneWithoutPlus);
        console.log("📝 Message length:", message.length);

        return whatsappLink;

    } catch (error) {
        console.error("❌ Error generating WhatsApp link:", error);
        throw new Error(`Failed to generate WhatsApp link: ${error.message}`);
    }
}

// ====================================================================
// Send WhatsApp Message
// ====================================================================

/**
 * Open WhatsApp with pre-filled message
 * Combines message generation and link creation
 * 
 * @param {Object} invoice - Invoice object
 * @param {Object} options - Options
 * @param {string} options.template - Message template (default: 'STANDARD')
 * @param {string} options.customMessage - Custom message for CUSTOM template
 * @param {boolean} options.newTab - Open in new tab (default: true)
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * 
 * @returns {Object} Result object with link and status
 * 
 * @example
 * try {
 *     const result = sendWhatsAppMessage(invoice, {
 *         template: 'STANDARD',
 *         onSuccess: () => console.log('WhatsApp opened'),
 *         onError: (err) => console.error(err)
 *     });
 * } catch (error) {
 *     console.error(error);
 * }
 */
export function sendWhatsAppMessage(invoice, options = {}) {
    try {
        const {
            template = 'STANDARD',
            customMessage = '',
            newTab = true,
            onSuccess = null,
            onError = null
        } = options;

        // Generate message
        const message = generateWhatsAppMessage(invoice, {
            template,
            customMessage
        });

        // Generate link
        const link = generateWhatsAppLink(invoice.customerPhone, message);

        // Open WhatsApp
        const windowFeatures = newTab 
            ? '' 
            : 'width=800,height=600,resizable=yes,scrollbars=yes';

        const target = newTab ? '_blank' : '_self';
        const window_ref = window.open(link, target, windowFeatures);

        // Check if popup was blocked
        if (!window_ref || window_ref.closed || typeof window_ref.closed === 'undefined') {
            throw new Error("Popup blocked or WhatsApp couldn't be opened. Make sure popups are allowed.");
        }

        console.log("✅ WhatsApp opened successfully");

        // Trigger success callback
        if (typeof onSuccess === 'function') {
            onSuccess({
                invoiceId: invoice.id,
                customerName: invoice.customerName,
                link,
                message
            });
        }

        return {
            success: true,
            link,
            message,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error("❌ Error sending WhatsApp message:", error);

        // Trigger error callback
        if (typeof onError === 'function') {
            onError(error);
        }

        throw error;
    }
}

// ====================================================================
// Phone Number Utilities
// ====================================================================

/**
 * Clean and format phone number
 * Removes spaces, dashes, parentheses
 * Adds country code if missing
 * 
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Cleaned phone number with country code
 * 
 * @example
 * cleanPhoneNumber("08012345678") → "+2348012345678"
 * cleanPhoneNumber("+1-555-123-4567") → "+15551234567"
 * cleanPhoneNumber("(234) 801-234-5678") → "+2348012345678"
 */
export function cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return "";
    }

    // Remove all spaces, dashes, parentheses
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Already has + prefix
    if (cleaned.startsWith("+")) {
        return cleaned;
    }

    // Nigerian number without country code (10 digits starting with 08)
    if (cleaned.startsWith("0") && cleaned.length === 11) {
        return "+234" + cleaned.substring(1);
    }

    // International format without +
    if (/^\d{10,15}$/.test(cleaned)) {
        // If 10 digits, assume +234
        if (cleaned.length === 10) {
            return "+234" + cleaned;
        }
        return "+" + cleaned;
    }

    // Fallback - just add +
    return "+" + cleaned;
}

/**
 * Validate phone number format
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 * 
 * @example
 * validatePhoneNumber("+2348012345678") → true
 * validatePhoneNumber("08012345678") → false (must have country code)
 * validatePhoneNumber("+1234567890") → true
 */
export function validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return false;
    }

    // Must start with +
    if (!phoneNumber.startsWith("+")) {
        return false;
    }

    // Extract digits only
    const digitsOnly = phoneNumber.replace(/\D/g, "");

    // Must have 10-15 digits (international standard)
    // Most countries have 7-15 digit numbers
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return false;
    }

    return true;
}

// ====================================================================
// Message Formatting Helpers
// ====================================================================

/**
 * Format date for WhatsApp message display
 * 
 * @param {Date} date - Date to format
 * @returns {string} Formatted date (e.g., "15 Jan 2024")
 * 
 * @example
 * formatDateForMessage(new Date(2024, 0, 15)) → "15 Jan 2024"
 */
export function formatDateForMessage(date) {
    if (!date || !(date instanceof Date)) {
        return "N/A";
    }

    try {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error("Error formatting date:", error);
        return "N/A";
    }
}

/**
 * Format amount for WhatsApp message
 * 
 * @param {number} amount - Amount in currency
 * @returns {string} Formatted amount (e.g., "₦50,000.00")
 * 
 * @example
 * formatAmountForMessage(50000) → "₦50,000.00"
 */
export function formatAmountForMessage(amount) {
    if (!amount || isNaN(amount)) {
        return "₦0.00";
    }

    try {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        console.error("Error formatting amount:", error);
        return `₦${amount.toFixed(2)}`;
    }
}

/**
 * Sanitize text for WhatsApp
 * Removes problematic characters that may cause encoding issues
 * 
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 * 
 * @example
 * sanitizeText('John "Doe" Smith') → 'John Doe Smith'
 */
export function sanitizeText(text) {
    if (!text || typeof text !== 'string') {
        return "";
    }

    // Remove extra whitespace
    let sanitized = text.replace(/\s+/g, " ").trim();

    // Remove problematic characters that may cause URL encoding issues
    sanitized = sanitized.replace(/["\\]/g, "");

    return sanitized;
}

// ====================================================================
// Batch Operations
// ====================================================================

/**
 * Generate WhatsApp links for multiple invoices
 * 
 * @param {Array} invoices - Array of invoice objects
 * @param {string} template - Message template to use
 * 
 * @returns {Array} Array of result objects with invoice and link
 * 
 * @example
 * const results = generateBatchWhatsAppLinks(invoices, 'STANDARD');
 * results.forEach(result => {
 *     if (result.status === 'success') {
 *         console.log(`✅ ${result.customerName}: ${result.link}`);
 *     } else {
 *         console.error(`❌ ${result.customerName}: ${result.error}`);
 *     }
 * });
 */
export function generateBatchWhatsAppLinks(invoices, template = 'STANDARD') {
    if (!Array.isArray(invoices)) {
        throw new Error("Invoices must be an array");
    }

    return invoices.map(invoice => {
        try {
            const message = generateWhatsAppMessage(invoice, { template });
            const link = generateWhatsAppLink(invoice.customerPhone, message);

            return {
                invoiceId: invoice.id,
                customerName: invoice.customerName,
                phoneNumber: invoice.customerPhone,
                message,
                link,
                status: 'success'
            };
        } catch (error) {
            return {
                invoiceId: invoice.id,
                customerName: invoice.customerName,
                phoneNumber: invoice.customerPhone,
                status: 'error',
                error: error.message
            };
        }
    });
}

// ====================================================================
// Platform Detection
// ====================================================================

/**
 * Detect if user is on mobile device
 * 
 * @returns {boolean} True if on mobile
 */
export function isMobileDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return mobileRegex.test(userAgent.toLowerCase());
}

/**
 * Generate platform-specific WhatsApp link
 * Mobile: wa.me (opens WhatsApp app)
 * Desktop: web.whatsapp.com (opens web version)
 * 
 * @param {string} phoneNumber - Phone number
 * @param {string} message - Message text
 * 
 * @returns {string} Platform-specific link
 * 
 * @example
 * const link = generatePlatformSpecificLink("+2348012345678", "Hello!");
 * // On mobile: https://wa.me/2348012345678?text=Hello%21
 * // On desktop: https://web.whatsapp.com/send?phone=2348012345678&text=Hello%21
 */
export function generatePlatformSpecificLink(phoneNumber, message) {
    try {
        const cleanedPhone = cleanPhoneNumber(phoneNumber);
        
        if (!validatePhoneNumber(cleanedPhone)) {
            throw new Error("Invalid phone number");
        }

        const phoneWithoutPlus = cleanedPhone.replace("+", "");
        const encodedMessage = encodeURIComponent(message);

        if (isMobileDevice()) {
            // Mobile: Use wa.me (opens WhatsApp app if installed)
            return `https://wa.me/${phoneWithoutPlus}?text=${encodedMessage}`;
        } else {
            // Desktop: Use web.whatsapp.com
            return `https://web.whatsapp.com/send?phone=${phoneWithoutPlus}&text=${encodedMessage}`;
        }
    } catch (error) {
        console.error("Error generating platform-specific link:", error);
        throw error;
    }
}

// ====================================================================
// Clipboard Operations
// ====================================================================

/**
 * Copy WhatsApp link to clipboard
 * Uses modern Clipboard API with fallback for older browsers
 * 
 * @param {string} link - WhatsApp link to copy
 * @returns {Promise<boolean>} True if successful
 * 
 * @example
 * try {
 *     const success = await copyWhatsAppLinkToClipboard(link);
 *     if (success) console.log('Link copied!');
 * } catch (error) {
 *     console.error(error);
 * }
 */
export async function copyWhatsAppLinkToClipboard(link) {
    try {
        // Modern approach using Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(link);
            console.log("✅ Link copied to clipboard (modern)");
            return true;
        } else {
            // Fallback for older browsers or HTTP contexts
            const textArea = document.createElement("textarea");
            textArea.value = link;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            
            textArea.focus();
            textArea.select();
            
            const success = document.execCommand("copy");
            document.body.removeChild(textArea);
            
            if (success) {
                console.log("✅ Link copied to clipboard (fallback)");
                return true;
            } else {
                throw new Error("Copy command failed");
            }
        }
    } catch (error) {
        console.error("❌ Error copying to clipboard:", error);
        return false;
    }
}

// ====================================================================
// Web Share API Integration
// ====================================================================

/**
 * Share WhatsApp link using Web Share API
 * Falls back gracefully if API not available
 * 
 * @param {string} link - WhatsApp link
 * @param {string} title - Share title
 * @param {string} text - Share description
 * 
 * @returns {Promise<boolean>} True if shared successfully
 */
export async function shareWhatsAppLink(link, title = "Invoice", text = "Send invoice reminder via WhatsApp") {
    try {
        if (navigator.share) {
            await navigator.share({
                title,
                text,
                url: link
            });
            console.log("✅ Link shared via Web Share API");
            return true;
        } else {
            console.warn("⚠️ Web Share API not supported");
            return false;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("⚠️ User cancelled share");
        } else {
            console.error("❌ Share error:", error);
        }
        return false;
    }
}

// ====================================================================
// Message History
// ====================================================================

/**
 * Store WhatsApp message in local history
 * Keeps track of sent messages for analytics
 * 
 * @param {Object} messageData - Message data object
 */
export function storeWhatsAppMessageHistory(messageData) {
    try {
        const history = JSON.parse(localStorage.getItem('whatsapp_message_history') || '[]');
        
        history.unshift({
            ...messageData,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 messages
        if (history.length > 100) {
            history.pop();
        }

        localStorage.setItem('whatsapp_message_history', JSON.stringify(history));
        console.log("✅ Message stored in history");

    } catch (error) {
        console.error("❌ Error storing message history:", error);
    }
}

/**
 * Get WhatsApp message history
 * 
 * @returns {Array} Array of historical messages
 */
export function getWhatsAppMessageHistory() {
    try {
        return JSON.parse(localStorage.getItem('whatsapp_message_history') || '[]');
    } catch (error) {
        console.error("❌ Error retrieving message history:", error);
        return [];
    }
}

/**
 * Clear WhatsApp message history
 */
export function clearWhatsAppMessageHistory() {
    try {
        localStorage.removeItem('whatsapp_message_history');
        console.log("✅ Message history cleared");
    } catch (error) {
        console.error("❌ Error clearing history:", error);
    }
}

// ====================================================================
// Export All Functions
// ====================================================================

export {
    MESSAGE_TEMPLATES,
    generateWhatsAppMessage,
    generateWhatsAppLink,
    sendWhatsAppMessage,
    cleanPhoneNumber,
    validatePhoneNumber,
    formatDateForMessage,
    formatAmountForMessage,
    sanitizeText,
    generateBatchWhatsAppLinks,
    isMobileDevice,
    generatePlatformSpecificLink,
    copyWhatsAppLinkToClipboard,
    shareWhatsAppLink,
    storeWhatsAppMessageHistory,
    getWhatsAppMessageHistory,
    clearWhatsAppMessageHistory
};