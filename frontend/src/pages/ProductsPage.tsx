import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Thumbnail,
  Button,
  Spinner,
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";

interface Product {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  price?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable3D = (productId: string) => {
    // TODO: Implement 3D model generation
    console.log("Enable 3D for product:", productId);
  };

  if (loading) {
    return (
      <Page title="Products">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Products">
        <Card>
          <div style={{ padding: "20px", textAlign: "center" }}>
            <Text variant="bodyMd" as="p" tone="critical">
              {error}
            </Text>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Products"
      subtitle="Select products to enable 3D viewing"
      primaryAction={{
        content: "Refresh",
        onAction: fetchProducts,
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: "product", plural: "products" }}
              items={products}
              renderItem={(item) => {
                const { id, title, featuredImage, price } = item;
                const media = featuredImage ? (
                  <Thumbnail source={featuredImage.url} alt={title} />
                ) : (
                  <Thumbnail source={ImageMajor} alt={title} />
                );

                return (
                  <ResourceItem
                    id={id}
                    media={media}
                    accessibilityLabel={`View details for ${title}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {title}
                        </Text>
                        {price && (
                          <div style={{ marginTop: "4px" }}>
                            <Text variant="bodySm" as="p" tone="subdued">
                              ${price}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Button onClick={() => handleEnable3D(id)}>
                        Enable 3D
                      </Button>
                    </div>
                  </ResourceItem>
                );
              }}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
