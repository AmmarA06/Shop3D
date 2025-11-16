# 3D Model Generation Worker

Python worker service for generating 3D models from product images using TripoSR.

## Overview

This service processes jobs from Redis queue, generates 3D models, and uploads results to Supabase storage.

## Architecture

```
Redis Queue → Celery Worker → TripoSR → Supabase Storage → Backend Update
```

## Pipeline

1. **Image Preprocessing** - Remove background, center, normalize to 512x512
2. **3D Generation** - Generate mesh using TripoSR
3. **Upload** - Upload GLB file to Supabase
4. **Notify** - Update backend via webhook

## Project Structure

```
worker/
├── app/
│   ├── main.py              # FastAPI health check server
│   ├── worker.py            # Celery worker
│   ├── tripo/
│   │   ├── generator.py     # 3D generation
│   │   └── preprocessor.py  # Image preprocessing
│   └── utils/
│       ├── job_updater.py   # Backend communication
│       └── storage.py       # Supabase upload
└── requirements.txt
```

## Environment Variables

```env
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET_NAME=3d-models
BACKEND_URL=http://localhost:5000
```

## Dependencies

See `requirements.txt` for full list. Key dependencies:
- celery - Task queue
- rembg - Background removal
- trimesh - 3D mesh processing
- supabase - Storage client
