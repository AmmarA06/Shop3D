/**
 * 3D Model Viewer Component
 * Displays .glb models with interactive controls
 */
import { useRef, Suspense, useImperativeHandle, forwardRef, useLayoutEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage, Grid } from "@react-three/drei";
import * as THREE from "three";

interface ModelProps {
  url: string;
  scale?: number;
}

/**
 * 3D Model component that loads and displays a GLB file
 */
function Model({ url, scale = 1 }: ModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const [yOffset, setYOffset] = useState(0);

  // Calculate bounding box after scene is loaded and scaled
  useLayoutEffect(() => {
    if (groupRef.current) {
      // Create a temporary clone to calculate bounds with scale applied
      const clonedScene = scene.clone();
      const tempGroup = new THREE.Group();
      tempGroup.add(clonedScene);
      tempGroup.scale.set(scale, scale, scale);
      tempGroup.updateMatrixWorld(true);

      // Calculate bounding box of the scaled model
      const box = new THREE.Box3().setFromObject(tempGroup);
      const offset = -box.min.y;
      setYOffset(offset);

      // Clean up
      tempGroup.clear();
    }
  }, [scene, scale]);

  return (
    <group ref={groupRef} position={[0, yOffset, 0]}>
      <primitive object={scene} scale={scale} />
    </group>
  );
}

interface ModelViewerProps {
  modelUrl: string;
  scale?: number;
  showGrid?: boolean;
  autoRotate?: boolean;
  backgroundColor?: string;
}

export interface ModelViewerHandle {
  resetCamera: () => void;
}

/**
 * Main 3D Viewer Component
 */
const ModelViewer = forwardRef<ModelViewerHandle, ModelViewerProps>(
  ({ modelUrl, scale = 1, showGrid = true, autoRotate = false, backgroundColor = "#f0f0f0" }, ref) => {
    const controlsRef = useRef<any>(null);

    // Expose reset function to parent
    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        if (controlsRef.current) {
          controlsRef.current.reset();
        }
      },
    }));

    return (
      <div style={{ width: "100%", height: "500px", position: "relative" }}>
        <Canvas
          key={modelUrl} // Reset camera when model changes
          camera={{ position: [3, 3, 3], fov: 50 }}
          style={{ background: backgroundColor }}
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <Stage
              intensity={0.5}
              environment="city"
              shadows={{
                type: "accumulative",
                bias: -0.001,
                intensity: Math.PI,
                color: "#000000",
              }}
              adjustCamera={1.5}
            >
              <Model url={modelUrl} scale={scale} />
            </Stage>

            {/* Grid helper */}
            {showGrid && (
              <Grid
                args={[10, 10]}
                cellSize={0.5}
                cellThickness={0.5}
                cellColor="#6f6f6f"
                sectionSize={1}
                sectionThickness={1}
                sectionColor="#9d4b4b"
                fadeDistance={25}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid={true}
              />
            )}

            {/* Camera controls */}
            <OrbitControls
              ref={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
              enableDamping
              dampingFactor={0.05}
              minDistance={1}
              maxDistance={10}
              minPolarAngle={0} // Allow viewing from any angle
              maxPolarAngle={Math.PI} // Full rotation including bottom view
            />
          </Suspense>
        </Canvas>

        {/* Controls info overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            background: "rgba(0, 0, 0, 0.5)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          <div>🖱️ Left click + drag: Rotate</div>
          <div>🖱️ Right click + drag: Pan</div>
          <div>🖱️ Scroll: Zoom</div>
        </div>
      </div>
    );
  }
);

ModelViewer.displayName = "ModelViewer";

export default ModelViewer;

// Preload utility for caching models
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
