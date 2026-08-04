declare module "./usd/src/hydra/ThreeJsRenderDelegate.js" {
    export class ThreeRenderDelegateInterface {
      constructor(container: HTMLElement, config?: any);
      // Add additional methods and properties as needed.
    }
  }
  
  declare module "three/addons/loaders/RGBELoader.js";
  declare module "three/addons/controls/OrbitControls.js";
  declare module "three/addons/exporters/GLTFExporter.js";
  