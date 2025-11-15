/**
 * Middleware to verify authenticated requests
 */
import { Request, Response, NextFunction } from "express";
import { shopify } from "../config/shopify.js";
import { sessionStorage } from "../shopify/session-storage.js";

/**
 * Verify that the request has a valid Shopify session
 */
export async function verifyRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = await shopify.session.getCurrentId({
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    if (!sessionId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await sessionStorage.loadSession(sessionId);

    if (!session) {
      res.status(401).json({ error: "Session expired" });
      return;
    }

    // Attach session to request for use in routes
    (req as any).shopifySession = session;

    next();
  } catch (error) {
    console.error("Error verifying request:", error);
    res.status(500).json({ error: "Authentication verification failed" });
  }
}

/**
 * Verify webhook authenticity
 */
export async function verifyWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hmac = req.headers["x-shopify-hmac-sha256"] as string;
    const topic = req.headers["x-shopify-topic"] as string;
    const shop = req.headers["x-shopify-shop-domain"] as string;

    if (!hmac || !topic || !shop) {
      res.status(401).json({ error: "Missing webhook headers" });
      return;
    }

    // Get raw body for HMAC verification
    const body = (req as any).rawBody || JSON.stringify(req.body);

    const isValid = await shopify.webhooks.validate({
      rawBody: body,
      rawRequest: req,
      rawResponse: res,
    });

    if (!isValid) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    (req as any).webhookTopic = topic;
    (req as any).webhookShop = shop;

    next();
  } catch (error) {
    console.error("Error verifying webhook:", error);
    res.status(500).json({ error: "Webhook verification failed" });
  }
}
