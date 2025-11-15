/**
 * Shopify API configuration
 */
import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";

if (!process.env.SHOPIFY_API_KEY) {
  throw new Error("SHOPIFY_API_KEY is required");
}

if (!process.env.SHOPIFY_API_SECRET) {
  throw new Error("SHOPIFY_API_SECRET is required");
}

if (!process.env.SHOPIFY_APP_URL) {
  throw new Error("SHOPIFY_APP_URL is required");
}

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES?.split(",") || [
    "read_products",
    "write_products",
    "read_product_listings",
  ],
  hostName: new URL(process.env.SHOPIFY_APP_URL).hostname,
  hostScheme: "https",
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  restResources,
});

export const SHOPIFY_CONFIG = {
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  appUrl: process.env.SHOPIFY_APP_URL,
  scopes: process.env.SHOPIFY_SCOPES?.split(",") || [
    "read_products",
    "write_products",
    "read_product_listings",
  ],
} as const;
