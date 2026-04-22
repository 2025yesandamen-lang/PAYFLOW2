// Add at the top with other imports
import { openWhatsAppModal } from "./whatsapp-ui.js";

// Add this function to set up WhatsApp listeners
/**
 * Setup WhatsApp button event listeners
 */
function setupWhatsAppListeners() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".whatsapp-send-btn");
        
        if (btn) {
            const invoiceId = btn.getAttribute("data-invoice-id");
            const invoice = allInvoices.find(inv => inv.id === invoiceId);
            
            if (invoice) {
                openWhatsAppModal(invoice);
            } else {
                console.warn("Invoice not found:", invoiceId);
            }
        }
    });
}

// Call this in the initDashboard function
/**
 * Initialize dashboard
 */
export function initDashboard() {
    console.log("📊 Initializing dashboard...");

    // Setup user info
    setupUserInfo();

    // Setup event listeners
    setupEventListeners();
    
    // Setup WhatsApp listeners
    setupWhatsAppListeners();

    // Setup real-time listener
    setupRealtimeListener();

    console.log("✅ Dashboard initialized");
}