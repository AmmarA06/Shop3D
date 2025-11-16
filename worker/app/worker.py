"""
Celery worker for processing 3D model generation jobs
"""
from celery import Celery
import os
import tempfile
import shutil
import logging
from dotenv import load_dotenv
from typing import Dict, Any

from app.utils.job_updater import update_job_status
from app.utils.storage import upload_model_to_supabase
from app.tripo.preprocessor import preprocess_images
from app.tripo.generator import generate_3d_from_multiple_images

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# Configure Celery
celery_app = Celery(
    "3d_worker",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=1800,  # 30 minutes max
    task_soft_time_limit=1500,  # 25 minutes soft limit
)


@celery_app.task(name="generate_3d_model", bind=True)
def generate_3d_model(self, job_id: str, **kwargs):
    """
    Main task for generating 3D models from product images

    Steps:
    1. Download and preprocess product images
    2. Remove background and normalize
    3. Run TripoSR to generate 3D mesh
    4. Convert mesh to .glb format
    5. Upload to Supabase storage
    6. Update job status via backend webhook

    Args:
        job_id: Unique identifier for this generation job
        **kwargs: Job data including:
            - shop: Shop domain
            - product_id: Shopify product ID
            - product_handle: Product handle
            - variant_id: Optional variant ID
            - image_urls: List of product image URLs
            - metadata: Additional metadata
            - quality: Quality preset (fast, balanced, quality)
    
    Returns:
        Dict with job_id, status, and model_url (if successful)
    """
    temp_dir = None
    
    try:
        # Extract job data
        shop = kwargs.get("shop")
        product_id = kwargs.get("product_id")
        product_handle = kwargs.get("product_handle")
        variant_id = kwargs.get("variant_id")
        image_urls = kwargs.get("image_urls", [])
        metadata = kwargs.get("metadata", {})
        quality = kwargs.get("quality", "balanced")
        
        logger.info(f"🚀 Starting job {job_id} for product {product_id}")
        logger.info(f"   Shop: {shop}")
        logger.info(f"   Images: {len(image_urls)}")
        logger.info(f"   Quality: {quality}")
        
        # Validate input
        if not shop or not product_id or not image_urls:
            raise ValueError("Missing required fields: shop, product_id, or image_urls")
        
        # Update status to processing
        update_job_status(job_id, "processing", progress=5)
        
        # Create temporary working directory
        temp_dir = tempfile.mkdtemp(prefix=f"3d_gen_{job_id}_")
        logger.info(f"📁 Working directory: {temp_dir}")
        
        # Step 1: Preprocess images (download, remove bg, center, crop)
        logger.info("📸 Step 1: Preprocessing images...")
        update_job_status(job_id, "processing", progress=10, metadata={
            "step": "preprocessing",
            "message": "Downloading and preprocessing images"
        })
        
        preprocessed_dir = os.path.join(temp_dir, "preprocessed")
        preprocessed_images = preprocess_images(
            image_urls=image_urls,
            output_dir=preprocessed_dir,
            target_size=512,
            remove_bg=True
        )
        
        logger.info(f"✅ Preprocessed {len(preprocessed_images)} images")
        update_job_status(job_id, "processing", progress=40)
        
        # Step 2: Generate 3D model using TripoSR
        logger.info("🎨 Step 2: Generating 3D model...")
        update_job_status(job_id, "processing", progress=50, metadata={
            "step": "generation",
            "message": "Running 3D generation"
        })
        
        model_output_path = os.path.join(temp_dir, "model.glb")
        generate_3d_from_multiple_images(
            image_paths=preprocessed_images,
            output_path=model_output_path,
            quality=quality
        )
        
        logger.info("✅ 3D model generated")
        update_job_status(job_id, "processing", progress=80)
        
        # Step 3: Upload to Supabase storage
        logger.info("☁️  Step 3: Uploading to Supabase...")
        update_job_status(job_id, "processing", progress=85, metadata={
            "step": "upload",
            "message": "Uploading model to storage"
        })
        
        model_url = upload_model_to_supabase(
            file_path=model_output_path,
            shop=shop,
            product_id=product_id,
            variant_id=variant_id
        )
        
        logger.info(f"✅ Model uploaded: {model_url}")
        update_job_status(job_id, "processing", progress=95)
        
        # Step 4: Update status to completed
        logger.info("✅ Step 4: Finalizing...")
        result_metadata = {
            **metadata,
            "quality": quality,
            "images_processed": len(preprocessed_images),
            "product_handle": product_handle
        }
        
        update_job_status(
            job_id=job_id,
            status="completed",
            model_url=model_url,
            metadata=result_metadata,
            progress=100
        )
        
        logger.info(f"🎉 Job {job_id} completed successfully!")
        
        return {
            "job_id": job_id,
            "status": "completed",
            "model_url": model_url,
            "metadata": result_metadata
        }
    
    except Exception as e:
        logger.error(f"❌ Job {job_id} failed: {e}", exc_info=True)
        
        # Update status to failed
        update_job_status(
            job_id=job_id,
            status="failed",
            error_message=str(e),
            metadata={"error_type": type(e).__name__}
        )
        
        # Re-raise for Celery to handle
        raise
    
    finally:
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
                logger.info(f"🧹 Cleaned up temp directory: {temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp directory: {e}")


@celery_app.task(name="health_check")
def health_check():
    """
    Simple health check task for monitoring
    """
    return {"status": "healthy", "worker": "3d_generation"}
