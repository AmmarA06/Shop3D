/**
 * Shopify GraphQL client utilities
 */
import { Session } from "@shopify/shopify-api";
import { shopify } from "../config/shopify.js";

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
  extensions?: any;
}

/**
 * Execute GraphQL query against Shopify Admin API
 */
export async function adminGraphQL<T = any>(
  session: Session,
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  try {
    const client = new shopify.clients.Graphql({ session });

    const response = await client.query({
      data: {
        query,
        variables,
      },
    });

    if (!response.body) {
      throw new Error("GraphQL response body is empty");
    }

    return response.body as GraphQLResponse<T>;
  } catch (error) {
    console.error("Admin GraphQL error:", error);
    throw error;
  }
}

/**
 * Execute GraphQL query against Shopify Storefront API
 */
export async function storefrontGraphQL<T = any>(
  shop: string,
  storefrontAccessToken: string,
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse<T>> {
  try {
    const url = `https://${shop}/api/2024-01/graphql.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Storefront API error: ${response.statusText}`);
    }

    return (await response.json()) as GraphQLResponse<T>;
  } catch (error) {
    console.error("Storefront GraphQL error:", error);
    throw error;
  }
}

/**
 * GraphQL query helpers
 */
export const queries = {
  /**
   * Get product details including variants
   */
  GET_PRODUCT: `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        handle
        status
        variants(first: 100) {
          edges {
            node {
              id
              title
              sku
              price
              image {
                url
                altText
              }
            }
          }
        }
        images(first: 10) {
          edges {
            node {
              id
              url
              altText
              width
              height
            }
          }
        }
        metafields(first: 10) {
          edges {
            node {
              id
              namespace
              key
              value
            }
          }
        }
      }
    }
  `,

  /**
   * Get multiple products with pagination
   */
  GET_PRODUCTS: `
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            title
            handle
            status
            featuredImage {
              url
              altText
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,

  /**
   * Get product images from Storefront API (higher quality)
   */
  GET_PRODUCT_IMAGES_STOREFRONT: `
    query GetProductImages($handle: String!) {
      productByHandle(handle: $handle) {
        id
        title
        images(first: 10) {
          edges {
            node {
              url
              altText
              width
              height
            }
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  `,

  /**
   * Create product metafield for storing 3D model data
   */
  CREATE_METAFIELD: `
    mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
};

export default {
  adminGraphQL,
  storefrontGraphQL,
  queries,
};
