/** @odoo-module */

import { patch } from "@web/core/utils/patch";
import { session } from "@web/session";

// Helper function to get config
const getConfig = (component) => {
    // Log what's available for debugging
    console.log("[CustomerDisplay] Available data:", {
        env: !!component.env,
        envServices: !!component.env?.services,
        envServicesPos: !!component.env?.services?.pos,
        session: component.session,
        sessionKeys: component.session ? Object.keys(component.session) : [],
        globalSession: session,
        globalSessionKeys: session ? Object.keys(session) : [],
    });
    
    // Try env.services.pos.config first
    if (component.env?.services?.pos?.config) {
        return component.env.services.pos.config;
    }
    
    // Try session.pos_config
    if (component.session?.pos_config) {
        return component.session.pos_config;
    }
    
    // Try session.config (might be stored differently)
    if (component.session?.config) {
        return component.session.config;
    }
    
    // Try global session.pos_config
    if (session?.pos_config) {
        return session.pos_config;
    }
    
    // Try global session.config
    if (session?.config) {
        return session.config;
    }
    
    // Check if config_id is in session and we need to fetch it
    if (component.session?.config_id) {
        console.log("[CustomerDisplay] Found config_id in session:", component.session.config_id);
        // Config might need to be loaded from backend
    }
    
    return {};
};

// Import CustomerDisplay - if this fails, check browser console for import error
import { CustomerDisplay } from "@point_of_sale/customer_display/customer_display";

console.log("[CustomerDisplay] Module loaded, CustomerDisplay:", CustomerDisplay);

// Patch CustomerDisplay
patch(CustomerDisplay.prototype, {
    setup() {
        super.setup(...arguments);
        // Cache config if available
        this._cachedConfig = null;
    },
    get brandLogo() {
        // First try to get config using helper
        let config = getConfig(this);
        
        // If config is empty, try to get it from URL or fetch from backend
        if (!config || Object.keys(config).length === 0) {
            // Try to get config_id from URL or session
            const urlParams = new URLSearchParams(window.location.search);
            const pathParts = window.location.pathname.split('/');
            let configId = null;
            
            // Customer display URL format: /pos_customer_display/{config_id}/{access_token}
            if (pathParts.includes('pos_customer_display') && pathParts.length > 2) {
                configId = pathParts[pathParts.indexOf('pos_customer_display') + 1];
            }
            
            // Or try from session
            if (!configId && this.session?.config_id) {
                configId = this.session.config_id;
            }
            
            if (configId) {
                console.log("[CustomerDisplay] Found config_id:", configId, "Attempting to fetch config");
                // Try to get config from session data that might be loaded
                // The config should be in session but might be under a different key
                if (this.session && typeof this.session === 'object') {
                    // Check all keys in session
                    for (const key in this.session) {
                        if (key.includes('config') || key.includes('pos')) {
                            console.log("[CustomerDisplay] Session key:", key, "=", this.session[key]);
                        }
                    }
                }
            }
        }
        
        console.log("[CustomerDisplay] brandLogo called, Final Config:", {
            hasEnv: !!this.env,
            hasEnvServices: !!this.env?.services?.pos,
            hasSession: !!this.session,
            configKeys: Object.keys(config),
            hideBranding: config.hide_odoo_branding,
            hasBrandLogo: !!config.pos_brand_logo,
            hasLogo: !!config.logo,
            config: config,
        });
        
        if (!config || Object.keys(config).length === 0) {
            console.warn("[CustomerDisplay] Config is empty, cannot get logo");
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

console.log("[CustomerDisplay] Successfully patched CustomerDisplay");
