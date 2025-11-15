/**
 * Product routes
 */
import { Router, Request, Response } from "express";
import { verifyRequest } from "../middleware/verify-request.js";
import * as productService from "../services/product-service.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyRequest);

/**
 * GET /api/products
 * List all products with pagination
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const session = (req as any).shopifySession;
    const limit = parseInt(req.query.limit as string) || 50;
    const cursor = req.query.cursor as string | undefined;

    const result = await productService.getProducts(session, limit, cursor);

    res.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const session = (req as any).shopifySession;
    const productId = req.params.id;

    // Ensure ID is in proper GraphQL format
    const gid = productId.startsWith("gid://")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const product = await productService.getProduct(session, gid);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

/**
 * GET /api/products/:id/images
 * Get high-quality product images for 3D generation
 */
router.get("/:id/images", async (req: Request, res: Response) => {
  try {
    const session = (req as any).shopifySession;
    const productId = req.params.id;

    // First get product to retrieve handle
    const gid = productId.startsWith("gid://")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const product = await productService.getProduct(session, gid);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // TODO: Get storefront access token from shop settings
    // For now, return Admin API images
    res.json({
      images: product.images,
      variantImages: product.variants
        .filter((v) => v.image)
        .map((v) => ({
          variantId: v.id,
          variantTitle: v.title,
          url: v.image!.url,
          altText: v.image!.altText,
        })),
    });
  } catch (error) {
    console.error("Error fetching product images:", error);
    res.status(500).json({ error: "Failed to fetch product images" });
  }
});

export default router;
