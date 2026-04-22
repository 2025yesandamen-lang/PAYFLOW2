// ====================================================================
// WhatsApp UI Module
// ====================================================================
// Handles WhatsApp modal and UI components

import {
    generateWhatsAppMessage,
    generateWhatsAppLink,
    generatePlatformSpecificLink,
    sendWhatsAppMessage,
    copyWhatsAppLinkToClipboard,
    storeWhatsAppMessageHistory,
    sanitizeText,
    MESSAGE_TEMPLATES,
    validatePhoneNumber,
    cleanPhoneNumber
} from "./whatsapp-service.js";

// ====================================================================
// Create WhatsApp Button
// ====================================================================

/**
 * Create WhatsApp button for invoice
 * 
 * @param {Object} invoice - Invoice object
 * @returns {Element} Button element
 */
export function createWhatsAppButton(invoice) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "whatsapp-btn px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium text-sm flex items-center space-x-1 hover:shadow-md";
    button.innerHTML = `<span>📱</span><span>WhatsApp</span>`;
    button.title = "Send invoice reminder via WhatsApp";
    
    button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openWhatsAppModal(invoice);
    });

    return button;
}

// ====================================================================
// WhatsApp Modal
// ====================================================================

/**
 * Create WhatsApp modal
 * 
 * @returns {Element} Modal element
 */
export function createWhatsAppModal() {
    const modal = document.createElement("div");
    modal.id = "whatsappModal";
    modal.className = "hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto animate-slideUp">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-gray-800">📱 Send WhatsApp Message</h3>
                    <p class="text-gray-600 text-sm mt-1">Send invoice reminder to customer via WhatsApp</p>
                </div>
                <button class="close-modal text-gray-500 hover:text-gray-700 text-2xl font-bold">✕</button>
            </div>

            <!-- Invoice Info Card -->
            <div class="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg mb-6 border-l-4 border-green-600">
                <div class="flex items-start space-x-3">
                    <span class="text-3xl">📋</span>
                    <div class="flex-1">
                        <p id="modalCustomerName" class="font-bold text-gray-800 text-lg"></p>
                        <p id="modalCustomerPhone" class="text-sm text-gray-600 mt-1"></p>
                        <p id="modalInvoiceAmount" class="text-lg font-bold text-green-700 mt-2"></p>
                        <p id="modalInvoiceDueDate" class="text-sm text-gray-600 mt-1"></p>
                    </div>
                </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-gray-200 my-6"></div>

            <!-- Message Template Selection -->
            <div class="mb-6">
                <label class="block text-gray-700 font-semibold mb-3">📝 Choose Message Template</label>
                <div class="space-y-2">
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input type="radio" name="whatsappTemplate" value="STANDARD" checked class="w-4 h-4 accent-green-600">
                        <span class="ml-3">
                            <span class="font-medium text-gray-800">Standard Reminder</span>
                            <p class="text-xs text-gray-600 mt-1">Simple and professional message</p>
                        </span>
                    </label>
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input type="radio" name="whatsappTemplate" value="DETAILED" class="w-4 h-4 accent-green-600">
                        <span class="ml-3">
                            <span class="font-medium text-gray-800">Detailed Invoice</span>
                            <p class="text-xs text-gray-600 mt-1">Includes more information</p>
                        </span>
                    </label>
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input type="radio" name="whatsappTemplate" value="PROFESSIONAL" class="w-4 h-4 accent-green-600">
                        <span class="ml-3">
                            <span class="font-medium text-gray-800">Professional</span>
                            <p class="text-xs text-gray-600 mt-1">Formal business format</p>
                        </span>
                    </label>
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input type="radio" name="whatsappTemplate" value="URGENT" class="w-4 h-4 accent-green-600">
                        <span class="ml-3">
                            <span class="font-medium text-gray-800">⚠️ Urgent</span>
                            <p class="text-xs text-gray-600 mt-1">For overdue invoices</p>
                        </span>
                    </label>
                    <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input type="radio" name="whatsappTemplate" value="CUSTOM" class="w-4 h-4 accent-green-600">
                        <span class="ml-3">
                            <span class="font-medium text-gray-800">Custom Message</span>
                            <p class="text-xs text-gray-600 mt-1">Write your own message</p>
                        </span>
                    </label>
                </div>
            </div>

            <!-- Custom Message Input (Hidden by default) -->
            <div id="customMessageSection" class="hidden mb-6">
                <label class="block text-gray-700 font-semibold mb-2">✏️ Write Your Custom Message</label>
                <textarea 
                    id="whatsappCustomMessage"
                    placeholder="Enter your custom message here..."
                    rows="4"
                    maxlength="1000"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1"><span id="charLimitDisplay">0</span>/1000 characters</p>
            </div>

            <!-- Message Preview -->
            <div class="mb-6">
                <label class="block text-gray-700 font-semibold mb-2">💬 Message Preview</label>
                <div id="messagePreview" class="bg-gray-50 p-4 rounded-lg border-2 border-gray-200 min-h-24 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed"></div>
                <p class="text-xs text-gray-500 mt-2">Message length: <span id="messageLengthDisplay">0</span> characters / <span id="smsParts">1</span> SMS parts</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 pt-6 border-t border-gray-200">
                <button id="sendWhatsAppBtn" class="flex-1 bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 hover:shadow-lg">
                    <span id="sendBtnIcon">📱</span>
                    <span id="sendBtnText">Send via WhatsApp</span>
                </button>
                <button id="copyWhatsAppLinkBtn" class="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 hover:shadow-lg">
                    <span>📋</span>
                    <span>Copy Link</span>
                </button>
                <button id="closeWhatsAppModalBtn" class="flex-1 bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-400 transition">
                    Close
                </button>
            </div>

            <!-- Footer Note -->
            <p class="text-xs text-gray-500 text-center mt-4">💡 The message will open WhatsApp in a new tab. Make sure your phone is synced to WhatsApp Web.</p>
        </div>
    `;

    return modal;
}

/**
 * Open WhatsApp modal
 * 
 * @param {Object} invoice - Invoice object
 */
export function openWhatsAppModal(invoice) {
    try {
        // Validate invoice
        if (!invoice || !invoice.customerName || !invoice.customerPhone) {
            showNotification("Invalid invoice data", "error");
            return;
        }

        // Create or get modal
        let modal = document.getElementById("whatsappModal");
        if (!modal) {
            modal = createWhatsAppModal();
            document.body.appendChild(modal);
            setupWhatsAppModalEvents(modal);
        }

        // Populate modal
        populateWhatsAppModal(modal, invoice);

        // Show modal
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        // Generate initial preview
        updateMessagePreview(modal, invoice);

        console.log("✅ WhatsApp modal opened");

    } catch (error) {
        console.error("❌ Error opening WhatsApp modal:", error);
        showNotification(error.message, "error");
    }
}

/**
 * Close WhatsApp modal
 */
export function closeWhatsAppModal() {
    const modal = document.getElementById("whatsappModal");
    if (modal) {
        modal.classList.add("hidden");
        document.body.style.overflow = "auto";
    }
}

/**
 * Populate modal with invoice data
 * 
 * @param {Element} modal - Modal element
 * @param {Object} invoice - Invoice object
 */
function populateWhatsAppModal(modal, invoice) {
    const dueDate = invoice.dueDate.toDate?.() || new Date(invoice.dueDate);
    const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

    // Store invoice for later use
    modal.currentInvoice = invoice;

    // Update elements
    const customerName = modal.querySelector("#modalCustomerName");
    const customerPhone = modal.querySelector("#modalCustomerPhone");
    const invoiceAmount = modal.querySelector("#modalInvoiceAmount");
    const invoiceDueDate = modal.querySelector("#modalInvoiceDueDate");

    if (customerName) customerName.textContent = sanitizeText(invoice.customerName);
    if (customerPhone) customerPhone.textContent = `📱 ${invoice.customerPhone}`;
    if (invoiceAmount) invoiceAmount.textContent = `₦${invoice.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    
    const dueDateStr = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const dueDateDisplay = daysUntilDue < 0 ? `📍 Overdue since ${dueDateStr}` : `📅 Due: ${dueDateStr} (${daysUntilDue} days)`;
    if (invoiceDueDate) invoiceDueDate.textContent = dueDateDisplay;
}

/**
 * Update message preview
 * 
 * @param {Element} modal - Modal element
 * @param {Object} invoice - Invoice object
 */
export function updateMessagePreview(modal, invoice) {
    try {
        const template = modal.querySelector("input[name='whatsappTemplate']:checked")?.value || "STANDARD";
        const customMessage = modal.querySelector("#whatsappCustomMessage")?.value || "";

        const message = generateWhatsAppMessage(invoice, {
            template,
            customMessage
        });

        // Update preview
        const preview = modal.querySelector("#messagePreview");
        if (preview) preview.textContent = message;

        // Update message stats
        const lengthDisplay = modal.querySelector("#messageLengthDisplay");
        const smsParts = modal.querySelector("#smsParts");
        
        if (lengthDisplay) lengthDisplay.textContent = message.length;
        if (smsParts) smsParts.textContent = Math.ceil(message.length / 160);

        console.log(`✅ Message preview updated (${message.length} chars)`);

    } catch (error) {
        console.error("❌ Error updating preview:", error);
        showNotification("Error updating preview", "error");
    }
}

/**
 * Setup modal event listeners
 * 
 * @param {Element} modal - Modal element
 */
function setupWhatsAppModalEvents(modal) {
    // Close buttons
    modal.querySelector(".close-modal")?.addEventListener("click", closeWhatsAppModal);
    modal.querySelector("#closeWhatsAppModalBtn")?.addEventListener("click", closeWhatsAppModal);

    // Template change
    modal.querySelectorAll("input[name='whatsappTemplate']").forEach(input => {
        input.addEventListener("change", (e) => {
            const customSection = modal.querySelector("#customMessageSection");
            
            if (e.target.value === "CUSTOM") {
                customSection?.classList.remove("hidden");
            } else {
                customSection?.classList.add("hidden");
            }

            if (modal.currentInvoice) {
                updateMessagePreview(modal, modal.currentInvoice);
            }
        });
    });

    // Custom message input
    modal.querySelector("#whatsappCustomMessage")?.addEventListener("input", (e) => {
        const charLimit = modal.querySelector("#charLimitDisplay");
        if (charLimit) charLimit.textContent = e.target.value.length;

        if (modal.currentInvoice) {
            updateMessagePreview(modal, modal.currentInvoice);
        }
    });

    // Send button
    modal.querySelector("#sendWhatsAppBtn")?.addEventListener("click", async () => {
        if (modal.currentInvoice) {
            await handleSendWhatsApp(modal, modal.currentInvoice);
        }
    });

    // Copy link button
    modal.querySelector("#copyWhatsAppLinkBtn")?.addEventListener("click", async () => {
        if (modal.currentInvoice) {
            await handleCopyWhatsAppLink(modal, modal.currentInvoice);
        }
    });

    // Close on escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
            closeWhatsAppModal();
        }
    });

    // Close on outside click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeWhatsAppModal();
        }
    });
}

// ====================================================================
// Action Handlers
// ====================================================================

/**
 * Handle send WhatsApp message
 * 
 * @param {Element} modal - Modal element
 * @param {Object} invoice - Invoice object
 */
async function handleSendWhatsApp(modal, invoice) {
    try {
        const template = modal.querySelector("input[name='whatsappTemplate']:checked")?.value || "STANDARD";
        const customMessage = modal.querySelector("#whatsappCustomMessage")?.value || "";

        // Generate message and link
        const message = generateWhatsAppMessage(invoice, { template, customMessage });
        const link = generatePlatformSpecificLink(invoice.customerPhone, message);

        // Update button state
        const sendBtn = modal.querySelector("#sendWhatsAppBtn");
        const originalHTML = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span>⏳</span><span>Opening...</span>';
        sendBtn.disabled = true;

        // Store in history
        storeWhatsAppMessageHistory({
            invoiceId: invoice.id,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            amount: invoice.amount,
            template,
            messageLength: message.length
        });

        // Open WhatsApp
        const whatsappWindow = window.open(link, 'whatsapp', 'width=800,height=600');

        if (!whatsappWindow) {
            throw new Error("Popup blocked. Please allow popups for this website.");
        }

        // Show success notification
        showNotification(`✅ WhatsApp opened for ${invoice.customerName}`, "success");

        // Reset button after delay
        setTimeout(() => {
            sendBtn.innerHTML = originalHTML;
            sendBtn.disabled = false;
            closeWhatsAppModal();
        }, 1500);

    } catch (error) {
        console.error("❌ Error sending WhatsApp:", error);
        showNotification(error.message || "Failed to send WhatsApp message", "error");
        
        // Reset button
        const sendBtn = modal.querySelector("#sendWhatsAppBtn");
        sendBtn.innerHTML = '<span>📱</span><span>Send via WhatsApp</span>';
        sendBtn.disabled = false;
    }
}

/**
 * Handle copy WhatsApp link
 * 
 * @param {Element} modal - Modal element
 * @param {Object} invoice - Invoice object
 */
async function handleCopyWhatsAppLink(modal, invoice) {
    try {
        const template = modal.querySelector("input[name='whatsappTemplate']:checked")?.value || "STANDARD";
        const customMessage = modal.querySelector("#whatsappCustomMessage")?.value || "";

        const message = generateWhatsAppMessage(invoice, { template, customMessage });
        const link = generatePlatformSpecificLink(invoice.customerPhone, message);

        const copied = await copyWhatsAppLinkToClipboard(link);

        if (copied) {
            showNotification("✅ WhatsApp link copied to clipboard", "success");
        } else {
            showNotification("Failed to copy link", "error");
        }

    } catch (error) {
        console.error("❌ Error copying link:", error);
        showNotification(error.message, "error");
    }
}

// ====================================================================
// Notification System
// ====================================================================

/**
 * Show notification toast
 * 
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, info, warning)
 */
export function showNotification(message, type = "info") {
    // Get or create container
    let container = document.getElementById("whatsappNotificationContainer");
    
    if (!container) {
        container = document.createElement("div");
        container.id = "whatsappNotificationContainer";
        container.className = "fixed top-4 right-4 space-y-2 z-50 pointer-events-none";
        document.body.appendChild(container);
    }

    // Create notification
    const notification = document.createElement("div");
    const colors = {
        success: "bg-green-600",
        error: "bg-red-600",
        warning: "bg-yellow-600",
        info: "bg-blue-600"
    };

    notification.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg font-medium animate-slideInRight pointer-events-auto cursor-default`;
    notification.textContent = message;

    container.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// ====================================================================
// Export All
// ====================================================================

export {
    createWhatsAppButton,
    createWhatsAppModal,
    openWhatsAppModal,
    closeWhatsAppModal,
    populateWhatsAppModal,
    updateMessagePreview,
    setupWhatsAppModalEvents,
    showNotification
};