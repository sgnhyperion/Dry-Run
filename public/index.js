// // import { Vector3, Box3, PerspectiveCamera, Scene, Color, AmbientLight, Group, PointLight, WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping, VSMShadowMap, PMREMGenerator, EquirectangularReflectionMapping } from 'three';
// // import { ThreeRenderDelegateInterface } from "./usd/src/hydra/ThreeJsRenderDelegate.js"
// // import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// // import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// // import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
// // import './usd/src/bindings/emHdBindings.js';

// // const getUsdModule = globalThis["NEEDLE:USD:GET"];

// // export function init(options = {
// //   hdrPath: 'environments/neutral.hdr'
// // }) {

// // // wait for document
// // document.addEventListener("DOMContentLoaded", function() {
// // let scene;
// // let defaultTexture;

// // const debugFileHandling = false;

// // let params = (new URL(document.location)).searchParams;
// // let name = params.get("name");

// // let filename = params.get("file") || ""; // || 'https://cdn.glitch.global/bee386a1-31e6-4710-8850-a1d5b7026a09/speeder.usdz'; // default file
// // let messageLog = document.querySelector("#message-log");
// // let currentDisplayFilename = "";

// // function setFilenameText(__filename) {
// //   var _filename = __filename.split('/').pop().split('#')[0].split('?')[0];
// //   const _el = document.querySelector(".filename");
// //   if (_el) _el.innerText = _filename;
// //   currentDisplayFilename = _filename;
// // }
  
// // if (filename) {
// //   const el = document.querySelector("#container");
// //   el.classList.add("have-custom-file");
// //   // get filename from URL
// //   setFilenameText(filename);
// // }  
  
// // function updateUrl() {

// //   // Workaround for CORS issues: 
// //   // rewrite GitHub links in the form https://github.com/usd-wg/assets/blob/main/full_assets/ElephantWithMonochord/SoC-ElephantWithMonochord.usdc
// //   // to the raw version https://raw.githubusercontent.com/usd-wg/assets/main/full_assets/ElephantWithMonochord/SoC-ElephantWithMonochord.usdc
// //   if (filename.includes("github.com")) {
// //     filename = filename.replace("github.com", "raw.githubusercontent.com");
// //     filename = filename.replace("/blob/", "/");
// //   }
  
// //   // set quick look link
// //   let indexOfQuery = filename.indexOf('?');
// //   let url = filename;
// //   if (indexOfQuery >= 0)
// //     url = url.substring(0, indexOfQuery);

// //   const quickLookLink = document.querySelector("a#quick-look-link");
// //   if (quickLookLink) quickLookLink.href = url;
  
// //   const currentUrl = new URL(window.location.href);
// //   // set the file query parameter
// //   currentUrl.searchParams.set("file", filename);
// //   window.history.pushState({}, filename, currentUrl);
// // }

// // messageLog.textContent = "Initializing...";
// // const initPromise = init();

// // console.log("Loading USD Module...");
// // // messageLog.textContent = "Loading USD Module – this can take a moment...";
// // // messageLog.textContent = "Loading your message..";
// // if (messageLog) {
// //   messageLog.textContent = "Loading your message..";
// //   messageLog.style.background = "linear-gradient(to right, #a78bfa, #f472b6, #8b5cf6)"; // purple-pink gradient
// //   messageLog.style.webkitBackgroundClip = "text";
// //   messageLog.style.color = "transparent";
// //   messageLog.style.fontWeight = "600"; // optional bold
// // }
// // updateUrl();
// // try {
// //   Promise.all([getUsdModule({
// //     mainScriptUrlOrBlob: "./emHdBindings.js",
// //     locateFile: (file) => {
// //       return "/usd/bindings/" + file;
// //     },
// //   }), initPromise]).then(async ([Usd]) => {
// //     window.Usd = Usd;
// //     messageLog.textContent = "Loading done";
// //     animate();
// //     if (filename) {
// //       console.log("Loading File...");
// //       // messageLog.textContent = "Loading File " + filename;
// //       // messageLog.textContent = "....";
// //       if (messageLog) {
// //         messageLog.textContent = "....";
// //         messageLog.style.background = "linear-gradient(to right, #a78bfa, #f472b6, #8b5cf6)"; // purple-pink gradient
// //         messageLog.style.webkitBackgroundClip = "text";
// //         messageLog.style.color = "transparent";
// //         messageLog.style.fontWeight = "600"; // optional bold
// //       }

// //       clearStage();
// //       const urlPath = (new URL(document.location)).searchParams.get("file").split('?')[0];
// //       loadUsdFile(undefined, filename, urlPath, true);
// //     }
// //   });
// // }
// // catch (error) {
// //   if(error.toString().indexOf("SharedArrayBuffer") >= 0) {
// //     let err = "Your current browser doesn't support SharedArrayBuffer which is required for USD.";
// //     console.log(error, err);
// //     messageLog.textContent = err;
// //   }
// //   else {
// //     let err = "Your current browser doesn't support USD-for-web. Error during initialization: " + error;
// //     console.log(err);
// //     messageLog.textContent = err;
// //   }
// // }

// // var currentRootFileName = undefined;
// // var timeout = 40;
// // var endTimeCode = 1;
// // var ready = false;

// // const usdzExportBtn = document.getElementById('export-usdz');
// // if (usdzExportBtn) usdzExportBtn.addEventListener('click', () => {
// //   alert("usdz");
// // });

// // const gltfExportBtn = document.getElementById('export-gltf');
// // if (gltfExportBtn) gltfExportBtn.addEventListener('click', (evt) => {
// //   const exporter = new GLTFExporter();
// //   console.log("EXPORTING GLTF", window.usdRoot);
// //   exporter.parse( window.usdRoot, function ( gltf ) {
// //     const blob = new Blob([gltf], {type: 'application/octet-stream'});
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement('a');
// //     a.href = url;
// //     let filename = currentDisplayFilename;
// //     // strip extension, strip path
// //     filename = filename.split('/').pop().split('.')[0].split('?')[0];
// //     a.download = filename + ".glb";
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   },
// //   function (error) {
// //     console.error(error);
// //   },
// //   { 
// //     binary: true,
// //     // not possible right now since USD controls animation bindings,
// //     // it's not a three.js clip
// //     animations: [
// //       // window.usdRoot.animations[0]
// //     ]
// //   });
// //   evt.preventDefault();
// // });

// // function getAllLoadedFiles(){
// //   const filePaths = [];

// //   getAllLoadedFilePaths("/", filePaths);

// //   return filePaths;
// // }

// // function getAllLoadedFilePaths(currentPath, paths) {
// //   const files = Usd.FS_readdir(currentPath);
// //   for (const file of files) {
// //     // skip self and parent
// //     if (file === "." || file === "..") continue;
// //     const newPath = currentPath + file + "/";
// //     const data = Usd.FS_analyzePath(currentPath + file + "/");
// //     if (data.object.node_ops.readdir) {
// //       // default directories we're not interested in
// //       if (newPath == "/dev/" || newPath == "/proc/" || newPath== "/home/" || newPath== "/tmp/" || newPath== "/usd/") continue;
// //       getAllLoadedFilePaths(newPath, paths);
// //     }
// //     else {
// //       paths.push(data.path);
// //     }
// //   }
// // }

// // function clearStage() {

// //   var allFilePaths = getAllLoadedFiles();
// //   console.log("Clearing stage.", allFilePaths)

// //   for (const file of allFilePaths) {
// //     Usd.FS_unlink(file, true);
// //   }

// //   window.usdRoot.clear();
// // }

// // function addPath(root, path) {
// //     const files = Usd.FS_readdir(path);
// //     for (const file of files) {
// //       // skip self and parent
// //       if (file === "." || file === "..") continue;
// //       const newPath = path + file + "/";
// //       const data = Usd.FS_analyzePath(path + file + "/");
// //       if (data.object.node_ops.readdir) {
// //         // default directories we're not interested in
// //         if (newPath == "/dev/" || newPath == "/proc/" || newPath== "/home/" || newPath== "/tmp/" || newPath== "/usd/") continue;
// //         root[file] = {};
// //         addPath(root[file], newPath);
// //       }
// //       else {
// //         root[file] = data;
// //       }
// //     }
// // }

// // async function loadUsdFile(directory, filename, path, isRootFile = true) {
// //   setFilenameText(filename);
// //   if (debugFileHandling) console.warn("loading " + path, isRootFile, directory, filename);
// //   ready = false;

// //   // should be loaded last
// //   if (!isRootFile) return;

// //   let driver = null;
// //   const delegateConfig = {
// //     usdRoot: window.usdRoot,
// //     paths: new Array(),
// //     driver: () => (driver),
// // };

// //   const renderInterface = window.renderInterface = new ThreeRenderDelegateInterface(path, delegateConfig);
// //   driver = new Usd.HdWebSyncDriver(renderInterface, path);
// //   if (driver instanceof Promise) {
// //     driver = await driver;
// //   }
// //   window.driver = driver;
// //   window.driver.Draw();
// //   messageLog.textContent = "";

// //   let stage = window.driver.GetStage();
// //   if (stage instanceof Promise) {
// //     stage = await stage;
// //     stage = window.driver.GetStage();
// //   }
// //   window.usdStage = stage
// //   if (stage.GetEndTimeCode){
// //     endTimeCode = stage.GetEndTimeCode();
// //     timeout = 1000 / stage.GetTimeCodesPerSecond();
// //   }

// //   // if up axis is z, rotate, otherwise make sure rotation is 0, in case we rotated in the past and need to undo it
// //   window.usdRoot.rotation.x = String.fromCharCode(stage.GetUpAxis()) === 'z' ? -Math.PI / 2 : 0;

// //   fitCameraToSelection(window.camera, window._controls, [window.usdRoot]);
// //   console.log("Loading done. Scene: ", window.usdRoot);
// //   ready = true;

// //   try {
// //     console.log("Currently Exposed API", {
// //       "Stage": Object.getPrototypeOf(stage),
// //       "Layer": Object.getPrototypeOf(stage.GetRootLayer()),
// //       "Prim": Object.getPrototypeOf(stage.GetPrimAtPath("/")),
// //     });
// //   } catch(e) {
// //     console.warn("Couldn't log state root layer / root prim", e, stage, Object.getPrototypeOf(stage));
// //   }

// //   // TODO show file hierarchy in sidebar
// //   // better: object has "content" that contains child files, no multiple
// //   // calls to analyzePath necessary
// //   // TODO USDZ is resolved internally in Usd, if we want to make that useful
// //   // we need to unpack on the fly so that the directory can be traversed
// //   // OR we traverse the USD data directly, but that means we can't edit stuff.
// //   // So when content in a USDZ is changed > update the USDZ file and then reload
// //   // This might be recursive (USDZ in USDZ in USDZ)
// //   const root = {};
// //   addPath(root, "/");
// //   console.log("File system", root, Usd.FS_analyzePath("/"));
  
// //   window.parent.postMessage({ type: 'USD_LOADED' }, '*'); // i added

// // }

// // // from https://discourse.threejs.org/t/camera-zoom-to-fit-object/936/24
// // function fitCameraToSelection(camera, controls, selection, fitOffset = 1.5) {
// //   const size = new Vector3();
// //   const center = new Vector3();
// //   const box = new Box3();
  
// //   box.makeEmpty();
// //   for(const object of selection) {
// //     box.expandByObject(object);
// //   }

// //   box.getSize(size);
// //   box.getCenter(center );

// //   if (Number.isNaN(size.x) || Number.isNaN(size.y) || Number.isNaN(size.z) || 
// //       Number.isNaN(center.x) || Number.isNaN(center.y) || Number.isNaN(center.z)) {
// //     console.warn("Fit Camera failed: NaN values found, some objects may not have any mesh data.", selection, size);
// //     if (controls) 
// //       controls.update();
// //     return;
// //   }

// //   if (!controls) {
// //     console.warn("No camera controls object found, something went wrong.");
// //     return;
// //   }

// //   const maxSize = Math.max(size.x, size.y, size.z);
// //   const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
// //   const fitWidthDistance = fitHeightDistance / camera.aspect;
// //   const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

// //   if (distance == 0) {
// //     console.warn("Fit Camera failed: distance is 0, some objects may not have any mesh data.");
// //     return;
// //   }

// //   camera.position.z = params.get('cameraZ') || 7;
// //   camera.position.y = params.get('cameraY') || 7;
// //   camera.position.x = params.get('cameraX') || 0;

// //   const direction = controls.target.clone()
// //     .sub(camera.position)
// //     .normalize()
// //     .multiplyScalar(distance);

// //   controls.maxDistance = distance * 10;
// //   controls.target.copy(center);

// //   camera.near = distance / 100;
// //   camera.far = distance * 100;

// //   camera.updateProjectionMatrix();

// //   camera.position.copy(controls.target).sub(direction);
// //   controls.update();

// //   console.log("Fitting camera to selection", {
// //     size,
// //     center,
// //     maxSize,
// //     distance,
// //     near: camera.near,
// //     far: camera.far,
// //   });
// // }

// // async function init() {
// //   const camera = window.camera = new PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 3500 );
// //   camera.position.z = params.get('cameraZ') || 7;
// //   camera.position.y = params.get('cameraY') || 7;
// //   camera.position.x = params.get('cameraX') || 0;

// //   const scene = window.scene = new Scene();
// //   // scene.background = new Color(0xffffff);
  

// //   /*
// //   scene.add( new AmbientLight( 0x111111 ) );
// //   */
// //   const usdRoot = window.usdRoot = new Group();
// //   usdRoot.name = "USD Root";
// //   scene.add(usdRoot);

// //   /*
// //   let pointLight = new PointLight( 0xff8888 );
// //   pointLight.position.set( -30, 20, 220 );
// //   pointLight.castShadow = true;
// //   pointLight.shadow.camera.near = 8;
// //   pointLight.shadow.camera.far = 1000;
// //   pointLight.shadow.mapSize.width = 1024;
// //   pointLight.shadow.mapSize.height = 1024;
// //   pointLight.shadow.bias = - 0.002;

// //   pointLight.shadow.radius = 4;
// //   pointLight.shadow.samples = 8;
// //   scene.add( pointLight );
// //   */

// //   const renderer = window.renderer = new WebGLRenderer( { antialias: true, alpha: true } );
// //   renderer.setPixelRatio( window.devicePixelRatio );
// //   renderer.setSize( window.innerWidth, window.innerHeight );
// //   renderer.outputColorSpace = SRGBColorSpace;
// //   // renderer.toneMapping = AgXToneMapping;
// //   // renderer.toneMappingExposure = 1;
// //   renderer.toneMapping = NeutralToneMapping;
// //   console.log("tonemapping", renderer.toneMapping)
// //   renderer.shadowMap.enabled = false;
// //   renderer.shadowMap.type = VSMShadowMap;
// //   renderer.setClearColor( 0x000000, 0 ); // the default

// //   const envMapPromise = new Promise(resolve => {
// //     const pmremGenerator = new PMREMGenerator(renderer);
// //             pmremGenerator.compileCubemapShader();
            
// //     new RGBELoader().load(options.hdrPath, (texture) => {
// //       const hdrRenderTarget = pmremGenerator.fromEquirectangular(texture);

// //       texture.mapping = EquirectangularReflectionMapping;
// //       texture.needsUpdate = true;
// //       scene.environment = hdrRenderTarget.texture;
// //       resolve();
// //     }, undefined, (err) => {
// //         console.error('An error occurred loading the HDR environment map.', err);
// //         resolve();
// //     });
// //   });

// //   document.body.appendChild( renderer.domElement );
// //   const controls = window._controls = new OrbitControls( camera, renderer.domElement );
// //   controls.enableDamping = true;
// //   controls.dampingFactor = 0.2;
// //   controls.update();

// //   window.addEventListener( 'resize', onWindowResize );
  
// //   renderer.domElement.addEventListener("drop", dropHandler);
// //   renderer.domElement.addEventListener("dragover", dragOverHandler);

// //   // attach to link click handlers so that we don't have to reload the entire page
// //   const fileLoadingLinks = document.querySelectorAll("a.file");
// //   for(let link of fileLoadingLinks) {
// //     link.addEventListener('click', async function(event) {
// //       event.preventDefault();
      
// //       let params = new Map();
// //       try {
// //         params = (new URL(event.target.href)).searchParams;
// //       }
// //       catch {}
// //       filename = params.get("file");
      
// //       if (params.get('cameraZ') !== undefined) camera.position.z = params.get('cameraZ');
// //       if (params.get('cameraY') !== undefined) camera.position.y = params.get('cameraY');
// //       if (params.get('cameraX') !== undefined) camera.position.x = params.get('cameraX');
// //       window._controls.update();
      
// //       // clear existing objects
// //       if (filename !== undefined) {
// //         // clearStage();  
// //         setFilenameText("");
// //       }
      
// //       const el = document.querySelector("#container");
// //       el.classList.remove("have-custom-file");
      
// //       clearStage();

// //       if (filename) {
// //         el.classList.add("have-custom-file");
// //         messageLog.textContent = "Downloading File " + filename + "...";
// //         updateUrl();
// //         // get just the filename, no paths
// //         const parts = filename.split('/');
// //         filename = parts[parts.length - 1];
// //         const urlPath = (new URL(document.location)).searchParams.get("file").split('?')[0];
// //         loadUsdFile(undefined, filename, urlPath, true);
// //       }
// //     });
// //   }
  
// //   render();
  
// //   return envMapPromise;
// // }

// // // A little helper. Press space to pause/enable rendering. Useful when looking at animated scenes.
// // let stop = false;
// // document.body.onkeyup = function(e){
// //   if(e.keyCode == 32){
// //     stop = !stop;
// //   }
// // }

// // async function animate() {
  
// //   if (stop) {
// //     requestAnimationFrame( animate.bind(null, timeout, endTimeCode) );
// //     return;
// //   }

// //   window._controls.update();
// //   let secs = new Date().getTime() / 1000;
// //   await new Promise(resolve => setTimeout(resolve, 10));
// //   const time = secs * (1000 / timeout) % endTimeCode;
// //   if (window.driver && window.driver.SetTime && window.driver.Draw && ready) {
// //     window.driver.SetTime(time);
// //     window.driver.Draw();
// //     render();
// //   }
// //   requestAnimationFrame( animate.bind(null, timeout, endTimeCode) );
// // }

// // function onWindowResize() {
// //   camera.aspect = window.innerWidth / window.innerHeight;
// //   camera.updateProjectionMatrix();
// //   renderer.setSize( window.innerWidth, window.innerHeight );
// // }

// // function render() {
// //   const time = Date.now() * 0.001;
// //   if (window.renderer.render && window.scene){
// //     window.renderer.render( window.scene, window.camera );
// //   }
// // }

// // async function loadFile(fileOrHandle, isRootFile = true, fullPath = undefined) {
// //   let file = undefined;
// //   try {
// //     if(fileOrHandle.getFile !== undefined) {
// //       file = await fileOrHandle.getFile();
// //     }
// //     else
// //       file = fileOrHandle;

// //     var reader = new FileReader();
// //     const loadingPromise = new Promise((resolve, reject) => {
// //       reader.onloadend = resolve;
// //       reader.onerror = reject;
// //     });
// //     reader.onload = function(event) {
// //       let fileName = file.name;
// //       let directory = "/";
// //       if (fullPath !== undefined) {
// //         fileName = fullPath.split('/').pop();
// //         directory = fullPath.substring(0, fullPath.length - fileName.length);
// //         if (debugFileHandling) console.warn("directory", directory, "fileName", fileName);
// //       }
// //       Usd.FS_createPath("", directory, true, true);
// //       Usd.FS_createDataFile(directory, fileName, new Uint8Array(event.target.result), true, true, true);

// //       loadUsdFile(directory, fileName, fullPath, isRootFile);
// //     };
// //     reader.readAsArrayBuffer(file);
// //     await loadingPromise;
// //   }
// //   catch(ex) {
// //     console.warn("Error loading file", fileOrHandle, ex);
// //   }
// // }

// // function testAndLoadFile(file) {
// //   let ext = file.name.split('.').pop();
// //   if (debugFileHandling) console.log(file.name + ", " + file.size + ", " + ext);
// //   if(ext == 'usd' || ext == 'usdz' || ext == 'usda' || ext == 'usdc') {
// //     clearStage();
// //     loadFile(file);
// //   }
// // }

// // /**
// //  * @param {FileSystemDirectoryEntry} directory
// //  */
// // async function readDirectory(directory) {
// //   let entries = [];

// //   let getAllDirectoryEntries = async (dirReader) => {
// //     let entries = [];
// //     let readEntries = async () => {
// //       let result = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
// //       if (result.length === 0)
// //         return entries;
// //       else
// //         return entries.concat(result, await readEntries());
// //     }
// //     return await readEntries();
// //   }

// //   /**
// //    * @param {FileSystemDirectoryReader} dirReader
// //    * @param {FileSystemDirectoryEntry} directory
// //    * @returns {Promise<number>}
// //    */
// //   let getEntries = async (directory) => {
// //     let dirReader = directory.createReader();
// //     await new Promise(async (resolve, reject) => {
// //       // Call the reader.readEntries() until no more results are returned.

// //         const results = await getAllDirectoryEntries(dirReader);

// //         if (results.length) {
// //           // entries = entries.concat(results);
// //           for (let entry of results) {
// //             if (entry.isDirectory) {
// //               const foundFiles = await getEntries(entry);
// //               if (foundFiles === 100)
// //                 console.warn("Found more than 100 files in directory", entry);
// //             }
// //             else {
// //               entries.push(entry);
// //             }
// //           }
// //         }
// //         resolve(results.length);
// //     });
// //   };

// //   await getEntries(directory);
// //   return entries;
// // }

// // /**
// //  * @param {FileSystemEntry[]} entries
// //  */
// // async function handleFilesystemEntries(entries) {
// //   /** @type {FileSystemEntry[]} */
// //   const allFiles = [];
// //   const fileIgnoreList = [
// //     '.gitignore',
// //     'README.md',
// //     '.DS_Store',
// //   ]
// //   const dirIgnoreList = [
// //     '.git',
// //     'node_modules',
// //   ]

// //   for (let entry of entries) {
// //     if (debugFileHandling) console.log("file entry", entry)
// //     if (entry.isFile) {
// //       if (debugFileHandling) console.log("single file", entry);
// //       if (fileIgnoreList.includes(entry.name)) {
// //         continue;
// //       }
// //       allFiles.push(entry);
// //     }
// //     else if (entry.isDirectory) {
// //       if (dirIgnoreList.includes(entry.name)) {
// //         continue;
// //       }
// //       const files = await readDirectory(entry);
// //       if (debugFileHandling) console.log("all files", files);
// //       for (const file of files) {
// //         if (fileIgnoreList.includes(file.name)) {
// //           continue;
// //         }
// //         allFiles.push(file);
// //       }
// //     }
// //   }

// //   // clear current set of files
// //   clearStage();

// //   // determine which of these is likely the root file
// //   let rootFileCandidates = [];
// //   let usdaCandidates = [];
  
// //   // sort so shorter paths come first
// //   allFiles.sort((a, b) => {
// //     const diff = a.fullPath.split('/').length - b.fullPath.split('/').length;
// //     if (diff !== 0) return diff;
// //     return a.fullPath.localeCompare(b.fullPath);
// //   });

// //   // console.log("path candidates", allFiles);

// //   for (const file of allFiles) {
// //     if (debugFileHandling) console.log(file);
// //     // fullPath should only contain one slash, and should contain a valid USD extension
// //     let ext = file.name.split('.').pop();
// //     if(ext == 'usd' || ext == 'usdz' || ext == 'usda' || ext == 'usdc') {
// //       rootFileCandidates.push(file);
// //     }
// //     if(ext == 'usda') {
// //       usdaCandidates.push(file);
// //     }
// //   }

// //   let rootFile = undefined;

// //   // if there's multiple, use the first usda
// //   if (rootFileCandidates.length > 1) {
// //     if (usdaCandidates.length > 0) {
// //       rootFile = usdaCandidates[0];
// //     }
// //     else {
// //       rootFile = rootFileCandidates[0];
// //     }
// //   }
// //   else {
// //     // find the first usda file
// //     for (const file of allFiles) {
// //       let ext = file.name.split('.').pop();
// //       if(ext == 'usda' || ext == 'usdc' || ext == 'usdz' || ext == 'usd') {
// //         rootFile = file;
// //         break;
// //       }
// //     }
// //   }

// //   if (!rootFile && allFiles.length > 0) {
// //     // use first file
// //     rootFile = allFiles[0];
// //   }

// //   // TODO if there are still multiple candidates we should ask the user which one to use
// //   console.log("Assuming this is the root file: " + rootFile?.name); // + ". Total: " + allFiles.length, allFiles.map(f => f.fullPath).join('\n'));

// //   // remove the root file from the list of all files, we load it last
// //   if (rootFile) {
// //     allFiles.splice(allFiles.indexOf(rootFile), 1);
// //   }

// //   async function getFile(fileEntry) {
// //     try {
// //       return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
// //     } catch (err) {
// //       console.log(err);
// //     }
// //   }

// //   // Sort so that USD files come last and all references are already there.
// //   // As long as the root file is the last one this actually shouldn't matter
// //   allFiles.sort((a, b) => {
// //     let extA = a.name.split('.').pop();
// //     let extB = b.name.split('.').pop();
// //     if (extA == 'usd' || extA == 'usdz' || extA == 'usda' || extA == 'usdc') return 1;
// //     if (extB == 'usd' || extB == 'usdz' || extB == 'usda' || extB == 'usdc') return -1;
// //     return 0;
// //   });

// //   // load all files into memory
// //   for (const file of allFiles) {
// //     if (debugFileHandling) console.log("loading file ", file)
// //     await loadFile(await getFile(file), false, file.fullPath);
// //   }

// //   // THEN load the root file if it's a supported format

// //   if (rootFile) {
// //     const isSupportedFormat = ['usd', 'usdz', 'usda', 'usdc'].includes(rootFile.name.split('.').pop());
// //     if (!isSupportedFormat)
// //       console.error("Not a supported file format: ", rootFile.name);
// //     else
// //      loadFile(await getFile(rootFile), true, rootFile.fullPath);
// //   }
// // }

// // /**
// //  * @param {DragEvent} ev
// //  */
// // function dropHandler(ev) {
// //   if (debugFileHandling) console.log('File(s) dropped', ev.dataTransfer.items, ev.dataTransfer.files);

// //   // Prevent default behavior (Prevent file from being opened)
// //   ev.preventDefault();

// //   if (ev.dataTransfer.items)
// //   {
// //     /** @type {FileSystemEntry[]} */
// //     const allEntries = [];

// //     let haveGetAsEntry = false;
// //     if (ev.dataTransfer.items.length > 0)
// //       haveGetAsEntry = ("getAsEntry" in ev.dataTransfer.items[0]) || ("webkitGetAsEntry" in ev.dataTransfer.items[0]);

// //     if (haveGetAsEntry) {
// //       for (var i = 0; i < ev.dataTransfer.items.length; i++)
// //       {
// //         let item = ev.dataTransfer.items[i];
// //         /** @type {FileSystemEntry} */
// //         let entry = ("getAsEntry" in item) ? item.getAsEntry() : item.webkitGetAsEntry();
// //         allEntries.push(entry);
// //       }
// //       handleFilesystemEntries(allEntries);
// //       return;
// //     }

// //     for (var i = 0; i < ev.dataTransfer.items.length; i++)
// //     {
// //       let item = ev.dataTransfer.items[i];
      
// //       // API when there's no "getAsEntry" support
// //       console.log(item.kind, item, entry);
// //       if (item.kind === 'file')
// //       {
// //         var file = item.getAsFile();
// //         testAndLoadFile(file);
// //       }
// //       // could also be a directory
// //       else if (item.kind === 'directory')
// //       {
// //         var dirReader = item.createReader();
// //         dirReader.readEntries(function(entries) {
// //           for (var i = 0; i < entries.length; i++) {
// //             console.log(entries[i].name);
// //             var entry = entries[i];
// //             if (entry.isFile) {
// //               entry.file(function(file) {
// //                 testAndLoadFile(file);
// //               });
// //             }
// //           }
// //         });
// //       }
// //     }
// //   } else {
// //     for (var i = 0; i < ev.dataTransfer.files.length; i++) {
// //       let file = ev.dataTransfer.files[i];
// //       testAndLoadFile(file);
// //     }
// //   }
// // }

// // function dragOverHandler(ev) {
// //   ev.preventDefault();
// // }
// // });
// // };

           









// // import { Vector3, Box3, PerspectiveCamera, Scene, Color, AmbientLight, Group, PointLight, WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping, VSMShadowMap, PMREMGenerator, EquirectangularReflectionMapping } from 'three';
// // import { ThreeRenderDelegateInterface } from "./usd/hydra/ThreeJsRenderDelegate.js"
// // import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// // import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// // import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
// // import './usd/bindings/emHdBindings.js';

// // // Global access for the USD Emscripten Module
// // const getUsdModule = globalThis["NEEDLE:USD:GET"];

// // /** Configuration for the environment and camera. */
// // const DEFAULT_OPTIONS = {
// //     hdrPath: 'environments/neutral.hdr',
// //     defaultCameraZ: 7,
// //     defaultCameraY: 7,
// //     defaultCameraX: 0,
// //     debugFileHandling: false
// // };

// // let scene, camera, renderer, controls, messageLog;
// // let currentDisplayFilename = "";
// // let ready = false;
// // let timeout = 40; // Frame time (e.g., 1000/25 fps)
// // let endTimeCode = 1; // End frame for animation loop
// // window.allDrivers = []; // store all USD drivers (root + backgrounds)


// // // --- Utility Functions ---

// // /**
// //  * Replaces system alerts with console/UI messages.
// //  * @param {string} message 
// //  * @param {boolean} isError 
// //  */
// // function showUserMessage(message, isError = false) {
// //     console.log(isError ? "ERROR:" : "INFO:", message);
// //     if (messageLog) {
// //         messageLog.textContent = message;
// //         messageLog.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
// //     }
// // }

// // /**
// //  * Updates the filename displayed in the UI.
// //  * @param {string} __filename 
// //  */
// // function setFilenameText(__filename) {
// //     var _filename = __filename.split('/').pop().split('#')[0].split('?')[0];
// //     const _el = document.querySelector(".filename");
// //     if (_el) _el.innerText = _filename;
// //     currentDisplayFilename = _filename;
// // }

// // /**
// //  * Updates the browser's URL based on the loaded file.
// //  * @param {string} filename 
// //  * @param {string[]} bgUsds - Array of background USD file URLs. 
// //  */
// // function updateUrl(filename, bgUsds = []) {
// //     if (!filename) return;

// //     // Workaround for GitHub CORS: rewrite blob links to raw
// //     if (filename.includes("github.com")) {
// //         filename = filename.replace("github.com", "raw.githubusercontent.com");
// //         filename = filename.replace("/blob/", "/");
// //     }

// //     // Set quick look link
// //     let url = filename.split('?')[0];
// //     const quickLookLink = document.querySelector("a#quick-look-link");
// //     if (quickLookLink) quickLookLink.href = url;

// //     const currentUrl = new URL(window.location.href);
// //     currentUrl.searchParams.set("file", filename);
    
// //     // Handle multiple background files
// //     if (bgUsds && bgUsds.length > 0) {
// //         // Join paths with comma for the URL parameter
// //         currentUrl.searchParams.set("bgs", bgUsds.join(',')); 
// //     } else {
// //         currentUrl.searchParams.delete("bgs");
// //     }
    
// //     // Remove old 'bg' parameter for clean up
// //     currentUrl.searchParams.delete("bg"); 
    
// //     // Only update history if the URL has changed significantly
// //     if (window.location.search !== currentUrl.search) {
// //         window.history.pushState({}, filename, currentUrl);
// //     }
// // }

// // // --- USD File System (FS) Helpers ---

// // /**
// //  * Recursively retrieves all loaded file paths from the USD virtual filesystem.
// //  * @param {string} currentPath 
// //  * @param {string[]} paths 
// //  */
// // function getAllLoadedFilePaths(currentPath, paths) {
// //     const files = window.Usd.FS_readdir(currentPath);
// //     for (const file of files) {
// //         if (file === "." || file === "..") continue;
// //         const newPath = currentPath + file + "/";
// //         const data = window.Usd.FS_analyzePath(currentPath + file + "/");
// //         if (data.object.node_ops.readdir) {
// //             // Skip default directories
// //             if (["/dev/", "/proc/", "/home/", "/tmp/", "/usd/"].includes(newPath)) continue;
// //             getAllLoadedFilePaths(newPath, paths);
// //         } else {
// //             paths.push(data.path);
// //         }
// //     }
// // }

// // /**
// //  * Clears the USD stage and the Three.js root group.
// //  */
// // function clearStage() {
// //     if (!window.Usd || !window.usdRoot) return;

// //     // 1. Unlink all files from USD virtual FS
// //     const allFilePaths = [];
// //     getAllLoadedFilePaths("/", allFilePaths);
// //     console.log("Clearing stage. Unlinking files:", allFilePaths);

// //     for (const file of allFilePaths) {
// //         try {
// //             window.Usd.FS_unlink(file, true);
// //         } catch (e) {
// //             console.warn(`Could not unlink file ${file}:`, e);
// //         }
// //     }

// //     // 2. Clear Three.js scene group
// //     window.usdRoot.clear();
// //     ready = false;
// //     currentDisplayFilename = "";
// //     showUserMessage("Stage cleared.");
// // }

// // // --- Three.js & Scene Setup ---

// // /**
// //  * Fits the camera to contain the entire selection of objects.
// //  * @param {PerspectiveCamera} camera 
// //  * @param {OrbitControls} controls 
// //  * @param {Group[]} selection 
// //  * @param {number} fitOffset 
// //  */
// // function fitCameraToSelection(camera, controls, selection, fitOffset = 1.5) {
// //     const box = new Box3().makeEmpty();
// //     for(const object of selection) {
// //         // Expand by world space bounding box
// //         box.expandByObject(object);
// //     }
    
// //     const size = new Vector3();
// //     const center = new Vector3();
// //     box.getSize(size);
// //     box.getCenter(center);

// //     if (Number.isNaN(size.x)) {
// //         console.warn("Fit Camera failed: NaN values found (object likely has no geometry).");
// //         if (controls) controls.update();
// //         return;
// //     }

// //     if (!controls) return;

// //     const maxSize = Math.max(size.x, size.y, size.z);
// //     const fovRad = Math.PI * camera.fov / 360;
// //     const fitHeightDistance = maxSize / (2 * Math.tan(fovRad));
// //     const fitWidthDistance = fitHeightDistance / camera.aspect;
// //     const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

// //     if (distance === 0) {
// //         console.warn("Fit Camera failed: distance is 0.");
// //         return;
// //     }

// //     controls.maxDistance = distance * 10;
// //     controls.target.copy(center);

// //     camera.near = distance / 100;
// //     camera.far = distance * 100;

// //     camera.updateProjectionMatrix();

// //     // Calculate new position based on target and distance
// //     const direction = camera.position.clone()
// //         .sub(controls.target)
// //         .normalize()
// //         .multiplyScalar(distance);

// //     camera.position.copy(controls.target).add(direction);
// //     controls.update();

// //     console.log("Fitting camera to selection", { size, center, distance });
// // }

// // /**
// //  * Initializes Three.js renderer, camera, scene, and controls.
// //  * @param {object} options 
// //  * @returns {Promise<void>} Resolves when the environment map is loaded.
// //  */
// // async function initThree(options) {
// //     camera = window.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 3500);
// //     const params = (new URL(document.location)).searchParams;
// //     camera.position.z = parseFloat(params.get('cameraZ')) || options.defaultCameraZ;
// //     camera.position.y = parseFloat(params.get('cameraY')) || options.defaultCameraY;
// //     camera.position.x = parseFloat(params.get('cameraX')) || options.defaultCameraX;

// //     scene = window.scene = new Scene();
// //     window.usdRoot = new Group();
// //     window.usdRoot.name = "USD Root";
// //     scene.add(window.usdRoot);

// //     renderer = window.renderer = new WebGLRenderer({ antialias: true, alpha: true });
// //     renderer.setPixelRatio(window.devicePixelRatio);
// //     renderer.setSize(window.innerWidth, window.innerHeight);
// //     renderer.outputColorSpace = SRGBColorSpace;
// //     renderer.toneMapping = NeutralToneMapping; // Neutral is often better for PBR in viewers
// //     renderer.shadowMap.enabled = false;
// //     renderer.setClearColor(0x000000, 0);

// //     const envMapPromise = new Promise(resolve => {
// //         const pmremGenerator = new PMREMGenerator(renderer);
// //         pmremGenerator.compileCubemapShader();

// //         new RGBELoader().load(options.hdrPath, (texture) => {
// //             const hdrRenderTarget = pmremGenerator.fromEquirectangular(texture);
// //             texture.mapping = EquirectangularReflectionMapping;
// //             texture.needsUpdate = true;
// //             scene.environment = hdrRenderTarget.texture;
// //             console.log("HDR Environment loaded.");
// //             resolve();
// //         }, undefined, (err) => {
// //             console.error('Failed to load HDR environment map. Scene environment will be null.', err);
// //             resolve(); // Resolve even on error to continue initialization
// //         });
// //     });

// //     document.body.appendChild(renderer.domElement);
// //     controls = window._controls = new OrbitControls(camera, renderer.domElement);
// //     controls.enableDamping = true;
// //     controls.dampingFactor = 0.2;

// //     controls.update();

// //     window.addEventListener('resize', onWindowResize);
// //     renderer.domElement.addEventListener("drop", dropHandler);
// //     renderer.domElement.addEventListener("dragover", dragOverHandler);

// //     return envMapPromise;
// // }

// // function onWindowResize() {
// //     camera.aspect = window.innerWidth / window.innerHeight;
// //     camera.updateProjectionMatrix();
// //     renderer.setSize(window.innerWidth, window.innerHeight);
// // }

// // function render() {
// //     if (renderer && scene && camera) {
// //         renderer.render(scene, camera);
// //     }
// // }

// // // --- USD Loading Logic ---

// // /**
// //  * Loads a USD stage and renders it into the Three.js scene.
// //  * This function handles both the primary file and background/referenced files.
// //  * * @param {string} path - The path to the USD file (URL or virtual FS path)
// //  * @param {boolean} isRoot - Is this the primary file being loaded?
// //  * @param {Group} targetRoot - The Three.js group to attach the content to. Defaults to window.usdRoot.
// //  * @returns {Promise<{driver: Usd.HdWebSyncDriver, stage: Usd.Stage}>}
// //  */
// // async function loadSingleUsdStage(path, isRoot = true, targetRoot = window.usdRoot) {
// //     if (DEFAULT_OPTIONS.debugFileHandling) console.warn("Attempting to load USD stage:", path, "Is Root:", isRoot);

// //     let driver = null;
// //     const delegateConfig = {
// //         usdRoot: targetRoot,
// //         paths: new Array(),
// //         driver: () => driver,
// //     };

// //     try {
// //         const renderInterface = new ThreeRenderDelegateInterface(path, delegateConfig);
// //         driver = await (new window.Usd.HdWebSyncDriver(renderInterface, path));
// //     } catch (e) {
// //         console.error(`Error initializing Hydra driver for ${path}:`, e);
// //         throw new Error(`Failed to initialize USD driver for ${path}`);
// //     }

// //     let stage = driver.GetStage();
// //     if (stage instanceof Promise) {
// //         stage = await stage;
// //         // Re-get stage after potential async loading
// //         stage = driver.GetStage();
// //     }
    
    
// //     if (isRoot) {
// //         // Only call Draw once all dependencies are loaded (in the main file loading process)
// //         // If not the root, Draw will be called externally or implicitly via the delegate setup
// //         driver.Draw();
// //     }

// //     return { driver, stage };
// // }


// // /**
// //  * Orchestrates the loading of the primary USD file and any background files.
// //  * @param {string} filename 
// //  * @param {string} path 
// //  * @param {string[]} extraUsdPaths 
// //  */
// // async function loadUsdFile(filename, path, extraUsdPaths = []) {
// //     setFilenameText(filename);
// //     showUserMessage(`Loading primary file: ${filename}...`);
    
// //     // 1. Load Primary USD Stage
// //     let rootStageResult;
// //     try {
// //         // path here is the URL or the FS path to the main file
// //         rootStageResult = await loadSingleUsdStage(path, true, window.usdRoot);
// //         window.driver = rootStageResult.driver;
// //         window.usdStage = rootStageResult.stage;
// //         window.allDrivers.push(rootStageResult.driver); // include root driver in array

// //     } catch (e) {
// //         showUserMessage(`Error loading primary USD file (${filename}). Check console for details.`, true);
// //         console.error("Primary USD Load Error:", e);
// //         return;
// //     }
    
// //     const stage = window.usdStage;

// //     // Set animation parameters
// //     if (stage.GetEndTimeCode) {
// //         endTimeCode = stage.GetEndTimeCode();
// //         timeout = 1000 / stage.GetTimeCodesPerSecond();
// //     }

// //     // Adjust rotation based on USD Up Axis (Z up vs Y up)
// //     // window.usdRoot.rotation.x = String.fromCharCode(stage.GetUpAxis()) === "z" ? -Math.PI / 2 : 0;
// //     const upAxis = String.fromCharCode(stage.GetUpAxis());

// //     // if (upAxis === "z") {
// //     //   window.usdRoot.rotation.x = -Math.PI / 2;

// //     //   if (window.extraUsdRoots) {
// //     //     for (const bg of window.extraUsdRoots) {
// //     //       bg.rotation.x = -Math.PI / 2;
// //     //     }
// //     //   }
// //     // } else {
// //     //   window.usdRoot.rotation.x = 0;
// //     // }

// //     // ✅ Done — no need to call fitCameraToScene


// //     // 2. Load Background USD Stage(s)
// //     if (extraUsdPaths.length > 0) {
// //         for (const bgPath of extraUsdPaths) {
// //             showUserMessage(`Loading background USD: ${bgPath}...`);
// //             try {
// //                 // Background files are loaded as separate, detached groups
// //                 const bgGroup = new Group();
// //                 const bgStageResult = await loadSingleUsdStage(bgPath, false, bgGroup);
// //                 window.usdRoot.add(bgGroup);
// //                 window.allDrivers.push(bgStageResult.driver); // add driver to the global array
// //                 console.log(`Successfully loaded background USD: ${bgPath}`);


// //             } catch (e) {
// //                 console.error(`Failed to load background USD: ${bgPath}. This could be a CORS issue if remote.`, e);
// //                 console.warn(`If ${bgPath} is remote, ensure its server sends 'Access-Control-Allow-Origin: *' header.`);
// //             }
// //         }
// //     }

    


    
// //     // 3. Finalize and Fit Camera
// //     fitCameraToSelection(camera, controls, [window.usdRoot]);
// //     ready = true;
// //     showUserMessage(`Successfully loaded ${currentDisplayFilename} (and ${extraUsdPaths.length} background${extraUsdPaths.length === 1 ? '' : 's'}).`);
// //     console.log("Loading complete. Scene elements:", window.usdRoot.children);

// //         // Delay the postMessage a bit to ensure the first render completed
// //     setTimeout(() => {
// //       window.parent.postMessage({ type: "USD_LOADED" }, "*");
// //       console.log("📤 USD_LOADED message sent to parent");
// //     }, 500);
// // }

// // // --- Animation Loop ---

// // let isPaused = false;
// // document.body.onkeyup = function(e){
// //     if(e.keyCode == 32){ // Spacebar
// //         isPaused = !isPaused;
// //         showUserMessage(isPaused ? "Rendering Paused (Press Space)" : "Rendering Active");
// //     }
// // }

// // async function animate() {
// //     if (!isPaused && ready) {
// //     const secs = new Date().getTime() / 1000;
// //     const time = (secs * (1000 / timeout)) % endTimeCode;

// //     for (const drv of window.allDrivers) {
// //         if (drv.SetTime && drv.Draw) {
// //             drv.SetTime(time);
// //             drv.Draw();
// //         }
// //     }
// // }


// //     window._controls.update();
// //     render();
    
// //     // Use requestAnimationFrame for smoother rendering
// //     requestAnimationFrame(animate); 
// // }

// // // --- Drag and Drop Logic ---

// // /**
// //  * Converts a FileSystemEntry into a File object.
// //  * @param {FileSystemFileEntry} fileEntry 
// //  * @returns {Promise<File>}
// //  */
// // async function getFileFromFileEntry(fileEntry) {
// //     try {
// //         return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
// //     } catch (err) {
// //         console.error("Error getting file from entry:", err);
// //         return null;
// //     }
// // }

// // /**
// //  * Loads a file from a URL or local file, writes it to the USD FS, and loads the stage.
// //  * @param {File|FileSystemFileEntry} fileOrHandle 
// //  * @param {boolean} isRootFile 
// //  * @param {string} fullPath 
// //  */
// // async function loadFile(fileOrHandle, isRootFile = true, fullPath = undefined) {
// //     let file;
// //     if (fileOrHandle.getFile) {
// //         file = await fileOrHandle.getFile();
// //     } else if (fileOrHandle.isFile && fileOrHandle.file) {
// //         // Handle FileSystemFileEntry for older APIs
// //         file = await getFileFromFileEntry(fileOrHandle);
// //     } else {
// //         file = fileOrHandle;
// //     }

// //     if (!file) {
// //         console.warn("Could not retrieve file data.");
// //         return;
// //     }

// //     try {
// //         const arrayBuffer = await file.arrayBuffer();
        
// //         let fileName = file.name;
// //         let directory = "/";
// //         if (fullPath !== undefined) {
// //             fileName = fullPath.split('/').pop();
// //             // Ensure directory path ends with a slash for FS_createPath
// //             directory = fullPath.substring(0, fullPath.length - fileName.length); 
// //             if (DEFAULT_OPTIONS.debugFileHandling) console.log("Virtual FS path:", { directory, fileName });
// //         }
        
// //         // 1. Create directory structure in USD FS
// //         window.Usd.FS_createPath("", directory, true, true); 
        
// //         // 2. Write file data
// //         window.Usd.FS_createDataFile(directory, fileName, new Uint8Array(arrayBuffer), true, true, true);

// //         if (isRootFile) {
// //             // Load the entire stage now that dependencies are in FS
// //             const params = (new URL(document.location)).searchParams;
// //             // Check for multiple backgrounds ('bgs') or legacy single ('bg')
// //             const bgUsdString = params.get("bgs") || params.get("bg"); 
// //             const extraUsd = bgUsdString ? bgUsdString.split(',').filter(p => p.trim() !== '') : [];
            
// //             await loadUsdFile(fileName, fullPath || `/${fileName}`, extraUsd);
// //             updateUrl(fullPath || fileName, extraUsd);
// //         }
// //     }
// //     catch(ex) {
// //         console.error("Error loading file into USD virtual FS:", file.name, ex);
// //         showUserMessage(`Error processing file ${file.name}. See console.`, true);
// //     }
// // }


// // /**
// //  * Processes all dropped filesystem entries (files or directories).
// //  * @param {FileSystemEntry[]} entries
// //  */
// // async function handleFilesystemEntries(entries) {
// //     showUserMessage("Processing dropped files...");
// //     const allFiles = [];
// //     const ignoreList = ['.gitignore', 'README.md', '.DS_Store', '.git', 'node_modules'];

// //     /** @type {(entry: FileSystemEntry) => Promise<void>} */
// //     const traverseEntry = async (entry) => {
// //         if (ignoreList.includes(entry.name)) return;

// //         if (entry.isFile) {
// //             // Get file path relative to the drop root (or just use entry.fullPath)
// //             allFiles.push(entry);
// //         } else if (entry.isDirectory) {
// //             const dirReader = entry.createReader();
// //             let results = [];
// //             let readBatch;
// //             do {
// //                 readBatch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
// //                 results = results.concat(readBatch);
// //             } while (readBatch.length > 0);

// //             for (const subEntry of results) {
// //                 await traverseEntry(subEntry);
// //             }
// //         }
// //     };

// //     for (const entry of entries) {
// //         await traverseEntry(entry);
// //     }

// //     // 1. Clear existing scene
// //     clearStage();

// //     // 2. Determine the root file (e.g., the shallowest USD file)
// //     let rootFile = allFiles
// //         .filter(f => ['usd', 'usdz', 'usda', 'usdc'].includes(f.name.split('.').pop()))
// //         .sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length)[0];

// //     if (!rootFile && allFiles.length > 0) {
// //         console.warn("Could not find a standard USD root file. Using first file as root.");
// //         rootFile = allFiles[0];
// //     }

// //     if (!rootFile) {
// //         showUserMessage("No loadable USD files found in dropped content.", true);
// //         return;
// //     }

// //     // 3. Load all dependencies first (not the root file)
// //     const filesToLoad = allFiles.filter(f => f !== rootFile);
// //     console.log(`Found ${allFiles.length} files. Dependencies to load: ${filesToLoad.length}`);

// //     // Sort dependencies to prioritize non-USD files (e.g., textures)
// //     filesToLoad.sort((a, b) => {
// //         let extA = a.name.split('.').pop();
// //         let extB = b.name.split('.').pop();
// //         const isUsdA = ['usd', 'usdz', 'usda', 'usdc'].includes(extA);
// //         const isUsdB = ['usd', 'usdz', 'usda', 'usdc'].includes(extB);
// //         if (isUsdA && !isUsdB) return 1;
// //         if (!isUsdA && isUsdB) return -1;
// //         return 0;
// //     });

// //     for (const fileEntry of filesToLoad) {
// //         showUserMessage(`Loading dependency: ${fileEntry.name}...`);
// //         await loadFile(fileEntry, false, fileEntry.fullPath);
// //     }

// //     // 4. Load the root file last
// //     showUserMessage(`Loading root file: ${rootFile.name}...`);
// //     await loadFile(rootFile, true, rootFile.fullPath);
// // }

// // /**
// //  * @param {DragEvent} ev
// //  */
// // function dropHandler(ev) {
// //     ev.preventDefault();
// //     if (!window.Usd) {
// //         showUserMessage("USD module not ready yet. Please wait.", true);
// //         return;
// //     }

// //     if (ev.dataTransfer.items) {
// //         const allEntries = [];
// //         let haveGetAsEntry = ("getAsEntry" in ev.dataTransfer.items[0]) || ("webkitGetAsEntry" in ev.dataTransfer.items[0]);

// //         if (haveGetAsEntry) {
// //             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
// //                 let item = ev.dataTransfer.items[i];
// //                 let entry = ("getAsEntry" in item) ? item.getAsEntry() : item.webkitGetAsEntry();
// //                 if (entry) allEntries.push(entry);
// //             }
// //             handleFilesystemEntries(allEntries);
// //         } else {
// //             // Fallback for browsers without proper Directory drag support
// //             const files = [];
// //             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
// //                 let file = ev.dataTransfer.items[i].getAsFile();
// //                 if (file) files.push(file);
// //             }
// //             if (files.length > 0) {
// //                 clearStage();
// //                 // Assumes the first file is the root if only files are dropped
// //                 loadFile(files[0], true, `/${files[0].name}`);
// //             }
// //         }
// //     }
// // }

// // function dragOverHandler(ev) {
// //     ev.preventDefault();
// // }


// // // --- Export Logic ---

// // /**
// //  * Attaches event listeners for export buttons.
// //  */
// // function setupExportListeners() {
// //     const usdzExportBtn = document.getElementById('export-usdz');
// //     if (usdzExportBtn) usdzExportBtn.addEventListener('click', () => {
// //         showUserMessage("USDZ export is not supported in this WebAssembly build yet.", true);
// //     });

// //     const gltfExportBtn = document.getElementById('export-gltf');
// //     if (gltfExportBtn) gltfExportBtn.addEventListener('click', (evt) => {
// //         evt.preventDefault();
// //         if (!window.usdRoot) return showUserMessage("Nothing to export.", true);

// //         showUserMessage("Exporting to GLB (GLTF binary)...");
// //         const exporter = new GLTFExporter();
        
// //         exporter.parse(window.usdRoot, function (gltfArrayBuffer) {
// //             try {
// //                 const blob = new Blob([gltfArrayBuffer], {type: 'model/gltf-binary'});
// //                 const url = URL.createObjectURL(blob);
// //                 const a = document.createElement('a');
// //                 a.href = url;
                
// //                 // Construct clean filename
// //                 let filename = currentDisplayFilename.split('/').pop().split('.')[0].split('?')[0];
// //                 a.download = (filename || 'exported_usd_model') + ".glb";
                
// //                 a.click();
// //                 URL.revokeObjectURL(url);
// //                 showUserMessage("Exported GLB successfully.");
// //             } catch (e) {
// //                 console.error("Error during GLB file download:", e);
// //                 showUserMessage("Error during GLB file download.", true);
// //             }
// //         }, function (error) {
// //             console.error("GLTF Export Error:", error);
// //             showUserMessage("GLTF Export Failed. See console.", true);
// //         }, { 
// //             binary: true,
// //             // Animations are complex in USD/Hydra, usually handled separately
// //             animations: [] 
// //         });
// //     });
// // }


// // // --- Main Entry Point ---

// // export function init(options = {}) {
// //     // Merge provided options with defaults
// //     const finalOptions = { ...DEFAULT_OPTIONS, ...options };

// //     document.addEventListener("DOMContentLoaded", async function() {
// //         messageLog = document.querySelector("#message-log");
// //         showUserMessage("Initializing 3D viewer...");

// //         const params = (new URL(document.location)).searchParams;
// //         let filename = params.get("file") || "";
        
// //         // Combined logic to get multiple background paths from 'bgs' or legacy 'bg'
// //         let bgUsdString = params.get("bgs") || params.get("bg");
// //         let extraUsd = [];
// //         if (bgUsdString) {
// //             extraUsd = bgUsdString.split(',').filter(p => p.trim() !== '');
// //         }

// //         // 1. Initialize Three.js scene and load environment map
// //         const threeInitPromise = initThree(finalOptions);

// //         // 2. Load USD Module (WebAssembly)
// //         showUserMessage("Loading USD Module (WebAssembly) – this may take a moment...");
// //         try {
// //             const [Usd] = await Promise.all([
// //                 getUsdModule({
// //                     mainScriptUrlOrBlob: "./emHdBindings.js",
// //                     locateFile: (file) => {
// //                         return "/usd/bindings/" + file;
// //                     },
// //                 }),
// //                 threeInitPromise
// //             ]);
// //             window.Usd = Usd;
// //             showUserMessage("USD Module loaded.");

// //             // 3. Setup export listeners
// //             setupExportListeners();

// //             // 4. Load initial file from URL if present
// //             if (filename) {
// //                 const el = document.querySelector("#container");
// //                 el.classList.add("have-custom-file");
                
// //                 // Get URL path for loading
// //                 const urlPath = filename.split('?')[0];
                
// //                 // Load the USD file(s)
// //                 await loadUsdFile(filename, urlPath, extraUsd);
// //                 updateUrl(filename, extraUsd);
// //             }
            
// //             // 5. Start the animation loop
// //             animate();

// //         } catch (error) {
// //             let errorMessage = "An unknown error occurred during initialization.";
// //             if(error.toString().includes("SharedArrayBuffer")) {
// //                 errorMessage = "Your browser doesn't support SharedArrayBuffer (COOP/COEP headers missing), which is required for USD.";
// //             } else {
// //                 errorMessage = "Error during USD module initialization: " + error.message;
// //             }
// //             console.error(error);
// //             showUserMessage(errorMessage, true);
// //         }
// //     });
// // }








// import { Vector3, Box3, PerspectiveCamera, Scene, Color, AmbientLight, Group, PointLight, WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping, VSMShadowMap, PMREMGenerator, EquirectangularReflectionMapping } from 'three';
// import { ThreeRenderDelegateInterface } from "./usd/hydra/ThreeJsRenderDelegate.js"
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
// import './usd/bindings/emHdBindings.js';

// // Global access for the USD Emscripten Module
// const getUsdModule = globalThis["NEEDLE:USD:GET"];

// /** Configuration for the environment and camera. */
// const DEFAULT_OPTIONS = {
//     hdrPath: 'environments/neutral.hdr',
//     defaultCameraZ: 7,
//     defaultCameraY: 7,
//     defaultCameraX: 0,
//     debugFileHandling: false
// };

// let scene, camera, renderer, controls, messageLog;
// let currentDisplayFilename = "";
// let ready = false;
// let timeout = 40; // Frame time (e.g., 1000/25 fps)
// let endTimeCode = 1; // End frame for animation loop
// window.allDrivers = []; // store all USD drivers (root + backgrounds)


// // --- Utility Functions ---

// /**
//  * Replaces system alerts with console/UI messages.
//  * @param {string} message 
//  * @param {boolean} isError 
//  */
// function showUserMessage(message, isError = false) {
//     console.log(isError ? "ERROR:" : "INFO:", message);
//     // if (messageLog) {
//     //     messageLog.textContent = message;
//     //     messageLog.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
//     // }
//     if (messageLog) {
//         messageLog.textContent = message;
//         messageLog.style.background = "linear-gradient(to right, #a78bfa, #f472b6, #8b5cf6)"; // purple-pink gradient
//         messageLog.style.webkitBackgroundClip = "text";
//         messageLog.style.color = "transparent";
//         messageLog.style.fontWeight = "600"; // optional bold
//         messageLog.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
// }
// }

// /**
//  * Updates the filename displayed in the UI.
//  * @param {string} __filename 
//  */
// function setFilenameText(__filename) {
//     var _filename = __filename.split('/').pop().split('#')[0].split('?')[0];
//     const _el = document.querySelector(".filename");
//     if (_el) _el.innerText = _filename;
//     currentDisplayFilename = _filename;
// }

// /**
//  * Updates the browser's URL based on the loaded file.
//  * @param {string} filename 
//  * @param {string[]} bgUsds - Array of background USD file URLs. 
//  */
// function updateUrl(filename, bgUsds = []) {
//     if (!filename) return;

//     // Workaround for GitHub CORS: rewrite blob links to raw
//     if (filename.includes("github.com")) {
//         filename = filename.replace("github.com", "raw.githubusercontent.com");
//         filename = filename.replace("/blob/", "/");
//     }

//     // Set quick look link
//     let url = filename.split('?')[0];
//     const quickLookLink = document.querySelector("a#quick-look-link");
//     if (quickLookLink) quickLookLink.href = url;

//     const currentUrl = new URL(window.location.href);
//     currentUrl.searchParams.set("file", filename);
    
//     // Handle multiple background files
//     if (bgUsds && bgUsds.length > 0) {
//         // Join paths with comma for the URL parameter
//         currentUrl.searchParams.set("bgs", bgUsds.join(',')); 
//     } else {
//         currentUrl.searchParams.delete("bgs");
//     }
    
//     // Remove old 'bg' parameter for clean up
//     currentUrl.searchParams.delete("bg"); 
    
//     // Only update history if the URL has changed significantly
//     if (window.location.search !== currentUrl.search) {
//         window.history.pushState({}, filename, currentUrl);
//     }
// }

// // --- USD File System (FS) Helpers ---

// /**
//  * Recursively retrieves all loaded file paths from the USD virtual filesystem.
//  * @param {string} currentPath 
//  * @param {string[]} paths 
//  */
// function getAllLoadedFilePaths(currentPath, paths) {
//     const files = window.Usd.FS_readdir(currentPath);
//     for (const file of files) {
//         if (file === "." || file === "..") continue;
//         const newPath = currentPath + file + "/";
//         const data = window.Usd.FS_analyzePath(currentPath + file + "/");
//         if (data.object.node_ops.readdir) {
//             // Skip default directories
//             if (["/dev/", "/proc/", "/home/", "/tmp/", "/usd/"].includes(newPath)) continue;
//             getAllLoadedFilePaths(newPath, paths);
//         } else {
//             paths.push(data.path);
//         }
//     }
// }

// /**
//  * Clears the USD stage and the Three.js root group.
//  */
// function clearStage() {
//     if (!window.Usd || !window.usdRoot) return;

//     // 1. Unlink all files from USD virtual FS
//     const allFilePaths = [];
//     getAllLoadedFilePaths("/", allFilePaths);
//     console.log("Clearing stage. Unlinking files:", allFilePaths);

//     for (const file of allFilePaths) {
//         try {
//             window.Usd.FS_unlink(file, true);
//         } catch (e) {
//             console.warn(`Could not unlink file ${file}:`, e);
//         }
//     }

//     // 2. Clear Three.js scene group
//     window.usdRoot.clear();
//     ready = false;
//     currentDisplayFilename = "";
//     // showUserMessage("Stage cleared.");
// }

// // --- Drag and Drop Logic ---

// /**
//  * Converts a FileSystemEntry into a File object.
//  * @param {FileSystemFileEntry} fileEntry 
//  * @returns {Promise<File>}
//  */
// async function getFileFromFileEntry(fileEntry) {
//     try {
//         return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
//     } catch (err) {
//         console.error("Error getting file from entry:", err);
//         return null;
//     }
// }

// /**
//  * Loads a file from a URL or local file, writes it to the USD FS, and loads the stage.
//  * @param {File|FileSystemFileEntry} fileOrHandle 
//  * @param {boolean} isRootFile 
//  * @param {string} fullPath 
//  */
// async function loadFile(fileOrHandle, isRootFile = true, fullPath = undefined) {
//     let file;
//     if (fileOrHandle.getFile) {
//         file = await fileOrHandle.getFile();
//     } else if (fileOrHandle.isFile && fileOrHandle.file) {
//         // Handle FileSystemFileEntry for older APIs
//         file = await getFileFromFileEntry(fileOrHandle);
//     } else {
//         file = fileOrHandle;
//     }

//     if (!file) {
//         console.warn("Could not retrieve file data.");
//         return;
//     }

//     try {
//         const arrayBuffer = await file.arrayBuffer();
        
//         let fileName = file.name;
//         let directory = "/";
//         if (fullPath !== undefined) {
//             fileName = fullPath.split('/').pop();
//             // Ensure directory path ends with a slash for FS_createPath
//             directory = fullPath.substring(0, fullPath.length - fileName.length); 
//             if (DEFAULT_OPTIONS.debugFileHandling) console.log("Virtual FS path:", { directory, fileName });
//         }
        
//         // 1. Create directory structure in USD FS
//         window.Usd.FS_createPath("", directory, true, true); 
        
//         // 2. Write file data
//         window.Usd.FS_createDataFile(directory, fileName, new Uint8Array(arrayBuffer), true, true, true);

//         if (isRootFile) {
//             // Load the entire stage now that dependencies are in FS
//             const params = (new URL(document.location)).searchParams;
//             // Check for multiple backgrounds ('bgs') or legacy single ('bg')
//             const bgUsdString = params.get("bgs") || params.get("bg"); 
//             const extraUsd = bgUsdString ? bgUsdString.split(',').filter(p => p.trim() !== '') : [];
            
//             await loadUsdFile(fileName, fullPath || `/${fileName}`, extraUsd);
//             updateUrl(fullPath || fileName, extraUsd);
//         }
//     }
//     catch(ex) {
//         console.error("Error loading file into USD virtual FS:", file.name, ex);
//         showUserMessage(`Error processing file ${file.name}. See console.`, true);
//     }
// }


// /**
//  * Processes all dropped filesystem entries (files or directories).
//  * @param {FileSystemEntry[]} entries
//  */
// async function handleFilesystemEntries(entries) {
//     // showUserMessage("Processing dropped files...");
//     const allFiles = [];
//     const ignoreList = ['.gitignore', 'README.md', '.DS_Store', '.git', 'node_modules'];

//     /** @type {(entry: FileSystemEntry) => Promise<void>} */
//     const traverseEntry = async (entry) => {
//         if (ignoreList.includes(entry.name)) return;

//         if (entry.isFile) {
//             // Get file path relative to the drop root (or just use entry.fullPath)
//             allFiles.push(entry);
//         } else if (entry.isDirectory) {
//             const dirReader = entry.createReader();
//             let results = [];
//             let readBatch;
//             do {
//                 readBatch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
//                 results = results.concat(readBatch);
//             } while (readBatch.length > 0);

//             for (const subEntry of results) {
//                 await traverseEntry(subEntry);
//             }
//         }
//     };

//     for (const entry of entries) {
//         await traverseEntry(entry);
//     }

//     // 1. Clear existing scene
//     clearStage();

//     // 2. Determine the root file (e.g., the shallowest USD file)
//     let rootFile = allFiles
//         .filter(f => ['usd', 'usdz', 'usda', 'usdc'].includes(f.name.split('.').pop()))
//         .sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length)[0];

//     if (!rootFile && allFiles.length > 0) {
//         console.warn("Could not find a standard USD root file. Using first file as root.");
//         rootFile = allFiles[0];
//     }

//     if (!rootFile) {
//         // showUserMessage("No loadable USD files found in dropped content.", true);
//         return;
//     }

//     // 3. Load all dependencies first (not the root file)
//     const filesToLoad = allFiles.filter(f => f !== rootFile);
//     console.log(`Found ${allFiles.length} files. Dependencies to load: ${filesToLoad.length}`);

//     // Sort dependencies to prioritize non-USD files (e.g., textures)
//     filesToLoad.sort((a, b) => {
//         let extA = a.name.split('.').pop();
//         let extB = b.name.split('.').pop();
//         const isUsdA = ['usd', 'usdz', 'usda', 'usdc'].includes(extA);
//         const isUsdB = ['usd', 'usdz', 'usda', 'usdc'].includes(extB);
//         if (isUsdA && !isUsdB) return 1;
//         if (!isUsdA && isUsdB) return -1;
//         return 0;
//     });

//     for (const fileEntry of filesToLoad) {
//         // showUserMessage(`Loading dependency: ${fileEntry.name}...`);
//         await loadFile(fileEntry, false, fileEntry.fullPath);
//     }

//     // 4. Load the root file last
//     // showUserMessage(`Loading root file: ${rootFile.name}...`);
//     await loadFile(rootFile, true, rootFile.fullPath);
// }

// /**
//  * @param {DragEvent} ev
//  */
// function dropHandler(ev) {
//     ev.preventDefault();
//     if (!window.Usd) {
//         // showUserMessage("USD module not ready yet. Please wait.", true);
//         return;
//     }

//     if (ev.dataTransfer.items) {
//         const allEntries = [];
//         let haveGetAsEntry = ("getAsEntry" in ev.dataTransfer.items[0]) || ("webkitGetAsEntry" in ev.dataTransfer.items[0]);

//         if (haveGetAsEntry) {
//             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
//                 let item = ev.dataTransfer.items[i];
//                 let entry = ("getAsEntry" in item) ? item.getAsEntry() : item.webkitGetAsEntry();
//                 if (entry) allEntries.push(entry);
//             }
//             handleFilesystemEntries(allEntries);
//         } else {
//             // Fallback for browsers without proper Directory drag support
//             const files = [];
//             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
//                 let file = ev.dataTransfer.items[i].getAsFile();
//                 if (file) files.push(file);
//             }
//             if (files.length > 0) {
//                 clearStage();
//                 // Assumes the first file is the root if only files are dropped
//                 loadFile(files[0], true, `/${files[0].name}`);
//             }
//         }
//     }
// }

// function dragOverHandler(ev) {
//     ev.preventDefault();
// }

// // --- Three.js & Scene Setup ---

// /**
//  * Fits the camera to contain the entire selection of objects.
//  * NOTE: Assumes the selection group is already centered at (0, 0, 0)
//  * @param {PerspectiveCamera} camera 
//  * @param {OrbitControls} controls 
//  * @param {Group[]} selection 
//  * @param {number} fitOffset 
//  */
// function fitCameraToSelection(camera, controls, selection, fitOffset = 1.5) {
//     const box = new Box3().makeEmpty();
//     for(const object of selection) {
//         // Expand by world space bounding box
//         box.expandByObject(object);
//     }
    
//     const size = new Vector3();
//     const center = new Vector3();
//     box.getSize(size);
//     box.getCenter(center); // Should be close to (0, 0, 0) due to pre-translation

//     if (Number.isNaN(size.x)) {
//         console.warn("Fit Camera failed: NaN values found (object likely has no geometry).");
//         if (controls) controls.update();
//         return;
//     }

//     if (!controls) return;
    
//     // Explicitly set the control target to the calculated center (should be origin)
//     controls.target.copy(center); 

//     const maxSize = Math.max(size.x, size.y, size.z);
//     const fovRad = Math.PI * camera.fov / 360;
//     const fitHeightDistance = maxSize / (2 * Math.tan(fovRad));
//     const fitWidthDistance = fitHeightDistance / camera.aspect;
//     const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

//     if (distance === 0) {
//         console.warn("Fit Camera failed: distance is 0.");
//         return;
//     }

//     controls.maxDistance = distance * 10;

//     camera.near = distance / 100;
//     camera.far = distance * 100;

//     camera.updateProjectionMatrix();

//     // Calculate new position based on target and distance
//     // This repositions the camera based on its *current* direction relative to the new target (center)
//     const direction = camera.position.clone()
//         .sub(controls.target)
//         .normalize()
//         .multiplyScalar(distance);

//     camera.position.copy(controls.target).add(direction);
//     controls.update();

//     console.log("Fitting camera to selection", { size, center: center.toArray(), distance });
// }

// /**
//  * Initializes Three.js renderer, camera, scene, and controls.
//  * @param {object} options 
//  * @returns {Promise<void>} Resolves when the environment map is loaded.
//  */
// async function initThree(options) {
//     camera = window.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 3500);
//     const params = (new URL(document.location)).searchParams;
//     camera.position.z = parseFloat(params.get('cameraZ')) || options.defaultCameraZ;
//     camera.position.y = parseFloat(params.get('cameraY')) || options.defaultCameraY;
//     camera.position.x = parseFloat(params.get('cameraX')) || options.defaultCameraX;

//     scene = window.scene = new Scene();
//     window.usdRoot = new Group();
//     window.usdRoot.name = "USD Root";
//     scene.add(window.usdRoot);

//     // renderer = window.renderer = new WebGLRenderer({ antialias: true, alpha: true });
//     // renderer.setPixelRatio(window.devicePixelRatio);
//     // renderer.setSize(window.innerWidth / 1.05, window.innerHeight / 1.05); // slightly smaller to see edges
//     // ...
//     renderer = window.renderer = new WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setPixelRatio(window.devicePixelRatio);
// // ✅ WITH THIS LINE:
//     renderer.setSize(window.innerWidth, window.innerHeight); // Set to full window size
// // ...
//     renderer.outputColorSpace = SRGBColorSpace;
//     renderer.toneMapping = NeutralToneMapping; // Neutral is often better for PBR in viewers
//     renderer.shadowMap.enabled = false;
//     renderer.setClearColor(0x000000, 0);

//     const envMapPromise = new Promise(resolve => {
//         const pmremGenerator = new PMREMGenerator(renderer);
//         pmremGenerator.compileCubemapShader();

//         new RGBELoader().load(options.hdrPath, (texture) => {
//             const hdrRenderTarget = pmremGenerator.fromEquirectangular(texture);
//             texture.mapping = EquirectangularReflectionMapping;
//             texture.needsUpdate = true;
//             scene.environment = hdrRenderTarget.texture;
//             console.log("HDR Environment loaded.");
//             resolve();
//         }, undefined, (err) => {
//             console.error('Failed to load HDR environment map. Scene environment will be null.', err);
//             resolve(); // Resolve even on error to continue initialization
//         });
//     });

//     document.body.appendChild(renderer.domElement);
//     controls = window._controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.2;

//     controls.update();

//     window.addEventListener('resize', onWindowResize);
//     renderer.domElement.addEventListener("drop", dropHandler);
//     renderer.domElement.addEventListener("dragover", dragOverHandler);

//     return envMapPromise;
// }

// function onWindowResize() {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function render() {
//     if (renderer && scene && camera) {
//         renderer.render(scene, camera);
//     }
// }

// // --- USD Loading Logic ---

// /**
//  * Loads a USD stage and renders it into the Three.js scene.
//  * This function handles both the primary file and background/referenced files.
//  * * @param {string} path - The path to the USD file (URL or virtual FS path)
//  * @param {boolean} isRoot - Is this the primary file being loaded?
//  * @param {Group} targetRoot - The Three.js group to attach the content to. Defaults to window.usdRoot.
//  * @returns {Promise<{driver: Usd.HdWebSyncDriver, stage: Usd.Stage}>}
//  */
// async function loadSingleUsdStage(path, isRoot = true, targetRoot = window.usdRoot) {
//     if (DEFAULT_OPTIONS.debugFileHandling) console.warn("Attempting to load USD stage:", path, "Is Root:", isRoot);

//     let driver = null;
//     const delegateConfig = {
//         usdRoot: targetRoot,
//         paths: new Array(),
//         driver: () => driver,
//     };

//     try {
//         const renderInterface = new ThreeRenderDelegateInterface(path, delegateConfig);
//         driver = await (new window.Usd.HdWebSyncDriver(renderInterface, path));
//     } catch (e) {
//         console.error(`Error initializing Hydra driver for ${path}:`, e);
//         throw new Error(`Failed to initialize USD driver for ${path}`);
//     }

//     let stage = driver.GetStage();
//     if (stage instanceof Promise) {
//         stage = await stage;
//         // Re-get stage after potential async loading
//         stage = driver.GetStage();
//     }
    
    
//     if (isRoot) {
//         // Only call Draw once all dependencies are loaded (in the main file loading process)
//         // If not the root, Draw will be called externally or implicitly via the delegate setup
//         driver.Draw();
//     }

//     return { driver, stage };
// }


// /**
//  * Orchestrates the loading of the primary USD file and any background files.
//  * @param {string} filename 
//  * @param {string} path 
//  * @param {string[]} extraUsdPaths 
//  */
// async function loadUsdFile(filename, path, extraUsdPaths = []) {
//     setFilenameText(filename);
//     // showUserMessage(`Loading primary file: ${filename}...`);
    
//     // 1. Load Primary USD Stage
//     let rootStageResult;
//     try {
//         // path here is the URL or the FS path to the main file
//         rootStageResult = await loadSingleUsdStage(path, true, window.usdRoot);
//         window.driver = rootStageResult.driver;
//         window.usdStage = rootStageResult.stage;
//         window.allDrivers.push(rootStageResult.driver); // include root driver in array

//     } catch (e) {
//         // showUserMessage(`Error loading primary USD file (${filename}). Check console for details.`, true);
//         console.error("Primary USD Load Error:", e);
//         return;
//     }
    
//     const stage = window.usdStage;

//     // Set animation parameters
//     if (stage.GetEndTimeCode) {
//         endTimeCode = stage.GetEndTimeCode();
//         timeout = 1000 / stage.GetTimeCodesPerSecond();
//     }

//     // --- START OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
//     // 2. Calculate the un-transformed bounding box
//     const initialBox = new Box3().setFromObject(window.usdRoot);
//     const center = new Vector3();
//     initialBox.getCenter(center);
    
//     // 3. **Translate the root group so its center is at the world origin (0, 0, 0)**
//     // This ensures that all subsequent rotations are perfectly centered.
//     window.usdRoot.position.sub(center);

//     // 4. Apply rotation based on USD Up Axis (Z up vs Y up).
//     const upAxis = String.fromCharCode(stage.GetUpAxis()).toUpperCase();
    
//     // Reset rotation/scale to defaults first
//     window.usdRoot.rotation.set(0, 0, 0);
//     window.usdRoot.scale.set(1, 1, 1);
    
//     if (upAxis === "Z") {
//         // Z-up to Y-up conversion: Rotate -90 degrees around X
//         window.usdRoot.rotation.x = -Math.PI / 2; 
        
//         // Rotate 180 degrees around Y to correct "backwards" view after Z-up conversion.
//         window.usdRoot.rotation.y = Math.PI;
//     }

//     // 5. IMPORTANT: Force Three.js to calculate the object's final world position/bounds 
//     // immediately after the transformations are applied.
//     window.usdRoot.updateWorldMatrix(true, true);
    
//     // --- END OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
//     // 6. Load Background USD Stage(s)
//     if (extraUsdPaths.length > 0) {
//         for (const bgPath of extraUsdPaths) {
//             // showUserMessage(`Loading background USD: ${bgPath}...`);
//             try {
//                 // Background files are loaded as separate, detached groups
//                 const bgGroup = new Group();
//                 const bgStageResult = await loadSingleUsdStage(bgPath, false, bgGroup);
//                 window.usdRoot.add(bgGroup);
//                 window.allDrivers.push(bgStageResult.driver); // add driver to the global array
//                 console.log(`Successfully loaded background USD: ${bgPath}`);


//             } catch (e) {
//                 console.error(`Failed to load background USD: ${bgPath}. This could be a CORS issue if remote.`, e);
//                 console.warn(`If ${bgPath} is remote, ensure its server sends 'Access-Control-Allow-Origin: *' header.`);
//             }
//         }
//     }

//     // 7. Finalize and Fit Camera
//     // fitCameraToSelection now targets the origin and adjusts the zoom.
//     fitCameraToSelection(camera, controls, [window.usdRoot]);
//     ready = true;
//     // showUserMessage(`Successfully loaded ${currentDisplayFilename} (and ${extraUsdPaths.length} background${extraUsdPaths.length === 1 ? '' : 's'}).`);
//     console.log("Loading complete. Scene elements:", window.usdRoot.children);

//     // Delay the postMessage a bit to ensure the first render completed
//     setTimeout(() => {
//         window.parent.postMessage({ type: "USD_LOADED" }, "*");
//         console.log("📤 USD_LOADED message sent to parent");
//     }, 500);
// }

// // --- Animation Loop ---

// let isPaused = false;
// document.body.onkeyup = function(e){
//     if(e.keyCode == 32){ // Spacebar
//         isPaused = !isPaused;
//         // showUserMessage(isPaused ? "Rendering Paused (Press Space)" : "Rendering Active");
//     }
// }

// async function animate() {
//     if (!isPaused && ready) {
//     const secs = new Date().getTime() / 1000;
//     const time = (secs * (1000 / timeout)) % endTimeCode;

//     for (const drv of window.allDrivers) {
//         if (drv.SetTime && drv.Draw) {
//             drv.SetTime(time);
//             drv.Draw();
//         }
//     }
// }


//     window._controls.update();
//     render();
    
//     // Use requestAnimationFrame for smoother rendering
//     requestAnimationFrame(animate); 
// }

// // --- Export Logic ---

// /**
//  * Attaches event listeners for export buttons.
//  */
// function setupExportListeners() {
//     const usdzExportBtn = document.getElementById('export-usdz');
//     if (usdzExportBtn) usdzExportBtn.addEventListener('click', () => {
//         // showUserMessage("USDZ export is not supported in this WebAssembly build yet.", true);
//     });

//     const gltfExportBtn = document.getElementById('export-gltf');
//     if (gltfExportBtn) gltfExportBtn.addEventListener('click', (evt) => {
//         evt.preventDefault();
//         if (!window.usdRoot) return showUserMessage("Nothing to export.", true);

//         // showUserMessage("Exporting to GLB (GLTF binary)...");
//         const exporter = new GLTFExporter();
        
//         exporter.parse(window.usdRoot, function (gltfArrayBuffer) {
//             try {
//                 const blob = new Blob([gltfArrayBuffer], {type: 'model/gltf-binary'});
//                 const url = URL.createObjectURL(blob);
//                 const a = document.createElement('a');
//                 a.href = url;
                
//                 // Construct clean filename
//                 let filename = currentDisplayFilename.split('/').pop().split('.')[0].split('?')[0];
//                 a.download = (filename || 'exported_usd_model') + ".glb";
                
//                 a.click();
//                 URL.revokeObjectURL(url);
//                 showUserMessage("Exported GLB successfully.");
//             } catch (e) {
//                 console.error("Error during GLB file download:", e);
//                 showUserMessage("Error during GLB file download.", true);
//             }
//         }, function (error) {
//             console.error("GLTF Export Error:", error);
//             showUserMessage("GLTF Export Failed. See console.", true);
//         }, { 
//             binary: true,
//             // Animations are complex in USD/Hydra, usually handled separately
//             animations: [] 
//         });
//     });
// }


// // --- Main Entry Point ---

// export function init(options = {}) {
//     // Merge provided options with defaults
//     const finalOptions = { ...DEFAULT_OPTIONS, ...options };

//     document.addEventListener("DOMContentLoaded", async function() {
//         messageLog = document.querySelector("#message-log");
//         showUserMessage("Initializing 3D viewer...");

//         const params = (new URL(document.location)).searchParams;
//         let filename = params.get("file") || "";
        
//         // Combined logic to get multiple background paths from 'bgs' or legacy 'bg'
//         let bgUsdString = params.get("bgs") || params.get("bg");
//         let extraUsd = [];
//         if (bgUsdString) {
//             extraUsd = bgUsdString.split(',').filter(p => p.trim() !== '');
//         }

//         // 1. Initialize Three.js scene and load environment map
//         const threeInitPromise = initThree(finalOptions);

//         // 2. Load USD Module (WebAssembly)
//         showUserMessage("Loading your message...");
//         try {
//             const [Usd] = await Promise.all([
//                 getUsdModule({
//                     mainScriptUrlOrBlob: "./emHdBindings.js",
//                     locateFile: (file) => {
//                         return "/usd/bindings/" + file;
//                     },
//                 }),
//                 threeInitPromise
//             ]);
//             window.Usd = Usd;
//             showUserMessage("....");

//             // 3. Setup export listeners
//             setupExportListeners();

//             // 4. Load initial file from URL if present
//             if (filename) {
//                 const el = document.querySelector("#container");
//                 el.classList.add("have-custom-file");
                
//                 // Get URL path for loading
//                 const urlPath = filename.split('?')[0];
                
//                 // Load the USD file(s)
//                 await loadUsdFile(filename, urlPath, extraUsd);
//                 updateUrl(filename, extraUsd);
//             }
            
//             // 5. Start the animation loop
//             animate();

//         } catch (error) {
//             let errorMessage = "An unknown error occurred during initialization.";
//             if(error.toString().includes("SharedArrayBuffer")) {
//                 errorMessage = "Your browser doesn't support SharedArrayBuffer (COOP/COEP headers missing), which is required for USD.";
//             } else {
//                 errorMessage = "Error during USD module initialization: " + error.message;
//             }
//             console.error(error);
//             showUserMessage(errorMessage, true);
//         }
//     });
// }







// import { Vector3, Box3, PerspectiveCamera, Scene, Color, AmbientLight, Group, PointLight, WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping, VSMShadowMap, PMREMGenerator, EquirectangularReflectionMapping, MeshStandardMaterial } from 'three';
// import { ThreeRenderDelegateInterface } from "./usd/hydra/ThreeJsRenderDelegate.js"
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
// import './usd/bindings/emHdBindings.js';

// // Global access for the USD Emscripten Module
// const getUsdModule = globalThis["NEEDLE:USD:GET"];

// /** Configuration for the environment and camera. */
// const DEFAULT_OPTIONS = {
//     hdrPath: 'environments/neutral.hdr',
//     defaultCameraZ: 7,
//     defaultCameraY: 7,
//     defaultCameraX: 0,
//     debugFileHandling: false
// };

// let scene, camera, renderer, controls, messageLog;
// let currentDisplayFilename = "";
// let ready = false;
// let timeout = 40; // Frame time (e.g., 1000/25 fps)
// let endTimeCode = 1; // End frame for animation loop
// window.allDrivers = []; // store all USD drivers (root + backgrounds)


// // --- Utility Functions ---

// /**
//  * Replaces system alerts with console/UI messages.
//  * @param {string} message 
//  * @param {boolean} isError 
//  */
// function showUserMessage(message, isError = false) {
//     console.log(isError ? "ERROR:" : "INFO:", message);
//     // if (messageLog) {
//     //     messageLog.textContent = message;
//     //     messageLog.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
//     // }
//     if (messageLog) {
//         messageLog.textContent = message;
//         messageLog.style.background = "linear-gradient(to right, #a78bfa, #f472b6, #8b5cf6)"; // purple-pink gradient
//         messageLog.style.webkitBackgroundClip = "text";
//         messageLog.style.color = "transparent";
//         messageLog.style.fontWeight = "600"; // optional bold
//         messageLog.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
// }
// }

// /**
//  * Updates the filename displayed in the UI.
//  * @param {string} __filename 
//  */
// function setFilenameText(__filename) {
//     var _filename = __filename.split('/').pop().split('#')[0].split('?')[0];
//     const _el = document.querySelector(".filename");
//     if (_el) _el.innerText = _filename;
//     currentDisplayFilename = _filename;
// }

// /**
//  * Updates the browser's URL based on the loaded file.
//  * @param {string} filename 
//  * @param {string[]} bgUsds - Array of background USD file URLs. 
//  */
// function updateUrl(filename, bgUsds = []) {
//     if (!filename) return;

//     // Workaround for GitHub CORS: rewrite blob links to raw
//     if (filename.includes("github.com")) {
//         filename = filename.replace("github.com", "raw.githubusercontent.com");
//         filename = filename.replace("/blob/", "/");
//     }

//     // Set quick look link
//     let url = filename.split('?')[0];
//     const quickLookLink = document.querySelector("a#quick-look-link");
//     if (quickLookLink) quickLookLink.href = url;

//     const currentUrl = new URL(window.location.href);
//     currentUrl.searchParams.set("file", filename);
    
//     // Handle multiple background files
//     if (bgUsds && bgUsds.length > 0) {
//         // Join paths with comma for the URL parameter
//         currentUrl.searchParams.set("bgs", bgUsds.join(',')); 
//     } else {
//         currentUrl.searchParams.delete("bgs");
//     }
    
//     // Remove old 'bg' parameter for clean up
//     currentUrl.searchParams.delete("bg"); 
    
//     // Only update history if the URL has changed significantly
//     if (window.location.search !== currentUrl.search) {
//         window.history.pushState({}, filename, currentUrl);
//     }
// }

// // --- USD File System (FS) Helpers ---

// /**
//  * Recursively retrieves all loaded file paths from the USD virtual filesystem.
//  * @param {string} currentPath 
//  * @param {string[]} paths 
//  */
// function getAllLoadedFilePaths(currentPath, paths) {
//     const files = window.Usd.FS_readdir(currentPath);
//     for (const file of files) {
//         if (file === "." || file === "..") continue;
//         const newPath = currentPath + file + "/";
//         const data = window.Usd.FS_analyzePath(currentPath + file + "/");
//         if (data.object.node_ops.readdir) {
//             // Skip default directories
//             if (["/dev/", "/proc/", "/home/", "/tmp/", "/usd/"].includes(newPath)) continue;
//             getAllLoadedFilePaths(newPath, paths);
//         } else {
//             paths.push(data.path);
//         }
//     }
// }

// /**
//  * Clears the USD stage and the Three.js root group.
//  */
// function clearStage() {
//     if (!window.Usd || !window.usdRoot) return;

//     // 1. Unlink all files from USD virtual FS
//     const allFilePaths = [];
//     getAllLoadedFilePaths("/", allFilePaths);
//     console.log("Clearing stage. Unlinking files:", allFilePaths);

//     for (const file of allFilePaths) {
//         try {
//             window.Usd.FS_unlink(file, true);
//         } catch (e) {
//             console.warn(`Could not unlink file ${file}:`, e);
//         }
//     }

//     // 2. Clear Three.js scene group
//     window.usdRoot.clear();
//     ready = false;
//     currentDisplayFilename = "";
//     // showUserMessage("Stage cleared.");
// }

// // --- Drag and Drop Logic ---

// /**
//  * Converts a FileSystemEntry into a File object.
//  * @param {FileSystemFileEntry} fileEntry 
//  * @returns {Promise<File>}
//  */
// async function getFileFromFileEntry(fileEntry) {
//     try {
//         return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
//     } catch (err) {
//         console.error("Error getting file from entry:", err);
//         return null;
//     }
// }

// /**
//  * Loads a file from a URL or local file, writes it to the USD FS, and loads the stage.
//  * @param {File|FileSystemFileEntry} fileOrHandle 
//  * @param {boolean} isRootFile 
//  * @param {string} fullPath 
//  */
// async function loadFile(fileOrHandle, isRootFile = true, fullPath = undefined) {
//     let file;
//     if (fileOrHandle.getFile) {
//         file = await fileOrHandle.getFile();
//     } else if (fileOrHandle.isFile && fileOrHandle.file) {
//         // Handle FileSystemFileEntry for older APIs
//         file = await getFileFromFileEntry(fileOrHandle);
//     } else {
//         file = fileOrHandle;
//     }

//     if (!file) {
//         console.warn("Could not retrieve file data.");
//         return;
//     }

//     try {
//         const arrayBuffer = await file.arrayBuffer();
        
//         let fileName = file.name;
//         let directory = "/";
//         if (fullPath !== undefined) {
//             fileName = fullPath.split('/').pop();
//             // Ensure directory path ends with a slash for FS_createPath
//             directory = fullPath.substring(0, fullPath.length - fileName.length); 
//             if (DEFAULT_OPTIONS.debugFileHandling) console.log("Virtual FS path:", { directory, fileName });
//         }
        
//         // 1. Create directory structure in USD FS
//         window.Usd.FS_createPath("", directory, true, true); 
        
//         // 2. Write file data
//         window.Usd.FS_createDataFile(directory, fileName, new Uint8Array(arrayBuffer), true, true, true);

//         if (isRootFile) {
//             // Load the entire stage now that dependencies are in FS
//             const params = (new URL(document.location)).searchParams;
//             // Check for multiple backgrounds ('bgs') or legacy single ('bg')
//             const bgUsdString = params.get("bgs") || params.get("bg"); 
//             const extraUsd = bgUsdString ? bgUsdString.split(',').filter(p => p.trim() !== '') : [];
            
//             await loadUsdFile(fileName, fullPath || `/${fileName}`, extraUsd);
//             updateUrl(fullPath || fileName, extraUsd);
//         }
//     }
//     catch(ex) {
//         console.error("Error loading file into USD virtual FS:", file.name, ex);
//         showUserMessage(`Error processing file ${file.name}. See console.`, true);
//     }
// }


// /**
//  * Processes all dropped filesystem entries (files or directories).
//  * @param {FileSystemEntry[]} entries
//  */
// async function handleFilesystemEntries(entries) {
//     // showUserMessage("Processing dropped files...");
//     const allFiles = [];
//     const ignoreList = ['.gitignore', 'README.md', '.DS_Store', '.git', 'node_modules'];

//     /** @type {(entry: FileSystemEntry) => Promise<void>} */
//     const traverseEntry = async (entry) => {
//         if (ignoreList.includes(entry.name)) return;

//         if (entry.isFile) {
//             // Get file path relative to the drop root (or just use entry.fullPath)
//             allFiles.push(entry);
//         } else if (entry.isDirectory) {
//             const dirReader = entry.createReader();
//             let results = [];
//             let readBatch;
//             do {
//                 readBatch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
//                 results = results.concat(readBatch);
//             } while (readBatch.length > 0);

//             for (const subEntry of results) {
//                 await traverseEntry(subEntry);
//             }
//         }
//     };

//     for (const entry of entries) {
//         await traverseEntry(entry);
//     }

//     // 1. Clear existing scene
//     clearStage();

//     // 2. Determine the root file (e.g., the shallowest USD file)
//     let rootFile = allFiles
//         .filter(f => ['usd', 'usdz', 'usda', 'usdc'].includes(f.name.split('.').pop()))
//         .sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length)[0];

//     if (!rootFile && allFiles.length > 0) {
//         console.warn("Could not find a standard USD root file. Using first file as root.");
//         rootFile = allFiles[0];
//     }

//     if (!rootFile) {
//         // showUserMessage("No loadable USD files found in dropped content.", true);
//         return;
//     }

//     // 3. Load all dependencies first (not the root file)
//     const filesToLoad = allFiles.filter(f => f !== rootFile);
//     console.log(`Found ${allFiles.length} files. Dependencies to load: ${filesToLoad.length}`);

//     // Sort dependencies to prioritize non-USD files (e.g., textures)
//     filesToLoad.sort((a, b) => {
//         let extA = a.name.split('.').pop();
//         let extB = b.name.split('.').pop();
//         const isUsdA = ['usd', 'usdz', 'usda', 'usdc'].includes(extA);
//         const isUsdB = ['usd', 'usdz', 'usda', 'usdc'].includes(extB);
//         if (isUsdA && !isUsdB) return 1;
//         if (!isUsdA && isUsdB) return -1;
//         return 0;
//     });

//     for (const fileEntry of filesToLoad) {
//         // showUserMessage(`Loading dependency: ${fileEntry.name}...`);
//         await loadFile(fileEntry, false, fileEntry.fullPath);
//     }

//     // 4. Load the root file last
//     // showUserMessage(`Loading root file: ${rootFile.name}...`);
//     await loadFile(rootFile, true, rootFile.fullPath);
// }

// /**
//  * @param {DragEvent} ev
//  */
// function dropHandler(ev) {
//     ev.preventDefault();
//     if (!window.Usd) {
//         // showUserMessage("USD module not ready yet. Please wait.", true);
//         return;
//     }

//     if (ev.dataTransfer.items) {
//         const allEntries = [];
//         let haveGetAsEntry = ("getAsEntry" in ev.dataTransfer.items[0]) || ("webkitGetAsEntry" in ev.dataTransfer.items[0]);

//         if (haveGetAsEntry) {
//             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
//                 let item = ev.dataTransfer.items[i];
//                 let entry = ("getAsEntry" in item) ? item.getAsEntry() : item.webkitGetAsEntry();
//                 if (entry) allEntries.push(entry);
//             }
//             handleFilesystemEntries(allEntries);
//         } else {
//             // Fallback for browsers without proper Directory drag support
//             const files = [];
//             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
//                 let file = ev.dataTransfer.items[i].getAsFile();
//                 if (file) files.push(file);
//             }
//             if (files.length > 0) {
//                 clearStage();
//                 // Assumes the first file is the root if only files are dropped
//                 loadFile(files[0], true, `/${files[0].name}`);
//             }
//         }
//     }
// }

// function dragOverHandler(ev) {
//     ev.preventDefault();
// }

// // --- Three.js & Scene Setup ---

// /**
//  * Fits the camera to contain the entire selection of objects.
//  * NOTE: Assumes the selection group is already centered at (0, 0, 0)
//  * @param {PerspectiveCamera} camera 
//  * @param {OrbitControls} controls 
//  * @param {Group[]} selection 
//  * @param {number} fitOffset 
//  */
// function fitCameraToSelection(camera, controls, selection, fitOffset = 1.5) {
//     const box = new Box3().makeEmpty();
//     for(const object of selection) {
//         // Expand by world space bounding box
//         box.expandByObject(object);
//     }
    
//     const size = new Vector3();
//     const center = new Vector3();
//     box.getSize(size);
//     box.getCenter(center); // Should be close to (0, 0, 0) due to pre-translation

//     if (Number.isNaN(size.x)) {
//         console.warn("Fit Camera failed: NaN values found (object likely has no geometry).");
//         if (controls) controls.update();
//         return;
//     }

//     if (!controls) return;
    
//     // Explicitly set the control target to the calculated center (should be origin)
//     controls.target.copy(center); 

//     const maxSize = Math.max(size.x, size.y, size.z);
//     const fovRad = Math.PI * camera.fov / 360;
//     const fitHeightDistance = maxSize / (2 * Math.tan(fovRad));
//     const fitWidthDistance = fitHeightDistance / camera.aspect;
//     const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

//     if (distance === 0) {
//         console.warn("Fit Camera failed: distance is 0.");
//         return;
//     }

//     controls.maxDistance = distance * 10;

//     camera.near = distance / 100;
//     camera.far = distance * 100;

//     camera.updateProjectionMatrix();

//     // Calculate new position based on target and distance
//     // This repositions the camera based on its *current* direction relative to the new target (center)
//     const direction = camera.position.clone()
//         .sub(controls.target)
//         .normalize()
//         .multiplyScalar(distance);

//     camera.position.copy(controls.target).add(direction);
//     controls.update();

//     console.log("Fitting camera to selection", { size, center: center.toArray(), distance });
// }

// /**
//  * Initializes Three.js renderer, camera, scene, and controls.
//  * @param {object} options 
//  * @returns {Promise<void>} Resolves when the environment map is loaded.
//  */
// async function initThree(options) {
//     camera = window.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 3500);
//     const params = (new URL(document.location)).searchParams;
//     camera.position.z = parseFloat(params.get('cameraZ')) || options.defaultCameraZ;
//     camera.position.y = parseFloat(params.get('cameraY')) || options.defaultCameraY;
//     camera.position.x = parseFloat(params.get('cameraX')) || options.defaultCameraX;

//     scene = window.scene = new Scene();
//     window.usdRoot = new Group();
//     window.usdRoot.name = "USD Root";
//     scene.add(window.usdRoot);

//     // renderer = window.renderer = new WebGLRenderer({ antialias: true, alpha: true });
//     // renderer.setPixelRatio(window.devicePixelRatio);
//     // renderer.setSize(window.innerWidth / 1.05, window.innerHeight / 1.05); // slightly smaller to see edges
//     // ...
//     renderer = window.renderer = new WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setPixelRatio(window.devicePixelRatio);
// // ✅ WITH THIS LINE:
//     renderer.setSize(window.innerWidth, window.innerHeight); // Set to full window size
// // ...
//     renderer.outputColorSpace = SRGBColorSpace;
//     renderer.toneMapping = NeutralToneMapping; // Neutral is often better for PBR in viewers
//     renderer.shadowMap.enabled = false;
//     renderer.setClearColor(0x000000, 0);

//     const envMapPromise = new Promise(resolve => {
//         const pmremGenerator = new PMREMGenerator(renderer);
//         pmremGenerator.compileCubemapShader();

//         new RGBELoader().load(options.hdrPath, (texture) => {
//             const hdrRenderTarget = pmremGenerator.fromEquirectangular(texture);
//             texture.mapping = EquirectangularReflectionMapping;
//             texture.needsUpdate = true;
//             scene.environment = hdrRenderTarget.texture;
//             console.log("HDR Environment loaded.");
//             resolve();
//         }, undefined, (err) => {
//             console.error('Failed to load HDR environment map. Scene environment will be null.', err);
//             resolve(); // Resolve even on error to continue initialization
//         });
//     });

//     document.body.appendChild(renderer.domElement);
//     controls = window._controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.2;

//     controls.update();

//     window.addEventListener('resize', onWindowResize);
//     renderer.domElement.addEventListener("drop", dropHandler);
//     renderer.domElement.addEventListener("dragover", dragOverHandler);

//     return envMapPromise;
// }

// function onWindowResize() {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function render() {
//     if (renderer && scene && camera) {
//         renderer.render(scene, camera);
//     }
// }

// // -------------------------------------------------------------------------
// // ⭐ NEW UTILITY FUNCTION TO APPLY COLOR
// // -------------------------------------------------------------------------

// /**
//  * Applies a simple, colored MeshStandardMaterial to all Mesh objects 
//  * within a given group, overwriting existing materials.
//  * @param {Group} rootGroup - The Three.js group to traverse.
//  * @param {Color} color - The Color to apply.
//  */
// function applyDefaultColorMaterial(rootGroup, color = new Color(0x7CFC00)) {
//     // Create a single material instance to share across all meshes for efficiency
//     const defaultMaterial = new MeshStandardMaterial({
//         color: color,
//         metalness: 0.2, 
//         roughness: 0.7, 
//     });

//     // Traverse the entire hierarchy of the loaded model
//     rootGroup.traverse(function (object) {
//         if (object.isMesh) {
//             // Apply the default material
//             object.material = defaultMaterial;
//             // 💡 ADD THIS LINE FOR DEBUGGING
//             // This forces Three.js to re-read the geometry/material setup
//             object.material.needsUpdate = true;
//         }
//     });

//     console.log(`Applied default color material (${color.getHexString()}) to meshes.`);
// }

// // --- USD Loading Logic ---

// /**
//  * Loads a USD stage and renders it into the Three.js scene.
//  * This function handles both the primary file and background/referenced files.
//  * * @param {string} path - The path to the USD file (URL or virtual FS path)
//  * @param {boolean} isRoot - Is this the primary file being loaded?
//  * @param {Group} targetRoot - The Three.js group to attach the content to. Defaults to window.usdRoot.
//  * @returns {Promise<{driver: Usd.HdWebSyncDriver, stage: Usd.Stage}>}
//  */
// async function loadSingleUsdStage(path, isRoot = true, targetRoot = window.usdRoot) {
//     if (DEFAULT_OPTIONS.debugFileHandling) console.warn("Attempting to load USD stage:", path, "Is Root:", isRoot);

//     let driver = null;
//     const delegateConfig = {
//         usdRoot: targetRoot,
//         paths: new Array(),
//         driver: () => driver,
//     };

//     try {
//         const renderInterface = new ThreeRenderDelegateInterface(path, delegateConfig);
//         driver = await (new window.Usd.HdWebSyncDriver(renderInterface, path));
//     } catch (e) {
//         console.error(`Error initializing Hydra driver for ${path}:`, e);
//         throw new Error(`Failed to initialize USD driver for ${path}`);
//     }

//     let stage = driver.GetStage();
//     if (stage instanceof Promise) {
//         stage = await stage;
//         // Re-get stage after potential async loading
//         stage = driver.GetStage();
//     }
    
    
//     if (isRoot) {
//         // Only call Draw once all dependencies are loaded (in the main file loading process)
//         // If not the root, Draw will be called externally or implicitly via the delegate setup
//         driver.Draw();
//     }

//     return { driver, stage };
// }


// /**
//  * Orchestrates the loading of the primary USD file and any background files.
//  * @param {string} filename 
//  * @param {string} path 
//  * @param {string[]} extraUsdPaths 
//  */
// async function loadUsdFile(filename, path, extraUsdPaths = []) {
//     setFilenameText(filename);
//     // showUserMessage(`Loading primary file: ${filename}...`);
    
//     // 1. Load Primary USD Stage
//     let rootStageResult;
//     try {
//         // path here is the URL or the FS path to the main file
//         rootStageResult = await loadSingleUsdStage(path, true, window.usdRoot);
//         window.driver = rootStageResult.driver;
//         window.usdStage = rootStageResult.stage;
//         window.allDrivers.push(rootStageResult.driver); // include root driver in array

//     } catch (e) {
//         // showUserMessage(`Error loading primary USD file (${filename}). Check console for details.`, true);
//         console.error("Primary USD Load Error:", e);
//         return;
//     }
    
//     const stage = window.usdStage;

//     // Set animation parameters
//     if (stage.GetEndTimeCode) {
//         endTimeCode = stage.GetEndTimeCode();
//         timeout = 1000 / stage.GetTimeCodesPerSecond();
//     }

//     // --- START OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
//     // 2. Calculate the un-transformed bounding box
//     const initialBox = new Box3().setFromObject(window.usdRoot);
//     const center = new Vector3();
//     initialBox.getCenter(center);
    
//     // 3. **Translate the root group so its center is at the world origin (0, 0, 0)**
//     // This ensures that all subsequent rotations are perfectly centered.
//     window.usdRoot.position.sub(center);

//     // 4. Apply rotation based on USD Up Axis (Z up vs Y up).
//     const upAxis = String.fromCharCode(stage.GetUpAxis()).toUpperCase();
    
//     // Reset rotation/scale to defaults first
//     window.usdRoot.rotation.set(0, 0, 0);
//     window.usdRoot.scale.set(1, 1, 1);
    
//     if (upAxis === "Z") {
//         // Z-up to Y-up conversion: Rotate -90 degrees around X
//         window.usdRoot.rotation.x = -Math.PI / 2; 
        
//         // Rotate 180 degrees around Y to correct "backwards" view after Z-up conversion.
//         window.usdRoot.rotation.y = Math.PI;
//     }

//     // 5. IMPORTANT: Force Three.js to calculate the object's final world position/bounds 
//     // immediately after the transformations are applied.
//     window.usdRoot.updateWorldMatrix(true, true);
    
//     // --- END OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
//     // ---------------------------------------------------------------------
//     // ⭐ SOLUTION INSERTED HERE: Apply color ONLY to the primary model content
//     // window.usdRoot now contains ONLY the primary file geometry.
//     // Change 0x0077FF to any hex color you want (e.g., 0xFF0000 for red).
//     // applyDefaultColorMaterial(window.usdRoot, new Color(0x7CFC00)); 
//     applyDefaultColorMaterial(window.usdRoot, new Color(0xE0AC69)); // golden tan

//     // ---------------------------------------------------------------------

//     // 6. Load Background USD Stage(s)
//     if (extraUsdPaths.length > 0) {
//         for (const bgPath of extraUsdPaths) {
//             // showUserMessage(`Loading background USD: ${bgPath}...`);
//             try {
//                 // Background files are loaded as separate, detached groups
//                 const bgGroup = new Group();
//                 const bgStageResult = await loadSingleUsdStage(bgPath, false, bgGroup);
//                 window.usdRoot.add(bgGroup); // Add background group to the root
//                 window.allDrivers.push(bgStageResult.driver); // add driver to the global array
//                 console.log(`Successfully loaded background USD: ${bgPath}`);


//             } catch (e) {
//                 console.error(`Failed to load background USD: ${bgPath}. This could be a CORS issue if remote.`, e);
//                 console.warn(`If ${bgPath} is remote, ensure its server sends 'Access-Control-Allow-Origin: *' header.`);
//             }
//         }
//     }

//     // 7. Finalize and Fit Camera
//     // fitCameraToSelection now targets the origin and adjusts the zoom.
//     fitCameraToSelection(camera, controls, [window.usdRoot]);
//     ready = true;
//     // showUserMessage(`Successfully loaded ${currentDisplayFilename} (and ${extraUsdPaths.length} background${extraUsdPaths.length === 1 ? '' : 's'}).`);
//     console.log("Loading complete. Scene elements:", window.usdRoot.children);

//     // Delay the postMessage a bit to ensure the first render completed
//     setTimeout(() => {
//         window.parent.postMessage({ type: "USD_LOADED" }, "*");
//         console.log("📤 USD_LOADED message sent to parent");
//     }, 500);
// }

// // --- Animation Loop ---

// let isPaused = false;
// document.body.onkeyup = function(e){
//     if(e.keyCode == 32){ // Spacebar
//         isPaused = !isPaused;
//         // showUserMessage(isPaused ? "Rendering Paused (Press Space)" : "Rendering Active");
//     }
// }

// async function animate() {
//     if (!isPaused && ready) {
//     const secs = new Date().getTime() / 1000;
//     const time = (secs * (1000 / timeout)) % endTimeCode;

//     for (const drv of window.allDrivers) {
//         if (drv.SetTime && drv.Draw) {
//             drv.SetTime(time);
//             drv.Draw();
//         }
//     }
// }


//     window._controls.update();
//     render();
    
//     // Use requestAnimationFrame for smoother rendering
//     requestAnimationFrame(animate); 
// }

// // --- Export Logic ---

// /**
//  * Attaches event listeners for export buttons.
//  */
// function setupExportListeners() {
//     const usdzExportBtn = document.getElementById('export-usdz');
//     if (usdzExportBtn) usdzExportBtn.addEventListener('click', () => {
//         // showUserMessage("USDZ export is not supported in this WebAssembly build yet.", true);
//     });

//     const gltfExportBtn = document.getElementById('export-gltf');
//     if (gltfExportBtn) gltfExportBtn.addEventListener('click', (evt) => {
//         evt.preventDefault();
//         if (!window.usdRoot) return showUserMessage("Nothing to export.", true);

//         // showUserMessage("Exporting to GLB (GLTF binary)...");
//         const exporter = new GLTFExporter();
        
//         exporter.parse(window.usdRoot, function (gltfArrayBuffer) {
//             try {
//                 const blob = new Blob([gltfArrayBuffer], {type: 'model/gltf-binary'});
//                 const url = URL.createObjectURL(blob);
//                 const a = document.createElement('a');
//                 a.href = url;
                
//                 // Construct clean filename
//                 let filename = currentDisplayFilename.split('/').pop().split('.')[0].split('?')[0];
//                 a.download = (filename || 'exported_usd_model') + ".glb";
                
//                 a.click();
//                 URL.revokeObjectURL(url);
//                 showUserMessage("Exported GLB successfully.");
//             } catch (e) {
//                 console.error("Error during GLB file download:", e);
//                 showUserMessage("Error during GLB file download.", true);
//             }
//         }, function (error) {
//             console.error("GLTF Export Error:", error);
//             showUserMessage("GLTF Export Failed. See console.", true);
//         }, { 
//             binary: true,
//             // Animations are complex in USD/Hydra, usually handled separately
//             animations: [] 
//         });
//     });
// }


// // --- Main Entry Point ---

// export function init(options = {}) {
//     // Merge provided options with defaults
//     const finalOptions = { ...DEFAULT_OPTIONS, ...options };

//     document.addEventListener("DOMContentLoaded", async function() {
//         messageLog = document.querySelector("#message-log");
//         showUserMessage("Initializing 3D viewer...");

//         const params = (new URL(document.location)).searchParams;
//         let filename = params.get("file") || "";
        
//         // Combined logic to get multiple background paths from 'bgs' or legacy 'bg'
//         let bgUsdString = params.get("bgs") || params.get("bg");
//         let extraUsd = [];
//         if (bgUsdString) {
//             extraUsd = bgUsdString.split(',').filter(p => p.trim() !== '');
//         }

//         // 1. Initialize Three.js scene and load environment map
//         const threeInitPromise = initThree(finalOptions);

//         // 2. Load USD Module (WebAssembly)
//         showUserMessage("Loading your message...");
//         try {
//             const [Usd] = await Promise.all([
//                 getUsdModule({
//                     mainScriptUrlOrBlob: "./emHdBindings.js",
//                     locateFile: (file) => {
//                         return "/usd/bindings/" + file;
//                     },
//                 }),
//                 threeInitPromise
//             ]);
//             window.Usd = Usd;
//             showUserMessage("....");

//             // 3. Setup export listeners
//             setupExportListeners();

//             // 4. Load initial file from URL if present
//             if (filename) {
//                 const el = document.querySelector("#container");
//                 el.classList.add("have-custom-file");
                
//                 // Get URL path for loading
//                 const urlPath = filename.split('?')[0];
                
//                 // Load the USD file(s)
//                 await loadUsdFile(filename, urlPath, extraUsd);
//                 updateUrl(filename, extraUsd);
//             }
            
//             // 5. Start the animation loop
//             animate();

//         } catch (error) {
//             let errorMessage = "An unknown error occurred during initialization.";
//             if(error.toString().includes("SharedArrayBuffer")) {
//                 errorMessage = "Your browser doesn't support SharedArrayBuffer (COOP/COEP headers missing), which is required for USD.";
//             } else {
//                 errorMessage = "Error during USD module initialization: " + error.message;
//             }
//             console.error(error);
//             showUserMessage(errorMessage, true);
//         }
//     });
// }










// import { Vector3, Box3, PerspectiveCamera, Scene, Color, AmbientLight, Group, PointLight, WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping, VSMShadowMap, PMREMGenerator, EquirectangularReflectionMapping, MeshStandardMaterial } from 'three';
// import { ThreeRenderDelegateInterface } from "./usd/hydra/ThreeJsRenderDelegate.js"
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
// import './usd/bindings/emHdBindings.js';

// // Global access for the USD Emscripten Module
// const getUsdModule = globalThis["NEEDLE:USD:GET"];

// /** Configuration for the environment and camera. */
// const DEFAULT_OPTIONS = {
//     hdrPath: 'environments/neutral.hdr',
//     defaultCameraZ: 7,
//     defaultCameraY: 7,
//     defaultCameraX: 0,
//     debugFileHandling: false
// };

// let scene, camera, renderer, controls, messageLog;
// let currentDisplayFilename = "";
// let ready = false;
// let timeout = 40; // Frame time (e.g., 1000/25 fps)
// let endTimeCode = 1; // End frame for animation loop
// window.allDrivers = []; // store all USD drivers (root + backgrounds)


// // --- Utility Functions ---

// /**
//  * Replaces system alerts with console/UI messages.
//  * @param {string} message 
//  * @param {boolean} isError 
//  */
// function showUserMessage(message, isError = false) {
//     console.log(isError ? "ERROR:" : "INFO:", message);
//     if (messageLog) {
//         messageLog.textContent = message;
//         messageLog.style.background = "linear-gradient(to right, #a78bfa, #f472b6, #8b5cf6)"; // purple-pink gradient
//         messageLog.style.webkitBackgroundClip = "text";
//         messageLog.style.color = "transparent";
//         messageLog.style.fontWeight = "600"; // optional bold
//         messageLog.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
// }
// }

// /**
//  * Updates the filename displayed in the UI.
//  * @param {string} __filename 
//  */
// function setFilenameText(__filename) {
//     var _filename = __filename.split('/').pop().split('#')[0].split('?')[0];
//     const _el = document.querySelector(".filename");
//     if (_el) _el.innerText = _filename;
//     currentDisplayFilename = _filename;
// }

// /**
//  * Updates the browser's URL based on the loaded file.
//  * @param {string} filename 
//  * @param {string[]} bgUsds - Array of background USD file URLs. 
//  */
// function updateUrl(filename, bgUsds = []) {
//     if (!filename) return;

//     // Workaround for GitHub CORS: rewrite blob links to raw
//     if (filename.includes("github.com")) {
//         filename = filename.replace("github.com", "raw.githubusercontent.com");
//         filename = filename.replace("/blob/", "/");
//     }

//     // Set quick look link
//     let url = filename.split('?')[0];
//     const quickLookLink = document.querySelector("a#quick-look-link");
//     if (quickLookLink) quickLookLink.href = url;

//     const currentUrl = new URL(window.location.href);
//     currentUrl.searchParams.set("file", filename);
    
//     // Handle multiple background files
//     if (bgUsds && bgUsds.length > 0) {
//         // Join paths with comma for the URL parameter
//         currentUrl.searchParams.set("bgs", bgUsds.join(',')); 
//     } else {
//         currentUrl.searchParams.delete("bgs");
//     }
    
//     // Remove old 'bg' parameter for clean up
//     currentUrl.searchParams.delete("bg"); 
    
//     // Only update history if the URL has changed significantly
//     if (window.location.search !== currentUrl.search) {
//         window.history.pushState({}, filename, currentUrl);
//     }
// }

// // --- USD File System (FS) Helpers ---

// /**
//  * Recursively retrieves all loaded file paths from the USD virtual filesystem.
//  * @param {string} currentPath 
//  * @param {string[]} paths 
//  */
// function getAllLoadedFilePaths(currentPath, paths) {
//     const files = window.Usd.FS_readdir(currentPath);
//     for (const file of files) {
//         if (file === "." || file === "..") continue;
//         const newPath = currentPath + file + "/";
//         const data = window.Usd.FS_analyzePath(currentPath + file + "/");
//         if (data.object.node_ops.readdir) {
//             // Skip default directories
//             if (["/dev/", "/proc/", "/home/", "/tmp/", "/usd/"].includes(newPath)) continue;
//             getAllLoadedFilePaths(newPath, paths);
//         } else {
//             paths.push(data.path);
//         }
//     }
// }

// /**
//  * Clears the USD stage and the Three.js root group.
//  */
// function clearStage() {
//     if (!window.Usd || !window.usdRoot) return;

//     // 1. Unlink all files from USD virtual FS
//     const allFilePaths = [];
//     getAllLoadedFilePaths("/", allFilePaths);
//     console.log("Clearing stage. Unlinking files:", allFilePaths);

//     for (const file of allFilePaths) {
//         try {
//             window.Usd.FS_unlink(file, true);
//         } catch (e) {
//             console.warn(`Could not unlink file ${file}:`, e);
//         }
//     }

//     // 2. Clear Three.js scene group
//     window.usdRoot.clear();
//     ready = false;
//     currentDisplayFilename = "";
//     // showUserMessage("Stage cleared.");
// }

// // --- Drag and Drop Logic ---

// /**
//  * Converts a FileSystemEntry into a File object.
//  * @param {FileSystemFileEntry} fileEntry 
//  * @returns {Promise<File>}
//  */
// async function getFileFromFileEntry(fileEntry) {
//     try {
//         return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
//     } catch (err) {
//         console.error("Error getting file from entry:", err);
//         return null;
//     }
// }

// /**
//  * Loads a file from a URL or local file, writes it to the USD FS, and loads the stage.
//  * @param {File|FileSystemFileEntry} fileOrHandle 
//  * @param {boolean} isRootFile 
//  * @param {string} fullPath 
//  */
// async function loadFile(fileOrHandle, isRootFile = true, fullPath = undefined) {
//     let file;
//     if (fileOrHandle.getFile) {
//         file = await fileOrHandle.getFile();
//     } else if (fileOrHandle.isFile && fileOrHandle.file) {
//         // Handle FileSystemFileEntry for older APIs
//         file = await getFileFromFileEntry(fileOrHandle);
//     } else {
//         file = fileOrHandle;
//     }

//     if (!file) {
//         console.warn("Could not retrieve file data.");
//         return;
//     }

//     try {
//         const arrayBuffer = await file.arrayBuffer();
        
//         let fileName = file.name;
//         let directory = "/";
//         if (fullPath !== undefined) {
//             fileName = fullPath.split('/').pop();
//             // Ensure directory path ends with a slash for FS_createPath
//             directory = fullPath.substring(0, fullPath.length - fileName.length); 
//             if (DEFAULT_OPTIONS.debugFileHandling) console.log("Virtual FS path:", { directory, fileName });
//         }
        
//         // 1. Create directory structure in USD FS
//         window.Usd.FS_createPath("", directory, true, true); 
        
//         // 2. Write file data
//         window.Usd.FS_createDataFile(directory, fileName, new Uint8Array(arrayBuffer), true, true, true);

//         if (isRootFile) {
//             // Load the entire stage now that dependencies are in FS
//             const params = (new URL(document.location)).searchParams;
//             // Check for multiple backgrounds ('bgs') or legacy single ('bg')
//             const bgUsdString = params.get("bgs") || params.get("bg"); 
//             const extraUsd = bgUsdString ? bgUsdString.split(',').filter(p => p.trim() !== '') : [];
            
//             await loadUsdFile(fileName, fullPath || `/${fileName}`, extraUsd);
//             updateUrl(fullPath || fileName, extraUsd);
//         }
//     }
//     catch(ex) {
//         console.error("Error loading file into USD virtual FS:", file.name, ex);
//         showUserMessage(`Error processing file ${file.name}. See console.`, true);
//     }
// }


// /**
//  * Processes all dropped filesystem entries (files or directories).
//  * @param {FileSystemEntry[]} entries
//  */
// async function handleFilesystemEntries(entries) {
//     // showUserMessage("Processing dropped files...");
//     const allFiles = [];
//     const ignoreList = ['.gitignore', 'README.md', '.DS_Store', '.git', 'node_modules'];

//     /** @type {(entry: FileSystemEntry) => Promise<void>} */
//     const traverseEntry = async (entry) => {
//         if (ignoreList.includes(entry.name)) return;

//         if (entry.isFile) {
//             // Get file path relative to the drop root (or just use entry.fullPath)
//             allFiles.push(entry);
//         } else if (entry.isDirectory) {
//             const dirReader = entry.createReader();
//             let results = [];
//             let readBatch;
//             do {
//                 readBatch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
//                 results = results.concat(readBatch);
//             } while (readBatch.length > 0);

//             for (const subEntry of results) {
//                 await traverseEntry(subEntry);
//             }
//         }
//     };

//     for (const entry of entries) {
//         await traverseEntry(entry);
//     }

//     // 1. Clear existing scene
//     clearStage();

//     // 2. Determine the root file (e.g., the shallowest USD file)
//     let rootFile = allFiles
//         .filter(f => ['usd', 'usdz', 'usda', 'usdc'].includes(f.name.split('.').pop()))
//         .sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length)[0];

//     if (!rootFile && allFiles.length > 0) {
//         console.warn("Could not find a standard USD root file. Using first file as root.");
//         rootFile = allFiles[0];
//     }

//     if (!rootFile) {
//         // showUserMessage("No loadable USD files found in dropped content.", true);
//         return;
//     }

//     // 3. Load all dependencies first (not the root file)
//     const filesToLoad = allFiles.filter(f => f !== rootFile);
//     console.log(`Found ${allFiles.length} files. Dependencies to load: ${filesToLoad.length}`);

//     // Sort dependencies to prioritize non-USD files (e.g., textures)
//     filesToLoad.sort((a, b) => {
//         let extA = a.name.split('.').pop();
//         let extB = b.name.split('.').pop();
//         const isUsdA = ['usd', 'usdz', 'usda', 'usdc'].includes(extA);
//         const isUsdB = ['usd', 'usdz', 'usda', 'usdc'].includes(extB);
//         if (isUsdA && !isUsdB) return 1;
//         if (!isUsdA && isUsdB) return -1;
//         return 0;
//     });

//     for (const fileEntry of filesToLoad) {
//         // showUserMessage(`Loading dependency: ${fileEntry.name}...`);
//         await loadFile(fileEntry, false, fileEntry.fullPath);
//     }

//     // 4. Load the root file last
//     // showUserMessage(`Loading root file: ${rootFile.name}...`);
//     await loadFile(rootFile, true, rootFile.fullPath);
// }

// /**
//  * @param {DragEvent} ev
//  */
// function dropHandler(ev) {
//     ev.preventDefault();
//     if (!window.Usd) {
//         // showUserMessage("USD module not ready yet. Please wait.", true);
//         return;
//     }

//     if (ev.dataTransfer.items) {
//         const allEntries = [];
//         let haveGetAsEntry = ("getAsEntry" in ev.dataTransfer.items[0]) || ("webkitGetAsEntry" in ev.dataTransfer.items[0]);

//         if (haveGetAsEntry) {
//             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
//                 let item = ev.dataTransfer.items[i];
//                 let entry = ("getAsEntry" in item) ? item.getAsEntry() : item.webkitGetAsEntry();
//                 if (entry) allEntries.push(entry);
//             }
//             handleFilesystemEntries(allEntries);
//         } else {
//             // Fallback for browsers without proper Directory drag support
//             const files = [];
//             for (var i = 0; i < ev.dataTransfer.items.length; i++) {
//                 let file = ev.dataTransfer.items[i].getAsFile();
//                 if (file) files.push(file);
//             }
//             if (files.length > 0) {
//                 clearStage();
//                 // Assumes the first file is the root if only files are dropped
//                 loadFile(files[0], true, `/${files[0].name}`);
//             }
//         }
//     }
// }

// function dragOverHandler(ev) {
//     ev.preventDefault();
// }

// // --- Three.js & Scene Setup ---

// /**
//  * Fits the camera to contain the entire selection of objects.
//  * NOTE: Assumes the selection group is already centered at (0, 0, 0)
//  * @param {PerspectiveCamera} camera 
//  * @param {OrbitControls} controls 
//  * @param {Group[]} selection 
//  * @param {number} fitOffset 
//  */
// function fitCameraToSelection(camera, controls, selection, fitOffset = 1.5) {
//     const box = new Box3().makeEmpty();
//     for(const object of selection) {
//         // Expand by world space bounding box
//         box.expandByObject(object);
//     }
    
//     const size = new Vector3();
//     const center = new Vector3();
//     box.getSize(size);
//     box.getCenter(center); // Should be close to (0, 0, 0) due to pre-translation

//     if (Number.isNaN(size.x)) {
//         console.warn("Fit Camera failed: NaN values found (object likely has no geometry).");
//         if (controls) controls.update();
//         return;
//     }

//     if (!controls) return;
    
//     // Explicitly set the control target to the calculated center (should be origin)
//     controls.target.copy(center); 

//     const maxSize = Math.max(size.x, size.y, size.z);
//     const fovRad = Math.PI * camera.fov / 360;
//     const fitHeightDistance = maxSize / (2 * Math.tan(fovRad));
//     const fitWidthDistance = fitHeightDistance / camera.aspect;
//     const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

//     if (distance === 0) {
//         console.warn("Fit Camera failed: distance is 0.");
//         return;
//     }

//     controls.maxDistance = distance * 10;

//     camera.near = distance / 100;
//     camera.far = distance * 100;

//     camera.updateProjectionMatrix();

//     // Calculate new position based on target and distance
//     // This repositions the camera based on its *current* direction relative to the new target (center)
//     const direction = camera.position.clone()
//         .sub(controls.target)
//         .normalize()
//         .multiplyScalar(distance);

//     camera.position.copy(controls.target).add(direction);
//     controls.update();

//     console.log("Fitting camera to selection", { size, center: center.toArray(), distance });
// }

// /**
//  * Initializes Three.js renderer, camera, scene, and controls.
//  * @param {object} options 
//  * @returns {Promise<void>} Resolves when the environment map is loaded.
//  */
// async function initThree(options) {
//     camera = window.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 3500);
//     const params = (new URL(document.location)).searchParams;
//     camera.position.z = parseFloat(params.get('cameraZ')) || options.defaultCameraZ;
//     camera.position.y = parseFloat(params.get('cameraY')) || options.defaultCameraY;
//     camera.position.x = parseFloat(params.get('cameraX')) || options.defaultCameraX;

//     scene = window.scene = new Scene();
//     window.usdRoot = new Group();
//     window.usdRoot.name = "USD Root";
//     scene.add(window.usdRoot);

//     renderer = window.renderer = new WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setPixelRatio(window.devicePixelRatio);
//     renderer.setSize(window.innerWidth, window.innerHeight); // Set to full window size
//     renderer.outputColorSpace = SRGBColorSpace;
//     renderer.toneMapping = NeutralToneMapping; // Neutral is often better for PBR in viewers
//     renderer.shadowMap.enabled = false;
//     // renderer.setClearColor(0x000000, 0);
//     renderer.setClearColor(0x87CEE, 1);

//     const envMapPromise = new Promise(resolve => {
//         const pmremGenerator = new PMREMGenerator(renderer);
//         pmremGenerator.compileCubemapShader();

//         new RGBELoader().load(options.hdrPath, (texture) => {
//             const hdrRenderTarget = pmremGenerator.fromEquirectangular(texture);
//             texture.mapping = EquirectangularReflectionMapping;
//             texture.needsUpdate = true;
//             scene.environment = hdrRenderTarget.texture;
//             console.log("HDR Environment loaded.");
//             resolve();
//         }, undefined, (err) => {
//             console.error('Failed to load HDR environment map. Scene environment will be null.', err);
//             resolve(); // Resolve even on error to continue initialization
//         });
//     });

//     document.body.appendChild(renderer.domElement);
//     controls = window._controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.2;

//     controls.update();

//     window.addEventListener('resize', onWindowResize);
//     renderer.domElement.addEventListener("drop", dropHandler);
//     renderer.domElement.addEventListener("dragover", dragOverHandler);

//     return envMapPromise;
// }

// function onWindowResize() {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// }

// function render() {
//     if (renderer && scene && camera) {
//         renderer.render(scene, camera);
//     }
// }

// // -------------------------------------------------------------------------
// // ⭐ NEW UTILITY FUNCTION TO APPLY CONDITIONAL COLOR BASED ON NAME
// // -------------------------------------------------------------------------

// /**
//  * Applies different MeshStandardMaterials based on keywords found in the mesh name.
//  * @param {Group} rootGroup - The Three.js group to traverse (e.g., window.usdRoot).
//  */
// function applyConditionalMaterials(rootGroup) {
//     // --- Define Material Keywords and Colors ---
//     const materialRules = {
//         'hair': new Color(0x000000),  // Bright green for hair
//         'eye': new Color(0x000000),   // Dodger blue for eyes
//         'teeth': new Color(0xFFFFFF),
//         'tearline': new Color(0xEEC1B9),
//         // Add more rules here: 'black', 'white', etc., if needed
//     };

//     // --- Create Material Instances ---
//     // Keep a cache of materials so they can be reused for efficiency.
//     const materialCache = {};
//     for (const [keyword, color] of Object.entries(materialRules)) {
//         materialCache[keyword] = new MeshStandardMaterial({
//             color: color,
//             metalness: 0.1,
//             roughness: 0.5,
//             name: `${keyword}Material`
//         });
//     }

//     // --- Create a Fallback Material ---
//     const defaultMaterial = new MeshStandardMaterial({
//         color: new Color(0xE0AC69), // Golden tan fallback color
//         metalness: 0.2,
//         roughness: 0.7,
//         name: "DefaultMaterial"
//     });

//     let meshesColored = 0;

//     // --- Scene Traversal ---
//     rootGroup.traverse(function (object) {
//         if (object.isMesh) {
//             let applied = false;
//             // The name check should be against the lower-cased version of the object's name
//             const objectNameLower = object.name.toLowerCase(); 

//             for (const keyword in materialRules) {
//                 // Check if the name contains the keyword
//                 if (objectNameLower.includes(keyword)) {
//                     // Apply the corresponding cached material
//                     object.material = materialCache[keyword];
//                     object.material.needsUpdate = true;
//                     applied = true;
//                     meshesColored++;
//                     break; // Stop after the first match (e.g., 'hair' takes precedence over 'body' if both are in the name)
//                 }
//             }

//             if (!applied) {
//                 // Apply the fallback material if no keyword matched
//                 object.material = defaultMaterial;
//                 object.material.needsUpdate = true;
//                 meshesColored++;
//             }
//         }
//     });

//     console.log(`Applied conditional materials to ${meshesColored} meshes.`);
// }

// // --- USD Loading Logic ---

// /**
//  * Loads a USD stage and renders it into the Three.js scene.
//  * This function handles both the primary file and background/referenced files.
//  * * @param {string} path - The path to the USD file (URL or virtual FS path)
//  * @param {boolean} isRoot - Is this the primary file being loaded?
//  * @param {Group} targetRoot - The Three.js group to attach the content to. Defaults to window.usdRoot.
//  * @returns {Promise<{driver: Usd.HdWebSyncDriver, stage: Usd.Stage}>}
//  */
// async function loadSingleUsdStage(path, isRoot = true, targetRoot = window.usdRoot) {
//     if (DEFAULT_OPTIONS.debugFileHandling) console.warn("Attempting to load USD stage:", path, "Is Root:", isRoot);

//     let driver = null;
//     const delegateConfig = {
//         usdRoot: targetRoot,
//         paths: new Array(),
//         driver: () => driver,
//     };

//     try {
//         const renderInterface = new ThreeRenderDelegateInterface(path, delegateConfig);
//         driver = await (new window.Usd.HdWebSyncDriver(renderInterface, path));
//     } catch (e) {
//         console.error(`Error initializing Hydra driver for ${path}:`, e);
//         throw new Error(`Failed to initialize USD driver for ${path}`);
//     }

//     let stage = driver.GetStage();
//     if (stage instanceof Promise) {
//         stage = await stage;
//         // Re-get stage after potential async loading
//         stage = driver.GetStage();
//     }
    
    
//     if (isRoot) {
//         // Only call Draw once all dependencies are loaded (in the main file loading process)
//         // If not the root, Draw will be called externally or implicitly via the delegate setup
//         driver.Draw();
//     }

//     return { driver, stage };
// }


// /**
//  * Orchestrates the loading of the primary USD file and any background files.
//  * @param {string} filename 
//  * @param {string} path 
//  * @param {string[]} extraUsdPaths 
//  */
// async function loadUsdFile(filename, path, extraUsdPaths = []) {
//     setFilenameText(filename);
//     // showUserMessage(`Loading primary file: ${filename}...`);
    
//     // 1. Load Primary USD Stage
//     let rootStageResult;
//     try {
//         // path here is the URL or the FS path to the main file
//         rootStageResult = await loadSingleUsdStage(path, true, window.usdRoot);
//         window.driver = rootStageResult.driver;
//         window.usdStage = rootStageResult.stage;
//         window.allDrivers.push(rootStageResult.driver); // include root driver in array

//     } catch (e) {
//         // showUserMessage(`Error loading primary USD file (${filename}). Check console for details.`, true);
//         console.error("Primary USD Load Error:", e);
//         return;
//     }
    
//     const stage = window.usdStage;

//     // Set animation parameters
//     if (stage.GetEndTimeCode) {
//         endTimeCode = stage.GetEndTimeCode();
//         timeout = 1000 / stage.GetTimeCodesPerSecond();
//     }

//     // --- START OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
//     // 2. Calculate the un-transformed bounding box
//     const initialBox = new Box3().setFromObject(window.usdRoot);
//     const center = new Vector3();
//     initialBox.getCenter(center);
    
//     // 3. **Translate the root group so its center is at the world origin (0, 0, 0)**
//     window.usdRoot.position.sub(center);

//     // 4. Apply rotation based on USD Up Axis (Z up vs Y up).
//     const upAxis = String.fromCharCode(stage.GetUpAxis()).toUpperCase();
    
//     // Reset rotation/scale to defaults first
//     window.usdRoot.rotation.set(0, 0, 0);
//     window.usdRoot.scale.set(1, 1, 1);
    
//     if (upAxis === "Z") {
//         // Z-up to Y-up conversion: Rotate -90 degrees around X
//         window.usdRoot.rotation.x = -Math.PI / 2; 
        
//         // Rotate 180 degrees around Y to correct "backwards" view after Z-up conversion.
//         window.usdRoot.rotation.y = Math.PI;
//     }

//     // 5. IMPORTANT: Force Three.js to calculate the object's final world position/bounds 
//     // immediately after the transformations are applied.
//     window.usdRoot.updateWorldMatrix(true, true);
    
//     // --- END OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
//     // ---------------------------------------------------------------------
//     // ⭐ SOLUTION INSERTED HERE: Apply conditional color based on prim name
//     // ---------------------------------------------------------------------
//     applyConditionalMaterials(window.usdRoot); 
//     // ---------------------------------------------------------------------

//     // 6. Load Background USD Stage(s)
//     if (extraUsdPaths.length > 0) {
//         for (const bgPath of extraUsdPaths) {
//             // showUserMessage(`Loading background USD: ${bgPath}...`);
//             try {
//                 // Background files are loaded as separate, detached groups
//                 const bgGroup = new Group();
//                 const bgStageResult = await loadSingleUsdStage(bgPath, false, bgGroup);
//                 window.usdRoot.add(bgGroup); // Add background group to the root
//                 window.allDrivers.push(bgStageResult.driver); // add driver to the global array
//                 console.log(`Successfully loaded background USD: ${bgPath}`);


//             } catch (e) {
//                 console.error(`Failed to load background USD: ${bgPath}. This could be a CORS issue if remote.`, e);
//                 console.warn(`If ${bgPath} is remote, ensure its server sends 'Access-Control-Allow-Origin: *' header.`);
//             }
//         }
//     }

//     // 7. Finalize and Fit Camera
//     // fitCameraToSelection now targets the origin and adjusts the zoom.
//     fitCameraToSelection(camera, controls, [window.usdRoot]);
//     ready = true;
//     // showUserMessage(`Successfully loaded ${currentDisplayFilename} (and ${extraUsdPaths.length} background${extraUsdPaths.length === 1 ? '' : 's'}).`);
//     console.log("Loading complete. Scene elements:", window.usdRoot.children);

//     // Delay the postMessage a bit to ensure the first render completed
//     setTimeout(() => {
//         window.parent.postMessage({ type: "USD_LOADED" }, "*");
//         console.log("📤 USD_LOADED message sent to parent");
//     }, 500);
// }

// // --- Animation Loop ---

// let isPaused = false;
// document.body.onkeyup = function(e){
//     if(e.keyCode == 32){ // Spacebar
//         isPaused = !isPaused;
//         // showUserMessage(isPaused ? "Rendering Paused (Press Space)" : "Rendering Active");
//     }
// }

// async function animate() {
//     if (!isPaused && ready) {
//     const secs = new Date().getTime() / 1000;
//     const time = (secs * (1000 / timeout)) % endTimeCode;

//     for (const drv of window.allDrivers) {
//         if (drv.SetTime && drv.Draw) {
//             drv.SetTime(time);
//             drv.Draw();
//         }
//     }
// }


//     window._controls.update();
//     render();
    
//     // Use requestAnimationFrame for smoother rendering
//     requestAnimationFrame(animate); 
// }

// // --- Export Logic ---

// /**
//  * Attaches event listeners for export buttons.
//  */
// function setupExportListeners() {
//     const usdzExportBtn = document.getElementById('export-usdz');
//     if (usdzExportBtn) usdzExportBtn.addEventListener('click', () => {
//         // showUserMessage("USDZ export is not supported in this WebAssembly build yet.", true);
//     });

//     const gltfExportBtn = document.getElementById('export-gltf');
//     if (gltfExportBtn) gltfExportBtn.addEventListener('click', (evt) => {
//         evt.preventDefault();
//         if (!window.usdRoot) return showUserMessage("Nothing to export.", true);

//         // showUserMessage("Exporting to GLB (GLTF binary)...");
//         const exporter = new GLTFExporter();
        
//         exporter.parse(window.usdRoot, function (gltfArrayBuffer) {
//             try {
//                 const blob = new Blob([gltfArrayBuffer], {type: 'model/gltf-binary'});
//                 const url = URL.createObjectURL(blob);
//                 const a = document.createElement('a');
//                 a.href = url;
                
//                 // Construct clean filename
//                 let filename = currentDisplayFilename.split('/').pop().split('.')[0].split('?')[0];
//                 a.download = (filename || 'exported_usd_model') + ".glb";
                
//                 a.click();
//                 URL.revokeObjectURL(url);
//                 showUserMessage("Exported GLB successfully.");
//             } catch (e) {
//                 console.error("Error during GLB file download:", e);
//                 showUserMessage("Error during GLB file download.", true);
//             }
//         }, function (error) {
//             console.error("GLTF Export Error:", error);
//             showUserMessage("GLTF Export Failed. See console.", true);
//         }, { 
//             binary: true,
//             // Animations are complex in USD/Hydra, usually handled separately
//             animations: [] 
//         });
//     });
// }


// // --- Main Entry Point ---

// export function init(options = {}) {
//     // Merge provided options with defaults
//     const finalOptions = { ...DEFAULT_OPTIONS, ...options };

//     document.addEventListener("DOMContentLoaded", async function() {
//         messageLog = document.querySelector("#message-log");
//         showUserMessage("Initializing 3D viewer...");

//         const params = (new URL(document.location)).searchParams;
//         let filename = params.get("file") || "";
        
//         // Combined logic to get multiple background paths from 'bgs' or legacy 'bg'
//         let bgUsdString = params.get("bgs") || params.get("bg");
//         let extraUsd = [];
//         if (bgUsdString) {
//             extraUsd = bgUsdString.split(',').filter(p => p.trim() !== '');
//         }

//         // 1. Initialize Three.js scene and load environment map
//         const threeInitPromise = initThree(finalOptions);

//         // 2. Load USD Module (WebAssembly)
//         showUserMessage("Wait a minute, we’re setting things up for you...");
//         // try {
//         //     const [Usd] = await Promise.all([
//         //         getUsdModule({
//         //             mainScriptUrlOrBlob: "./emHdBindings.js",
//         //             locateFile: (file) => {
//         //                 return "/usd/bindings/" + file;
//         //             },
//         //         }),
//         //         threeInitPromise
//         //     ]);

//         try {
//   const [Usd] = await Promise.all([
//     getUsdModule({
//       mainScriptUrlOrBlob: "/r2/usd/bindings/emHdBindings.js",
//       locateFile: (file) => {
//         return "/r2/usd/bindings/" + file;
//       },
//     }),
//     threeInitPromise
//   ]);



//             window.Usd = Usd;
//             showUserMessage("almost done...");

//             // 3. Setup export listeners
//             setupExportListeners();

//             // 4. Load initial file from URL if present
//             if (filename) {
//                 const el = document.querySelector("#container");
//                 el.classList.add("have-custom-file");
                
//                 // Get URL path for loading
//                 const urlPath = filename.split('?')[0];
                
//                 // Load the USD file(s)
//                 await loadUsdFile(filename, urlPath, extraUsd);
//                 updateUrl(filename, extraUsd);
//             }
            
//             // 5. Start the animation loop
//             animate();

//         } catch (error) {
//             let errorMessage = "An unknown error occurred during initialization.";
//             if(error.toString().includes("SharedArrayBuffer")) {
//                 errorMessage = "Your browser doesn't support SharedArrayBuffer (COOP/COEP headers missing), which is required for USD.";
//             } else {
//                 errorMessage = "Error during USD module initialization: " + error.message;
//             }
//             console.error(error);
//             showUserMessage(errorMessage, true);
//         }
//     });
// }







import { Vector3, Box3, PerspectiveCamera, Scene, Color, AmbientLight, Group, PointLight, WebGLRenderer, SRGBColorSpace, AgXToneMapping, NeutralToneMapping, VSMShadowMap, PMREMGenerator, EquirectangularReflectionMapping, MeshStandardMaterial } from 'three';
import { ThreeRenderDelegateInterface } from "./usd/hydra/ThreeJsRenderDelegate.js"
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import './usd/bindings/emHdBindings.js';

// Global access for the USD Emscripten Module
const getUsdModule = globalThis["NEEDLE:USD:GET"];

/** Configuration for the environment and camera. */
const DEFAULT_OPTIONS = {
    hdrPath: 'environments/neutral.hdr',
    defaultCameraZ: 7,
    defaultCameraY: 7,
    defaultCameraX: 0,
    debugFileHandling: false
};

// ----------------------------------------------------------------------
// 🎨 EMOTION → BACKGROUND COLOR MAP
// ----------------------------------------------------------------------
const EMOTION_BG_COLORS = {
  // Core emotions
  amazement:   0xC084FC, // soft violet (wonder / awe)
  anger:       0x7F1D1D, // deep controlled red
  cheekiness:  0xF59E0B, // playful orange
  disgust:     0x556B2F, // olive green
  fear:        0x374151, // cold dark gray-blue
  grief:       0x4B5563, // deep muted blue-gray
  joy:         0x87CEE, 
  outofbreath: 0x9CA3AF, // light gray (exhaustion)
  pain:        0x991B1B, // sharp dark crimson
  sadness:    0x6B7C93, // muted blue

  // 🆕 Hybrid / custom emotions
  happy:       0xFFD966, // bright joyful yellow
  flirty:      0xFB7185, // playful pink
  romantic:    0xFFB6C1, // soft blush pink
  confident:   0x2563EB, // strong royal blue
  excited:     0xF97316, // energetic orange
  tired:       0x9CA3AF, // desaturated gray
  nervous:     0xA855F7, // anxious purple

  // Fallback
  neutral:     0xE5E7EB  // light neutral gray
};

const emotionIcons = {
  amazement: "😮",
  anger: "😡",
  cheekiness: "😏",
  disgust: "🤢",
  fear: "😨",
  grief: "😭",
  joy: "😄",
  outofbreath: "🥵",
  pain: "🤕",
  sadness: "😥",
  happy: "😊",
  flirty: "😉",
  romantic: "🥰",
  confident: "😎",
  excited: "🤩",
  tired: "😴",
  nervous: "😬",
};



let scene, camera, renderer, controls, messageLog;
let currentDisplayFilename = "";
let ready = false;
let timeout = 40; // Frame time (e.g., 1000/25 fps)
let endTimeCode = 1; // End frame for animation loop
let avatarModel;
window.allDrivers = []; // store all USD drivers (root + backgrounds)

// =======================================================
// ⭐ PUPPETEER CONTROL FLAGS AND COMMUNICATION (NEW)
// =======================================================
let isExternallyControlled = false; 
window.isExternallyControlled = isExternallyControlled; // Expose globally for Puppeteer to set

/**
 * Sends a signal back to the parent window (Puppeteer) that the frame 
 * for the given time has been rendered and is ready for screenshot.
 * @param {number} timeMs - The absolute time in milliseconds that was just rendered.
 */
function signalFrameRendered(timeMs) {
    // We only use window.parent.postMessage when we know we're inside an iframe 
    // being controlled, which is the Puppeteer setup.
    window.parent.postMessage({ 
        type: 'FRAME_RENDERED', 
        time: timeMs 
    }, "*");
}
// =======================================================

// ... [signalFrameRendered function remains the same] ...

// =======================================================
// ⭐ FRAME SEEKING LOGIC (PUPPETEER CONTROL) (NEW)
// =======================================================

/**
 * Jumps the USD animation and rendering state to a specific time.
 * This function is called externally by Puppeteer via page.evaluate().
 * @param {number} timeMs - The absolute time in milliseconds (0 to audio duration).
 */
export function seekAnimationTo(timeMs) {
    // 1. Safety check
    if (!ready || !window.usdStage) {
        console.warn("Cannot seek: USD Stage not ready.");
        signalFrameRendered(timeMs);
        return;
    }

    const stage = window.usdStage;
    const timeCodesPerSecond = stage.GetTimeCodesPerSecond();
    
    // 2. Convert milliseconds to USD Time Code
    const timeCode = (timeMs / 1000) * timeCodesPerSecond;
    
    // 3. Update all USD Drivers
    for (const drv of window.allDrivers) {
        if (drv.SetTime && drv.Draw) {
            drv.SetTime(timeCode); // Set the specific frame time
            drv.Draw(); // Force USD to update the geometry
        }
    }

    // 4. Apply any manual/lip-sync shape keys after USD update
    // applyActiveEmotions(); 
    
    // 5. Force a Three.js render (assuming 'render' function exists elsewhere)
    render(); 

    // 6. Signal back to Puppeteer
    signalFrameRendered(timeMs);
}

// ⭐ CRITICAL LINE FOR PUPPETEER ACCESS
window.seekAnimationTo = seekAnimationTo;

// --- REACT SYNC BRIDGE ---
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_TICK') {
        // 1. Stop the internal clock so it doesn't fight with the audio
        window.isExternallyControlled = true;
        
        // 2. Seek to the exact millisecond provided by the React audio
        if (typeof window.seekAnimationTo === 'function') {
            window.seekAnimationTo(event.data.timeMs);
        }
    }
});


// ----------------------------------------------------------------------
// ⭐ NEW: SHAPE KEY MANAGEMENT AND STATE
// ----------------------------------------------------------------------
// const shapeKeyIndexMap = {}; // Maps meshName -> { shapeKeyName: index }
window.activeEmotions = {}; // Stores the target influence: { meshName: { keyName: influence } }

function applyEmotionBackground(emotion) {
    if (!renderer) return;

    const key = (emotion || "neutral").toLowerCase();
    const color = EMOTION_BG_COLORS[key] ?? EMOTION_BG_COLORS.neutral;

    renderer.setClearColor(color, 1);
    console.log(`🎨 Background set for emotion: ${key}`);
}

function applyEmotionEmoji(emotion) {
  const el = document.getElementById("emotion-indicator");
  if (!el) return;

  const key = (emotion || "").toLowerCase();
  el.textContent = emotionIcons[key] ?? "🙂";
//   showUserMessage(emotionIcons[key] ?? "🙂");
}


// --- Utility Functions ---

/**
 * Replaces system alerts with console/UI messages.
 * @param {string} message 
 * @param {boolean} isError 
 */
function showUserMessage(message, isError = false) {
    console.log(isError ? "ERROR:" : "INFO:", message);
    if (messageLog) {
        messageLog.textContent = message;
        messageLog.style.background = "linear-gradient(to right, #a78bfa, #f472b6, #8b5cf6)"; // purple-pink gradient
        messageLog.style.webkitBackgroundClip = "text";
        messageLog.style.color = "transparent";
        messageLog.style.fontWeight = "600"; // optional bold
        messageLog.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
}
}

/**
 * Updates the filename displayed in the UI.
 * @param {string} __filename 
 */
function setFilenameText(__filename) {
    var _filename = __filename.split('/').pop().split('#')[0].split('?')[0];
    const _el = document.querySelector(".filename");
    if (_el) _el.innerText = _filename;
    currentDisplayFilename = _filename;
}

/**
 * Updates the browser's URL based on the loaded file.
 * @param {string} filename 
 * @param {string[]} bgUsds - Array of background USD file URLs. 
 */
function updateUrl(filename, bgUsds = []) {
    if (!filename) return;

    // Workaround for GitHub CORS: rewrite blob links to raw
    if (filename.includes("github.com")) {
        filename = filename.replace("github.com", "raw.githubusercontent.com");
        filename = filename.replace("/blob/", "/");
    }

    // Set quick look link
    let url = filename.split('?')[0];
    const quickLookLink = document.querySelector("a#quick-look-link");
    if (quickLookLink) quickLookLink.href = url;

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("file", filename);
    
    // Handle multiple background files
    if (bgUsds && bgUsds.length > 0) {
        // Join paths with comma for the URL parameter
        currentUrl.searchParams.set("bgs", bgUsds.join(',')); 
    } else {
        currentUrl.searchParams.delete("bgs");
    }
    
    // Remove old 'bg' parameter for clean up
    currentUrl.searchParams.delete("bg"); 
    
    // Only update history if the URL has changed significantly
    if (window.location.search !== currentUrl.search) {
        window.history.pushState({}, filename, currentUrl);
    }
}

// --- USD File System (FS) Helpers ---

/**
 * Recursively retrieves all loaded file paths from the USD virtual filesystem.
 * @param {string} currentPath 
 * @param {string[]} paths 
 */
function getAllLoadedFilePaths(currentPath, paths) {
    const files = window.Usd.FS_readdir(currentPath);
    for (const file of files) {
        if (file === "." || file === "..") continue;
        const newPath = currentPath + file + "/";
        const data = window.Usd.FS_analyzePath(currentPath + file + "/");
        if (data.object.node_ops.readdir) {
            // Skip default directories
            if (["/dev/", "/proc/", "/home/", "/tmp/", "/usd/"].includes(newPath)) continue;
            getAllLoadedFilePaths(newPath, paths);
        } else {
            paths.push(data.path);
        }
    }
}

/**
 * Clears the USD stage and the Three.js root group.
 */
function clearStage() {
    if (!window.Usd || !window.usdRoot) return;

    // 1. Unlink all files from USD virtual FS
    const allFilePaths = [];
    getAllLoadedFilePaths("/", allFilePaths);
    console.log("Clearing stage. Unlinking files:", allFilePaths);

    for (const file of allFilePaths) {
        try {
            window.Usd.FS_unlink(file, true);
        } catch (e) {
            console.warn(`Could not unlink file ${file}:`, e);
        }
    }

    // 2. Clear Three.js scene group
    window.usdRoot.clear();
    ready = false;
    currentDisplayFilename = "";
    // showUserMessage("Stage cleared.");
    
    // 3. Clear shape key state
    // for (const key in shapeKeyIndexMap) delete shapeKeyIndexMap[key];
    for (const key in window.activeEmotions) delete window.activeEmotions[key];
}

// --- Drag and Drop Logic ---

/**
 * Converts a FileSystemEntry into a File object.
 * @param {FileSystemFileEntry} fileEntry 
 * @returns {Promise<File>}
 */
async function getFileFromFileEntry(fileEntry) {
    try {
        return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
    } catch (err) {
        console.error("Error getting file from entry:", err);
        return null;
    }
}

/**
 * Loads a file from a URL or local file, writes it to the USD FS, and loads the stage.
 * @param {File|FileSystemFileEntry} fileOrHandle 
 * @param {boolean} isRootFile 
 * @param {string} fullPath 
 */
async function loadFile(fileOrHandle, isRootFile = true, fullPath = undefined) {
    let file;
    if (fileOrHandle.getFile) {
        file = await fileOrHandle.getFile();
    } else if (fileOrHandle.isFile && fileOrHandle.file) {
        // Handle FileSystemFileEntry for older APIs
        file = await getFileFromFileEntry(fileOrHandle);
    } else {
        file = fileOrHandle;
    }

    if (!file) {
        console.warn("Could not retrieve file data.");
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        let fileName = file.name;
        let directory = "/";
        if (fullPath !== undefined) {
            fileName = fullPath.split('/').pop();
            // Ensure directory path ends with a slash for FS_createPath
            directory = fullPath.substring(0, fullPath.length - fileName.length); 
            if (DEFAULT_OPTIONS.debugFileHandling) console.log("Virtual FS path:", { directory, fileName });
        }
        
        // 1. Create directory structure in USD FS
        window.Usd.FS_createPath("", directory, true, true); 
        
        // 2. Write file data
        window.Usd.FS_createDataFile(directory, fileName, new Uint8Array(arrayBuffer), true, true, true);

        if (isRootFile) {
            // Load the entire stage now that dependencies are in FS
            const params = (new URL(document.location)).searchParams;
            // Check for multiple backgrounds ('bgs') or legacy single ('bg')
            const bgUsdString = params.get("bgs") || params.get("bg"); 
            const extraUsd = bgUsdString ? bgUsdString.split(',').filter(p => p.trim() !== '') : [];
            
            await loadUsdFile(fileName, fullPath || `/${fileName}`, extraUsd);
            updateUrl(fullPath || fileName, extraUsd);
        }
    }
    catch(ex) {
        console.error("Error loading file into USD virtual FS:", file.name, ex);
        showUserMessage(`Error processing file ${file.name}. See console.`, true);
    }
}


/**
 * Processes all dropped filesystem entries (files or directories).
 * @param {FileSystemEntry[]} entries
 */
async function handleFilesystemEntries(entries) {
    // showUserMessage("Processing dropped files...");
    const allFiles = [];
    const ignoreList = ['.gitignore', 'README.md', '.DS_Store', '.git', 'node_modules'];

    /** @type {(entry: FileSystemEntry) => Promise<void>} */
    const traverseEntry = async (entry) => {
        if (ignoreList.includes(entry.name)) return;

        if (entry.isFile) {
            // Get file path relative to the drop root (or just use entry.fullPath)
            allFiles.push(entry);
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            let results = [];
            let readBatch;
            do {
                readBatch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
                results = results.concat(readBatch);
            } while (readBatch.length > 0);

            for (const subEntry of results) {
                await traverseEntry(subEntry);
            }
        }
    };

    for (const entry of entries) {
        await traverseEntry(entry);
    }

    // 1. Clear existing scene
    clearStage();

    // 2. Determine the root file (e.g., the shallowest USD file)
    let rootFile = allFiles
        .filter(f => ['usd', 'usdz', 'usda', 'usdc'].includes(f.name.split('.').pop()))
        .sort((a, b) => a.fullPath.split('/').length - b.fullPath.split('/').length)[0];

    if (!rootFile && allFiles.length > 0) {
        console.warn("Could not find a standard USD root file. Using first file as root.");
        rootFile = allFiles[0];
    }

    if (!rootFile) {
        // showUserMessage("No loadable USD files found in dropped content.", true);
        return;
    }

    // 3. Load all dependencies first (not the root file)
    const filesToLoad = allFiles.filter(f => f !== rootFile);
    console.log(`Found ${allFiles.length} files. Dependencies to load: ${filesToLoad.length}`);

    // Sort dependencies to prioritize non-USD files (e.g., textures)
    filesToLoad.sort((a, b) => {
        let extA = a.name.split('.').pop();
        let extB = b.name.split('.').pop();
        const isUsdA = ['usd', 'usdz', 'usda', 'usdc'].includes(extA);
        const isUsdB = ['usd', 'usdz', 'usda', 'usdc'].includes(extB);
        if (isUsdA && !isUsdB) return 1;
        if (!isUsdA && isUsdB) return -1;
        return 0;
    });

    for (const fileEntry of filesToLoad) {
        // showUserMessage(`Loading dependency: ${fileEntry.name}...`);
        await loadFile(fileEntry, false, fileEntry.fullPath);
    }

    // 4. Load the root file last
    // showUserMessage(`Loading root file: ${rootFile.name}...`);
    await loadFile(rootFile, true, rootFile.fullPath);
}

/**
 * @param {DragEvent} ev
 */
function dropHandler(ev) {
    ev.preventDefault();
    if (!window.Usd) {
        // showUserMessage("USD module not ready yet. Please wait.", true);
        return;
    }

    if (ev.dataTransfer.items) {
        const allEntries = [];
        let haveGetAsEntry = ("getAsEntry" in ev.dataTransfer.items[0]) || ("webkitGetAsEntry" in ev.dataTransfer.items[0]);

        if (haveGetAsEntry) {
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                let item = ev.dataTransfer.items[i];
                let entry = ("getAsEntry" in item) ? item.getAsEntry() : item.webkitGetAsEntry();
                if (entry) allEntries.push(entry);
            }
            handleFilesystemEntries(allEntries);
        } else {
            // Fallback for browsers without proper Directory drag support
            const files = [];
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                let file = ev.dataTransfer.items[i].getAsFile();
                if (file) files.push(file);
            }
            if (files.length > 0) {
                clearStage();
                // Assumes the first file is the root if only files are dropped
                loadFile(files[0], true, `/${files[0].name}`);
            }
        }
    }
}

function dragOverHandler(ev) {
    ev.preventDefault();
}

// --- Three.js & Scene Setup ---

/**
 * Fits the camera to contain the entire selection of objects.
 * NOTE: Assumes the selection group is already centered at (0, 0, 0)
 * @param {PerspectiveCamera} camera 
 * @param {OrbitControls} controls 
 * @param {Group[]} selection 
 * @param {number} fitOffset 
 */
function fitCameraToSelection(camera, controls, selection, fitOffset = 1.5) {
    const box = new Box3().makeEmpty();
    for(const object of selection) {
        // Expand by world space bounding box
        box.expandByObject(object);
    }
    
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center); // Should be close to (0, 0, 0) due to pre-translation

    if (Number.isNaN(size.x)) {
        console.warn("Fit Camera failed: NaN values found (object likely has no geometry).");
        if (controls) controls.update();
        return;
    }

    if (!controls) return;
    
    // Explicitly set the control target to the calculated center (should be origin)
    controls.target.copy(center); 

    const maxSize = Math.max(size.x, size.y, size.z);
    const fovRad = Math.PI * camera.fov / 360;
    const fitHeightDistance = maxSize / (2 * Math.tan(fovRad));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

    if (distance === 0) {
        console.warn("Fit Camera failed: distance is 0.");
        return;
    }

    controls.maxDistance = distance * 10;

    camera.near = distance / 100;
    camera.far = distance * 100;

    camera.updateProjectionMatrix();

    // Calculate new position based on target and distance
    // This repositions the camera based on its *current* direction relative to the new target (center)
    const direction = camera.position.clone()
        .sub(controls.target)
        .normalize()
        .multiplyScalar(distance);

    camera.position.copy(controls.target).add(direction);
    controls.update();

    console.log("Fitting camera to selection", { size, center: center.toArray(), distance });
}

/**
 * Initializes Three.js renderer, camera, scene, and controls.
 * @param {object} options 
 * @returns {Promise<void>} Resolves when the environment map is loaded.
 */
async function initThree(options) {
    camera = window.camera = new PerspectiveCamera(27, window.innerWidth / window.innerHeight, 0.1, 3500);
    const params = (new URL(document.location)).searchParams;
    camera.position.z = parseFloat(params.get('cameraZ')) || options.defaultCameraZ;
    camera.position.y = parseFloat(params.get('cameraY')) || options.defaultCameraY;
    camera.position.x = parseFloat(params.get('cameraX')) || options.defaultCameraX;

    scene = window.scene = new Scene();
    window.usdRoot = new Group();
    window.usdRoot.name = "USD Root";
    scene.add(window.usdRoot);

    renderer = window.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight); // Set to full window size
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NeutralToneMapping; // Neutral is often better for PBR in viewers
    renderer.shadowMap.enabled = false;
    // renderer.setClearColor(0x000000, 0);
    renderer.setClearColor(0x87CEE, 1);

    const envMapPromise = new Promise(resolve => {
        const pmremGenerator = new PMREMGenerator(renderer);
        pmremGenerator.compileCubemapShader();

        new RGBELoader().load(options.hdrPath, (texture) => {
            const hdrRenderTarget = pmremGenerator.fromEquirectangular(texture);
            texture.mapping = EquirectangularReflectionMapping;
            texture.needsUpdate = true;
            scene.environment = hdrRenderTarget.texture;
            console.log("HDR Environment loaded.");
            resolve();
        }, undefined, (err) => {
            console.error('Failed to load HDR environment map. Scene environment will be null.', err);
            resolve(); // Resolve even on error to continue initialization
        });
    });

    document.body.appendChild(renderer.domElement);
    controls = window._controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    controls.update();

    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener("drop", dropHandler);
    renderer.domElement.addEventListener("dragover", dragOverHandler);

    return envMapPromise;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// -------------------------------------------------------------------------
// ⭐ NEW UTILITY FUNCTION TO APPLY CONDITIONAL COLOR BASED ON NAME
// -------------------------------------------------------------------------

/**
 * Applies different MeshStandardMaterials based on keywords found in the mesh name.
 * @param {Group} rootGroup - The Three.js group to traverse (e.g., window.usdRoot).
 */
function applyConditionalMaterials(rootGroup) {
    // --- Define Material Keywords and Colors ---
    const materialRules = {
        'hair': new Color(0x000000),  // Bright green for hair
        'eye': new Color(0x000000),   // Dodger blue for eyes
        'eyeball': new Color(0xFFFFFF),
        'teeth': new Color(0xFFFFFF),
        'tearline': new Color(0xF3DCD2),
        'tongue': new Color(0xE0A0A8),
        'iris': new Color(0x4B3621), // dark brown
        'pupil': new Color(0x000000),
        'batman_mask': new Color(0x000000),
        // Add more rules here: 'black', 'white', etc., if needed
    };

    // --- Create Material Instances ---
    // Keep a cache of materials so they can be reused for efficiency.
    const materialCache = {};
    for (const [keyword, color] of Object.entries(materialRules)) {
        materialCache[keyword] = new MeshStandardMaterial({
            color: color,
            metalness: 0.1,
            roughness: 0.5,
            name: `${keyword}Material`
        });
    }
    // Sort keywords by length descending to prioritize longer matches (eyeball before eye)
   


    // --- Create a Fallback Material ---
    // const defaultMaterial = new MeshStandardMaterial({
    //     color: new Color(0xE0AC69), // Golden tan fallback color
    //     metalness: 0.2,
    //     roughness: 0.7,
    //     name: "DefaultMaterial"
    // });
     const AVATAR_SKIN_MAP = {
    "ishowspeed.usd": 0x8D5524, // dark brown
    "raju.usd":0xE0AC69,
    "batman.usd":0xFFDBAC,
    };

    
    console.log(avatarModel);

    const skinColor =
        AVATAR_SKIN_MAP[avatarModel] ?? 0xE0AC69; // default fallback

    const defaultMaterial = new MeshStandardMaterial({
        color: new Color(skinColor),
        metalness: 0.2,
        roughness: 0.7,
        name: "DefaultSkinMaterial"
    });


    let meshesColored = 0;

    // --- Scene Traversal ---
    rootGroup.traverse(function (object) {
        if (object.isMesh) {
            let applied = false;
            // The name check should be against the lower-cased version of the object's name
            const objectNameLower = object.name.toLowerCase(); 

            // for (const keyword in materialRules) {
            //     // Check if the name contains the keyword
            //     if (objectNameLower.includes(keyword)) {
            //         // Apply the corresponding cached material
            //         object.material = materialCache[keyword];
            //         object.material.needsUpdate = true;
            //         applied = true;
            //         meshesColored++;
            //         break; // Stop after the first match (e.g., 'hair' takes precedence over 'body' if both are in the name)
            //     }
            // }
             const sortedKeywords = Object.keys(materialRules).sort((a, b) => b.length - a.length);

            for (const keyword of sortedKeywords) {
                if (objectNameLower.includes(keyword)) {
                    object.material = materialCache[keyword];
                    object.material.needsUpdate = true;
                    applied = true;
                    meshesColored++;
                    break; // stop after first match
                }
            }

            if (!applied) {
                // Apply the fallback material if no keyword matched
                object.material = defaultMaterial;
                object.material.needsUpdate = true;
                meshesColored++;
            }
        }
    });

    console.log(`Applied conditional materials to ${meshesColored} meshes.`);
}

// --- USD Loading Logic ---

/**
 * Loads a USD stage and renders it into the Three.js scene.
 * This function handles both the primary file and background/referenced files.
 * * @param {string} path - The path to the USD file (URL or virtual FS path)
 * @param {boolean} isRoot - Is this the primary file being loaded?
 * @param {Group} targetRoot - The Three.js group to attach the content to. Defaults to window.usdRoot.
 * @returns {Promise<{driver: Usd.HdWebSyncDriver, stage: Usd.Stage}>}
 */
async function loadSingleUsdStage(path, isRoot = true, targetRoot = window.usdRoot) {
    if (DEFAULT_OPTIONS.debugFileHandling) console.warn("Attempting to load USD stage:", path, "Is Root:", isRoot);

    let driver = null;
    const delegateConfig = {
        usdRoot: targetRoot,
        paths: new Array(),
        driver: () => driver,
    };

    try {
        const renderInterface = new ThreeRenderDelegateInterface(path, delegateConfig);
        driver = await (new window.Usd.HdWebSyncDriver(renderInterface, path));
    } catch (e) {
        console.error(`Error initializing Hydra driver for ${path}:`, e);
        throw new Error(`Failed to initialize USD driver for ${path}`);
    }

    let stage = driver.GetStage();
    if (stage instanceof Promise) {
        stage = await stage;
        // Re-get stage after potential async loading
        stage = driver.GetStage();
    }
    
    
    if (isRoot) {
        // Only call Draw once all dependencies are loaded (in the main file loading process)
        // If not the root, Draw will be called externally or implicitly via the delegate setup
        driver.Draw();
    }

    return { driver, stage };
}


/**
 * Orchestrates the loading of the primary USD file and any background files.
 * @param {string} filename 
 * @param {string} path 
 * @param {string[]} extraUsdPaths 
 */
async function loadUsdFile(filename, path, extraUsdPaths = []) {
    setFilenameText(filename);
    // showUserMessage(`Loading primary file: ${filename}...`);
    
    // 1. Load Primary USD Stage
    let rootStageResult;
    try {
        // path here is the URL or the FS path to the main file
        rootStageResult = await loadSingleUsdStage(path, true, window.usdRoot);
        window.driver = rootStageResult.driver;
        window.usdStage = rootStageResult.stage;
        window.allDrivers.push(rootStageResult.driver); // include root driver in array

    } catch (e) {
        // showUserMessage(`Error loading primary USD file (${filename}). Check console for details.`, true);
        console.error("Primary USD Load Error:", e);
        return;
    }
    
    const stage = window.usdStage;

    // Set animation parameters
    if (stage.GetEndTimeCode) {
        endTimeCode = stage.GetEndTimeCode();
        timeout = 1000 / stage.GetTimeCodesPerSecond();
    }

    // --- START OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
    // 2. Calculate the un-transformed bounding box
    const initialBox = new Box3().setFromObject(window.usdRoot);
    const center = new Vector3();
    initialBox.getCenter(center);
    
    // 3. **Translate the root group so its center is at the world origin (0, 0, 0)**
    window.usdRoot.position.sub(center);

    // 4. Apply rotation based on USD Up Axis (Z up vs Y up).
    const upAxis = String.fromCharCode(stage.GetUpAxis()).toUpperCase();
    
    // Reset rotation/scale to defaults first
    window.usdRoot.rotation.set(0, 0, 0);
    window.usdRoot.scale.set(1, 1, 1);
    
    if (upAxis === "Z") {
        // Z-up to Y-up conversion: Rotate -90 degrees around X
        window.usdRoot.rotation.x = -Math.PI / 2; 
        
        // Rotate 180 degrees around Y to correct "backwards" view after Z-up conversion.
        window.usdRoot.rotation.y = Math.PI;
    }

    // 5. IMPORTANT: Force Three.js to calculate the object's final world position/bounds 
    // immediately after the transformations are applied.
    window.usdRoot.updateWorldMatrix(true, true);
    
    // --- END OF DEFINITIVE CENTERING AND ORIENTATION FIX ---
    
    // ---------------------------------------------------------------------
    // ⭐ INSERTION POINT 1: Shape Key Mapping
    // ---------------------------------------------------------------------
    // buildShapeKeyMaps(window.usdRoot); 
    // ---------------------------------------------------------------------

    // 6. Apply conditional color based on prim name
    applyConditionalMaterials(window.usdRoot); 

    // 7. Load Background USD Stage(s)
    if (extraUsdPaths.length > 0) {
        for (const bgPath of extraUsdPaths) {
            // showUserMessage(`Loading background USD: ${bgPath}...`);
            try {
                // Background files are loaded as separate, detached groups
                const bgGroup = new Group();
                const bgStageResult = await loadSingleUsdStage(bgPath, false, bgGroup);
                window.usdRoot.add(bgGroup); // Add background group to the root
                window.allDrivers.push(bgStageResult.driver); // add driver to the global array
                console.log(`Successfully loaded background USD: ${bgPath}`);


            } catch (e) {
                console.error(`Failed to load background USD: ${bgPath}. This could be a CORS issue if remote.`, e);
                console.warn(`If ${bgPath} is remote, ensure its server sends 'Access-Control-Allow-Origin: *' header.`);
            }
        }
    }

    // 8. Finalize and Fit Camera
    // fitCameraToSelection now targets the origin and adjusts the zoom.
    fitCameraToSelection(camera, controls, [window.usdRoot]);
    ready = true;
    // showUserMessage(`Successfully loaded ${currentDisplayFilename} (and ${extraUsdPaths.length} background${extraUsdPaths.length === 1 ? '' : 's'}).`);
    console.log("Loading complete. Scene elements:", window.usdRoot.children);

    // Delay the postMessage a bit to ensure the first render completed
    setTimeout(() => {
        window.parent.postMessage({ type: "USD_LOADED" }, "*");
        console.log("📤 USD_LOADED message sent to parent");
    }, 500);
}

// --- Animation Loop ---

let isPaused = false;
document.body.onkeyup = function(e){
    if(e.keyCode == 32){ // Spacebar
        isPaused = !isPaused;
        // showUserMessage(isPaused ? "Rendering Paused (Press Space)" : "Rendering Active");
    }
}

// async function animate() {
//     if (!isPaused && ready) {
//     const secs = new Date().getTime() / 1000;
//     const time = (secs * (1000 / timeout)) % endTimeCode;

//     for (const drv of window.allDrivers) {
//         if (drv.SetTime && drv.Draw) {
//             drv.SetTime(time);
//             drv.Draw();
//         }
//     }

//     // ---------------------------------------------------------------------
//     // ⭐ INSERTION POINT 2: Apply Manual Emotion Control
//     // This runs AFTER the USD animation updates (drv.Draw()), allowing manual 
//     // emotions to override or blend with the geometry cache animation.
//     // ---------------------------------------------------------------------
//     // applyActiveEmotions();
//     // ---------------------------------------------------------------------
// }


//     window._controls.update();
//     render();
    
//     // Use requestAnimationFrame for smoother rendering
//     requestAnimationFrame(animate); 
// }

// --- Export Logic ---


async function animate() {
    // ------------------------------------------------------------------
    // ⭐ SAFEGUARD: ONLY ADVANCE INTERNAL CLOCK IF NOT EXTERNALLY CONTROLLED
    // ------------------------------------------------------------------
    if (!isPaused && ready && !window.isExternallyControlled) {
        const secs = new Date().getTime() / 1000;
        const time = (secs * (1000 / timeout)) % endTimeCode;

        for (const drv of window.allDrivers) {
            if (drv.SetTime && drv.Draw) {
                drv.SetTime(time);
                drv.Draw();
            }
        }
    }
    // ------------------------------------------------------------------

    // ALWAYS update controls and render so the user can still rotate the camera
    if (window._controls) window._controls.update();
    render();
    
    requestAnimationFrame(animate); 
}
/**
 * Attaches event listeners for export buttons.
 */
function setupExportListeners() {
    const usdzExportBtn = document.getElementById('export-usdz');
    if (usdzExportBtn) usdzExportBtn.addEventListener('click', () => {
        // showUserMessage("USDZ export is not supported in this WebAssembly build yet.", true);
    });

    const gltfExportBtn = document.getElementById('export-gltf');
    if (gltfExportBtn) gltfExportBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (!window.usdRoot) return showUserMessage("Nothing to export.", true);

        // showUserMessage("Exporting to GLB (GLTF binary)...");
        const exporter = new GLTFExporter();
        
        exporter.parse(window.usdRoot, function (gltfArrayBuffer) {
            try {
                const blob = new Blob([gltfArrayBuffer], {type: 'model/gltf-binary'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                // Construct clean filename
                let filename = currentDisplayFilename.split('/').pop().split('.')[0].split('?')[0];
                a.download = (filename || 'exported_usd_model') + ".glb";
                
                a.click();
                URL.revokeObjectURL(url);
                showUserMessage("Exported GLB successfully.");
            } catch (e) {
                console.error("Error during GLB file download:", e);
                showUserMessage("Error during GLB file download.", true);
            }
        }, function (error) {
            console.error("GLTF Export Error:", error);
            showUserMessage("GLTF Export Failed. See console.", true);
        }, { 
            binary: true,
            // Animations are complex in USD/Hydra, usually handled separately
            animations: [] 
        });
    });
}


// --- Main Entry Point ---

export function init(options = {}) {
    // Merge provided options with defaults
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    document.addEventListener("DOMContentLoaded", async function() {
        messageLog = document.querySelector("#message-log");
        showUserMessage("Initializing 3D viewer...");

        const params = (new URL(document.location)).searchParams;
        let filename = params.get("file") || "";

        let avataremotion = params.get("emotion") || "joy";
        avatarModel = params.get("avatarModel") || "boy2.usd";
        
        // Combined logic to get multiple background paths from 'bgs' or legacy 'bg'
        let bgUsdString = params.get("bgs") || params.get("bg");
        let extraUsd = [];
        if (bgUsdString) {
            extraUsd = bgUsdString.split(',').filter(p => p.trim() !== '');
        }

        // 1. Initialize Three.js scene and load environment map
        const threeInitPromise = initThree(finalOptions);

        // 2. Load USD Module (WebAssembly)
        showUserMessage("Wait a minute, we’re setting things up for you...");
        try {
            const [Usd] = await Promise.all([
                getUsdModule({
                    mainScriptUrlOrBlob: "/r2/usd/bindings/emHdBindings.js",
                    locateFile: (file) => {
                        return "/r2/usd/bindings/" + file;
                    },
                }),
                threeInitPromise
            ]);

            window.Usd = Usd;
            applyEmotionBackground(avataremotion);
            applyEmotionEmoji(avataremotion);


            showUserMessage("almost done...");

            // 3. Setup export listeners
            setupExportListeners();

            // 4. Load initial file from URL if present
            if (filename) {
                const el = document.querySelector("#container");
                el.classList.add("have-custom-file");
                
                // Get URL path for loading
                const urlPath = filename.split('?')[0];
                
                // Load the USD file(s)
                await loadUsdFile(filename, urlPath, extraUsd);
                updateUrl(filename, extraUsd);
            }
            
            // 5. Start the animation loop
            animate();

        } catch (error) {
            let errorMessage = "An unknown error occurred during initialization.";
            if(error.toString().includes("SharedArrayBuffer")) {
                errorMessage = "Your browser doesn't support SharedArrayBuffer (COOP/COEP headers missing), which is required for USD.";
            } else {
                errorMessage = "Error during USD module initialization: " + error.message;
            }
            console.error(error);
            showUserMessage(errorMessage, true);
        }
    });
}

// ----------------------------------------------------------------------
// ⭐ NEW: EXTERNAL API FOR SHAPE KEY CONTROL (POST MESSAGE LISTENER)
// ----------------------------------------------------------------------

/**
 * Public function to control shape key influences from the parent page.
 * @param {string} meshName - The mesh to control (e.g., 'Face_Mesh', derived from USD prim name).
 * @param {string} keyName - The name of the shape key (e.g., 'Happy').
 * @param {number} influence - The target weight (0.0 to 1.0).
 */
function setEmotion(meshName, keyName, influence) {
    if (!window.activeEmotions[meshName]) {
        window.activeEmotions[meshName] = {};
    }
    
    // Set the target influence in the global state. 
    // This state is read and applied in every animate() frame.
    window.activeEmotions[meshName][keyName] = influence; 

    console.log(`SET_EMOTION received: ${keyName} on ${meshName} to ${influence}`);
}

window.addEventListener("message", (event) => {
    // Only process messages from the parent window
    if (event.source !== window.parent) return;

    if (event.data && event.data.type === "SET_EMOTION") {
        const { meshName, keyName, influence } = event.data;
        // Important: Convert influence to a number if it comes in as a string
        const numInfluence = parseFloat(influence);
        if (!isNaN(numInfluence)) {
            setEmotion(meshName, keyName, numInfluence);
        } else {
            console.error("Invalid influence value received for SET_EMOTION:", influence);
        }
    }
    // You can add logic for "SET_EMOTION_RESET" or other custom commands here
});
// ----------------------------------------------------------------------