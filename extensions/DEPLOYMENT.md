# Theme App Extension - Deployment Guide

This guide explains how to deploy and test the 3D Product Viewer Theme App Extension.

## Prerequisites

- Shopify CLI installed
- Shopify Partner account
- Development store
- Your app created in Partners dashboard

## Project Structure

```
extensions/
└── product-3d-viewer/
    ├── shopify.extension.toml        # Extension configuration
    ├── blocks/
    │   └── product-3d-viewer.liquid  # Liquid block template
    ├── assets/
    │   ├── product-3d-viewer.js      # JavaScript viewer
    │   └── product-3d-viewer.css     # Styling
    ├── locales/
    │   └── en.default.json           # Translations
    └── README.md                     # Extension documentation
```

## Step 1: Configure shopify.app.toml

Make sure you have a `shopify.app.toml` file in the project root:

```toml
# Learn more: https://shopify.dev/docs/apps/tools/cli/configuration

name = "3d-store-visualizer"
client_id = "YOUR_CLIENT_ID"
application_url = "https://YOUR_NGROK_URL"
embedded = true

[access_scopes]
# Add your required scopes
scopes = "write_products,read_products"

[auth]
redirect_urls = [
  "https://YOUR_NGROK_URL/api/auth/callback"
]

[webhooks]
api_version = "2024-10"

[pos]
embedded = false

[build]
automatically_update_urls_on_dev = true
dev_store_url = "YOUR_DEV_STORE.myshopify.com"
```

## Step 2: Deploy the Extension

### Development Mode

1. Start the development server:
   ```bash
   npm run dev
   # or
   shopify app dev
   ```

2. The extension will be automatically deployed to your development store

3. Install the app on your dev store if not already installed

### Production Deployment

1. Build and push the extension:
   ```bash
   shopify app deploy
   ```

2. Follow the prompts to create a new version

3. Submit for review in Partners dashboard (if going to App Store)

## Step 3: Add the Block to Theme

1. Go to your development store admin

2. Navigate to **Online Store > Themes**

3. Click **Customize** on your theme

4. Navigate to a product page template

5. Click **Add block**

6. Under **Apps**, find **3D Product Viewer**

7. Add the block to your product page (usually below the product images)

8. Configure the settings:
   - Header text
   - Viewer height
   - Auto-rotate
   - Grid visibility
   - Instructions

9. Click **Save**

## Step 4: Testing

### Prerequisites for Testing

1. **Backend API must be running**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Product must have a 3D model**:
   - Use the admin app to generate a 3D model for a test product
   - Or manually insert a test record in the database

3. **Test product data**:
   ```sql
   -- Example: Insert a test model record
   INSERT INTO product_models (shop, product_id, variant_id, model_url, status)
   VALUES (
     'your-store.myshopify.com',
     'gid://shopify/Product/1234567890',
     NULL,
     'https://your-supabase-bucket.com/models/test.glb',
     'completed'
   );
   ```

### Testing Checklist

- [ ] 3D viewer loads on product page
- [ ] Model displays correctly
- [ ] Camera controls work (rotate, pan, zoom)
- [ ] Auto-rotate toggle works
- [ ] Fullscreen toggle works
- [ ] Reset camera works
- [ ] Variant switching works (if product has variants)
- [ ] Loading state shows while model loads
- [ ] Error state shows if model not found
- [ ] Mobile responsive (test on mobile devices)
- [ ] Works with different themes

### Troubleshooting

**Viewer shows error "3D model not available"**:
- Check that backend API is running
- Verify product has a completed model in database
- Check browser console for API errors
- Verify API endpoint is accessible

**Viewer doesn't load at all**:
- Check that Three.js CDN is loading
- Check browser console for JavaScript errors
- Verify extension assets are being loaded
- Clear browser cache

**Variant switching doesn't work**:
- Check that product has multiple variants
- Verify each variant has its own model
- Check browser console for errors
- Test variant selector on the page

**Model appears incorrectly positioned**:
- Check GLB file is valid
- Verify model has correct bounding box
- Test with different models
- Check that grid is enabled

## Step 5: Monitoring

### Frontend Logging

The viewer logs useful information to the browser console:

- Model loading progress
- API requests and responses
- Error messages
- Variant changes

### Backend Logging

Monitor your backend logs for:

```bash
# Watch backend logs
npm run dev
```

Look for:
- API requests to `/api/models/storefront/:productId`
- Database queries
- Model URL resolution

### Performance Monitoring

- **Model load time**: Check Network tab in browser DevTools
- **File size**: Models should be < 5MB
- **Render performance**: Monitor FPS in Chrome DevTools

## Step 6: Optimization

### Model Optimization

- Keep GLB files under 5MB
- Use texture compression
- Reduce polygon count if needed
- Enable Draco compression

### Caching

The browser will cache:
- Three.js library
- GLB model files
- Extension assets

You can verify caching in Network tab (status 304).

### CDN Configuration

For production, consider hosting Three.js on your own CDN:

1. Download Three.js library
2. Host on your own server or CDN
3. Update Liquid template to use your URL

## API Endpoints Used

The extension relies on this backend endpoint:

```
GET /api/models/storefront/:productId?variantId=X&shop=Y
```

**Response format**:
```json
{
  "modelUrl": "https://supabase.com/storage/v1/object/public/models/product-123.glb",
  "productId": "gid://shopify/Product/1234567890",
  "variantId": "gid://shopify/ProductVariant/9876543210",
  "completedAt": "2024-01-15T10:30:00Z"
}
```

## Next Steps

After successful deployment:

1. **Polish the UX**: Refine loading states and transitions
2. **Add analytics**: Track viewer usage
3. **A/B testing**: Test different viewer configurations
4. **Documentation**: Create merchant-facing documentation
5. **Support**: Set up support channels for merchants

## Resources

- [Shopify Theme App Extensions Docs](https://shopify.dev/docs/api/app-extensions/theme)
- [Three.js Documentation](https://threejs.org/docs/)
- [GLTF Model Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
