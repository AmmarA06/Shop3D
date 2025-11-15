# 3D Model Shopify App — Architecture & Project Structure

This document defines the full system architecture, responsibilities, and folder layout for the Shopify 3D product visualization app.

---

## 🎯 Product Vision

### Customer Experience

Customers browsing a Shopify store can interact with products in 3D:

1. Click "View in 3D" button on product pages (Theme App Extension)
2. Interactive 3D viewer opens showing the product model
3. Rotate, zoom, and inspect the product from all angles
4. See accurate product dimensions
5. Switch between product variants (colors, designs) and see the model update in real-time

### Merchant Experience

Merchants using the Shopify admin app can:

1. Select products to enable 3D viewing
2. App automatically generates 3D models (.glb) from existing product photos using AI
3. Models are generated in the background and cached for instant customer access
4. Models auto-regenerate when product images are updated via webhooks
5. Configure 3D viewer settings and variant mappings

### Generation Strategy

- **When**: Models generated during merchant setup, NOT on customer demand
- **Trigger**: Merchant enables 3D for a product → background job → model cached
- **Variants**:
  - Separate .glb files for different geometries (e.g., mug vs travel mug)
  - Texture/material swapping for same geometry (e.g., color variants)
- **Updates**: Webhooks auto-regenerate models when merchants update product images

---

## ⚙️ High-Level Architecture

### 1. Frontend (React + TypeScript)

- Built with **React** + **TypeScript**.
- Uses **React Three Fiber (R3F)** + **drei** for rendering 3D models.
- Uses **Shopify Polaris** for a native Shopify app feel.
- Communicates with backend via REST + WebSockets (for job status).

### 2. Main Backend API (Node.js + TypeScript)

Responsibilities:

- Handles merchant authentication (OAuth) with Shopify.
- Exposes REST endpoints:
  - `/api/products` → fetch product data via Storefront/Admin GraphQL
  - `/api/models/create` → initiate 3D model generation job
  - `/api/models/status/:id`
  - `/api/models/result/:id`
- Stores job metadata in MySQL/Supabase.
- Publishes generation jobs to Redis queue.

### 3. Background Job Worker (Python + FastAPI + Celery)

Responsibilities:

- Runs GPU pipeline for generating 3D models.
- Steps performed:
  1. Download product images from Shopify Storefront API.
  2. Normalize/crop/background-remove images.
  3. Generate camera poses using simple heuristics.
  4. Run **TripoSR** (single-view → 3D mesh).
  5. Convert mesh to `.glb` using `trimesh` or Blender headless.
  6. Upload generated model to object storage (Supabase bucket).
  7. Update job status → Redis → Node.js backend.

Notes:

- No multiple model pipelines.
- No ambiguous choices.
- Stable, deterministic behavior for AI agents.

### 4. Rails Microservice (Ruby on Rails)

Golden Rule: **Rails must never become a dependency for the core system.**

Minimal responsibilities:

- Receives Shopify webhooks (product update, product delete).
- Normalizes webhook payload and forwards clean messages → Redis.
- Strictly isolated from 3D generation pipeline.

This allows the project to “use Rails” but keeps it safe and small.

### 5. Storage

- **Supabase** or **S3** bucket for generated `.glb` files.
- **MySQL / Supabase Postgres** for job metadata.

### 6. Shopify Integration

- **Admin App**: Embedded app in Shopify Admin for merchant configuration
- **Theme App Extension**: `<Product3DViewer>` block for storefront product pages
- Uses:
  - **Admin GraphQL API** → merchant product metadata, variant data
  - **Storefront GraphQL API** → product images for generation
  - **App Bridge + Polaris** for UI
  - **Webhooks** → product update/delete triggers regeneration

---

## 📦 Project Structure

```

root/
│
├── frontend/ # React + TypeScript + Polaris + R3F
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── three/
│ │ └── hooks/
│ └── package.json
│
├── backend/ # Node.js API
│ ├── src/
│ │ ├── index.ts
│ │ ├── routes/
│ │ ├── services/
│ │ ├── shopify/
│ │ ├── models/
│ │ └── queue/
│ └── package.json
│
├── worker/ # FastAPI + Python + Celery
│ ├── app/
│ │ ├── main.py # FastAPI entry
│ │ ├── worker.py # Celery tasks
│ │ ├── tripo/ # 3D generation logic
│ │ └── utils/
│ └── requirements.txt
│
├── rails-webhooks/ # Rails minimal microservice
│ ├── app/
│ ├── config/
│ └── Gemfile
│
├── infra/
│ ├── docker/ # Dockerfiles for each service
│ ├── k8s/ # (optional)
│ └── redis/
│
├── docs/
│ └── CLAUDE.md # This file
│
└── README.md

```

---

## ✔️ Summary

- **TripoSR** is the only 3D pipeline → stable, open-source, predictable.
- **Rails** is used _only_ for webhooks → safe.
- **Python** handles GPU workloads (correct tool for the job).
- **Node.js** remains the core backend connecting everything.
- **React Three Fiber** is the final viewer.

This architecture is deliberately structured for:

- clarity
- AI-assisted coding
- production reliability
- Shopify-friendly stack

---

## 🔮 Optional Future Features (Not Priority)

These features can be added later but are not part of the initial build:

1. **AR Viewer**: "View in Your Room" feature using WebXR/AR Quick Look
2. **Admin Preview**: 3D model preview directly in Shopify admin before publishing
3. **Advanced Variant Detection**: AI-based detection of which variants share geometry
4. **Custom Dimensions Input**: Allow merchants to manually input/override product dimensions
5. **Model Quality Settings**: Let merchants choose generation quality vs speed trade-offs
