/**
 * Webhook routes
 */
import { Router, Request, Response } from "express";
import { verifyWebhook } from "../middleware/verify-request.js";
import * as webhookService from "../services/webhook-service.js";

const router = Router();

// Apply webhook verification to all routes
router.use(verifyWebhook);

/**
 * POST /api/webhooks/products/update
 * Handle product update events
 */
router.post("/products/update", async (req: Request, res: Response) => {
  try {
    const shop = (req as any).webhookShop;
    const payload = req.body;

    console.log(`Product update webhook from ${shop}`);

    // Process webhook asynchronously
    webhookService.handleProductUpdate(payload).catch((error) => {
      console.error("Error processing product update webhook:", error);
    });

    // Respond immediately to Shopify
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).send("Error");
  }
});

/**
 * POST /api/webhooks/products/delete
 * Handle product deletion events
 */
router.post("/products/delete", async (req: Request, res: Response) => {
  try {
    const shop = (req as any).webhookShop;
    const payload = req.body;

    console.log(`Product delete webhook from ${shop}`);

    // Process webhook asynchronously
    webhookService.handleProductDelete(payload).catch((error) => {
      console.error("Error processing product delete webhook:", error);
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).send("Error");
  }
});

/**
 * POST /api/webhooks/app/uninstalled
 * Handle app uninstallation
 */
router.post("/app/uninstalled", async (req: Request, res: Response) => {
  try {
    const shop = (req as any).webhookShop;

    console.log(`App uninstalled webhook from ${shop}`);

    // Process webhook asynchronously
    webhookService.handleAppUninstalled(shop).catch((error) => {
      console.error("Error processing app uninstall webhook:", error);
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).send("Error");
  }
});

export default router;
