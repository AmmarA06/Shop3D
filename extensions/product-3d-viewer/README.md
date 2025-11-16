# 3D Product Viewer - Theme App Extension

Interactive 3D model viewer for Shopify product pages.

## Features

- Interactive 3D model viewer using Three.js
- Auto-rotate, fullscreen, camera controls
- Variant switching support
- Customizable merchant settings
- Mobile responsive
- Loading and error states

## File Structure

```
extensions/product-3d-viewer/
├── shopify.extension.toml          # Extension configuration
├── blocks/
│   └── product-3d-viewer.liquid    # Liquid template
├── assets/
│   ├── product-3d-viewer.js        # JavaScript viewer
│   └── product-3d-viewer.css       # Styling
└── locales/
    └── en.default.json             # Translations
```

## API Endpoint

The extension fetches models from:

```
GET /api/models/storefront/:productId?variantId=:variantId&shop=:shop
```

Response format:
```json
{
  "modelUrl": "https://supabase-bucket.com/models/product.glb"
}
```

## Dependencies

- Three.js (r152) - Loaded from CDN
- GLTFLoader - Loaded dynamically
- OrbitControls - Loaded dynamically

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Safari, Edge).
