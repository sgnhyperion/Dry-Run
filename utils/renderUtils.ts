
// renderUtils.ts 
import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// --- CONFIGURATION ---
// const RENDER_URL = 'https://mimichat.space/index3.html';
const RENDER_URL = 'http://localhost:3005/index4.html';
const FRAME_RATE = 45;
const RESOLUTION = { width: 1280, height: 720 };
const TEMP_VIDEO_NAME = 'temp_video_only.mp4';
const READY_SIGNAL = 'USD_LOADED';
const RENDER_SIGNAL = 'FRAME_RENDERED';

// Final video output folder
const FINAL_RENDER_DIR = path.resolve('D:/chat-avatar-app/public/renders');
if (!fs.existsSync(FINAL_RENDER_DIR)) fs.mkdirSync(FINAL_RENDER_DIR, { recursive: true });

interface RenderSetupResult {
    browser: Browser;
    page: Page;
    frameCount: number;
    frameDelay: number;
    audioExists: boolean;
}


function toLocalUsdUrl(remoteUsdUrl: string): string {
    return remoteUsdUrl
        .replace(
            "https://mimichat.space",
            "http://localhost:3005"
        );
}
/**
 * Gets audio duration using FFprobe
 */
async function getAudioDuration(filePath: string): Promise<number> {
    if (!fs.existsSync(filePath)) {
        console.warn(`[Warning] Audio file not found at: ${filePath}. Falling back to 2s.`);
        return 2.0;
    }
    const ffprobeCommand = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path.resolve(filePath)}"`;
    try {
        const { stdout } = await execPromise(ffprobeCommand);
        const duration = parseFloat(stdout.trim());
        return isNaN(duration) ? 2.0 : duration;
    } catch (error) {
        return 2.0;
    }
}

/**
 * SETUP: Navigates and stops the animation clock
 */
export async function setup(
    usdFileUrl: string,
    audioFilePath: string,
    framesDir: string,
    emotion: string,
    avatarModel: string
): Promise<RenderSetupResult> {
    const NAVIGATION_TIMEOUT = 120000;
    const audioDuration = await getAudioDuration(audioFilePath);
    const frameCount = Math.ceil(audioDuration * FRAME_RATE);
    const frameCaptureDelay = 1000 / FRAME_RATE;
    const audioExists = fs.existsSync(audioFilePath);

    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--enable-webgl',
            `--window-size=${RESOLUTION.width},${RESOLUTION.height}`,
        ]
    });

    const page = await browser.newPage();
    await page.setViewport(RESOLUTION);

    // This handles the communication back from the Browser to Node.js
    let resolveSignal: (value: any) => void;
    let signalPromise = new Promise(resolve => { resolveSignal = resolve; });

    await page.exposeFunction('onClientMessage', (message: { type: string, time?: number }) => {
        if (message.type === READY_SIGNAL || message.type === RENDER_SIGNAL) {
            resolveSignal(message);
            // Reset the promise for the next frame signal
            signalPromise = new Promise(resolve => { resolveSignal = resolve; });
        }
    });

    // Inject listener to bridge window.postMessage to our exposed Node function
    await page.evaluateOnNewDocument(() => {
        window.addEventListener('message', event => {
            if (event.data && event.data.type) {
                // @ts-ignore
                window.onClientMessage(event.data); 
            }
        });
    });

    // const fullUrl = `${RENDER_URL}?file=${encodeURIComponent(usdFileUrl)}`;
   const localUsdUrl = toLocalUsdUrl(usdFileUrl);

    const fullUrl =
    `${RENDER_URL}?file=${encodeURIComponent(localUsdUrl)}` +
    `&emotion=${encodeURIComponent(emotion)}`+
    `&avatarModel=${encodeURIComponent(avatarModel)}`+
    `&render=true`; // <--- Add this flag;


    console.log(`[Setup] Navigating to scene...`);
    
    await page.goto(fullUrl, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT });

    // Wait for the initial USD_LOADED signal
    await signalPromise;
    console.log(`[Setup] Scene Ready. Stopping internal clock...`);

    // ⭐ STOP THE INTERNAL ANIMATION CLOCK
    await page.evaluate(() => {
        // @ts-ignore
        window.isExternallyControlled = true;
    });

    return { browser, page, frameCount, frameDelay: frameCaptureDelay, audioExists };
}

/**
 * FRAME CAPTURE: Commands specific time seeks
 */
// export async function captureFrames(
//     page: Page,
//     frameCount: number,
//     frameDelay: number,
//     framesDir: string
// ): Promise<void> {
//     console.log(`[Capture] Starting Frame-Accurate Sync (${frameCount} frames)`);

//     for (let i = 0; i < frameCount; i++) {
//         const currentTimeMs = i * frameDelay;
//         const filename = `frame${String(i + 1).padStart(4, '0')}.png`;
//         const outputPath = path.join(framesDir, filename);

//         // 1. Setup the promise to wait for the next signal
//         // We redefine it here so we're fresh for every seek
//         const signalReceived = new Promise<void>(resolve => {
//             // @ts-ignore
//             const checkSignal = async (msg: any) => {
//                 // Check if this signal matches the time we just requested
//                 if (msg.type === RENDER_SIGNAL) resolve();
//             };
//             // The actual listener is already attached in setup() via exposeFunction
//             // We just need a way to know when the global onClientMessage was called.
//             // Simplified for this script: we'll use a small buffer delay + the signal.
//         });

//         // 2. Command the browser to seek to the exact millisecond
//         await page.evaluate((time) => {
//             // @ts-ignore
//             if (window.seekAnimationTo) window.seekAnimationTo(time);
//         }, currentTimeMs);

//         // 3. Wait for render confirmation (or a safety timeout)
//         // Note: For extreme stability, wait 20-50ms for GPU flush
//         await new Promise(resolve => setTimeout(resolve, 20)); 

//         // 4. Capture the frame
//         await page.screenshot({ path: outputPath });

//         process.stdout.write(`\r[Capture] Frame ${i + 1}/${frameCount} at ${currentTimeMs.toFixed(0)}ms`);
//     }
//     console.log('\n[Capture] Done.');
// }
/**
 * FRAME CAPTURE: Commands specific time seeks and captures instantly on signal
 */
export async function captureFrames(
    page: Page,
    frameCount: number,
    frameDelay: number,
    framesDir: string
): Promise<void> {
    console.log(`[Capture] Starting High-Speed Sync (${frameCount} frames)`);

    for (let i = 0; i < frameCount; i++) {
        const currentTimeMs = i * frameDelay;
        const filename = `frame${String(i + 1).padStart(4, '0')}.png`;
        const outputPath = path.join(framesDir, filename);

        // 1. Create a promise that resolves ONLY when the browser says 'RENDER_DONE'
        const frameReady = new Promise<void>((resolve) => {
            const listener = (msg: any) => {
                if (msg.text() === 'RENDER_DONE') {
                    page.off('console', listener); // Remove listener to prevent memory leak
                    resolve();
                }
            };
            page.on('console', listener);
        });

        // 2. Command the browser to seek
        // This triggers the seekAnimationTo(time) in index2.js, 
        // which ends with console.log('RENDER_DONE')
        await page.evaluate((time) => {
            // @ts-ignore
            if (window.seekAnimationTo) window.seekAnimationTo(time);
        }, currentTimeMs);

        // 3. WAIT for the signal (No more fixed 20ms sleep!)
        // This will resolve as fast as your ASUS GPU can draw the frame.
        await frameReady;

        // 4. Capture the frame immediately
        await page.screenshot({ 
            path: outputPath,
            type: 'png',
            omitBackground: false 
        });

        process.stdout.write(`\r[Capture] Frame ${i + 1}/${frameCount} | Progress: ${((i/frameCount)*100).toFixed(1)}%`);
    }
    console.log('\n[Capture] Done.');
}
/**
 * STITCH VIDEO: Combines frames and audio
 */
export async function stitchVideo(
    messageId: string,
    audioFilePath: string,
    bgmFilePath: string,
    audioExists: boolean,
    framesDir: string
): Promise<string> {
    const tempVideoPath = path.join(framesDir, TEMP_VIDEO_NAME);
    const outputVideoName = `video_${messageId}.mp4`;
    const finalVideoPath = path.join(FINAL_RENDER_DIR, outputVideoName);

    try {
        console.log('[Stitch] encoding PNG sequence...');
        // Step 1: PNGs to Video
        await execPromise(`ffmpeg -y -framerate ${FRAME_RATE} -i "${path.resolve(framesDir)}/frame%04d.png" -c:v libx264 -pix_fmt yuv420p -vf "scale=${RESOLUTION.width}:${RESOLUTION.height}" "${tempVideoPath}"`);
        const bgmExists = bgmFilePath && fs.existsSync(bgmFilePath);

        if (audioExists && bgmExists) {
            console.log('[Stitch] Mixing Voice and BGM...');
            // We remove "-map :a" and just let the filter handle the audio output
            const mixCommand = `ffmpeg -y -i "${tempVideoPath}" -i "${audioFilePath}" -i "${bgmFilePath}" ` +
                `-filter_complex "[2:a]volume=0.35[bg]; [1:a][bg]amix=inputs=2:duration=first" ` +
                `-c:v copy -c:a aac -map 0:v "${finalVideoPath}"`;
            
            await execPromise(mixCommand);
            if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);

        }else if (audioExists) {
            console.log('[Stitch] Merging audio...');
            // Step 2: Add Audio
            await execPromise(`ffmpeg -y -i "${tempVideoPath}" -i "${audioFilePath}" -c:v copy -c:a aac -map 0:v -map 1:a -shortest "${finalVideoPath}"`);
            fs.unlinkSync(tempVideoPath);
        } else if (bgmExists) {
            console.log('[Stitch] Adding BGM only...');
            await execPromise(`ffmpeg -y -i "${tempVideoPath}" -i "${bgmFilePath}" -c:v copy -c:a aac -map 0:v -map 1:a -shortest "${finalVideoPath}"`);
            fs.unlinkSync(tempVideoPath);
        } else {
            fs.renameSync(tempVideoPath, finalVideoPath);
        }

        fs.rmSync(framesDir, { recursive: true, force: true });
        console.log(`[Stitch] ✅ Success: ${finalVideoPath}`);
        return outputVideoName;

    } catch (err: any) {
        console.error('[Stitch] FFmpeg error:', err.message);
        throw err;
    }
}