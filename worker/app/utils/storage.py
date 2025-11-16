"""
Supabase storage upload utility
"""
from supabase import create_client, Client
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """
    Create and return Supabase client
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    
    return create_client(supabase_url, supabase_key)


def upload_model_to_supabase(
    file_path: str,
    shop: str,
    product_id: str,
    variant_id: Optional[str] = None
) -> str:
    """
    Upload .glb file to Supabase storage
    
    Args:
        file_path: Local path to the .glb file
        shop: Shop domain (e.g., "shop-name.myshopify.com")
        product_id: Shopify product ID
        variant_id: Optional variant ID
    
    Returns:
        Public URL of uploaded file
        
    Raises:
        Exception: If upload fails
    """
    try:
        supabase = get_supabase_client()
        bucket_name = os.getenv("SUPABASE_BUCKET_NAME", "3d-models")

        # Generate storage path
        # Format: shop/product_id/variant_id.glb or shop/product_id.glb
        # Clean up Shopify GID format (gid://shopify/Product/123 -> 123)
        clean_product_id = product_id.split("/")[-1] if "/" in product_id else product_id
        
        filename = f"{shop}/{clean_product_id}"
        if variant_id:
            clean_variant_id = variant_id.split("/")[-1] if "/" in variant_id else variant_id
            filename += f"/{clean_variant_id}"
        filename += ".glb"

        logger.info(f"Uploading model to Supabase: {filename}")

        # Upload file
        with open(file_path, "rb") as f:
            file_data = f.read()
            
            # Try to remove existing file first (upsert)
            try:
                supabase.storage.from_(bucket_name).remove([filename])
            except Exception:
                pass  # File might not exist, that's okay
            
            # Upload the new file
            supabase.storage.from_(bucket_name).upload(
                filename,
                file_data,
                file_options={"content-type": "model/gltf-binary", "upsert": "true"}
            )

        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)

        logger.info(f"✅ Model uploaded successfully: {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"❌ Failed to upload model to Supabase: {e}")
        raise Exception(f"Supabase upload failed: {str(e)}")


def delete_model_from_supabase(
    shop: str,
    product_id: str,
    variant_id: Optional[str] = None
) -> bool:
    """
    Delete a model from Supabase storage
    
    Args:
        shop: Shop domain
        product_id: Shopify product ID
        variant_id: Optional variant ID
    
    Returns:
        True if deletion was successful
    """
    try:
        supabase = get_supabase_client()
        bucket_name = os.getenv("SUPABASE_BUCKET_NAME", "3d-models")

        # Generate storage path (same as upload)
        clean_product_id = product_id.split("/")[-1] if "/" in product_id else product_id
        
        filename = f"{shop}/{clean_product_id}"
        if variant_id:
            clean_variant_id = variant_id.split("/")[-1] if "/" in variant_id else variant_id
            filename += f"/{clean_variant_id}"
        filename += ".glb"

        supabase.storage.from_(bucket_name).remove([filename])
        logger.info(f"✅ Model deleted from Supabase: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to delete model from Supabase: {e}")
        return False

