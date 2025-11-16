/**
 * Product Detail Page with 3D Viewer Integration
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Page,
  Layout,
  Card,
  Spinner,
  Banner,
  Text,
  Button,
} from "@shopify/polaris";
import ProductModelViewer from "../components/ProductModelViewer";
import ModelGenerationCard from "../components/ModelGenerationCard";
import { useProductJobs } from "../hooks/useModelGeneration";

interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  status: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    sku?: string;
    price: string;
    image?: {
      url: string;
      altText?: string;
    };
  }>;
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );
  const [shopDomain, setShopDomain] = useState<string | null>(null);

  // Fetch product jobs to check for existing 3D models
  const { jobs, refetch: refetchJobs } = useProductJobs(productId || null);

  // Fetch product details
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();
        setProduct(data);
        setSelectedVariantId(data.variants[0]?.id || null);
        
        // Extract shop domain from URL params (Shopify embedded app)
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        if (shop) {
          setShopDomain(shop);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Find completed job for current variant or product
  const getModelUrl = () => {
    if (!jobs.length) return null;

    // First, try to find a completed job for the selected variant
    if (selectedVariantId) {
      const variantJob = jobs.find(
        (job) =>
          job.variantId === selectedVariantId && job.status === "completed"
      );
      if (variantJob?.modelUrl) return variantJob.modelUrl;
    }

    // Fallback to product-level job (no variant)
    const productJob = jobs.find(
      (job) => !job.variantId && job.status === "completed"
    );
    return productJob?.modelUrl || null;
  };

  const hasActiveJob = jobs.some(
    (job) =>
      job.status === "pending" ||
      job.status === "processing"
  );

  const activeJob = jobs.find(
    (job) =>
      job.status === "pending" ||
      job.status === "processing"
  );

  if (loading) {
    return (
      <Page title="Product Details">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error || !product) {
    return (
      <Page
        title="Product Details"
        backAction={{ onAction: () => navigate("/products") }}
      >
        <Card>
          <div style={{ padding: "20px" }}>
            <Banner status="critical">
              <Text as="p" variant="bodyMd">
                {error || "Product not found"}
              </Text>
            </Banner>
          </div>
        </Card>
      </Page>
    );
  }

  const modelUrl = getModelUrl();
  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId
  );

  // Prepare variants with model URLs
  const variantsWithModels = product.variants.map((variant) => {
    const variantJob = jobs.find(
      (job) => job.variantId === variant.id && job.status === "completed"
    );
    return {
      ...variant,
      modelUrl: variantJob?.modelUrl,
    };
  });

  return (
    <Page
      title={product.title}
      backAction={{ onAction: () => navigate("/products") }}
      primaryAction={
        modelUrl && shopDomain
          ? {
              content: "View in Store",
              external: true,
              url: `https://${shopDomain}/products/${product.handle}`,
            }
          : undefined
      }
    >
      <Layout>
        {/* Main content */}
        <Layout.Section>
          {modelUrl ? (
            <ProductModelViewer
              productId={product.id}
              productTitle={product.title}
              variants={variantsWithModels}
              defaultModelUrl={modelUrl}
              onVariantChange={(variantId) => setSelectedVariantId(variantId)}
            />
          ) : (
            <Card>
              <div style={{ padding: "20px" }}>
                <Banner status="info">
                  <Text as="p" variant="bodyMd">
                    No 3D model available yet. Generate a 3D model to enable
                    interactive viewing.
                  </Text>
                </Banner>
              </div>
            </Card>
          )}
        </Layout.Section>

        {/* Sidebar */}
        <Layout.Section variant="oneThird">
          {/* Product info */}
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h3">
                Product Information
              </Text>
              <div style={{ marginTop: "12px" }}>
                <Text variant="bodyMd" as="p">
                  {product.description || "No description available"}
                </Text>
              </div>
              <div style={{ marginTop: "16px" }}>
                <Text variant="bodySm" as="p" tone="subdued">
                  Status: {product.status}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Variants: {product.variants.length}
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Images: {product.images.length}
                </Text>
              </div>
            </div>
          </Card>

          {/* Model generation card */}
          <div style={{ marginTop: "16px" }}>
            <ModelGenerationCard
              productId={product.id}
              productTitle={product.title}
              variantId={selectedVariantId || undefined}
              variantTitle={selectedVariant?.title}
              existingJobId={activeJob?.id}
              onGenerationComplete={() => {
                refetchJobs();
              }}
            />
          </div>

          {/* Existing models */}
          {jobs.filter((j) => j.status === "completed").length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <Card>
                <div style={{ padding: "20px" }}>
                  <Text variant="headingMd" as="h3">
                    Generated Models
                  </Text>
                  <div style={{ marginTop: "12px" }}>
                    {jobs
                      .filter((j) => j.status === "completed")
                      .map((job) => (
                        <div
                          key={job.id}
                          style={{
                            marginBottom: "8px",
                            paddingBottom: "8px",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          <Text variant="bodySm" as="p" fontWeight="medium">
                            {job.metadata?.variantTitle || "Default"}
                          </Text>
                          <Text variant="bodySm" as="p" tone="subdued">
                            Created:{" "}
                            {new Date(job.createdAt).toLocaleDateString()}
                          </Text>
                          {job.modelUrl && (
                            <Button
                              size="slim"
                              url={job.modelUrl}
                              external
                              target="_blank"
                            >
                              Download
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
