/**
 * Product service for fetching and managing Shopify products
 */
import { Session } from "@shopify/shopify-api";
import { adminGraphQL, storefrontGraphQL, queries } from "../shopify/graphql-client.js";

export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  status: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    width?: number;
    height?: number;
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
  metafields?: Array<{
    id: string;
    namespace: string;
    key: string;
    value: string;
  }>;
}

export interface ProductListItem {
  id: string;
  title: string;
  handle: string;
  status: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  price?: string;
  cursor: string;
}

export interface PaginatedProducts {
  products: ProductListItem[];
  hasNextPage: boolean;
  endCursor?: string;
}

/**
 * Fetch a single product by ID
 */
export async function getProduct(
  session: Session,
  productId: string
): Promise<Product | null> {
  try {
    const response = await adminGraphQL(session, queries.GET_PRODUCT, {
      id: productId,
    });

    if (response.errors || !response.data?.product) {
      console.error("Error fetching product:", response.errors);
      return null;
    }

    const product = response.data.product;

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      handle: product.handle,
      status: product.status,
      images: product.images.edges.map((edge: any) => ({
        id: edge.node.id,
        url: edge.node.url,
        altText: edge.node.altText,
        width: edge.node.width,
        height: edge.node.height,
      })),
      variants: product.variants.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        sku: edge.node.sku,
        price: edge.node.price,
        image: edge.node.image
          ? {
              url: edge.node.image.url,
              altText: edge.node.image.altText,
            }
          : undefined,
      })),
      metafields: product.metafields.edges.map((edge: any) => ({
        id: edge.node.id,
        namespace: edge.node.namespace,
        key: edge.node.key,
        value: edge.node.value,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

/**
 * Fetch products with pagination
 */
export async function getProducts(
  session: Session,
  limit: number = 50,
  cursor?: string
): Promise<PaginatedProducts> {
  try {
    const response = await adminGraphQL(session, queries.GET_PRODUCTS, {
      first: limit,
      after: cursor,
    });

    if (response.errors || !response.data?.products) {
      console.error("Error fetching products:", response.errors);
      return { products: [], hasNextPage: false };
    }

    const { edges, pageInfo } = response.data.products;

    return {
      products: edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        status: edge.node.status,
        featuredImage: edge.node.featuredImage,
        price: edge.node.variants.edges[0]?.node.price,
        cursor: edge.cursor,
      })),
      hasNextPage: pageInfo.hasNextPage,
      endCursor: pageInfo.endCursor,
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return { products: [], hasNextPage: false };
  }
}

/**
 * Fetch high-quality product images from Storefront API
 * Used for 3D model generation
 */
export async function getProductImagesForGeneration(
  shop: string,
  storefrontAccessToken: string,
  productHandle: string
): Promise<{
  images: Array<{ url: string; altText?: string; width?: number; height?: number }>;
  variantImages: Array<{
    variantId: string;
    variantTitle: string;
    url: string;
    altText?: string;
  }>;
} | null> {
  try {
    const response = await storefrontGraphQL(
      shop,
      storefrontAccessToken,
      queries.GET_PRODUCT_IMAGES_STOREFRONT,
      { handle: productHandle }
    );

    if (response.errors || !response.data?.productByHandle) {
      console.error("Error fetching product images:", response.errors);
      return null;
    }

    const product = response.data.productByHandle;

    return {
      images: product.images.edges.map((edge: any) => ({
        url: edge.node.url,
        altText: edge.node.altText,
        width: edge.node.width,
        height: edge.node.height,
      })),
      variantImages: product.variants.edges
        .filter((edge: any) => edge.node.image)
        .map((edge: any) => ({
          variantId: edge.node.id,
          variantTitle: edge.node.title,
          url: edge.node.image.url,
          altText: edge.node.image.altText,
        })),
    };
  } catch (error) {
    console.error("Failed to fetch product images:", error);
    return null;
  }
}

/**
 * Save 3D model URL to product metafield
 */
export async function save3DModelMetafield(
  session: Session,
  productId: string,
  modelUrl: string,
  variantId?: string
): Promise<boolean> {
  try {
    const metafields = [
      {
        ownerId: productId,
        namespace: "3d_visualizer",
        key: variantId ? `model_${variantId}` : "model_url",
        value: modelUrl,
        type: "url",
      },
    ];

    const response = await adminGraphQL(session, queries.CREATE_METAFIELD, {
      metafields,
    });

    if (response.errors || response.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error(
        "Error saving metafield:",
        response.errors || response.data?.metafieldsSet?.userErrors
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to save 3D model metafield:", error);
    return false;
  }
}

export default {
  getProduct,
  getProducts,
  getProductImagesForGeneration,
  save3DModelMetafield,
};
