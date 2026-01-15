/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

// Customer display logo / branding (separate asset bundle)
(async () => {
    try {
        const { CustomerDisplay } = await import(
            "@point_of_sale/customer_display/customer_display"
        );

        patch(CustomerDisplay.prototype, {
            setup() {
                super.setup(...arguments);
                this.pos = useService("pos");
            },
            /**
             * Returns the logo that should be displayed on the customer display screen.
             * - Custom POS logo if configured in pos_brand_logo
             * - Falls back to company logo if no custom logo
             * - Returns false to hide logo if hide_odoo_branding is enabled and no custom logo
             */
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
    } catch (e) {
        console.warn("Could not patch CustomerDisplay:", e);
    }
})();
