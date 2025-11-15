# 3D Product Viewer - Theme App Extension

This is a Shopify Theme App Extension that allows customers to view products in interactive 3D on the storefront.

## Features

- Interactive 3D model viewer using Three.js
- Auto-rotate toggle
- Fullscreen mode
- Camera reset
- Variant switching support
- Customizable settings for merchants
- Mobile responsive
- Loading and error states

## Installation

1. **Deploy the extension** using Shopify CLI:
   ```bash
   shopify app extension push
   ```

2. **Enable in theme**:
   - Merchants go to their theme editor
   - Navigate to a product page template
   - Click "Add block"
   - Select "3D Product Viewer" from the app blocks section
   - Position it where they want (usually near product images)
   - Customize settings as needed

## Merchant Settings

Merchants can customize the following settings in the theme editor:

- **Show header**: Toggle header visibility
- **Heading**: Custom heading text (default: "View in 3D")
- **Show instructions**: Toggle mouse control instructions
- **Instructions text**: Custom instructions text
- **Loading text**: Custom loading message
- **Error text**: Custom error message
- **Viewer height**: Adjust viewer height (300-800px)
- **Auto-rotate by default**: Enable auto-rotation on load
- **Show grid**: Toggle ground grid visibility

## How It Works

1. **On page load**: The extension reads the current product ID and variant ID from the Liquid context
2. **Fetch model**: Makes an API call to your backend (`/api/models/product/:productId?variantId=:variantId`)
3. **Load 3D model**: Downloads the GLB file from Supabase and renders it using Three.js
4. **Variant changes**: Listens for variant change events and reloads the appropriate model

## Backend API Requirements

The extension expects your backend to provide this endpoint:

```
GET /api/models/product/:productId?variantId=:variantId
```

Response format:
```json
{
  "modelUrl": "https://your-supabase-bucket.com/models/product-123-variant-456.glb",
  "productId": "123",
  "variantId": "456"
}
```

## File Structure

```
extensions/product-3d-viewer/
├── shopify.extension.toml    # Extension configuration
├── blocks/
│   └── product-3d-viewer.liquid   # Liquid template
├── assets/
│   ├── product-3d-viewer.js       # JavaScript viewer logic
│   └── product-3d-viewer.css      # Styling
├── locales/
│   └── en.default.json            # English translations
└── README.md
```

## Browser Support

- Modern browsers with WebGL support
- Mobile devices (iOS Safari, Chrome, Firefox)
- Desktop (Chrome, Firefox, Safari, Edge)

## Development

To test the extension locally:

1. Start the Shopify CLI dev server:
   ```bash
   shopify app dev
   ```

2. Install the app on a development store

3. Add the block to a product page in the theme editor

4. Make sure your backend API is running and accessible

## Dependencies

- **Three.js** (r152): Loaded from CDN
- **GLTFLoader**: Loaded dynamically
- **OrbitControls**: Loaded dynamically

## Notes

- Models must be in GLB format
- Recommended model file size: < 5MB for optimal loading
- Models are cached by the browser
- The viewer automatically positions models on the ground using bounding box calculation
