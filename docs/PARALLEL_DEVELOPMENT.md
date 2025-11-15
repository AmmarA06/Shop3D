# Parallel Development Guide

This document explains how multiple developers can work on different parts of the project simultaneously.

## Work Streams

### Stream 1: 3D Viewer & Theme Extension (You)

**Branch:** `feature/3d-viewer`

**Files you'll work on:**

- `frontend/src/three/` - 3D viewer components
- `frontend/src/components/` - UI components
- Theme app extension (new directory to be created)

**Dependencies:**

- ✅ Shopify integration (already complete)
- ✅ Product API (already complete)
- ✅ Job status polling API (already complete)

**You can start immediately!**

### Stream 2: 3D Generation Pipeline (Collaborator)

**Branch:** `feature/3d-generation`

**Files they'll work on:**

- `worker/app/worker.py` - Celery task implementation
- `worker/app/tripo/` - TripoSR integration
- `worker/app/utils/` - Helper utilities

**Dependencies:**

- ✅ Redis queue (already set up)
- ✅ Job creation API (already complete)
- ✅ Database schema (already complete)
- ✅ Supabase storage (ready to use)

**They can start immediately!**

## Integration Contract

The two work streams are connected by a clear API contract:

### Job Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User clicks "Enable 3D"                                 │
│  2. POST /api/models/create                                 │
│     { productId, variantId }                                │
│                                                              │
│  3. Poll GET /api/models/status/:jobId                      │
│     Response: { status: "pending" | "processing" |          │
│                 "completed" | "failed" }                    │
│                                                              │
│  4. When status = "completed":                              │
│     GET /api/models/result/:jobId                           │
│     Response: { modelUrl: "https://..." }                   │
│                                                              │
│  5. Load modelUrl in React Three Fiber viewer               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
                     (Backend Bridge)
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                                            Worker           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Pick up job from Redis queue                            │
│  2. Update status to "processing"                           │
│  3. Download images from job.image_urls                     │
│  4. Run TripoSR pipeline                                    │
│  5. Upload .glb to Supabase storage                         │
│  6. Update status to "completed" with modelUrl              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints (Already Built)

**For Frontend (You):**

- `POST /api/models/create` - Create generation job
- `GET /api/models/status/:jobId` - Check job status
- `GET /api/models/result/:jobId` - Get model URL when complete
- `GET /api/models/product/:productId` - Get all jobs for a product

**For Worker (Collaborator):**

- `POST /api/models/webhook/update` - Update job status
  ```json
  {
    "jobId": "uuid",
    "status": "processing" | "completed" | "failed",
    "modelUrl": "https://...",  // Optional
    "errorMessage": "error",    // Optional
    "metadata": {}              // Optional
  }
  ```

## Testing Without Each Other

### You (Frontend) - Testing Without Real Worker

Use mock data:

```typescript
// frontend/src/mocks/mockModelGeneration.ts
export async function mockEnableModel(productId: string) {
  const jobId = "mock-job-" + Date.now();

  // Simulate job creation
  setTimeout(() => {
    // Mock completed job
    const mockModelUrl = "https://example.com/sample-model.glb";
    // Use this URL to test your 3D viewer
  }, 3000);

  return jobId;
}
```

Download sample .glb files for testing:

- [Sample GLB Models](https://github.com/KhronosGroup/glTF-Sample-Models)

### Collaborator (Worker) - Testing Without Real Frontend

Use the Python test script:

```python
# worker/test_job.py
import redis
import json
import uuid

def create_test_job():
    r = redis.Redis(host='localhost', port=6379)

    job_id = str(uuid.uuid4())
    test_job = {
        "task": "generate_3d_model",
        "id": job_id,
        "args": [],
        "kwargs": {
            "job_id": job_id,
            "shop": "test-shop.myshopify.com",
            "product_id": "gid://shopify/Product/123",
            "product_handle": "test-product",
            "image_urls": [
                "https://cdn.shopify.com/s/files/.../sample.jpg"
            ],
            "metadata": {
                "productTitle": "Test Product"
            }
        }
    }

    r.lpush("celery", json.dumps(test_job))
    print(f"Created test job: {job_id}")

if __name__ == "__main__":
    create_test_job()
```

## Merge Strategy

### When Both Features Are Ready

1. **Collaborator merges first:**

   ```bash
   git checkout main
   git pull origin main
   git merge feature/3d-generation
   git push origin main
   ```

2. **You merge second:**

   ```bash
   git checkout main
   git pull origin main  # Gets worker code
   git merge feature/3d-viewer
   git push origin main
   ```

3. **Integration test:**
   - Start all services (Redis, Backend, Worker, Frontend)
   - Click "Enable 3D" in frontend
   - Worker should process job
   - 3D viewer should display model

## Communication Points

**Only these scenarios require coordination:**

1. **If job payload structure needs to change**

   - Example: Need to add more metadata
   - Solution: Update both `backend/src/services/job-service.ts` and `worker/app/worker.py`

2. **If database schema needs modification**

   - Example: Add new column to `generation_jobs`
   - Solution: Update SQL migration and both backend/worker code

3. **If Supabase storage structure changes**
   - Example: Different folder structure
   - Solution: Agree on path format

## Current Status

✅ **Everything needed for parallel work is ready:**

| Component            | Status      | Owner            |
| -------------------- | ----------- | ---------------- |
| Shopify OAuth        | ✅ Complete | Backend          |
| Product API          | ✅ Complete | Backend          |
| Job Queue (Redis)    | ✅ Complete | Backend          |
| Job Creation API     | ✅ Complete | Backend          |
| Job Status API       | ✅ Complete | Backend          |
| Database Schema      | ✅ Complete | Backend          |
| Worker Structure     | ✅ Complete | Backend          |
| **3D Viewer**        | ⏳ To Build | **YOU**          |
| **Theme Extension**  | ⏳ To Build | **YOU**          |
| **TripoSR Pipeline** | ⏳ To Build | **COLLABORATOR** |
| **Image Processing** | ⏳ To Build | **COLLABORATOR** |

## Quick Start Commands

### For You (Frontend Dev)

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Redis (for job simulation)
redis-server
```

### For Collaborator (Worker Dev)

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Celery Worker
cd worker
pip install -r requirements.txt
celery -A app.worker worker --loglevel=info

# Terminal 3: Worker API (optional, for health checks)
cd worker
uvicorn app.main:app --reload --port 8000
```

## Questions?

If either of you needs changes to the integration layer (job structure, APIs, database), create a GitHub issue and tag both developers. Otherwise, you're fully independent!

Happy parallel coding! 🚀
