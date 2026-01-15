/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

// Wrap all async imports in an async IIFE (Immediately Invoked Function Expression)
(async () => {
    // Saver screen logo / branding (sleep mode screensaver)
    try {
        // Odoo 18 POS saver screen component (sleep mode/screensaver)
        const { SaverScreen } = await import(
            "@point_of_sale/app/screens/saver_screen/saver_screen"
        );

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
    } catch (e) {
        console.warn("Could not patch SaverScreen:", e);
    }

    // POS navbar logo / branding
    try {
        const { Navbar } = await import(
            "@point_of_sale/app/navbar/navbar"
        );

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
    } catch (e) {
        // Navbar component path/name may differ; ignore if not found.
        console.warn("Could not patch Navbar:", e);
    }

})();
