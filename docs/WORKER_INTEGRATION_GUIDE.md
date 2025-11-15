# Worker Integration Guide - For 3D Generation Pipeline Development

This guide is for developers working on the **3D model generation pipeline** (Python worker).

## Overview

The worker receives jobs from the backend via Redis queue, processes them using TripoSR, and updates job status back to the backend.

## Architecture Flow

```
Frontend "Enable 3D" Button
  ↓
Backend: POST /api/models/create
  ↓
Backend: Create job in Supabase database
  ↓
Backend: Push job to Redis queue
  ↓
Celery Worker: Pick up job from Redis
  ↓
Worker: Process with TripoSR pipeline
  ↓
Worker: Upload .glb to Supabase storage
  ↓
Worker: Update job status via HTTP or Redis
  ↓
Frontend: Poll job status and display model
```

## Job Payload Structure

When you receive a job from Redis, it will have this structure:

```python
{
  "job_id": "uuid-v4-string",
  "shop": "shop-name.myshopify.com",
  "product_id": "gid://shopify/Product/123456789",
  "product_handle": "coffee-mug",
  "variant_id": "gid://shopify/ProductVariant/987654321",  # Optional
  "image_urls": [
    "https://cdn.shopify.com/s/files/1/..../product-image.jpg"
  ],
  "metadata": {
    "productTitle": "Coffee Mug",
    "variantTitle": "Blue"
  }
}
```

## What You Need to Implement

### 1. Update `worker/app/worker.py`

Replace the current stub with the full pipeline:

```python
@celery_app.task(name="generate_3d_model")
def generate_3d_model(job_id: str, **kwargs):
    """
    Main task for generating 3D models from product images

    Steps:
    1. Download product images from image_urls
    2. Preprocess images (normalize, crop, background removal)
    3. Generate camera poses
    4. Run TripoSR to create 3D mesh
    5. Convert mesh to .glb format
    6. Upload .glb to Supabase storage
    7. Update job status
    """

    try:
        # Extract job data
        shop = kwargs.get("shop")
        product_id = kwargs.get("product_id")
        image_urls = kwargs.get("image_urls")

        # Update status to processing
        update_job_status(job_id, "processing")

        # TODO: Implement pipeline steps here
        # 1. Download images
        # 2. Preprocess
        # 3. Run TripoSR
        # 4. Convert to GLB
        # 5. Upload to Supabase

        model_url = "https://supabase-url.com/storage/v1/object/public/3d-models/..."

        # Update status to completed
        update_job_status(
            job_id,
            "completed",
            model_url=model_url
        )

        return {"job_id": job_id, "status": "completed", "model_url": model_url}

    except Exception as e:
        # Update status to failed
        update_job_status(
            job_id,
            "failed",
            error_message=str(e)
        )
        raise
```

### 2. Create Helper Functions

Create `worker/app/utils/job_updater.py`:

```python
"""
Utility to update job status in backend
"""
import os
import httpx

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

def update_job_status(
    job_id: str,
    status: str,
    model_url: str = None,
    error_message: str = None,
    metadata: dict = None
):
    """
    Update job status via backend webhook
    """
    try:
        payload = {
            "jobId": job_id,
            "status": status,
        }

        if model_url:
            payload["modelUrl"] = model_url

        if error_message:
            payload["errorMessage"] = error_message

        if metadata:
            payload["metadata"] = metadata

        response = httpx.post(
            f"{BACKEND_URL}/api/models/webhook/update",
            json=payload,
            timeout=10.0
        )

        response.raise_for_status()
        print(f"✅ Updated job {job_id} to status: {status}")

    except Exception as e:
        print(f"❌ Failed to update job {job_id}: {e}")
```

### 3. Implement TripoSR Pipeline

Create `worker/app/tripo/generator.py`:

```python
"""
TripoSR 3D generation pipeline
"""
import torch
from PIL import Image
import trimesh
import numpy as np
from rembg import remove

def generate_3d_model(image_path: str, output_path: str):
    """
    Generate 3D model from single image using TripoSR

    Args:
        image_path: Path to input product image
        output_path: Path to save output .glb file

    Returns:
        Path to generated .glb file
    """

    # 1. Load and preprocess image
    image = Image.open(image_path)

    # 2. Remove background
    image_no_bg = remove(image)

    # 3. Load TripoSR model
    # TODO: Load your TripoSR model
    # model = load_triposr_model()

    # 4. Generate 3D mesh
    # TODO: Run TripoSR inference
    # mesh = model.generate(image_no_bg)

    # 5. Convert to trimesh format
    # vertices, faces = mesh.vertices, mesh.faces
    # trimesh_obj = trimesh.Trimesh(vertices=vertices, faces=faces)

    # 6. Export as GLB
    # trimesh_obj.export(output_path, file_type='glb')

    return output_path
```

### 4. Supabase Upload Utility

Create `worker/app/utils/storage.py`:

```python
"""
Supabase storage upload utility
"""
from supabase import create_client
import os

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def upload_model_to_supabase(
    file_path: str,
    shop: str,
    product_id: str,
    variant_id: str = None
) -> str:
    """
    Upload .glb file to Supabase storage

    Returns:
        Public URL of uploaded file
    """
    bucket_name = os.getenv("SUPABASE_BUCKET_NAME", "3d-models")

    # Generate storage path
    filename = f"{shop}/{product_id}"
    if variant_id:
        filename += f"/{variant_id}"
    filename += ".glb"

    # Upload file
    with open(file_path, "rb") as f:
        supabase.storage.from_(bucket_name).upload(
            filename,
            f,
            file_options={"content-type": "model/gltf-binary"}
        )

    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(filename)

    return public_url
```

## Environment Variables

Your worker needs these environment variables (already in `.env.example`):

```env
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET_NAME=3d-models
BACKEND_URL=http://localhost:5000
```

## Testing Your Worker

### 1. Start Redis
```bash
redis-server
```

### 2. Start Celery Worker
```bash
cd worker
celery -A app.worker worker --loglevel=info
```

### 3. Manually Queue a Test Job (Python REPL)

```python
import redis
import json
import uuid

r = redis.Redis(host='localhost', port=6379)

test_job = {
    "task": "generate_3d_model",
    "id": str(uuid.uuid4()),
    "args": [],
    "kwargs": {
        "job_id": str(uuid.uuid4()),
        "shop": "test-shop.myshopify.com",
        "product_id": "gid://shopify/Product/123",
        "product_handle": "test-product",
        "image_urls": ["https://example.com/image.jpg"],
        "metadata": {}
    }
}

r.lpush("celery", json.dumps(test_job))
```

### 4. Check Worker Logs

You should see the worker pick up the job and process it.

## Integration Points with Backend

### Backend → Worker (Job Creation)
- Backend pushes job to Redis `celery` queue
- Worker picks up job via Celery

### Worker → Backend (Status Updates)
- Worker calls `POST /api/models/webhook/update` to update job status
- Alternative: Worker can write directly to Supabase database

## Current Status

✅ **Ready for you:**
- Job queue infrastructure (Redis)
- Database schema (Supabase)
- Job creation endpoint (`POST /api/models/create`)
- Status polling endpoint (`GET /api/models/status/:jobId`)
- Webhook for status updates (`POST /api/models/webhook/update`)

⏳ **What you need to build:**
- TripoSR model loading and inference
- Image preprocessing pipeline
- Mesh to GLB conversion
- Error handling and retry logic
- Quality presets (fast, balanced, quality)

## File Structure for Your Work

```
worker/
├── app/
│   ├── main.py                 # ✅ Already created (FastAPI)
│   ├── worker.py               # ⏳ Update with pipeline
│   ├── tripo/
│   │   ├── __init__.py        # ⏳ Create
│   │   ├── generator.py       # ⏳ Create (TripoSR logic)
│   │   └── preprocessor.py    # ⏳ Create (image preprocessing)
│   └── utils/
│       ├── __init__.py        # ⏳ Create
│       ├── job_updater.py     # ⏳ Create (backend communication)
│       └── storage.py          # ⏳ Create (Supabase upload)
├── requirements.txt            # ✅ Already created
└── .env                        # ⏳ Create from .env.example
```

## Questions?

If you need any changes to the job structure, database schema, or API endpoints, let us know and we can adjust the backend accordingly.

Happy coding! 🚀
