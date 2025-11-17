# 3D Store Visualizer

A Shopify app that generates 3D models from product photos and provides interactive 3D product visualization for customers.

## Overview

We aim to take one step closer to making ecommerce more "real". Seeing your products in 3D instead of as flat PNGs provides a more immersive shopping experience beyond traditional online stores.

This app enables Shopify merchants to:

- Auto-generate 3D models from product images using AI
- Display interactive 3D viewers on product pages
- Allow customers to rotate, zoom, and inspect products in 3D
- Support product variants with different models


![Untitled design (2)](https://github.com/user-attachments/assets/7ebd9dd5-eaf2-40ab-822b-52aeae48d28e)



# GPU Requirement Note

It is important to understand that TripoSR requires significant computational power. It is recommended that you use a >3000 series NVIDIA GPU with >12GB of VRAM if running the entire system in real time.

Here is an example of what happens when you use a GPU with less than optimal VRAM and older architecture (My old GTX 1080):

![image](https://github.com/user-attachments/assets/e5b82ba1-8783-4d36-b647-d51554d3d585)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Worker    │
│  (React)    │     │  (Node.js)  │     │  (Python)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────────────────────┐
                    │   Supabase (DB + Storage)   │
                    └─────────────────────────────┘
```

<img width="1715" height="308" alt="image" src="https://github.com/user-attachments/assets/d274375d-279d-4873-b598-cab5a4dcd707" />




### Services

1. **Frontend** - React + TypeScript + Shopify Polaris + Three.js
2. **Backend** - Node.js + Express + Shopify API
3. **Worker** - Python + Celery + TripoSR
4. **Rails Webhooks** - Ruby on Rails + HMAC verification (optional)
5. **Theme Extension** - Vanilla JS + Three.js for storefront

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Shopify Polaris, React Three Fiber
- **Backend**: Node.js, TypeScript, Express, Shopify API
- **Worker**: Python, FastAPI, Celery, TripoSR, PyTorch
- **Webhooks**: Ruby on Rails (minimal API-only)
- **Storage**: Supabase (PostgreSQL + Object Storage)
- **Queue**: Redis

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Ruby 3.2+ (optional)
- Redis
- Shopify Partner account
- Supabase account

### Setup

See [SETUP.md](./SETUP.md) for detailed configuration instructions.

### Running the System

#### 1. Start Redis
```bash
redis-server
```

#### 2. Start Backend (Node.js)
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

#### 3. Start Frontend (React)
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

#### 4. Start Worker (Python)
```bash
cd worker
pip install -r requirements.txt
celery -A app.worker worker --loglevel=info
```

#### 5. Start Rails Webhooks (Optional)
```bash
cd rails-webhooks
bundle install
bundle exec rails server -p 4000
# Runs on http://localhost:4000
```

#### 6. Deploy Theme Extension
```bash
shopify app dev
# Or for production:
shopify app deploy
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/health
- **Rails Webhooks**: http://localhost:4000/health
- **Shopify Admin**: Your dev store → Apps → 3D Store Visualizer
- **Storefront**: Your dev store product pages (with extension)

### Docker (Alternative)

```bash
docker-compose up
```

## License

MIT
