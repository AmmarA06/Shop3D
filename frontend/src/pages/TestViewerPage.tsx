/**
 * Test page for 3D viewer with sample models
 * Quick way to test the viewer without backend
 */
import { useState, useRef } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  ButtonGroup,
  InlineStack,
  BlockStack,
  Badge,
  Divider
} from "@shopify/polaris";
import ModelViewer, { ModelViewerHandle } from "../three/ModelViewer";

// Product structure with variants
interface ProductVariant {
  id: string;
  name: string;
  modelUrl: string;
  color?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  variants: ProductVariant[];
}

// Sample products with variants
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "duck",
    name: "Duck",
    description: "Classic rubber duck model",
    variants: [
      {
        id: "duck-default",
        name: "Default",
        modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
      },
    ],
  },
  {
    id: "helmet",
    name: "Damaged Helmet",
    description: "Battle-worn sci-fi helmet",
    variants: [
      {
        id: "helmet-damaged",
        name: "Damaged",
        modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
      },
    ],
  },
  {
    id: "containers",
    name: "Containers",
    description: "Various container models",
    variants: [
      {
        id: "lantern",
        name: "Lantern",
        modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
      },
      {
        id: "bottle",
        name: "Water Bottle",
        modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb",
      },
    ],
  },
  {
    id: "shapes",
    name: "Simple Shapes",
    description: "Basic geometric models",
    variants: [
      {
        id: "box",
        name: "Box",
        modelUrl: "https://wvmouyqnsuxmiatguxca.supabase.co/storage/v1/object/public/3d-models/test-shop.myshopify.com/123456789.glb",
      },
      {
        id: "avocado",
        name: "Avocado",
        modelUrl: "https://wvmouyqnsuxmiatguxca.supabase.co/storage/v1/object/public/3d-models/test-shop.myshopify.com/123456789.glb",
      },
    ],
  },
];

export default function TestViewerPage() {
  const viewerRef = useRef<ModelViewerHandle>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product>(SAMPLE_PRODUCTS[0]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(SAMPLE_PRODUCTS[0].variants[0]);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const handleResetCamera = () => {
    viewerRef.current?.resetCamera();
  };

  const handleProductChange = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants[0]); // Auto-select first variant
  };

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
  };

  return (
    <Page title="3D Viewer Test" subtitle="Testing environment for 3D viewer component">
      <Layout>
        {/* Main viewer */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              {/* Product header */}
              <div style={{ padding: "20px 20px 0" }}>
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="h2">
                      {selectedProduct.name}
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      {selectedProduct.description}
                    </Text>
                  </BlockStack>
                  <Badge tone="success">3D Enabled</Badge>
                </InlineStack>
              </div>

              <Divider />

              {/* Variant selection */}
              {selectedProduct.variants.length > 1 && (
                <div style={{ padding: "0 20px" }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Variant
                    </Text>
                    <ButtonGroup variant="segmented">
                      {selectedProduct.variants.map((variant) => (
                        <Button
                          key={variant.id}
                          pressed={selectedVariant.id === variant.id}
                          onClick={() => handleVariantChange(variant)}
                        >
                          {variant.name}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </BlockStack>
                </div>
              )}

              {/* 3D Viewer */}
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ height: "500px" }}>
                  <ModelViewer
                    ref={viewerRef}
                    modelUrl={selectedVariant.modelUrl}
                    scale={1}
                    showGrid={showGrid}
                    autoRotate={autoRotate}
                    backgroundColor="#f6f6f7"
                  />
                </div>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Sidebar */}
        <Layout.Section variant="oneThird">
          {/* Product selector */}
          <Card>
            <BlockStack gap="400">
              <div style={{ padding: "20px 20px 0" }}>
                <Text variant="headingMd" as="h3">
                  Select Product
                </Text>
              </div>

              <Divider />

              <div style={{ padding: "0 20px 20px" }}>
                <BlockStack gap="200">
                  {SAMPLE_PRODUCTS.map((product) => (
                    <Button
                      key={product.id}
                      onClick={() => handleProductChange(product)}
                      variant={selectedProduct.id === product.id ? "primary" : undefined}
                      textAlign="left"
                      fullWidth
                    >
                      <BlockStack gap="050">
                        <Text variant="bodyMd" as="span" fontWeight="semibold">
                          {product.name}
                        </Text>
                        <Text variant="bodySm" as="span" tone="subdued">
                          {product.variants.length} variant{product.variants.length > 1 ? "s" : ""}
                        </Text>
                      </BlockStack>
                    </Button>
                  ))}
                </BlockStack>
              </div>
            </BlockStack>
          </Card>

          {/* Viewer Controls */}
          <div style={{ marginTop: "16px" }}>
            <Card>
              <BlockStack gap="400">
                <div style={{ padding: "20px 20px 0" }}>
                  <Text variant="headingMd" as="h3">
                    Controls
                  </Text>
                </div>

                <Divider />

                <div style={{ padding: "0 20px 20px" }}>
                  <BlockStack gap="200">
                    <Button
                      onClick={() => setAutoRotate(!autoRotate)}
                      variant={autoRotate ? "primary" : undefined}
                      fullWidth
                    >
                      {autoRotate ? "Stop" : "Start"} Auto-Rotate
                    </Button>
                    <Button
                      onClick={() => setShowGrid(!showGrid)}
                      variant={showGrid ? "primary" : undefined}
                      fullWidth
                    >
                      {showGrid ? "Hide" : "Show"} Grid
                    </Button>
                    <Button onClick={handleResetCamera} fullWidth>
                      Reset Camera
                    </Button>
                  </BlockStack>
                </div>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
