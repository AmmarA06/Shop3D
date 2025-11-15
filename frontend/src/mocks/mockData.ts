/**
 * Mock data for testing 3D viewer without backend
 */

// Sample GLB model URLs from Khronos glTF sample repository
export const SAMPLE_MODELS = {
  // Simple test models
  cube: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb",
  duck: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
  helmet: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",

  // Product-like models
  lantern: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb",
  waterBottle:
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb",
  
  // Supabase hosted model
  customCube: "https://wvmouyqnsuxmiatguxca.supabase.co/storage/v1/object/public/3d-models/test-shop.myshopify.com/123456789.glb",
};

// Mock product data
export const MOCK_PRODUCTS = [
  {
    id: "gid://shopify/Product/1",
    title: "Classic Coffee Mug",
    description: "A beautiful ceramic coffee mug",
    handle: "coffee-mug",
    status: "active",
    images: [
      {
        id: "img1",
        url: "https://via.placeholder.com/400",
        altText: "Coffee Mug",
      },
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/1",
        title: "Blue",
        price: "15.00",
        sku: "MUG-BLUE",
        image: {
          url: "https://via.placeholder.com/400/0000FF/FFFFFF?text=Blue+Mug",
        },
        modelUrl: SAMPLE_MODELS.duck, // Use duck as placeholder
      },
      {
        id: "gid://shopify/ProductVariant/2",
        title: "Red",
        price: "15.00",
        sku: "MUG-RED",
        image: {
          url: "https://via.placeholder.com/400/FF0000/FFFFFF?text=Red+Mug",
        },
        modelUrl: SAMPLE_MODELS.helmet, // Use helmet as placeholder
      },
    ],
  },
  {
    id: "gid://shopify/Product/2",
    title: "Water Bottle",
    description: "Stainless steel water bottle",
    handle: "water-bottle",
    status: "active",
    images: [
      {
        id: "img2",
        url: "https://via.placeholder.com/400",
        altText: "Water Bottle",
      },
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/3",
        title: "Silver",
        price: "25.00",
        sku: "BOTTLE-SILVER",
        modelUrl: SAMPLE_MODELS.waterBottle,
      },
    ],
  },
  {
    id: "gid://shopify/Product/3",
    title: "Custom 3D Product",
    description: "A custom 3D model from Supabase storage",
    handle: "custom-product",
    status: "active",
    images: [
      {
        id: "img3",
        url: "https://via.placeholder.com/400",
        altText: "Custom Product",
      },
    ],
    variants: [
      {
        id: "gid://shopify/ProductVariant/4",
        title: "Default",
        price: "30.00",
        sku: "CUSTOM-001",
        modelUrl: SAMPLE_MODELS.customCube,
      },
    ],
  },
];

// Mock generation job
export const createMockJob = (
  productId: string,
  variantId?: string
): any => {
  return {
    id: `mock-job-${Date.now()}`,
    shop: "test-shop.myshopify.com",
    productId,
    variantId,
    status: "pending",
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Simulate job progression
export const simulateJobProgress = (
  jobId: string,
  onStatusChange: (status: string) => void
) => {
  // Pending -> Processing -> Completed
  setTimeout(() => onStatusChange("processing"), 2000);
  setTimeout(() => onStatusChange("completed"), 5000);
};

// Mock API responses
export const mockApiResponses = {
  products: {
    products: MOCK_PRODUCTS.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      status: p.status,
      featuredImage: p.images[0],
      price: p.variants[0]?.price,
      cursor: p.id,
    })),
    hasNextPage: false,
  },

  productDetail: (id: string) => {
    return MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];
  },

  createJob: (productId: string, variantId?: string) => {
    const job = createMockJob(productId, variantId);
    return {
      success: true,
      jobId: job.id,
      status: job.status,
      message: "3D model generation job created",
    };
  },

  jobStatus: (jobId: string, status: string = "completed") => {
    const modelUrl =
      status === "completed" ? SAMPLE_MODELS.duck : undefined;

    return {
      id: jobId,
      shop: "test-shop.myshopify.com",
      productId: "gid://shopify/Product/1",
      productHandle: "test-product",
      status,
      modelUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: status === "completed" ? new Date().toISOString() : undefined,
    };
  },
};

export default {
  SAMPLE_MODELS,
  MOCK_PRODUCTS,
  createMockJob,
  simulateJobProgress,
  mockApiResponses,
};
