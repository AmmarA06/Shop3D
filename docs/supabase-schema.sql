-- Supabase Database Schema for 3D Store Visualizer
-- Run this in your Supabase SQL editor

-- Table: shopify_sessions
-- Stores Shopify OAuth session data
CREATE TABLE IF NOT EXISTS shopify_sessions (
  id TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  state TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  scope TEXT,
  expires TIMESTAMPTZ,
  access_token TEXT,
  user_id BIGINT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_email TEXT,
  account_owner BOOLEAN,
  locale TEXT,
  collaborator BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster shop lookups
CREATE INDEX IF NOT EXISTS idx_sessions_shop ON shopify_sessions(shop);

-- Table: generation_jobs
-- Tracks 3D model generation jobs
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_handle TEXT NOT NULL,
  variant_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  model_url TEXT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for job lookups
CREATE INDEX IF NOT EXISTS idx_jobs_shop ON generation_jobs(shop);
CREATE INDEX IF NOT EXISTS idx_jobs_product ON generation_jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON generation_jobs(status);

-- Table: product_models
-- Stores generated 3D model metadata
CREATE TABLE IF NOT EXISTS product_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_handle TEXT NOT NULL,
  variant_id TEXT,
  model_url TEXT NOT NULL,
  file_size BIGINT,
  file_format TEXT DEFAULT 'glb',
  generation_settings JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_models_shop ON product_models(shop);
CREATE INDEX IF NOT EXISTS idx_models_product ON product_models(product_id);
CREATE INDEX IF NOT EXISTS idx_models_variant ON product_models(variant_id);

-- Unique constraint: one model per product/variant combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_models_unique
  ON product_models(shop, product_id, COALESCE(variant_id, ''));

-- Table: shop_settings
-- Store shop-specific configuration
CREATE TABLE IF NOT EXISTS shop_settings (
  shop TEXT PRIMARY KEY,
  storefront_access_token TEXT,
  auto_generate BOOLEAN DEFAULT false,
  quality_preset TEXT DEFAULT 'balanced', -- fast, balanced, quality
  webhook_enabled BOOLEAN DEFAULT true,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage Bucket for 3D Models
-- Run this in Supabase Storage section:
-- 1. Create a bucket named '3d-models'
-- 2. Set it to public
-- 3. Add RLS policy for authenticated uploads

-- RLS Policies (optional, for security)
-- Enable RLS on tables
ALTER TABLE shopify_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Allow service role to access everything
-- (Your backend uses service role key)
CREATE POLICY "Service role can do everything on sessions"
  ON shopify_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on jobs"
  ON generation_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on models"
  ON product_models
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on settings"
  ON shop_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
