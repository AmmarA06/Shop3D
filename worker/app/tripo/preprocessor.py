"""
Image preprocessing utilities for 3D model generation
"""
import os
import httpx
from PIL import Image
import numpy as np
from rembg import remove
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


def download_image(url: str, save_path: str) -> str:
    """
    Download image from URL
    
    Args:
        url: Image URL
        save_path: Path to save the downloaded image
    
    Returns:
        Path to downloaded image
    """
    try:
        logger.info(f"Downloading image from: {url}")
        response = httpx.get(url, timeout=30.0, follow_redirects=True)
        response.raise_for_status()
        
        with open(save_path, "wb") as f:
            f.write(response.content)
        
        logger.info(f"✅ Image downloaded: {save_path}")
        return save_path
    except Exception as e:
        logger.error(f"❌ Failed to download image: {e}")
        raise Exception(f"Image download failed: {str(e)}")


def remove_background(image: Image.Image) -> Image.Image:
    """
    Remove background from image using rembg
    
    Args:
        image: PIL Image
    
    Returns:
        Image with transparent background
    """
    try:
        logger.info("Removing background...")
        # Convert to RGBA if not already
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        
        # Remove background
        output = remove(image)
        
        logger.info("✅ Background removed")
        return output
    except Exception as e:
        logger.error(f"❌ Background removal failed: {e}")
        raise Exception(f"Background removal failed: {str(e)}")


def center_and_crop_image(
    image: Image.Image,
    target_size: int = 512,
    padding: int = 50
) -> Image.Image:
    """
    Center the object and crop to square with padding
    
    Args:
        image: PIL Image with transparent background
        target_size: Target size for output image
        padding: Padding around the object in pixels
    
    Returns:
        Centered and cropped image
    """
    try:
        logger.info("Centering and cropping image...")
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Get alpha channel
        if img_array.shape[2] == 4:
            alpha = img_array[:, :, 3]
        else:
            # No alpha channel, use brightness
            alpha = np.mean(img_array[:, :, :3], axis=2)
        
        # Find bounding box of non-transparent pixels
        rows = np.any(alpha > 10, axis=1)
        cols = np.any(alpha > 10, axis=0)
        
        if not np.any(rows) or not np.any(cols):
            # No object found, return resized original
            logger.warning("No object found in image, using original")
            return image.resize((target_size, target_size), Image.Resampling.LANCZOS)
        
        y_min, y_max = np.where(rows)[0][[0, -1]]
        x_min, x_max = np.where(cols)[0][[0, -1]]
        
        # Add padding
        y_min = max(0, y_min - padding)
        y_max = min(image.height, y_max + padding)
        x_min = max(0, x_min - padding)
        x_max = min(image.width, x_max + padding)
        
        # Crop to bounding box
        cropped = image.crop((x_min, y_min, x_max, y_max))
        
        # Make it square by padding
        width, height = cropped.size
        max_dim = max(width, height)
        
        # Create new square image with transparent background
        square_img = Image.new("RGBA", (max_dim, max_dim), (0, 0, 0, 0))
        
        # Paste cropped image in center
        paste_x = (max_dim - width) // 2
        paste_y = (max_dim - height) // 2
        square_img.paste(cropped, (paste_x, paste_y))
        
        # Resize to target size
        result = square_img.resize((target_size, target_size), Image.Resampling.LANCZOS)
        
        logger.info(f"✅ Image centered and cropped to {target_size}x{target_size}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Center and crop failed: {e}")
        raise Exception(f"Center and crop failed: {str(e)}")


def preprocess_image(
    image_url: str,
    output_path: str,
    target_size: int = 512,
    remove_bg: bool = True
) -> str:
    """
    Full preprocessing pipeline for a single image
    
    Args:
        image_url: URL of the product image
        output_path: Path to save preprocessed image
        target_size: Target size for output image
        remove_bg: Whether to remove background
    
    Returns:
        Path to preprocessed image
    """
    try:
        # Create temp directory for downloads
        temp_dir = os.path.dirname(output_path)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Download image
        temp_download = os.path.join(temp_dir, "temp_download.png")
        download_image(image_url, temp_download)
        
        # Load image
        image = Image.open(temp_download)
        
        # Convert to RGB or RGBA
        if image.mode not in ["RGB", "RGBA"]:
            image = image.convert("RGB")
        
        # Remove background if requested
        if remove_bg:
            image = remove_background(image)
        else:
            # Ensure RGBA mode
            if image.mode != "RGBA":
                image = image.convert("RGBA")
        
        # Center and crop
        image = center_and_crop_image(image, target_size=target_size)
        
        # Save preprocessed image
        image.save(output_path, "PNG")
        
        # Clean up temp download
        if os.path.exists(temp_download):
            os.remove(temp_download)
        
        logger.info(f"✅ Image preprocessing complete: {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"❌ Image preprocessing failed: {e}")
        raise Exception(f"Image preprocessing failed: {str(e)}")


def preprocess_images(
    image_urls: list,
    output_dir: str,
    target_size: int = 512,
    remove_bg: bool = True
) -> list:
    """
    Preprocess multiple images
    
    Args:
        image_urls: List of image URLs
        output_dir: Directory to save preprocessed images
        target_size: Target size for output images
        remove_bg: Whether to remove background
    
    Returns:
        List of paths to preprocessed images
    """
    os.makedirs(output_dir, exist_ok=True)
    
    preprocessed_paths = []
    
    for i, url in enumerate(image_urls):
        output_path = os.path.join(output_dir, f"preprocessed_{i}.png")
        try:
            path = preprocess_image(url, output_path, target_size, remove_bg)
            preprocessed_paths.append(path)
        except Exception as e:
            logger.warning(f"Failed to preprocess image {i}: {e}")
            continue
    
    if not preprocessed_paths:
        raise Exception("Failed to preprocess any images")
    
    logger.info(f"✅ Preprocessed {len(preprocessed_paths)} images")
    return preprocessed_paths

