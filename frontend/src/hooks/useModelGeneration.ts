/**
 * Custom hook for managing 3D model generation jobs
 */
import { useState, useEffect, useCallback } from "react";

export interface GenerationJob {
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

interface UseModelGenerationOptions {
  pollInterval?: number; // milliseconds
  onComplete?: (job: GenerationJob) => void;
  onError?: (error: string) => void;
}

export function useModelGeneration(
  jobId: string | null,
  options: UseModelGenerationOptions = {}
) {
  const { pollInterval = 2000, onComplete, onError } = options;

  const [job, setJob] = useState<GenerationJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/models/status/${jobId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }

      const data = await response.json();
      setJob(data);

      // Call completion callback if job is completed
      if (data.status === "completed" && onComplete) {
        onComplete(data);
      }

      // Call error callback if job failed
      if (data.status === "failed" && onError) {
        onError(data.errorMessage || "Generation failed");
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  }, [jobId, onComplete, onError]);

  // Poll for job status
  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();

    // Set up polling only if job is not in terminal state
    const interval = setInterval(() => {
      if (job?.status === "completed" || job?.status === "failed") {
        clearInterval(interval);
        return;
      }
      fetchJobStatus();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [jobId, job?.status, pollInterval, fetchJobStatus]);

  return {
    job,
    loading,
    error,
    isComplete: job?.status === "completed",
    isFailed: job?.status === "failed",
    isProcessing: job?.status === "processing" || job?.status === "pending",
    refetch: fetchJobStatus,
  };
}

/**
 * Hook for creating new model generation jobs
 */
export function useCreateModelJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = useCallback(
    async (productId: string, variantId?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/models/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId, variantId }),
        });

        if (!response.ok) {
          throw new Error("Failed to create generation job");
        }

        const data = await response.json();
        return data.jobId as string;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createJob,
    loading,
    error,
  };
}

/**
 * Hook for fetching all jobs for a product
 */
export function useProductJobs(productId: string | null) {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/models/product/${productId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch product jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
  };
}
