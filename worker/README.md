# 3D Model Generation Worker

Python worker service for generating 3D models from product images using TripoSR.

## Overview

This worker processes jobs from Redis queue, generates 3D models using the TripoSR pipeline, and uploads results to Supabase storage.

## Architecture

```
Redis Queue → Celery Worker → TripoSR → Supabase Storage → Backend Update
```

## Setup

### 1. Install Dependencies

```bash
cd worker
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the worker directory with the following variables:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_BUCKET_NAME=3d-models

# Backend Configuration
BACKEND_URL=http://localhost:5000

# Optional: GPU Configuration
# CUDA_VISIBLE_DEVICES=0
```

### 3. Start Redis

```bash
# macOS (with Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Start Celery Worker

```bash
cd worker
celery -A app.worker worker --loglevel=info
```

For development with auto-reload:

```bash
watchmedo auto-restart -d app -p '*.py' -- celery -A app.worker worker --loglevel=info
```

## Project Structure

```
worker/
├── app/
│   ├── main.py              # FastAPI health check server
│   ├── worker.py            # Main Celery worker with pipeline
│   ├── tripo/
│   │   ├── __init__.py
│   │   ├── generator.py     # TripoSR 3D generation
│   │   └── preprocessor.py  # Image preprocessing
│   └── utils/
│       ├── __init__.py
│       ├── job_updater.py   # Backend communication
│       └── storage.py       # Supabase upload
├── requirements.txt
└── README.md
```

## Pipeline Steps

1. **Image Preprocessing**
   - Download images from URLs
   - Remove background using rembg
   - Center and crop to square
   - Normalize to 512x512

2. **3D Generation**
   - Load TripoSR model
   - Generate 3D mesh from image
   - Apply quality settings (fast/balanced/quality)

3. **Export & Upload**
   - Convert to GLB format
   - Upload to Supabase storage
   - Update job status via backend webhook

## Job Structure

Jobs received from the queue have this structure:

```python
{
    "job_id": "uuid-v4-string",
    "shop": "shop-name.myshopify.com",
    "product_id": "gid://shopify/Product/123456789",
    "product_handle": "coffee-mug",
    "variant_id": "gid://shopify/ProductVariant/987654321",  # Optional
    "image_urls": ["https://cdn.shopify.com/..."],
    "metadata": {
        "productTitle": "Coffee Mug",
        "variantTitle": "Blue"
    },
    "quality": "balanced"  # fast, balanced, or quality
}
```

## Testing

### Health Check

The worker includes a FastAPI server for health checks:

```bash
# Start the FastAPI server (optional)
uvicorn app.main:app --host 0.0.0.0 --port 8001

# Check health
curl http://localhost:8001/health
```

### Manual Job Testing

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
        "metadata": {"productTitle": "Test Product"},
        "quality": "balanced"
    }
}

r.lpush("celery", json.dumps(test_job))
print("✅ Test job queued!")
```

### Monitor Worker Logs

The worker logs all steps:
- 📸 Image preprocessing
- 🎨 3D generation
- ☁️ Storage upload
- ✅ Completion
- ❌ Errors

## TripoSR Integration

**Note:** The current implementation includes a placeholder for TripoSR. To use the actual model:

1. Install TripoSR:
```bash
pip install git+https://github.com/VAST-AI-Research/TripoSR.git
```

2. Update `app/tripo/generator.py` to load the real model:
```python
from tsr.system import TSR

model = TSR.from_pretrained(
    "stabilityai/triposr",
    device=device,
    chunk_size=8192,
)
```

## Production Deployment

### Using Docker

```bash
# Build image
docker build -f ../infra/docker/worker.Dockerfile -t 3d-worker .

# Run container
docker run -d \
  --name 3d-worker \
  --env-file .env \
  3d-worker
```

### Using Docker Compose

```bash
cd ..
docker-compose up -d worker
```

### Scaling Workers

```bash
# Run multiple workers
celery -A app.worker worker --loglevel=info --concurrency=4

# Or start multiple instances
for i in {1..4}; do
  celery -A app.worker worker --loglevel=info --hostname=worker$i@%h &
done
```

## Monitoring

### Flower (Celery Monitoring)

```bash
pip install flower
celery -A app.worker flower --port=5555
```

Visit http://localhost:5555 to see:
- Active tasks
- Worker status
- Task history
- Performance metrics

## Troubleshooting

### Worker won't start
- Check Redis is running: `redis-cli ping`
- Verify environment variables
- Check Python dependencies: `pip list`

### Models not generating
- Check GPU/CUDA availability: `torch.cuda.is_available()`
- Verify TripoSR is installed
- Check image URLs are accessible
- Review worker logs for errors

### Upload fails
- Verify Supabase credentials
- Check bucket exists and is public
- Ensure service role key has storage permissions

## Development

### Adding New Features

1. **New preprocessing step**: Edit `app/tripo/preprocessor.py`
2. **Model improvements**: Edit `app/tripo/generator.py`
3. **Status updates**: Edit `app/utils/job_updater.py`
4. **Storage changes**: Edit `app/utils/storage.py`

### Testing Changes

```bash
# Run with auto-reload during development
pip install watchdog
watchmedo auto-restart -d app -p '*.py' -- celery -A app.worker worker --loglevel=info
```

## Performance

### Quality Presets

- **fast**: 128 resolution, ~10-20 seconds
- **balanced**: 256 resolution, ~30-60 seconds  (default)
- **quality**: 384 resolution, ~1-2 minutes

### Hardware Requirements

- **Minimum**: 8GB RAM, CPU only
- **Recommended**: 16GB RAM, GPU with 8GB+ VRAM
- **Optimal**: 32GB RAM, GPU with 16GB+ VRAM

## License

Part of the 3D Store Visualizer project.

