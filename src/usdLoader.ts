// src/usdLoader.ts
export function preloadUsdModule(): Promise<any> {
  return new Promise(async (resolve, reject) => {
    if ((window as any).Usd) {
      // Already loaded
      return resolve((window as any).Usd);
    }

    try {
      // 1. Dynamically add the script from public folder
      await new Promise<void>((res, rej) => {
        const script = document.createElement("script");
        script.src = "/r2/usd/bindings/emHdBindings.js"; // public folder
        script.onload = () => res();
        script.onerror = (e) => rej(e);
        document.body.appendChild(script);
      });

      // 2. Get the global getter
      const getUsdModule = (window as any)["NEEDLE:USD:GET"];
      if (!getUsdModule) throw new Error("USD module getter not found on window");

      // 3. Initialize the WASM module (starts downloading 23MB)
      const Usd = await getUsdModule({
        mainScriptUrlOrBlob: "/r2/usd/bindings/emHdBindings.js",
        locateFile: (file: string) => `/r2/usd/bindings/${file}`,
      });

      // 4. Cache globally
      (window as any).Usd = Usd;
      resolve(Usd);
    } catch (err) {
      reject(err);
    }
  });
}
