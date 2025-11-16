import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import SimplePage from "./pages/SimplePage";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";

function AppContent() {
  const [config, setConfig] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Get shop and host from URL params
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");
    const host = params.get("host");

    if (shop && host) {
      setConfig({
        apiKey: import.meta.env.VITE_SHOPIFY_API_KEY,
        host: host,
        forceRedirect: true,
      });
    } else {
      // No Shopify params - run in standalone mode
      setIsStandalone(true);
    }
  }, []);

  // Standalone mode (for testing without Shopify)
  if (isStandalone) {
    return (
      <AppProvider i18n={{}}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SimplePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    );
  }

  // Shopify embedded mode
  if (!config) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AppBridgeProvider config={config}>
      <AppProvider i18n={{}}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AppBridgeProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
