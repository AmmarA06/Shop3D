import { Page, Layout, Card, Text, Button } from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Page title="3D Store Visualizer">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingLg" as="h2">
                Welcome to 3D Store Visualizer
              </Text>
              <div style={{ marginTop: "16px" }}>
                <Text variant="bodyMd" as="p">
                  Transform your product images into interactive 3D models that
                  customers can view, rotate, and explore on your storefront.
                </Text>
              </div>
              <div style={{ marginTop: "24px" }}>
                <Button primary onClick={() => navigate("/products")}>
                  View Products
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h3">
                Getting Started
              </Text>
              <div style={{ marginTop: "12px" }}>
                <ol>
                  <li>Select products to enable 3D viewing</li>
                  <li>We'll generate 3D models from your product photos</li>
                  <li>Customers can view products in 3D on your storefront</li>
                </ol>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
