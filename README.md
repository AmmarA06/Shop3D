# 3D Store Visualizer

A Shopify app that generates 3D models from product photos and provides interactive 3D product visualization for customers.

## Overview

This app enables Shopify merchants to:

- Auto-generate 3D models from product images using AI
- Display interactive 3D viewers on product pages
- Allow customers to rotate, zoom, and inspect products in 3D
- Support product variants with different models

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

## License

MIT
