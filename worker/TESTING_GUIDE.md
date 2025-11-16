# Testing Guide for 3D Model Generation Worker

This guide will walk you through testing the 3D model generation pipeline step by step.

## Prerequisites

Before testing, ensure you have:

1. **Python 3.9+** installed
2. **Redis** installed and running
3. **Dependencies** installed: `pip install -r requirements.txt`
4. **Environment variables** configured (see below)

## Step 1: Environment Setup

### Create `.env` file

Create a `.env` file in the `worker/` directory:

```bash
cd worker
touch .env
```

Add the following content:

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

**Note:** Replace the Supabase values with your actual credentials.

### Install Dependencies

```bash
cd worker
pip install -r requirements.txt
```

## Step 2: Start Redis

### macOS (with Homebrew)
```bash
brew services start redis

# Or run in foreground
redis-server
```

### Linux
```bash
sudo systemctl start redis

# Or run in foreground
redis-server
```

### Docker
```bash
docker run -d --name redis-test -p 6379:6379 redis:7-alpine
```

### Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

## Step 3: Start the Celery Worker

Open a **new terminal** and start the worker:

```bash
cd worker
celery -A app.worker worker --loglevel=info
```

You should see output like:

```
 -------------- celery@hostname v5.3.4
---- **** ----- 
--- * ***  * -- 
-- * - **** --- 
- ** ---------- [config]
- ** ---------- .> app:         3d_worker:0x...
- ** ---------- .> transport:   redis://localhost:6379/0
- ** ---------- .> results:     redis://localhost:6379/0
*** --- * ---
*** -- * ----
** -  --------
*    --------
[tasks]
  . generate_3d_model
  . health_check

[2024-01-01 12:00:00,000: INFO/MainProcess] Connected to redis://localhost:6379/0
[2024-01-01 12:00:00,000: INFO/MainProcess] celery@hostname ready.
```

**Keep this terminal open** - this is your worker process.

## Step 4: Run the Test Script

In a **different terminal**, run the test script:

```bash
cd worker
python test_worker.py
```

### Test Script Flow

The script will:

1. ✅ Check if Redis is accessible
2. ✅ Verify environment variables are set
3. 📤 Queue a test job to Redis
4. 👀 Monitor the job status in real-time

### Expected Output

```
============================================================
3D Model Generation Worker - Test Script
============================================================
🔍 Checking Redis connection: redis://localhost:6379/0
✅ Redis is accessible

🔍 Checking environment variables...
   ✅ REDIS_URL: redis://localhost:6379/0
   ✅ SUPABASE_URL: https://your-project...
   ✅ SUPABASE_SERVICE_ROLE_KEY: **********
   ✅ BACKEND_URL: http://localhost:5000

✅ All required environment variables are set

============================================================

🚀 Ready to queue a test job? (y/n): y
📸 Use real product image? (y/n, default=n): y

📤 Queueing test job...
   Using real product image from Unsplash
   ✅ Job queued!
   Job ID: 123e4567-e89b-12d3-a456-426614174000
   Celery Task ID: 987f6543-e21b-34d5-a678-426614174111

============================================================
⚠️  IMPORTANT: Make sure your worker is running!
   Run in another terminal: celery -A app.worker worker --loglevel=info
============================================================

📊 Monitor job status? (y/n): y

👀 Monitoring job status (timeout: 300s)...
   Check your worker logs in another terminal for detailed progress
   Press Ctrl+C to stop monitoring

   [0.1s] Status: STARTED
   [2.3s] Status: PROCESSING
   [45.7s] Status: SUCCESS

🎉 Job completed successfully!
   Result: {
     "job_id": "123e4567-e89b-12d3-a456-426614174000",
     "status": "completed",
     "model_url": "https://your-project.supabase.co/storage/v1/object/public/3d-models/...",
     "metadata": {...}
   }

✅ Test script completed
```

## Step 5: Check Worker Logs

In your **worker terminal**, you should see detailed logs:

```
[2024-01-01 12:01:00,000: INFO/MainProcess] Task generate_3d_model[...] received
[2024-01-01 12:01:00,100: INFO/ForkPoolWorker-1] 🚀 Starting job 123e4567... for product gid://shopify/Product/123456789
[2024-01-01 12:01:00,100: INFO/ForkPoolWorker-1]    Shop: test-shop.myshopify.com
[2024-01-01 12:01:00,100: INFO/ForkPoolWorker-1]    Images: 1
[2024-01-01 12:01:00,100: INFO/ForkPoolWorker-1]    Quality: fast
[2024-01-01 12:01:00,200: INFO/ForkPoolWorker-1] 📁 Working directory: /tmp/3d_gen_123e4567...
[2024-01-01 12:01:00,300: INFO/ForkPoolWorker-1] 📸 Step 1: Preprocessing images...
[2024-01-01 12:01:02,500: INFO/ForkPoolWorker-1] Downloading image from: https://images.unsplash.com/...
[2024-01-01 12:01:05,800: INFO/ForkPoolWorker-1] ✅ Image downloaded
[2024-01-01 12:01:06,000: INFO/ForkPoolWorker-1] Removing background...
[2024-01-01 12:01:15,200: INFO/ForkPoolWorker-1] ✅ Background removed
[2024-01-01 12:01:15,500: INFO/ForkPoolWorker-1] Centering and cropping image...
[2024-01-01 12:01:15,800: INFO/ForkPoolWorker-1] ✅ Image centered and cropped to 512x512
[2024-01-01 12:01:16,000: INFO/ForkPoolWorker-1] ✅ Image preprocessing complete
[2024-01-01 12:01:16,100: INFO/ForkPoolWorker-1] ✅ Preprocessed 1 images
[2024-01-01 12:01:16,200: INFO/ForkPoolWorker-1] 🎨 Step 2: Generating 3D model...
[2024-01-01 12:01:16,300: INFO/ForkPoolWorker-1] Loading TripoSR model...
[2024-01-01 12:01:20,500: INFO/ForkPoolWorker-1] Using device: cuda
[2024-01-01 12:01:25,800: INFO/ForkPoolWorker-1] ⚠️  TripoSR model not yet implemented - using placeholder
[2024-01-01 12:01:25,900: INFO/ForkPoolWorker-1] ✅ Model loaded successfully
[2024-01-01 12:01:26,000: INFO/ForkPoolWorker-1] Starting 3D generation from: /tmp/.../preprocessed_0.png
[2024-01-01 12:01:26,100: INFO/ForkPoolWorker-1] Quality preset: fast
[2024-01-01 12:01:30,500: INFO/ForkPoolWorker-1] Generating 3D mesh (resolution: 128)...
[2024-01-01 12:01:35,200: INFO/ForkPoolWorker-1] ⚠️  Using placeholder cube mesh - TripoSR not yet implemented
[2024-01-01 12:01:35,500: INFO/ForkPoolWorker-1] ✅ Mesh exported as GLB
[2024-01-01 12:01:35,600: INFO/ForkPoolWorker-1] ✅ 3D model generated
[2024-01-01 12:01:35,700: INFO/ForkPoolWorker-1] ☁️  Step 3: Uploading to Supabase...
[2024-01-01 12:01:36,000: INFO/ForkPoolWorker-1] Uploading model to Supabase: test-shop.myshopify.com/123456789.glb
[2024-01-01 12:01:42,300: INFO/ForkPoolWorker-1] ✅ Model uploaded successfully
[2024-01-01 12:01:42,400: INFO/ForkPoolWorker-1] ✅ Step 4: Finalizing...
[2024-01-01 12:01:42,800: INFO/ForkPoolWorker-1] ✅ Updated job 123e4567... to status: completed
[2024-01-01 12:01:42,900: INFO/ForkPoolWorker-1] 🎉 Job 123e4567... completed successfully!
[2024-01-01 12:01:43,000: INFO/ForkPoolWorker-1] 🧹 Cleaned up temp directory
[2024-01-01 12:01:43,100: INFO/MainProcess] Task generate_3d_model[...] succeeded in 42.8s
```

## Step 6: Manual Testing (Advanced)

### Using Python REPL

```python
import redis
import json
import uuid

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0)

# Create a test job
job_id = str(uuid.uuid4())
test_job = {
    "task": "generate_3d_model",
    "id": str(uuid.uuid4()),
    "args": [],
    "kwargs": {
        "job_id": job_id,
        "shop": "test-shop.myshopify.com",
        "product_id": "gid://shopify/Product/123",
        "product_handle": "test-mug",
        "image_urls": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"],
        "metadata": {"productTitle": "Coffee Mug"},
        "quality": "balanced"
    }
}

# Queue the job
r.lpush("celery", json.dumps(test_job))
print(f"✅ Job queued! Job ID: {job_id}")
```

### Using Redis CLI

```bash
# Check queue length
redis-cli LLEN celery

# Inspect job results
redis-cli KEYS "celery-task-meta-*"
redis-cli GET "celery-task-meta-<task-id>"
```

## Step 7: Testing with Backend Integration

If your backend is running, you can test the full integration:

1. **Start Backend** (in another terminal):
```bash
cd backend
npm run dev
```

2. **Create a job via API**:
```bash
curl -X POST http://localhost:5000/api/models/create \
  -H "Content-Type: application/json" \
  -d '{
    "shop": "test-shop.myshopify.com",
    "productId": "gid://shopify/Product/123",
    "productHandle": "test-product",
    "imageUrls": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"],
    "quality": "balanced"
  }'
```

3. **Monitor job status**:
```bash
curl http://localhost:5000/api/models/status/<job-id>
```

## Troubleshooting

### Redis Connection Error

**Error:** `redis.exceptions.ConnectionError: Error connecting to Redis`

**Solution:**
- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL in .env
- Check firewall settings

### Module Not Found Error

**Error:** `ModuleNotFoundError: No module named 'rembg'`

**Solution:**
```bash
pip install -r requirements.txt
```

### Supabase Upload Error

**Error:** `Supabase upload failed: 401 Unauthorized`

**Solution:**
- Verify SUPABASE_SERVICE_ROLE_KEY (not anon key!)
- Check bucket exists: Log into Supabase → Storage → Create bucket "3d-models"
- Make bucket public if needed

### Background Removal is Slow

**Note:** First run downloads the rembg model (~176MB). Subsequent runs are faster.

**To speed up:**
- Use GPU: Set `CUDA_VISIBLE_DEVICES=0`
- Pre-download model:
```python
from rembg import remove
from PIL import Image
# First run downloads model
remove(Image.new('RGB', (100, 100)))
```

### TripoSR Not Working

**Note:** The current implementation uses a placeholder cube mesh.

**To use real TripoSR:**

1. Install TripoSR:
```bash
pip install git+https://github.com/VAST-AI-Research/TripoSR.git
```

2. Update `app/tripo/generator.py`:
   - Uncomment the TripoSR import and model loading code
   - Remove the placeholder mesh function

## Performance Benchmarks

On a typical system:

| Step | Duration | Notes |
|------|----------|-------|
| Image Download | 1-3s | Depends on network |
| Background Removal | 5-15s | First run slower (model download) |
| Image Preprocessing | 1-2s | - |
| 3D Generation (fast) | 10-20s | Placeholder: instant |
| 3D Generation (balanced) | 30-60s | With real TripoSR |
| 3D Generation (quality) | 1-2min | With real TripoSR |
| Upload to Supabase | 2-5s | Depends on file size |
| **Total (fast)** | **20-50s** | - |
| **Total (balanced)** | **40-90s** | - |
| **Total (quality)** | **80-150s** | - |

## Next Steps

After successful testing:

1. **Deploy to Production**
   - Use Docker: `docker-compose up -d worker`
   - Scale workers: Run multiple instances
   - Monitor with Flower: `celery -A app.worker flower`

2. **Integrate Real TripoSR**
   - Install TripoSR library
   - Update generator.py
   - Test with real models

3. **Optimize Performance**
   - Enable GPU acceleration
   - Tune quality presets
   - Add result caching

4. **Add Monitoring**
   - Set up Flower dashboard
   - Add error alerting
   - Track metrics (job duration, success rate)

## Support

If you encounter issues:

1. Check worker logs for detailed errors
2. Verify all environment variables are set
3. Test each component individually
4. Review the WORKER_INTEGRATION_GUIDE.md

Happy testing! 🚀

