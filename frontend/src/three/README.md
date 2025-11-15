# 3D Viewer Components

This directory contains the React Three Fiber based 3D model viewer components.

## Components

### `ModelViewer.tsx`

Base 3D viewer component that renders GLB models with interactive controls.

**Features:**
- Orbit controls (rotate, pan, zoom)
- Auto-rotate option
- Grid helper
- Stage lighting
- Loading states

**Usage:**
```tsx
import ModelViewer from './three/ModelViewer';

<ModelViewer
  modelUrl="https://example.com/model.glb"
  scale={1}
  showGrid={true}
  autoRotate={false}
  backgroundColor="#f0f0f0"
/>
```

**Controls:**
- Left click + drag: Rotate model
- Right click + drag: Pan camera
- Scroll wheel: Zoom in/out

## Technical Details

### Dependencies
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for R3F
- `three` - Core 3D library

### Model Format
- Supports `.glb` files (binary glTF format)
- Models are preloaded for better performance
- Cached automatically by R3F

### Performance
- Models are loaded asynchronously with Suspense
- `useGLTF.preload()` available for pre-caching
- Stage component handles lighting automatically

## Adding New Features

### Custom Lighting
Modify the `<Stage>` component in `ModelViewer.tsx`:

```tsx
<Stage
  intensity={0.5}
  environment="city"
  shadows={{ ... }}
>
  <Model url={modelUrl} scale={scale} />
</Stage>
```

### Camera Presets
Add camera position presets:

```tsx
const CAMERA_PRESETS = {
  front: [0, 0, 3],
  top: [0, 3, 0],
  side: [3, 0, 0],
};
```

### Annotations
Use `@react-three/drei` Html component for 3D annotations:

```tsx
import { Html } from '@react-three/drei';

<Html position={[0, 1, 0]}>
  <div>Product name</div>
</Html>
```

## Testing

Test with sample GLB models:
- [Khronos glTF Samples](https://github.com/KhronosGroup/glTF-Sample-Models)
- Download sample models to test locally

## Troubleshooting

**Model not loading:**
- Check model URL is accessible
- Verify file is valid GLB format
- Check browser console for CORS errors

**Performance issues:**
- Reduce model polygon count
- Use lower resolution textures
- Disable auto-rotate

**Lighting looks wrong:**
- Adjust Stage intensity
- Try different environment presets
- Add custom lights if needed
