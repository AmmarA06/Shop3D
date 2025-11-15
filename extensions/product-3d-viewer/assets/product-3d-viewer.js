/**
 * 3D Product Viewer
 * Vanilla JS implementation using Three.js
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Product3DViewer {
  constructor(container) {
    this.container = container;
    this.canvasContainer = container.querySelector('[data-canvas]');
    this.loadingContainer = container.querySelector('[data-loading]');
    this.errorContainer = container.querySelector('[data-error]');
    this.productListContainer = container.querySelector('[data-product-list]');

    // Shop data from Liquid
    this.shopDomain = container.dataset.shopDomain;
    this.apiUrl = container.dataset.apiUrl;

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

    // Settings
    this.autoRotate = false;
    this.showGrid = true;
    this.isFullscreen = false;

    this.init();
  }

  async init() {
    try {
      console.log('🎨 Initializing 3D Viewer...');
      
      // Initialize Three.js first
      console.log('🎬 Initializing Three.js...');
      this.initThreeJS();
      
      // Load products
      await this.loadProducts();
      
      // Setup sidebar controls
      this.setupSidebarControls();
      
      // Start render loop
      this.animate();

    } catch (error) {
      console.error('❌ 3D Viewer Error:', error);
      this.showError();
    }
  }
  
  async loadProducts() {
    console.log('📦 Loading products...');
    
    // DEMO MODE: Use hardcoded products
    // TODO: Fetch from Shopify API
    this.products = [
      {
        id: '1',
        title: 'Demo Cube',
        handle: 'demo-cube',
        modelUrl: 'https://wvmouyqnsuxmiatguxca.supabase.co/storage/v1/object/public/3d-models/test-shop.myshopify.com/123456789.glb'
      },
      {
        id: '2',
        title: 'Water Bottle',
        handle: 'water-bottle',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb'
      },
      {
        id: '3',
        title: 'Lantern',
        handle: 'lantern',
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb'
      }
    ];
    
    this.renderProductList();
    
    // Load first product
    if (this.products.length > 0) {
      await this.selectProduct(this.products[0]);
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
      
      const meta = document.createElement('p');
      meta.className = 'product-3d-viewer__product-meta';
      meta.textContent = '3D Model Available';
      
      button.appendChild(name);
      button.appendChild(meta);
      
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
        return {
          modelUrl: 'https://wvmouyqnsuxmiatguxca.supabase.co/storage/v1/object/public/3d-models/test-shop.myshopify.com/123456789.glb',
          demo: true
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching model data:', error);
      
      // DEMO MODE: Fallback to demo model on error
      return {
        modelUrl: 'https://wvmouyqnsuxmiatguxca.supabase.co/storage/v1/object/public/3d-models/test-shop.myshopify.com/123456789.glb',
        demo: true
      };
    }
  }

  initThreeJS() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6f8fa);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.canvasContainer.clientWidth / this.canvasContainer.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(3, 3, 3);

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

    // Grid
    this.gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    this.scene.add(this.gridHelper);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 2;

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
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
  }

  resetCamera() {
    if (this.controls) {
      this.controls.reset();
    }
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
