"""
TripoSR 3D generation pipeline
"""
import torch
from PIL import Image
import trimesh
import numpy as np
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Global model cache
_model_cache = None


def get_device() -> str:
    """
    Get the best available device (cuda, mps, or cpu)
    """
    if torch.cuda.is_available():
        return "cuda"
    elif torch.backends.mps.is_available():
        return "mps"
    else:
        return "cpu"


def load_triposr_model():
    """
    Load TripoSR model (cached)
    
    Loads the TripoSR model from Hugging Face Hub (stabilityai/triposr)
    """
    global _model_cache
    
    if _model_cache is not None:
        return _model_cache
    
    try:
        logger.info("Loading TripoSR model from Hugging Face...")
        device = get_device()
        logger.info(f"Using device: {device}")
        
        # Add app directory to path so 'tsr' module can be imported
        import sys
        app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if app_dir not in sys.path:
            sys.path.insert(0, app_dir)
        
        # Import TripoSR system
        from tsr.system import TSR
        
        # Load model from Hugging Face with required config and weight files
        model = TSR.from_pretrained(
            pretrained_model_name_or_path="stabilityai/triposr",
            config_name="config.yaml",
            weight_name="model.ckpt"
        )
        
        # Move model to the appropriate device
        model.to(device)
        
        _model_cache = model
        logger.info("TripoSR model loaded successfully")
        return _model_cache
        
    except Exception as e:
        logger.error(f"Failed to load TripoSR model: {e}")
        logger.warning("Falling back to placeholder mode")
        # Fallback to placeholder
        _model_cache = {"device": get_device(), "status": "placeholder"}
        return _model_cache


def generate_3d_model(
    image_path: str,
    output_path: str,
    quality: str = "balanced"
) -> str:
    """
    Generate 3D model from single image using TripoSR
    
    Args:
        image_path: Path to preprocessed input product image
        output_path: Path to save output .glb file
        quality: Quality preset - "fast", "balanced", or "quality"
    
    Returns:
        Path to generated .glb file
    """
    try:
        logger.info(f"Starting 3D generation from: {image_path}")
        logger.info(f"Quality preset: {quality}")
        
        # Clear GPU cache before starting to maximize available memory
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info(f"GPU memory cleared. Available: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        
        # Load model
        model = load_triposr_model()
        device = get_device()
        
        # Load and prepare image
        image = Image.open(image_path)
        
        # Ensure RGBA mode
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        
        # Convert to RGB with white background for model input
        rgb_image = Image.new("RGB", image.size, (255, 255, 255))
        rgb_image.paste(image, mask=image.split()[3] if image.mode == "RGBA" else None)
        
        # Configure quality settings
        # Optimized for 8GB GPU - TripoSR renderer needs significant memory
        mc_resolution = 192  # Marching cubes resolution (balanced)
        if quality == "fast":
            mc_resolution = 128  # Fastest, low memory
        elif quality == "balanced":
            mc_resolution = 192  # Good balance (safe for 8GB GPU)
        elif quality == "quality":
            mc_resolution = 256  # Best quality for 8GB GPU
        
        logger.info(f"Generating 3D mesh (resolution: {mc_resolution})...")
        
        # Check if we have a real model or placeholder
        if isinstance(model, dict) and model.get("status") == "placeholder":
            logger.warning("Using placeholder cube mesh - TripoSR not available")
            mesh = create_placeholder_mesh()
        else:
            # Use real TripoSR model
            logger.info("Running TripoSR inference...")
            with torch.no_grad():
                # TripoSR expects a list of PIL images and device
                scene_codes = model([rgb_image], device=device)
                # Extract mesh with vertex colors for better appearance
                meshes = model.extract_mesh(
                    scene_codes, 
                    resolution=mc_resolution,
                    has_vertex_color=True
                )
                mesh = meshes[0]
            
            logger.info("3D mesh generated with TripoSR")
        
        # Export as GLB
        export_mesh_as_glb(mesh, output_path)
        
        # Clear GPU cache after generation to free memory
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        logger.info(f"3D model generated: {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"3D generation failed: {e}")
        # Clear GPU cache on error too
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        raise Exception(f"3D generation failed: {str(e)}")


def create_placeholder_mesh() -> trimesh.Trimesh:
    """
    Create a placeholder mesh for testing
    
    This creates a simple textured cube. Remove this function when
    TripoSR is properly implemented.
    
    Returns:
        Trimesh object
    """
    # Create a simple cube
    vertices = np.array([
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],  # Back face
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]       # Front face
    ], dtype=np.float32) * 0.5
    
    faces = np.array([
        [0, 1, 2], [0, 2, 3],  # Back
        [4, 6, 5], [4, 7, 6],  # Front
        [0, 4, 5], [0, 5, 1],  # Bottom
        [2, 6, 7], [2, 7, 3],  # Top
        [0, 3, 7], [0, 7, 4],  # Left
        [1, 5, 6], [1, 6, 2]   # Right
    ], dtype=np.int32)
    
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    
    # Add some color
    mesh.visual.vertex_colors = np.array([
        [255, 0, 0, 255],    # Red
        [0, 255, 0, 255],    # Green
        [0, 0, 255, 255],    # Blue
        [255, 255, 0, 255],  # Yellow
        [255, 0, 255, 255],  # Magenta
        [0, 255, 255, 255],  # Cyan
        [255, 255, 255, 255], # White
        [128, 128, 128, 255]  # Gray
    ], dtype=np.uint8)
    
    return mesh


def export_mesh_as_glb(mesh: trimesh.Trimesh, output_path: str):
    """
    Export trimesh object as GLB file
    
    Args:
        mesh: Trimesh object
        output_path: Path to save .glb file
    """
    try:
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Export as GLB
        mesh.export(output_path, file_type='glb')
        
        logger.info(f"Mesh exported as GLB: {output_path}")
        
    except Exception as e:
        logger.error(f"GLB export failed: {e}")
        raise Exception(f"GLB export failed: {str(e)}")


def generate_3d_from_multiple_images(
    image_paths: list,
    output_path: str,
    quality: str = "balanced"
) -> str:
    """
    Generate 3D model from multiple images
    
    For now, this uses only the first image. In the future, you could
    implement multi-view reconstruction.
    
    Args:
        image_paths: List of preprocessed image paths
        output_path: Path to save output .glb file
        quality: Quality preset
    
    Returns:
        Path to generated .glb file
    """
    if not image_paths:
        raise ValueError("No images provided")
    
    # For single-view TripoSR, use the first image
    # In future, could implement multi-view fusion
    logger.info(f"Using first of {len(image_paths)} images for generation")
    
    return generate_3d_model(image_paths[0], output_path, quality)

