/**
 * Card component for initiating and tracking 3D model generation
 */
import { useState } from "react";
import {
  Card,
  Button,
  ProgressBar,
  Banner,
  Text,
  InlineStack,
} from "@shopify/polaris";
import {
  useCreateModelJob,
  useModelGeneration,
} from "../hooks/useModelGeneration";

interface ModelGenerationCardProps {
  productId: string;
  productTitle: string;
  variantId?: string;
  variantTitle?: string;
  existingJobId?: string;
  onGenerationComplete?: (modelUrl: string) => void;
}

export default function ModelGenerationCard({
  productId,
  productTitle,
  variantId,
  variantTitle,
  existingJobId,
  onGenerationComplete,
}: ModelGenerationCardProps) {
  const [currentJobId, setCurrentJobId] = useState<string | null>(
    existingJobId || null
  );

  const { createJob, loading: creating } = useCreateModelJob();

  const { job, isProcessing, isComplete, isFailed } = useModelGeneration(
    currentJobId,
    {
      onComplete: (completedJob) => {
        if (completedJob.modelUrl && onGenerationComplete) {
          onGenerationComplete(completedJob.modelUrl);
        }
      },
    }
  );

  const handleGenerateModel = async () => {
    try {
      const jobId = await createJob(productId, variantId);
      setCurrentJobId(jobId);
    } catch (error) {
      console.error("Failed to create generation job:", error);
    }
  };

  const getStatusText = () => {
    if (!job) return "";
    switch (job.status) {
      case "pending":
        return "Queued for processing...";
      case "processing":
        return "Generating 3D model...";
      case "completed":
        return "3D model ready!";
      case "failed":
        return "Generation failed";
      default:
        return "";
    }
  };

  const getProgressValue = () => {
    if (!job) return 0;
    switch (job.status) {
      case "pending":
        return 25;
      case "processing":
        return 75;
      case "completed":
        return 100;
      case "failed":
        return 0;
      default:
        return 0;
    }
  };

  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Text variant="headingMd" as="h3">
            3D Model Generation
          </Text>
          <div style={{ marginTop: "4px" }}>
            <Text variant="bodySm" as="p" tone="subdued">
              {productTitle}
              {variantTitle && ` - ${variantTitle}`}
            </Text>
          </div>
        </div>

        {/* No job created yet */}
        {!currentJobId && (
          <div>
            <Text variant="bodyMd" as="p">
              Generate a 3D model from product images to enable interactive
              viewing.
            </Text>
            <div style={{ marginTop: "16px" }}>
              <Button
                primary
                onClick={handleGenerateModel}
                loading={creating}
                disabled={creating}
              >
                Generate 3D Model
              </Button>
            </div>
          </div>
        )}

        {/* Job in progress */}
        {currentJobId && isProcessing && (
          <div>
            <div style={{ marginBottom: "12px" }}>
              <Text variant="bodyMd" as="p" fontWeight="medium">
                {getStatusText()}
              </Text>
            </div>
            <ProgressBar progress={getProgressValue()} size="small" />
            <div style={{ marginTop: "8px" }}>
              <Text variant="bodySm" as="p" tone="subdued">
                This may take a few minutes. You can leave this page and come
                back later.
              </Text>
            </div>
          </div>
        )}

        {/* Job completed */}
        {currentJobId && isComplete && (
          <div>
            <Banner status="success">
              <Text as="p" variant="bodyMd">
                3D model generated successfully! You can now view it in 3D.
              </Text>
            </Banner>
            {job?.modelUrl && (
              <div style={{ marginTop: "12px" }}>
                <InlineStack gap="200">
                  <Button
                    url={job.modelUrl}
                    external
                    target="_blank"
                  >
                    Download Model
                  </Button>
                  <Button onClick={handleGenerateModel}>
                    Regenerate
                  </Button>
                </InlineStack>
              </div>
            )}
          </div>
        )}

        {/* Job failed */}
        {currentJobId && isFailed && (
          <div>
            <Banner status="critical">
              <Text as="p" variant="bodyMd">
                Failed to generate 3D model.{" "}
                {job?.errorMessage && `Error: ${job.errorMessage}`}
              </Text>
            </Banner>
            <div style={{ marginTop: "12px" }}>
              <Button onClick={handleGenerateModel}>Try Again</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
