/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { session } from "@web/session";

// Customer display logo / branding (separate asset bundle)
(async () => {
    try {
        const { CustomerDisplay } = await import(
            "@point_of_sale/customer_display/customer_display"
        );

        patch(CustomerDisplay.prototype, {
            setup() {
                super.setup(...arguments);
                // Customer display uses session which has config_id
                // Config data should be available through session
            },
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
                    } else if (this.session?.config_id) {
                        // If only config_id is available, we might need to fetch it
                        // But for now, return false to avoid errors
                        console.warn("CustomerDisplay: config data not fully loaded");
                        return false;
                    }
                } catch (e) {
                    console.warn("Could not access config in CustomerDisplay:", e);
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
    } catch (e) {
        console.warn("Could not patch CustomerDisplay:", e);
    }
})();
