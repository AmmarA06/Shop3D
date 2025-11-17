/**
 * Webhook registration and management service
 */
import { Session } from "@shopify/shopify-api";
import { shopify } from "../config/shopify.js";

export const WEBHOOK_TOPICS = {
  PRODUCTS_UPDATE: "PRODUCTS_UPDATE",
  PRODUCTS_DELETE: "PRODUCTS_DELETE",
  APP_UNINSTALLED: "APP_UNINSTALLED",
} as const;

/**
 * Register all required webhooks for a shop
 */
export async function registerWebhooks(session: Session): Promise<boolean> {
  try {
    // Register all webhooks that were configured in shopify config
    const response = await shopify.webhooks.register({
      session,
    });

    // Check if all webhooks were registered successfully
    let allSuccess = true;
    for (const [topic, results] of Object.entries(response)) {
      for (const result of results) {
        if (!result.success) {
          console.error(`Failed to register ${topic} webhook:`, result);
          allSuccess = false;
        } else {
          console.log(`Registered ${topic} webhook`);
        }
      }
    }

    return allSuccess;
  } catch (error) {
    console.error("Failed to register webhooks:", error);
    return false;
  }
}

/**
 * Handle product update webhook
 * Triggers 3D model regeneration
 */
export async function handleProductUpdate(payload: any): Promise<void> {
  try {
    console.log("Product updated:", payload.id);

    // TODO: Check if this product has 3D enabled
    // TODO: If yes, queue regeneration job
    // TODO: Trigger 3D model generation process

    // For now, just log
    console.log("Product update received, regeneration will be queued");
  } catch (error) {
    console.error("Error handling product update:", error);
  }
}

/**
 * Handle product delete webhook
 * Removes 3D model data
 */
export async function handleProductDelete(payload: any): Promise<void> {
  try {
    console.log("Product deleted:", payload.id);

    // TODO: Delete 3D model files from Supabase storage
    // TODO: Delete job records from database

    console.log("Product deletion processed");
  } catch (error) {
    console.error("Error handling product delete:", error);
  }
}

/**
 * Handle app uninstalled webhook
 * Cleanup shop data
 */
export async function handleAppUninstalled(shop: string): Promise<void> {
  try {
    console.log("App uninstalled from shop:", shop);

    // TODO: Delete all sessions for this shop
    // TODO: Delete all 3D models for this shop
    // TODO: Cancel any pending jobs

    console.log("App uninstallation cleanup completed");
  } catch (error) {
    console.error("Error handling app uninstall:", error);
  }
}

export default {
  registerWebhooks,
  handleProductUpdate,
  handleProductDelete,
  handleAppUninstalled,
};
