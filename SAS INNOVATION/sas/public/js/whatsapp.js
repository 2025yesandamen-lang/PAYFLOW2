// WhatsApp Integration Module
// Generates WhatsApp "Click to Chat" links with pre-filled messages

/**
 * Generate invoice message for WhatsApp
 * @param {Object} invoice - Invoice data
 * @returns {string} Formatted invoice message
 */
export function generateInvoiceMessage(invoice) {
    const dueDateObj = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const dueDateStr = dueDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const message = `
*Invoice Reminder* 📋

Hello ${invoice.customerName},

This is a friendly reminder regarding your pending invoice.

*Invoice Details:*
💰 Amount: $${invoice.amount.toFixed(2)}
📅 Due Date: ${dueDateStr}
${invoice.description ? `📝 Description: ${invoice.description}` : ""}

Please proceed with the payment at your earliest convenience.

Thank you!
PayFlow - Invoice Management System
    `.trim();

    return message;
}

/**
 * Generate WhatsApp "Click to Chat" link
 * @param {string} phoneNumber - Customer's phone number
 * @param {string} message - Message to send
 * @returns {string} WhatsApp link
 */
export function generateWhatsAppLink(phoneNumber, message) {
    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp Web link format
    // Note: You can use either web.whatsapp.com or api.whatsapp.com
    const whatsappLink = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

    return whatsappLink;
}

/**
 * Alternative: Generate WhatsApp API link (works on mobile)
 * @param {string} phoneNumber - Customer's phone number
 * @param {string} message - Message to send
 * @returns {string} WhatsApp API link
 */
export function generateWhatsAppMobileLink(phoneNumber, message) {
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp API link format (works better on mobile)
    const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    return whatsappLink;
}

/**
 * Generate full WhatsApp link based on device type
 * @param {string} phoneNumber - Customer's phone number
 * @param {string} message - Message to send
 * @returns {string} Appropriate WhatsApp link
 */
export function generateSmartWhatsAppLink(phoneNumber, message) {
    // Detect if on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        return generateWhatsAppMobileLink(phoneNumber, message);
    } else {
        return generateWhatsAppLink(phoneNumber, message);
    }
}

/**
 * Send WhatsApp message (wrapper function)
 * @param {string} phoneNumber - Customer's phone number
 * @param {string} message - Message to send
 */
export function sendWhatsAppMessage(phoneNumber, message) {
    const link = generateSmartWhatsAppLink(phoneNumber, message);
    window.open(link, "_blank");
}

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} Is valid phone number
 */
export function validatePhoneNumber(phoneNumber) {
    // Basic validation: must have at least 10 digits
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    return digitsOnly.length >= 10;
}

// Export all functions
export {
    generateInvoiceMessage,
    generateWhatsAppLink,
    generateWhatsAppMobileLink,
    generateSmartWhatsAppLink,
    sendWhatsAppMessage,
    validatePhoneNumber
};