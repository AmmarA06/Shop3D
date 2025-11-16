/**
 * 3D Model generation routes
 */
import { Router, Request, Response } from "express";
import { verifyRequest } from "../middleware/verify-request.js";
import * as jobService from "../services/job-service.js";
import * as productService from "../services/product-service.js";

const router = Router();

/**
 * PUBLIC STOREFRONT ENDPOINT
 * GET /api/models/storefront/:productId
 * Get the 3D model URL for a product/variant (used by Theme App Extension)
 * No authentication required - this is for customer-facing storefront
 */
router.get("/storefront/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { variantId, shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: "shop parameter is required" });
    }

    // Get the most recent completed job for this product/variant
    const jobs = await jobService.getJobsByProduct(
      shop as string,
      productId.startsWith("gid://") ? productId : `gid://shopify/Product/${productId}`
    );

    // Filter for completed jobs
    let completedJobs = jobs.filter((job) => job.status === "completed" && job.modelUrl);

    // If variantId specified, filter for that variant
    if (variantId) {
      completedJobs = completedJobs.filter((job) => job.variantId === variantId);
    }

    // Get the most recent one
    const latestJob = completedJobs.sort(
      (a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    )[0];

    if (!latestJob) {
      return res.status(404).json({
        error: "No 3D model found for this product",
        productId,
        variantId: variantId || null,
      });
    }

    res.json({
      modelUrl: latestJob.modelUrl,
      productId: latestJob.productId,
      variantId: latestJob.variantId,
      completedAt: latestJob.completedAt,
    });
  } catch (error) {
    console.error("Error fetching storefront model:", error);
    res.status(500).json({ error: "Failed to fetch model" });
  }
});

// Apply authentication middleware to admin endpoints
router.use(verifyRequest);

/**
 * POST /api/models/create
 * Initiate 3D model generation for a product
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const session = (req as any).shopifySession;
    const { productId, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    // Get product details
    const gid = productId.startsWith("gid://")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const product = await productService.getProduct(session, gid);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if product has images
    if (!product.images || product.images.length === 0) {
      return res.status(400).json({
        error: "Product must have at least one image for 3D generation",
      });
    }

    // Determine which images to use
    let imageUrls: string[] = [];

    if (variantId) {
      // Get variant-specific image
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant?.image) {
        imageUrls = [variant.image.url];
      }
    }

    // Fallback to product images
    if (imageUrls.length === 0) {
      imageUrls = product.images.map((img) => img.url);
    }

    // Create generation job
    const job = await jobService.createJob({
      shop: session.shop,
      productId: product.id,
      productHandle: product.handle,
      variantId,
      imageUrls,
      metadata: {
        productTitle: product.title,
        variantTitle: variantId
          ? product.variants.find((v) => v.id === variantId)?.title
          : undefined,
      },
    });

    if (!job) {
      return res.status(500).json({ error: "Failed to create generation job" });
    }

    res.json({
      success: true,
      jobId: job.id,
      status: job.status,
      message: "3D model generation job created",
    });
  } catch (error) {
    console.error("Error creating model generation job:", error);
    res.status(500).json({ error: "Failed to initiate model generation" });
  }
});

/**
 * GET /api/models/status/:jobId
 * Get status of a generation job
 */
router.get("/status/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error fetching job status:", error);
    res.status(500).json({ error: "Failed to fetch job status" });
  }
});

/**
 * GET /api/models/result/:jobId
 * Get the result of a completed generation job
 */
router.get("/result/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const job = await jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "completed") {
      return res.status(400).json({
        error: "Job not completed",
        status: job.status,
      });
    }

    if (!job.modelUrl) {
      return res.status(500).json({
        error: "Job completed but no model URL available",
      });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      modelUrl: job.modelUrl,
      productId: job.productId,
      variantId: job.variantId,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("Error fetching job result:", error);
    res.status(500).json({ error: "Failed to fetch job result" });
  }
});

/**
 * GET /api/models/product/:productId
 * Get all generation jobs for a product
 */
router.get("/product/:productId", async (req: Request, res: Response) => {
  try {
    const session = (req as any).shopifySession;
    const { productId } = req.params;

    const gid = productId.startsWith("gid://")
      ? productId
      : `gid://shopify/Product/${productId}`;

    const jobs = await jobService.getJobsByProduct(session.shop, gid);

    res.json({ jobs });
  } catch (error) {
    console.error("Error fetching product jobs:", error);
    res.status(500).json({ error: "Failed to fetch product jobs" });
  }
});

/**
 * POST /api/models/webhook/update
 * Webhook endpoint for worker to update job status
 * (Worker calls this when job status changes)
 */
router.post("/webhook/update", async (req: Request, res: Response) => {
  try {
    // TODO: Add authentication for worker requests (shared secret)
    const { jobId, status, modelUrl, errorMessage, metadata } = req.body;

    if (!jobId || !status) {
      return res.status(400).json({ error: "jobId and status are required" });
    }

    const updated = await jobService.updateJobStatus(jobId, status, {
      modelUrl,
      errorMessage,
      metadata,
    });

    if (!updated) {
      return res.status(500).json({ error: "Failed to update job" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating job via webhook:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
});

export default router;
