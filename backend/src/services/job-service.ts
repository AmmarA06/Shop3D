/**
 * Job queue service for managing 3D model generation jobs
 */
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export interface CreateJobParams {
  shop: string;
  productId: string;
  productHandle: string;
  variantId?: string;
  imageUrls: string[];
  metadata?: Record<string, any>;
}

export interface Job {
  id: string;
  shop: string;
  productId: string;
  productHandle: string;
  variantId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  modelUrl?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Create a new 3D model generation job
 */
export async function createJob(params: CreateJobParams): Promise<Job | null> {
  try {
    const jobId = uuidv4();

    // Create job record in database
    const { data, error } = await supabase
      .from("generation_jobs")
      .insert({
        id: jobId,
        shop: params.shop,
        product_id: params.productId,
        product_handle: params.productHandle,
        variant_id: params.variantId,
        status: "pending",
        metadata: {
          ...params.metadata,
          image_urls: params.imageUrls,
        },
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating job:", error);
      return null;
    }

    // TODO: If you want to integrate with a job queue (like Celery, Bull, etc.),
    // you can add the queue logic here. For now, jobs are stored in Supabase
    // and can be processed by polling or webhooks.

    console.log(`Job created: ${jobId} for product ${params.productId}`);

    return {
      id: data.id,
      shop: data.shop,
      productId: data.product_id,
      productHandle: data.product_handle,
      variantId: data.variant_id,
      status: data.status,
      modelUrl: data.model_url,
      errorMessage: data.error_message,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };
  } catch (error) {
    console.error("Failed to create job:", error);
    return null;
  }
}

/**
 * Get job status by ID
 */
export async function getJob(jobId: string): Promise<Job | null> {
  try {
    const { data, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      shop: data.shop,
      productId: data.product_id,
      productHandle: data.product_handle,
      variantId: data.variant_id,
      status: data.status,
      modelUrl: data.model_url,
      errorMessage: data.error_message,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };
  } catch (error) {
    console.error("Failed to get job:", error);
    return null;
  }
}

/**
 * Get all jobs for a product
 */
export async function getJobsByProduct(
  shop: string,
  productId: string
): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("shop", shop)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((record) => ({
      id: record.id,
      shop: record.shop,
      productId: record.product_id,
      productHandle: record.product_handle,
      variantId: record.variant_id,
      status: record.status,
      modelUrl: record.model_url,
      errorMessage: record.error_message,
      metadata: record.metadata,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      completedAt: record.completed_at,
    }));
  } catch (error) {
    console.error("Failed to get jobs:", error);
    return [];
  }
}

/**
 * Update job status (called by worker via webhook/Redis)
 */
export async function updateJobStatus(
  jobId: string,
  status: Job["status"],
  updates?: {
    modelUrl?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed" || status === "failed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (updates?.modelUrl) {
      updateData.model_url = updates.modelUrl;
    }

    if (updates?.errorMessage) {
      updateData.error_message = updates.errorMessage;
    }

    if (updates?.metadata) {
      updateData.metadata = updates.metadata;
    }

    const { error } = await supabase
      .from("generation_jobs")
      .update(updateData)
      .eq("id", jobId);

    if (error) {
      console.error("Error updating job:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to update job:", error);
    return false;
  }
}

/**
 * Delete old jobs (cleanup utility)
 */
export async function deleteOldJobs(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("generation_jobs")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select();

    if (error) {
      console.error("Error deleting old jobs:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Failed to delete old jobs:", error);
    return 0;
  }
}

export default {
  createJob,
  getJob,
  getJobsByProduct,
  updateJobStatus,
  deleteOldJobs,
};
