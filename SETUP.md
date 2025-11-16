# Setup Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Redis
- Shopify Partner account
- Supabase account

## 1. Supabase Setup

### Create Project
1. Create a new project at [supabase.com](https://supabase.com)
2. Save your Project URL and Service Role Key (Settings → API)

### Database Schema
Run the SQL schema in Supabase SQL Editor:
```bash
# File location: docs/supabase-schema.sql
```

### Storage Bucket
1. Go to Storage in Supabase
2. Create a bucket named `3d-models`
3. Set bucket to Public
4. Add policy for authenticated uploads

## 2. Shopify App Setup

### Create App
1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a new app
3. Note your API Key and API Secret
4. Set App URL: `https://your-ngrok-url.ngrok.io`
5. Set Redirect URL: `https://your-ngrok-url.ngrok.io/api/auth/callback`
6. Set scopes: `read_products`, `write_products`

### Development Store
1. Create a development store in Partners Dashboard
2. Install your app on the dev store

## 3. Backend Setup

### Environment Variables
Create `backend/.env`:
```env
NODE_ENV=development
PORT=5000

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET_NAME=3d-models

# Redis
REDIS_URL=redis://localhost:6379
```

### Install & Run
```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

## 4. Frontend Setup

### Environment Variables
Create `frontend/.env`:
```env
VITE_SHOPIFY_API_KEY=your_api_key
VITE_API_URL=http://localhost:5000
```

### Install & Run
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## 5. Worker Setup (3D Generation)

### Environment Variables
Create `worker/.env`:
```env
# Redis
REDIS_URL=redis://localhost:6379/0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET_NAME=3d-models

# Backend
BACKEND_URL=http://localhost:5000

# Optional: GPU
# CUDA_VISIBLE_DEVICES=0
```

### Install Dependencies
```bash
cd worker
pip install -r requirements.txt
```

### Start Redis
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Verify
redis-cli ping  # Should return PONG
```

### Start Worker
```bash
cd worker
celery -A app.worker worker --loglevel=info
```

### Test Worker (Optional)
```bash
cd worker
python test_worker.py
```

## 6. Theme Extension Setup

### Configure Extension
Update `shopify.app.toml` in project root:
```toml
name = "3d-store-visualizer"
client_id = "YOUR_CLIENT_ID"
application_url = "https://YOUR_NGROK_URL"
dev_store_url = "your-store.myshopify.com"
```

### Deploy Extension
```bash
# Development mode
shopify app dev

# Production deployment
shopify app deploy
```

### Add to Theme
1. Go to Online Store → Themes → Customize
2. Navigate to a product page template
3. Click "Add block"
4. Under "Apps", find "3D Product Viewer"
5. Position and configure the block
6. Save

## 7. Expose Local Server

Use ngrok to expose your backend:
```bash
ngrok http 5000
```

Update all `.env` files and Shopify Partner Dashboard with the ngrok URL.

## Development Workflow

### Start All Services

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 4 - Worker:**
```bash
cd worker
celery -A app.worker worker --loglevel=info
```

**Terminal 5 - ngrok (for Shopify):**
```bash
ngrok http 5000
```

### Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Shopify Admin: Your dev store admin → Apps → 3D Store Visualizer
- Storefront: Your dev store product pages (with extension enabled)

## Docker Setup (Alternative)

```bash
docker-compose up
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Redis: localhost:6379

## Verification

### Backend
```bash
curl http://localhost:5000/health
# Should return: {"status":"healthy"}
```

### Redis
```bash
redis-cli ping
# Should return: PONG
```

### Worker
Check terminal logs for:
```
[tasks]
  . generate_3d_model
  . health_check
```

### Frontend
Visit http://localhost:3000 - should see the app homepage

## Troubleshooting

### OAuth Issues
- Verify ngrok URL matches in `.env` and Shopify Partner Dashboard
- Check redirect URL includes `/api/auth/callback`
- Clear browser cookies

### Database Connection
- Verify Supabase credentials
- Check SQL schema was executed
- Ensure service role key is used (not anon key)

### Redis Connection
- Ensure Redis is running: `redis-cli ping`
- Check `REDIS_URL` in all `.env` files
- Verify port 6379 is not blocked

### Worker Not Processing
- Check Celery logs for errors
- Verify Redis connection
- Ensure all environment variables are set
- Check Supabase bucket exists and is accessible

### Extension Not Loading
- Verify extension is deployed: `shopify app dev`
- Check app is installed on dev store
- Ensure backend API is accessible
- Check browser console for errors

## Production Deployment

### Backend
Deploy to hosting service (Heroku, Railway, etc.)

### Worker
- Use Docker: `docker-compose up -d worker`
- Scale workers as needed
- Enable GPU if available

### Frontend
Build and deploy:
```bash
cd frontend
npm run build
# Deploy dist/ folder to hosting service
```

### Extension
```bash
shopify app deploy
```
Then submit for review in Partners Dashboard.

## Additional Notes

### Model File Size
Keep GLB files under 5MB for optimal loading.

### Quality Presets
- `fast`: ~20s, 128 resolution
- `balanced`: ~60s, 256 resolution (default)
- `quality`: ~120s, 384 resolution

### GPU Acceleration
Set `CUDA_VISIBLE_DEVICES=0` in worker `.env` for GPU usage.

### Monitoring
- Backend: Console logs
- Worker: Celery logs
- Frontend: Browser DevTools console
- Optional: Use Flower for Celery monitoring: `celery -A app.worker flower`

