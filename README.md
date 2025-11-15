# 3D Store Visualizer

A Shopify app that automatically generates 3D models from product photos and provides interactive 3D product visualization for customers.

## Overview

This app enables Shopify merchants to:
- Auto-generate 3D models from existing product images using AI (TripoSR)
- Display interactive 3D viewers on product pages
- Allow customers to rotate, zoom, and inspect products in 3D
- Support product variants with color/design switching

## Architecture

The system consists of four main services:

1. **Frontend** (React + TypeScript + Three.js)
   - Shopify Polaris UI for merchant admin
   - React Three Fiber for 3D rendering
   - Theme App Extension for storefront integration

2. **Backend** (Node.js + TypeScript + Express)
   - Shopify OAuth and API integration
   - REST API for product and model management
   - Job queue management via Redis
   - WebSocket support for real-time updates

3. **Worker** (Python + FastAPI + Celery)
   - GPU-powered 3D model generation using TripoSR
   - Background job processing
   - Image preprocessing and model conversion

4. **Rails Webhooks** (Ruby on Rails - minimal)
   - Shopify webhook handling
   - Isolated microservice for webhook normalization

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Shopify Polaris, React Three Fiber, drei
- **Backend**: Node.js, TypeScript, Express, Shopify API, Redis, WebSockets
- **Worker**: Python, FastAPI, Celery, TripoSR, PyTorch, trimesh
- **Storage**: Supabase (PostgreSQL + Object Storage)
- **Queue**: Redis
- **Webhooks**: Ruby on Rails (minimal API-only setup)

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Ruby 3.2+ (optional, for webhooks)
- Redis
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd 3D-Store-Visualizer
```

2. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Install backend dependencies:
```bash
cd ../backend
npm install
```

5. Install worker dependencies:
```bash
cd ../worker
pip install -r requirements.txt
```

### Development

#### Using Docker Compose (Recommended)

```bash
docker-compose up
```

#### Manual Setup

1. Start Redis:
```bash
redis-server
```

2. Start Backend:
```bash
cd backend
npm run dev
```

3. Start Frontend:
```bash
cd frontend
npm run dev
```

4. Start Worker (FastAPI):
```bash
cd worker
uvicorn app.main:app --reload
```

5. Start Celery Worker:
```bash
cd worker
celery -A app.worker worker --loglevel=info
```

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and project structure documentation.

## Documentation

- [Architecture Guide](./CLAUDE.md)
- API Documentation: `/docs` (when backend is running)
- Worker API: `http://localhost:8000/docs` (FastAPI auto-docs)

## License

MIT
