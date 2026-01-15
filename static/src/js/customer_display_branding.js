/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { session } from "@web/session";

// Customer display logo / branding (separate asset bundle)
// Since registry import fails in customer_display_assets bundle, we'll patch CustomerDisplay directly
// when it's available via the component's env or session
(async () => {
    // Function to patch CustomerDisplay - try to find it without registry
    const patchCustomerDisplay = () => {
        try {
            // CustomerDisplay is likely available in the global scope or module loader
            // Try to access it from window.odoo or module cache
            let CustomerDisplay = null;
            
            // Try to get from module loader cache
            if (window.odoo && window.odoo.loader && window.odoo.loader.modules) {
                for (const moduleName in window.odoo.loader.modules) {
                    if (moduleName.includes('customer_display')) {
                        const module = window.odoo.loader.modules[moduleName];
                        if (module && module.CustomerDisplay) {
                            CustomerDisplay = module.CustomerDisplay;
                            break;
                        }
                    }
                }
            }
            
            // If still not found, try to patch it when it's actually used
            // We'll use a different approach - patch the component class directly
            if (!CustomerDisplay) {
                // CustomerDisplay might be exported from the module, try to access it
                // Since we can't import it, we'll patch it via the template system
                // For now, return false and rely on XML template inheritance
                return false;
            }
            
            if (CustomerDisplay) {
                patch(CustomerDisplay.prototype, {
                    /**
                     * Returns the logo that should be displayed on the customer display screen.
                     * - Custom POS logo if configured in pos_brand_logo
                     * - Falls back to company logo if no custom logo
                     * - Returns false to hide logo if hide_odoo_branding is enabled and no custom logo
                     */
                    get brandLogo() {
                        // Try multiple ways to get config
                        let config = {};
                        try {
                            // Try env.services.pos.config first (recommended approach)
                            if (this.env?.services?.pos?.config) {
                                config = this.env.services.pos.config;
                            }
                            // Fallback to session.pos_config
                            else if (this.session?.pos_config) {
                                config = this.session.pos_config;
                            } else if (session?.pos_config) {
                                config = session.pos_config;
                            } else {
                                return false;
                            }
                        } catch (e) {
                            console.warn("[CustomerDisplay] Error accessing config:", e);
                            return false;
                        }
                        
                        // Log config for debugging
                        console.log("[CustomerDisplay] Config:", {
                            hasEnv: !!this.env,
                            hasEnvServices: !!this.env?.services,
                            hasEnvServicesPos: !!this.env?.services?.pos,
                            hasSession: !!this.session,
                            configKeys: Object.keys(config),
                            hideBranding: config.hide_odoo_branding,
                            hasBrandLogo: !!config.pos_brand_logo,
                            hasLogo: !!config.logo,
                        });
                        
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
            }
        } catch (e) {
            console.warn("Error patching CustomerDisplay:", e);
        }
        return false;
    };
    
    // Try to patch immediately
    if (!patchCustomerDisplay()) {
        // Retry with delays - component might not be loaded yet
        setTimeout(() => {
            if (!patchCustomerDisplay()) {
                setTimeout(() => {
                    patchCustomerDisplay();
                }, 500);
            }
        }, 100);
    }
    
    // Note: If CustomerDisplay can't be patched via JavaScript,
    // the XML template inheritance should still work to replace the logo
})();
