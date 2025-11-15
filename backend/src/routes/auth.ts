/**
 * Shopify OAuth authentication routes
 */
import { Router, Request, Response } from "express";
import { shopify } from "../config/shopify.js";
import { sessionStorage } from "../shopify/session-storage.js";

const router = Router();

/**
 * Initiates OAuth flow
 * Shopify redirects merchant here to start installation
 */
router.get("/auth", async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as string;

    if (!shop) {
      return res.status(400).send("Missing shop parameter");
    }

    // Validate shop domain format
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return res.status(400).send("Invalid shop domain");
    }

    // Begin OAuth
    await shopify.auth.begin({
      shop: shopify.utils.sanitizeShop(shop, true)!,
      callbackPath: "/api/auth/callback",
      isOnline: false, // Offline access for background jobs
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error("Error in /auth:", error);
    res.status(500).send("Authentication failed");
  }
});

/**
 * OAuth callback
 * Shopify redirects here after merchant approves app installation
 */
router.get("/auth/callback", async (req: Request, res: Response) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;

    // Store session
    await sessionStorage.storeSession(session);

    // Register webhooks
    const { registerWebhooks } = await import("../services/webhook-service.js");
    const webhooksRegistered = await registerWebhooks(session);

    if (!webhooksRegistered) {
      console.warn("Some webhooks failed to register");
    }

    // Redirect to app
    const host = req.query.host as string;
    const redirectUrl = `/?shop=${session.shop}&host=${host}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in /auth/callback:", error);
    res.status(500).send("Authentication callback failed");
  }
});

/**
 * Get current session info
 */
router.get("/auth/session", async (req: Request, res: Response) => {
  try {
    const sessionId = await shopify.session.getCurrentId({
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });

    if (!sessionId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const session = await sessionStorage.loadSession(sessionId);

    if (!session) {
      return res.status(401).json({ error: "Session not found" });
    }

    res.json({
      shop: session.shop,
      scope: session.scope,
      isActive: session.isActive(),
    });
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
});

export default router;
