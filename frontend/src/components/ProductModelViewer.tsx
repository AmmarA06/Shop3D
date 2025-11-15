/**
 * Product 3D Model Viewer with variant switching
 * Integrates ModelViewer with product variant selection
 */
import { useState, useEffect } from "react";
import {
  Card,
  ButtonGroup,
  Button,
  Spinner,
  Banner,
  Text,
} from "@shopify/polaris";
import ModelViewer, { preloadModel } from "../three/ModelViewer";

interface Variant {
  id: string;
  title: string;
  modelUrl?: string;
  image?: {
    url: string;
    altText?: string;
  };
}

interface ProductModelViewerProps {
  productId: string;
  productTitle: string;
  variants: Variant[];
  defaultModelUrl?: string;
  onVariantChange?: (variantId: string) => void;
}

export default function ProductModelViewer({
  productId,
  productTitle,
  variants,
  defaultModelUrl,
  onVariantChange,
}: ProductModelViewerProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id || null
  );
  const [currentModelUrl, setCurrentModelUrl] = useState<string | null>(
    defaultModelUrl || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current variant
  const currentVariant = variants.find((v) => v.id === selectedVariantId);

  // Update model URL when variant changes
  useEffect(() => {
    if (!currentVariant) return;

    const modelUrl = currentVariant.modelUrl || defaultModelUrl;

    if (modelUrl) {
      setLoading(true);
      setError(null);

      // Preload the model
      preloadModel(modelUrl);

      // Small delay to show loading state
      setTimeout(() => {
        setCurrentModelUrl(modelUrl);
        setLoading(false);
      }, 300);
    } else {
      setCurrentModelUrl(null);
      setError("No 3D model available for this variant");
    }
  }, [currentVariant, defaultModelUrl]);

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    if (onVariantChange) {
      onVariantChange(variantId);
    }
  };

  // Show error if no model available
  if (!currentModelUrl && !loading) {
    return (
      <Card>
        <div style={{ padding: "20px" }}>
          <Banner status="info">
            <Text as="p" variant="bodyMd">
              3D model is not available for this product yet. Enable 3D viewing
              to generate a model.
            </Text>
          </Banner>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ padding: "20px" }}>
        {/* Product title */}
        <div style={{ marginBottom: "16px" }}>
          <Text variant="headingLg" as="h2">
            {productTitle}
          </Text>
        </div>

        {/* Variant selector */}
        {variants.length > 1 && (
          <div style={{ marginBottom: "16px" }}>
            <Text variant="bodyMd" as="p" fontWeight="semibold">
              Select Variant:
            </Text>
            <div style={{ marginTop: "8px" }}>
              <ButtonGroup>
                {variants.map((variant) => (
                  <Button
                    key={variant.id}
                    pressed={variant.id === selectedVariantId}
                    onClick={() => handleVariantChange(variant.id)}
                    disabled={loading}
                  >
                    {variant.title}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: "16px" }}>
            <Banner status="critical">
              <Text as="p" variant="bodyMd">
                {error}
              </Text>
            </Banner>
          </div>
        )}

        {/* 3D Viewer */}
        {loading ? (
          <div
            style={{
              height: "600px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f0f0f0",
              borderRadius: "8px",
            }}
          >
            <Spinner size="large" />
          </div>
        ) : currentModelUrl ? (
          <ModelViewer
            modelUrl={currentModelUrl}
            scale={1}
            showGrid={true}
            autoRotate={false}
            backgroundColor="#f5f5f5"
          />
        ) : null}

        {/* Info text */}
        <div style={{ marginTop: "12px" }}>
          <Text variant="bodySm" as="p" tone="subdued">
            Viewing {currentVariant?.title || "default"} variant in 3D
          </Text>
        </div>
      </div>
    </Card>
  );
}
