/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

// Lock screen logo / branding
try {
    // Odoo 18 POS lock screen component (name may differ slightly between minor versions)
    const { LockScreen } = await import(
        "@point_of_sale/app/screens/lock_screen/lock_screen"
    );

    patch(LockScreen.prototype, {
        setup() {
            super.setup(...arguments);
            this.pos = useService("pos");
        },
        /**
         * Returns the logo that should be displayed on the lock screen.
         * - Custom POS logo if configured
         * - Otherwise, fallback to the standard Odoo behaviour
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
    // If the import path changes between versions, we simply skip the patch.
}

// POS header logo / branding
try {
    const { Header } = await import(
        "@point_of_sale/app/header/header"
    );

    patch(Header.prototype, {
        setup() {
            super.setup(...arguments);
            this.pos = useService("pos");
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
    // Header component path/name may differ; ignore if not found.
}

// Customer screen logo / branding
try {
    const { CustomerDisplayScreen } = await import(
        "@point_of_sale/app/customer_display/customer_display_screen"
    );

    patch(CustomerDisplayScreen.prototype, {
        setup() {
            super.setup(...arguments);
            this.pos = useService("pos");
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
    // Customer display is optional; ignore if not available.
}

