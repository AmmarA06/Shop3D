/**
 * 3D Product Viewer
 * Vanilla JS implementation using Three.js
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Product3DViewer {
  // ============================================
  // CAMERA DEFAULT SETTINGS - CUSTOMIZE HERE
  // ============================================
  static DEFAULT_CAMERA_POSITION = { x: 0, y: 1, z: -3 };  // Camera position (x, y, z)
  static DEFAULT_CAMERA_FOV = 50;                          // Field of view (degrees)
  static DEFAULT_MIN_DISTANCE = 2.5;                         // Minimum zoom distance
  static DEFAULT_MAX_DISTANCE = 10;                        // Maximum zoom distance
  static DEFAULT_TARGET = { x: 0, y: 0, z: 0 };            // What camera looks at (center point)
  
  constructor(container) {
    this.container = container;
    this.widgetContainer = container.querySelector('[data-widget]');
    this.viewerContainer = container.querySelector('[data-viewer]');
    this.canvasContainer = container.querySelector('[data-canvas]');
    this.loadingContainer = container.querySelector('[data-loading]');
    this.errorContainer = container.querySelector('[data-error]');
    this.productListContainer = container.querySelector('[data-product-list]');

    // Shop data from Liquid
    this.shopDomain = container.dataset.shopDomain;
    this.apiUrl = container.dataset.apiUrl;
    this.supabaseUrl = container.dataset.supabaseUrl || 'https://wvmouyqnsuxmiatguxca.supabase.co';
    this.supabaseBucket = container.dataset.supabaseBucket || '3d-models';

    // Current product
    this.currentProduct = null;
    this.currentVariant = null;
    this.products = [];

    // Three.js objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.model = null;
    this.animationId = null;
    this.gridHelper = null;
    this.groundPlane = null;

    // Settings
    this.autoRotate = false;
    this.showGrid = true;
    this.isViewerOpen = false;

    this.init();
  }

  async init() {
    try {
      console.log('🎨 Initializing 3D Viewer Widget...');
      
      // Setup widget button listeners
      this.setupWidgetListeners();

    } catch (error) {
      console.error('❌ 3D Viewer Error:', error);
    }
  }
  
  setupWidgetListeners() {
    const openBtn = this.container.querySelector('[data-open-viewer]');
    const closeBtn = this.container.querySelector('[data-close-viewer]');
    
    if (openBtn) {
      openBtn.addEventListener('click', () => this.openViewer());
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeViewer());
    }
  }
  
  async openViewer() {
    if (this.isViewerOpen) return;
    
    console.log('🎬 Opening 3D Viewer...');
    this.isViewerOpen = true;
    
    // Hide widget, show viewer
    this.widgetContainer.style.display = 'none';
    this.viewerContainer.style.display = 'block';
    
    // Initialize Three.js on first open
    if (!this.scene) {
      console.log('🎬 Initializing Three.js...');
      this.initThreeJS();
      
      // Load products
      await this.loadProducts();
      
      // Setup sidebar controls
      this.setupSidebarControls();
      
      // Start render loop
      this.animate();
    } else {
      // Just resize if already initialized
      this.onWindowResize();
    }
    
    // Smooth scroll to viewer
    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  closeViewer() {
    if (!this.isViewerOpen) return;
    
    console.log('📦 Closing 3D Viewer...');
    this.isViewerOpen = false;
    
    // Show widget, hide viewer
    this.widgetContainer.style.display = 'block';
    this.viewerContainer.style.display = 'none';
    
    // Smooth scroll to widget
    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  async loadProducts() {
    console.log('📦 Loading products...');
    
    try {
      // Fetch GLB files from Supabase storage bucket
      // Use shop domain from Liquid template (dynamic per store)
      const supabaseUrl = this.supabaseUrl;
      const bucketName = this.supabaseBucket;
      const shopFolder = this.shopDomain;
      
      const listUrl = `${supabaseUrl}/storage/v1/object/list/${bucketName}?prefix=${shopFolder}/`;
      
      console.log('🔍 Fetching models from:', listUrl);
      console.log('🏪 Shop domain:', shopFolder);
      
      const response = await fetch(listUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const files = await response.json();
      
      // Filter only .glb files and sort by name
      const glbFiles = files
        .filter(file => file.name && file.name.endsWith('.glb'))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`✅ Found ${glbFiles.length} GLB file(s)`);
      
      // Dynamically create products from GLB files
      this.products = glbFiles.map((file, index) => {
        const modelNumber = index + 1;
        const modelUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${shopFolder}/${file.name}`;
        
        return {
          id: String(modelNumber),
          title: `Model #${modelNumber}`,
          handle: `model-${modelNumber}`,
          modelUrl: modelUrl,
          fileName: file.name
        };
      });
      
      console.log(`📦 Created ${this.products.length} product(s)`);
      
    } catch (error) {
      console.error('❌ Error loading products from Supabase:', error);
      
      // Fallback: empty products array
      this.products = [];
      
      // Show error to user
      alert('Failed to load 3D models. Please check your connection and try again.');
    }
    
    this.renderProductList();
    
    // Load first product
    if (this.products.length > 0) {
      await this.selectProduct(this.products[0]);
    } else {
      console.warn('⚠️ No products to display');
    }
  }
  
  renderProductList() {
    if (!this.productListContainer) return;
    
    this.productListContainer.innerHTML = '';
    
    this.products.forEach(product => {
      const button = document.createElement('button');
      button.className = 'product-3d-viewer__product-btn';
      button.dataset.productId = product.id;
      
      const name = document.createElement('p');
      name.className = 'product-3d-viewer__product-name';
      name.textContent = product.title;
      
      button.appendChild(name);
      
      button.addEventListener('click', () => this.selectProduct(product));
      
      this.productListContainer.appendChild(button);
    });
  }
  
  async selectProduct(product) {
    console.log('🔄 Loading product:', product.title);
    
    this.currentProduct = product;
    
    // Update UI
    const buttons = this.productListContainer.querySelectorAll('.product-3d-viewer__product-btn');
    buttons.forEach(btn => {
      if (btn.dataset.productId === product.id) {
        btn.classList.add('product-3d-viewer__product-btn--active');
      } else {
        btn.classList.remove('product-3d-viewer__product-btn--active');
      }
    });
    
    this.showLoading();
    
    try {
      // Remove old model
      if (this.model) {
        this.scene.remove(this.model);
        this.model = null;
      }
      
      // Load new model
      await this.loadModel(product.modelUrl);
      console.log('✅ Product loaded successfully!');
      
      // Reset camera to default position for new product
      this.resetCamera();
      
      this.showViewer();
    } catch (error) {
      console.error('❌ Failed to load product:', error);
      this.showError();
    }
  }

  async fetchModelData() {
    try {
      // Use shop domain from Liquid data attribute
      const shopDomain = this.shopDomain || window.Shopify?.shop;

      if (!shopDomain) {
        console.error('Shop domain not found');
        return null;
      }

      // Call your backend API to get the model URL for this product/variant
      const response = await fetch(
        `${this.apiUrl}/api/models/storefront/${this.productId}?variantId=${this.selectedVariantId}&shop=${shopDomain}`
      );

      if (!response.ok) {
        console.log('No model found in backend, using demo model');
        
        // DEMO MODE: Return a demo model for testing
        // Remove this fallback once you have real models generated
        // Use dynamic Supabase URL and shop domain
        return {
          modelUrl: `${this.supabaseUrl}/storage/v1/object/public/${this.supabaseBucket}/${this.shopDomain}/demo-model.glb`,
          demo: true
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching model data:', error);
      
      // DEMO MODE: Fallback to demo model on error
      // Use dynamic Supabase URL and shop domain
      return {
        modelUrl: `${this.supabaseUrl}/storage/v1/object/public/${this.supabaseBucket}/${this.shopDomain}/demo-model.glb`,
        demo: true
      };
    }
  }

  createSkyGradient() {
    // Create a canvas for the gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create vertical gradient with light blue shades
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    
    // Light blue shades from top to bottom
    gradient.addColorStop(0, '#E0F6FF');    // Very light sky blue (top)
    gradient.addColorStop(0.3, '#B0E0E6');  // Powder blue
    gradient.addColorStop(0.6, '#87CEEB');   // Sky blue
    gradient.addColorStop(1, '#ADD8E6');     // Light blue (bottom)
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert to Three.js texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  initThreeJS() {
    // Scene
    this.scene = new THREE.Scene();
    // Sky blue gradient background
    this.scene.background = this.createSkyGradient();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      Product3DViewer.DEFAULT_CAMERA_FOV,
      this.canvasContainer.clientWidth / this.canvasContainer.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(
      Product3DViewer.DEFAULT_CAMERA_POSITION.x,
      Product3DViewer.DEFAULT_CAMERA_POSITION.y,
      Product3DViewer.DEFAULT_CAMERA_POSITION.z
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(
      this.canvasContainer.clientWidth,
      this.canvasContainer.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.canvasContainer.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 5, -5);
    this.scene.add(directionalLight2);

    // Grid - Large gray grid covering entire floor
    // Parameters: size (total grid size), divisions (number of grid lines), color1 (main lines), color2 (subdivisions)
    this.gridHelper = new THREE.GridHelper(100, 100, 0x888888, 0xcccccc);
    this.gridHelper.material.opacity = 0.8;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);
    
    // Add a gray ground plane for better visual coverage
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xf5f5f5,
      side: THREE.DoubleSide
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.groundPlane.position.y = 0;
    this.groundPlane.renderOrder = -1; // Render behind other objects
    this.scene.add(this.groundPlane);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = Product3DViewer.DEFAULT_MIN_DISTANCE;
    this.controls.maxDistance = Product3DViewer.DEFAULT_MAX_DISTANCE;
    this.controls.target.set(
      Product3DViewer.DEFAULT_TARGET.x,
      Product3DViewer.DEFAULT_TARGET.y,
      Product3DViewer.DEFAULT_TARGET.z
    );
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 4;
    this.controls.update();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Initial resize to ensure correct dimensions
    this.onWindowResize();
  }

  async loadModel(modelUrl) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      loader.load(
        modelUrl,
        (gltf) => {
          this.model = gltf.scene;

          // Calculate bounding box and position model on ground
          const box = new THREE.Box3().setFromObject(this.model);
          const yOffset = -box.min.y;
          this.model.position.y = yOffset;
          
          // Optional: Center model horizontally (uncomment if needed)
          // const center = box.getCenter(new THREE.Vector3());
          // this.model.position.x = -center.x;
          // this.model.position.z = -center.z;
          
          // Optional: Rotate model (uncomment if needed)
          // this.model.rotation.y = Math.PI / 4; // 45 degrees

          this.scene.add(this.model);
          resolve();
        },
        (progress) => {
          // Optional: Show loading progress
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(`Loading: ${percentComplete.toFixed(2)}%`);
        },
        (error) => {
          console.error('Error loading model:', error);
          reject(error);
        }
      );
    });
  }

  setupSidebarControls() {
    const controlButtons = this.container.querySelectorAll('[data-control]');
    
    controlButtons.forEach(button => {
      const control = button.dataset.control;
      
      button.addEventListener('click', () => {
        switch(control) {
          case 'auto-rotate':
            this.toggleAutoRotate();
            const rotateText = button.querySelector('[data-rotate-text]');
            if (rotateText) {
              rotateText.textContent = this.autoRotate ? 'Stop Auto-Rotate' : 'Start Auto-Rotate';
            }
            if (this.autoRotate) {
              button.classList.add('product-3d-viewer__control-list-btn--active');
            } else {
              button.classList.remove('product-3d-viewer__control-list-btn--active');
            }
            break;
            
          case 'grid':
            this.toggleGrid();
            const gridText = button.querySelector('[data-grid-text]');
            if (gridText) {
              gridText.textContent = this.showGrid ? 'Hide Grid' : 'Show Grid';
            }
            if (this.showGrid) {
              button.classList.add('product-3d-viewer__control-list-btn--active');
            } else {
              button.classList.remove('product-3d-viewer__control-list-btn--active');
            }
            break;
            
          case 'reset':
            this.resetCamera();
            break;
        }
      });
    });
    
    // Initialize grid button state
    const gridBtn = this.container.querySelector('[data-control="grid"]');
    if (gridBtn && this.showGrid) {
      gridBtn.classList.add('product-3d-viewer__control-list-btn--active');
    }
  }
  
  toggleGrid() {
    this.showGrid = !this.showGrid;
    if (this.gridHelper) {
      this.gridHelper.visible = this.showGrid;
    }
    if (this.groundPlane) {
      this.groundPlane.visible = this.showGrid;
    }
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
  }

  resetCamera() {
    if (!this.camera || !this.controls) return;
    
    // Reset camera position
    this.camera.position.set(
      Product3DViewer.DEFAULT_CAMERA_POSITION.x,
      Product3DViewer.DEFAULT_CAMERA_POSITION.y,
      Product3DViewer.DEFAULT_CAMERA_POSITION.z
    );
    
    // Reset controls target (what camera looks at)
    this.controls.target.set(
      Product3DViewer.DEFAULT_TARGET.x,
      Product3DViewer.DEFAULT_TARGET.y,
      Product3DViewer.DEFAULT_TARGET.z
    );
    
    // Update controls
    this.controls.update();
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;

    const width = this.canvasContainer.clientWidth;
    const height = this.canvasContainer.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  showLoading() {
    this.loadingContainer.style.display = 'flex';
    this.canvasContainer.style.display = 'none';
    this.errorContainer.style.display = 'none';
  }

  showViewer() {
    this.loadingContainer.style.display = 'none';
    this.canvasContainer.style.display = 'block';
    this.errorContainer.style.display = 'none';
    
    // Force resize after showing canvas to ensure proper dimensions
    setTimeout(() => {
      this.onWindowResize();
    }, 100);
  }

  showError() {
    this.loadingContainer.style.display = 'none';
    this.canvasContainer.style.display = 'none';
    this.errorContainer.style.display = 'flex';
  }

  destroy() {
    // Cleanup
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.controls) {
      this.controls.dispose();
    }

    window.removeEventListener('resize', this.onWindowResize);
  }
}

// Initialize all viewers on page load
console.log('🚀 3D Viewer module loaded');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewers);
} else {
  initViewers();
}

function initViewers() {
  console.log('✅ Initializing 3D viewers');
  
  // Initialize all viewers
  const viewers = document.querySelectorAll('.product-3d-viewer');
  console.log(`📦 Found ${viewers.length} viewer(s)`);
  
  if (viewers.length === 0) {
    console.warn('⚠️ No 3D viewers found on page');
    return;
  }
  
  viewers.forEach((container, index) => {
    console.log(`🎬 Initializing viewer ${index + 1}`);
    try {
      new Product3DViewer(container);
    } catch (error) {
      console.error(`❌ Failed to initialize viewer ${index + 1}:`, error);
    }
  });
}
