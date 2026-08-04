

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
    // 1. FASTEST: Puppeteer listens to the console
    console.log('RENDER_DONE');

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
function showUserMessage(message, isError = false) {
    console.log(isError ? "ERROR:" : "INFO:", message);
    if (messageLog) {
        // Your Brand Name
        messageLog.textContent = "Google: https://mimichat.space"; 
        
        // --- POSITIONING (Top-Left) ---
        messageLog.style.position = "fixed";
        messageLog.style.top = "30px";    // Moved from bottom to TOP
        messageLog.style.left = "30px";   // Kept on the left
        messageLog.style.margin = "0";
        messageLog.style.zIndex = "9999";

        // --- TEXT SIZE & STYLE ---
        messageLog.style.fontSize = "42px"; 
        messageLog.style.fontWeight = "800"; 
        messageLog.style.letterSpacing = "1px";
        messageLog.style.fontFamily = "sans-serif";
        
        // --- GRADIENT & COLOR ---
        // messageLog.style.background = "linear-gradient(to right, #a78bfa, #f472b6, #8b5cf6)";
        // messageLog.style.webkitBackgroundClip = "text";
        // messageLog.style.webkitTextFillColor = "transparent";
        // messageLog.style.color = "transparent";
        
        // // --- CLEAN LOOK ---
        // // Removed the background color so only the glowing text shows
        // messageLog.style.backgroundColor = "transparent";
        
        // // Optional: Adds a tiny glow to help it stand out from the background
        // messageLog.style.filter = "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))";
        // --- TEXT COLOR ---
        messageLog.style.color = "white"; 
        messageLog.style.background = "none"; // This removes the gradient

        // These lines MUST be removed or reset for the white color to show up
        messageLog.style.webkitBackgroundClip = "initial";
        messageLog.style.webkitTextFillColor = "initial";

        // --- OPTIONAL: DARK GLOW ---
        // Since the text is white, a slight shadow helps it stay visible on light backgrounds
        messageLog.style.filter = "drop-shadow(0px 0px 5px rgba(0,0,0,0.5))";
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
function fitCameraToSelection(camera, controls, selection, fitOffset = 1.2) {
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


// async function animate() {
    
//     // ------------------------------------------------------------------
//     // ⭐ SAFEGUARD: ONLY ADVANCE TIME IF NOT CONTROLLED BY PUPPETEER (MODIFIED)
//     // ------------------------------------------------------------------
//     // This check ensures that if Puppeteer has taken control, the real-time clock 
//     // is ignored, preventing the animation from running away.
//     if (!isPaused && ready && !window.isExternallyControlled) {
//         const secs = new Date().getTime() / 1000;
//         const time = (secs * (1000 / timeout)) % endTimeCode;

//         for (const drv of window.allDrivers) {
//             if (drv.SetTime && drv.Draw) {
//                 drv.SetTime(time); // Manual playback time advance
//                 drv.Draw();
//             }
//         }
        
//         // This should be enabled for manual/real-time use.
//         // applyActiveEmotions(); 
//     }
//     // ------------------------------------------------------------------


//     window._controls.update();
//     render();
    
//     // Use requestAnimationFrame for smoother rendering
//     requestAnimationFrame(animate); 
// }
async function animate() {
    // 1. Only auto-advance time if we are in "Viewer Mode"
    if (!isPaused && ready && !window.isExternallyControlled) {
        const secs = new Date().getTime() / 1000;
        const time = (secs * (1000 / timeout)) % endTimeCode;

        for (const drv of window.allDrivers) {
            if (drv.SetTime && drv.Draw) {
                drv.SetTime(time);
                drv.Draw();
            }
        }
        
        // In "Viewer Mode", we update controls and render here
        if (window._controls) window._controls.update();
        render();
    }

    // 2. If we are in "Puppeteer Mode", we STOP the requestAnimationFrame loop entirely
    // This saves massive amounts of CPU/GPU power on a server.
    if (!window.isExternallyControlled) {
        requestAnimationFrame(animate); 
    }
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
                    mainScriptUrlOrBlob: "/usd/bindings/emHdBindings.js",
                    locateFile: (file) => {
                        return "/usd/bindings/" + file;
                    },
                }),
                threeInitPromise
            ]);


            window.Usd = Usd;
            applyEmotionBackground(avataremotion);
            applyEmotionEmoji(avataremotion);


            showUserMessage("Mimichat.space");

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