# Setup Guide - 3D Store Visualizer

This guide walks you through setting up the 3D Store Visualizer Shopify app for local development.

## Prerequisites

- Node.js 20+
- Python 3.11+
- Redis
- Shopify Partner account
- Supabase account

## 1. Shopify Partner Setup

### Create a Shopify App

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Click **Apps** → **Create app**
3. Choose **Custom app** or **Public app**
4. Fill in app details:
   - **App name**: 3D Store Visualizer
   - **App URL**: `https://your-ngrok-url.ngrok.io` (or your tunnel URL)
   - **Allowed redirection URL(s)**: `https://your-ngrok-url.ngrok.io/api/auth/callback`

5. Under **API access scopes**, select:
   - `read_products`
   - `write_products`
   - `read_product_listings`

6. Save your **API key** and **API secret**

### Set up Development Store

1. In Partners Dashboard, create a development store
2. Install your app on the development store

## 2. Supabase Setup

### Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Save your **Project URL** and **Service Role Key** (Settings → API)

### Create Database Tables

1. Go to **SQL Editor** in Supabase
2. Copy and paste the contents of `docs/supabase-schema.sql`
3. Run the SQL script

### Create Storage Bucket

1. Go to **Storage** in Supabase
2. Create a new bucket named `3d-models`
3. Set bucket to **Public**
4. Add upload policy:
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = '3d-models');
   ```

## 3. Environment Configuration

### Backend (.env)

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000

# Shopify
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_product_listings
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET_NAME=3d-models

# Redis
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)

Create `frontend/.env`:

```env
VITE_SHOPIFY_API_KEY=your_shopify_api_key
VITE_API_URL=http://localhost:5000
```

### Worker (.env)

Create `worker/.env`:

```env
REDIS_URL=redis://localhost:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET_NAME=3d-models
```

## 4. Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

### Worker

```bash
cd worker
pip install -r requirements.txt
```

## 5. Start Development Servers

### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Worker API: http://localhost:8000
- Redis: localhost:6379

### Option B: Manual Setup

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

**Terminal 4 - Worker API:**
```bash
cd worker
uvicorn app.main:app --reload --port 8000
```

**Terminal 5 - Celery Worker:**
```bash
cd worker
celery -A app.worker worker --loglevel=info
```

## 6. Expose Local Server (for Shopify)

Shopify needs to access your local server via HTTPS. Use ngrok or similar:

```bash
ngrok http 5000
```

Update your `.env` files with the ngrok URL:
- `SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io`

Also update the **App URL** and **Allowed redirection URLs** in Shopify Partner Dashboard.

## 7. Test the Integration

1. Go to your development store admin
2. Navigate to **Apps** → **3D Store Visualizer**
3. You should see the app embedded in Shopify admin
4. Go to the **Products** page to see your products listed

## 8. Next Steps

Now that Shopify integration is complete, you can:

1. **Build the 3D viewer** (React Three Fiber component)
2. **Create the Theme App Extension** (for storefront integration)
3. **Implement the 3D generation pipeline** (TripoSR integration)

## Troubleshooting

### OAuth Issues
- Ensure ngrok URL matches in `.env` and Shopify Partner Dashboard
- Check that redirect URL includes `/api/auth/callback`
- Clear browser cookies and try again

### Database Connection Errors
- Verify Supabase credentials in `.env`
- Check that SQL schema was run successfully
- Ensure RLS policies allow service role access

### Product Fetching Fails
- Verify API scopes in Shopify Partner Dashboard
- Check that session is stored correctly in database
- Look at backend logs for GraphQL errors

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check REDIS_URL in all `.env` files
- Restart Redis if needed

## Additional Resources

- [Shopify App Development Docs](https://shopify.dev/docs/apps)
- [Supabase Documentation](https://supabase.com/docs)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
