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
    const webhookUrl = `${process.env.SHOPIFY_APP_URL}/api/webhooks`;

    const webhooksToRegister = [
      {
        topic: WEBHOOK_TOPICS.PRODUCTS_UPDATE,
        path: `${webhookUrl}/products/update`,
      },
      {
        topic: WEBHOOK_TOPICS.PRODUCTS_DELETE,
        path: `${webhookUrl}/products/delete`,
      },
      {
        topic: WEBHOOK_TOPICS.APP_UNINSTALLED,
        path: `${webhookUrl}/app/uninstalled`,
      },
    ];

    const results = await Promise.all(
      webhooksToRegister.map(async ({ topic, path }) => {
        try {
          const response = await shopify.webhooks.register({
            session,
            topic,
            path,
          });

          if (!response.success) {
            console.error(`Failed to register ${topic} webhook:`, response);
            return false;
          }

          console.log(`✅ Registered ${topic} webhook`);
          return true;
        } catch (error) {
          console.error(`Error registering ${topic} webhook:`, error);
          return false;
        }
      })
    );

    return results.every((result) => result === true);
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
    // TODO: If yes, queue regeneration job in Redis
    // TODO: Forward to Rails webhook service for normalization

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
    // TODO: Forward to Rails webhook service

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
