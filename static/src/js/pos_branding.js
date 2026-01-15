/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

// Wrap all async imports in an async IIFE (Immediately Invoked Function Expression)
(async () => {
    try {
        const { registry } = await import("@web/core/registry");
        
        // Function to patch SaverScreen from registry
        const patchSaverScreen = () => {
            try {
                const posScreens = registry.category("pos_screens");
                const SaverScreen = posScreens.get("SaverScreen");
                
                if (SaverScreen) {
                    patch(SaverScreen.prototype, {
                        setup() {
                            super.setup(...arguments);
                            this.pos = useService("pos");
                        },
                        /**
                         * Returns the logo that should be displayed on the saver screen (sleep mode).
                         * - Custom POS logo if configured in pos_brand_logo
                         * - Falls back to company logo if no custom logo
                         * - Returns false to hide logo if hide_odoo_branding is enabled and no custom logo
                         */
                        get brandLogo() {
                            const config = this.pos?.config || {};
                            if (config.hide_odoo_branding && !config.pos_brand_logo) {
                                // Explicitly hide Odoo branding if requested and no custom logo is set
                                return false;
                            }
                            const logo = config.pos_brand_logo || config.logo;
                            // Format binary data as data URI for use in img src
                            if (logo) {
                                return `data:image/png;base64,${logo}`;
                            }
                            return false;
                        },
                    });
                    return true; // Successfully patched
                }
            } catch (e) {
                console.warn("Error patching SaverScreen:", e);
            }
            return false; // Not found or error
        };
        
        // Function to patch Navbar from registry
        const patchNavbar = () => {
            try {
                // Navbar might be in pos_screens or accessible through the component system
                let Navbar = null;
                
                // Try pos_screens first
                try {
                    const posScreens = registry.category("pos_screens");
                    Navbar = posScreens.get("Navbar");
                } catch (e) {
                    // Not in pos_screens
                }
                
                // If not found in pos_screens, Navbar might not be in a registry
                // In that case, we'll rely on the XML template inheritance which should work
                if (Navbar) {
                    patch(Navbar.prototype, {
                        setup() {
                            super.setup(...arguments);
                            // this.pos is already set by usePos() in the original setup, no need to set it again
                        },
                        get brandLogo() {
                            const config = this.pos?.config || {};
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
                    return true; // Successfully patched
                }
            } catch (e) {
                console.warn("Error patching Navbar:", e);
            }
            return false; // Not found or error
        };
        
        // Try to patch SaverScreen immediately
        if (!patchSaverScreen()) {
            // If not found, retry after a short delay (component might not be registered yet)
            setTimeout(() => {
                if (!patchSaverScreen()) {
                    // Final retry after longer delay
                    setTimeout(patchSaverScreen, 500);
                }
            }, 100);
        }
        
        // Try to patch Navbar immediately
        if (!patchNavbar()) {
            // If not found, retry after a short delay (component might not be registered yet)
            setTimeout(() => {
                if (!patchNavbar()) {
                    // Final retry after longer delay
                    setTimeout(patchNavbar, 500);
                }
            }, 100);
        }
        
    } catch (e) {
        console.warn("Could not set up component patching:", e);
    }

})();
