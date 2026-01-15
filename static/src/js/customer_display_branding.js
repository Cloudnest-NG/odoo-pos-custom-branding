/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { session } from "@web/session";

// Customer display logo / branding (separate asset bundle)
// Since direct import fails, we'll patch CustomerDisplay when it becomes available via registry
(async () => {
    try {
        const { registry } = await import("@web/core/registry");
        
        // Function to patch CustomerDisplay
        const patchCustomerDisplay = (CustomerDisplay) => {
            if (!CustomerDisplay) {
                return false;
            }
            
            try {
                patch(CustomerDisplay.prototype, {
                    /**
                     * Returns the logo that should be displayed on the customer display screen.
                     * - Custom POS logo if configured in pos_brand_logo
                     * - Falls back to company logo if no custom logo
                     * - Returns false to hide logo if hide_odoo_branding is enabled and no custom logo
                     */
                    get brandLogo() {
                        // Get config from session - customer display loads config through session
                        let config = {};
                        try {
                            // Try to get config from session.pos_config (loaded from backend)
                            if (this.session?.pos_config) {
                                config = this.session.pos_config;
                            } else if (session?.pos_config) {
                                config = session.pos_config;
                            } else {
                                return false;
                            }
                        } catch (e) {
                            return false;
                        }
                        
                        if (!config || Object.keys(config).length === 0) {
                            return false;
                        }
                        
                        if (config.hide_odoo_branding && !config.pos_brand_logo) {
                            return false;
                        }
                        const logo = config.pos_brand_logo || config.logo;
                        if (logo) {
                            return `data:image/png;base64,${logo}`;
                        }
                        return false;
                    },
                });
                return true;
            } catch (e) {
                console.warn("Error patching CustomerDisplay:", e);
                return false;
            }
        };
        
        // Try to find CustomerDisplay in registry with retries
        const tryPatch = () => {
            try {
                // CustomerDisplay might be registered in pos_screens or another category
                const posScreens = registry.category("pos_screens");
                const CustomerDisplay = posScreens.get("CustomerDisplay");
                
                if (CustomerDisplay) {
                    return patchCustomerDisplay(CustomerDisplay);
                }
            } catch (e) {
                // Not found or error
            }
            return false;
        };
        
        // Try immediately
        if (!tryPatch()) {
            // Retry with delays - component might not be registered yet
            setTimeout(() => {
                if (!tryPatch()) {
                    setTimeout(() => {
                        tryPatch();
                    }, 500);
                }
            }, 100);
        }
        
    } catch (e) {
        console.warn("Could not set up CustomerDisplay patching:", e);
    }
})();
