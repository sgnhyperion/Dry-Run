// "use client";

// import { useEffect, useState } from "react";
// import { auth } from "@/firebase/auth";

// export default function DocsPage() {
//   const [apiKey, setApiKey] = useState<string | null>(null);
//   const [plan, setPlan] = useState<string>("free");
//   const [copied, setCopied] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged(async (user) => {
//       if (!user) {
//         setLoading(false);
//         return;
//       }

//       try {
//         const token = await user.getIdToken();
//         const res = await fetch("/api/route", {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const data = await res.json();
//         console.log("Fetched API data:", data); // ✅ Now it will log

//         if (data?.apiKey) {
//           setApiKey(data.apiKey);
//           setPlan(data.plan || "free");
//         } else {
//           setApiKey(null);
//           setPlan("free");
//         }
//       } catch (err) {
//         console.error("Failed to fetch API key:", err);
//         setApiKey(null);
//         setPlan("free");
//       } finally {
//         setLoading(false);
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const copyKey = () => {
//     if (!apiKey) return;
//     navigator.clipboard.writeText(apiKey);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   return (
//     <div className="min-h-screen bg-black text-white px-6 py-20">
//       <div className="max-w-5xl mx-auto">

//         {/* HEADER */}
//         <h1 className="text-5xl font-bold mb-4">Mimichat API Documentation</h1>
//         <p className="text-gray-400 mb-10">
//           Generate realistic speech + emotional avatar animation using a single API.
//         </p>

//         {/* API KEY SECTION */}
//         <div className="bg-zinc-900 p-6 rounded-xl mb-12">
//           {loading ? (
//             <p className="text-gray-400">Loading API status...</p>
//           ) : apiKey ? (
//             <>
//               <p className="text-green-400 mb-2 font-semibold">Your API Key</p>
//               <p className="text-gray-400 mb-3">Plan: {plan}</p>

//               <div className="flex flex-wrap items-center gap-3">
//                 <code className="bg-black px-4 py-2 rounded text-sm break-all">
//                   {apiKey}
//                 </code>
//                 <button
//                   onClick={copyKey}
//                   className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
//                 >
//                   {copied ? "Copied!" : "Copy"}
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <p className="text-yellow-400 mb-3">
//                 You are currently on free access
//               </p>
//               <a
//                 href="/premium"
//                 className="inline-block bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 transition"
//               >
//                 Get API Key
//               </a>
//             </>
//           )}
//         </div>

//         {/* OVERVIEW */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-4">📌 API Overview</h2>
//           <ul className="text-gray-300 space-y-2">
//             <li>✅ Text → Realistic Speech </li>
//             <li>✅ Emotion-controlled delivery</li>
//             <li>✅ Emotion-driven Avatar Animation </li>
//             <li>✅ Returns playable audio + 3D USD animation</li>
//           </ul>
//         </section>

//         {/* AUTH */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-4">🔐 Authentication</h2>
//           <p className="text-gray-300 mb-2">
//             Send your API key in the request header:
//           </p>
//           <pre className="bg-zinc-900 p-4 rounded text-green-400">
// x-api-key: YOUR_API_KEY
//           </pre>
//         </section>

//         {/* ENDPOINT */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-4">🚀 Generate Animation</h2>

//           <p className="mb-2 text-gray-300">Endpoint:</p>
//           <pre className="bg-zinc-900 p-4 rounded text-blue-400 mb-4">
// POST https://api.mimichat.space/generate
//           </pre>

//           <p className="mb-2 text-gray-300">Request Body:</p>
//           <pre className="bg-zinc-900 p-4 rounded text-yellow-400 mb-4 overflow-x-auto">
// {`{
//   "text": "Hello bro",
//   "character_model": "male_face.usd",
//   "emotion": "happy",
//   "gender": "male"
// }`}
//           </pre>

//           <p className="mb-2 text-gray-300">Success Response:</p>
//           <pre className="bg-zinc-900 p-4 rounded text-green-400 overflow-x-auto">
// {`{
//   "status": "success",
//   "audioUrl": "https://api.mimichat.space/audio/miudnhbz.wav",
//   "usdUrl": "https://api.mimichat.space/usd_files/cache_miudnhbz_cache.usd"
// }`}
//           </pre>
//         </section>

//         {/* CURL TEST */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-4">🧪 Test With CURL</h2>
//           <pre className="bg-zinc-900 p-4 rounded text-white text-sm overflow-x-auto">
// {`curl -X POST https://api.mimichat.space/generate \\
// -H "Content-Type: application/json" \\
// -H "x-api-key: YOUR_API_KEY" \\
// -d '{
//   "text": "Hello bro",
//   "character_model": "male_face.usd",
//   "emotion": "happy",
//   "gender": "male"
// }'`}
//           </pre>
//         </section>

//         {/* PRICING */}
//         <section className="mb-12">
//           <h2 className="text-3xl font-bold mb-4">💳 Pricing</h2>
//           <ul className="text-gray-300 space-y-2">
//             <li>✅ ₹10,000 / month</li>
//             <li>✅ 10,000 API calls / day</li>
//             <li>✅ High priority rendering</li>
//             <li>✅ Dedicated voice & avatar inference</li>
//           </ul>
//         </section>

//         {/* FOOTER CTA */}
//         {!apiKey && !loading && (
//           <div className="text-center mt-20">
//             <a
//               href="/premium"
//               className="bg-blue-600 px-8 py-4 rounded-xl text-lg hover:bg-blue-700 transition"
//             >
//               Unlock Full API Access
//             </a>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase/auth";

// ⚠️ CHANGE THIS URL TO YOUR ACTUAL HOSTED VIEWER FILE LOCATION
const USD_VIEWER_DOWNLOAD_URL = "/usdviewer-forapi/mimichat-usd-viewer.zip"; 

export default function DocsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/route", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("Fetched API data:", data);

        if (data?.apiKey) {
          setApiKey(data.apiKey);
          setPlan(data.plan || "free");
        } else {
          setApiKey(null);
          setPlan("free");
        }
      } catch (err) {
        console.error("Failed to fetch API key:", err);
        setApiKey(null);
        setPlan("free");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownloadViewer = () => {
    if (!apiKey) return;
    
    const link = document.createElement('a');
    link.href = USD_VIEWER_DOWNLOAD_URL;
    link.setAttribute('download', 'mimichat-usd-viewer.zip');
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-20">
      <div className="max-w-5xl mx-auto">

        {/* HEADER and OVERVIEW sections (unchanged) */}
        <h1 className="text-5xl font-bold mb-4">Mimichat API Documentation</h1>
        <p className="text-gray-400 mb-10">
          Generate realistic speech + emotional avatar animation using a single API.
        </p>

        {/* API KEY SECTION - MODIFIED */}
        <div className="bg-zinc-900 p-6 rounded-xl mb-12">
          {loading ? (
            <p className="text-gray-400">Loading API status...</p>
          ) : apiKey ? (
            <>
              <p className="text-green-400 mb-2 font-semibold">Your API Key</p>
              <p className="text-gray-400 mb-3">Plan: {plan}</p>

              {/* 🎯 SPACED BUTTONS: Increased gap to gap-4 */}
              <div className="flex flex-wrap items-center gap-4">
                <code className="bg-black px-4 py-2 rounded text-sm break-all">
                  {apiKey}
                </code>
                
                {/* 1. Copy Key Button with Icon */}
                <button
                  onClick={copyKey}
                  className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-1"
                >
                  {/* Icon for Copy */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    {copied ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /> // Checkmark
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v2.25A2.25 2.25 0 0 1 13.5 22h-6a2.25 2.25 0 0 1-2.25-2.25v-10.5A2.25 2.25 0 0 1 7.5 9h6a2.25 2.25 0 0 1 2.25 2.25v2.25m-2.25-2.25h-4.5v-4.5" /> // Copy icon
                    )}
                  </svg>
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                
                {/* 2. Download Viewer Button with Icon */}
                <button
                  onClick={handleDownloadViewer}
                  className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-1"
                >
                  {/* Icon for Download */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download Viewer</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-yellow-400 mb-3">
                You are currently on free access
              </p>
              <a
                href="/premium"
                className="inline-block bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 transition"
              >
                Get API Key
              </a>
            </>
          )}
        </div>

        {/* The rest of the documentation sections remain unchanged */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">📌 API Overview</h2>
          <ul className="text-gray-300 space-y-2">
            <li>✅ Text → Realistic Speech </li>
            <li>✅ Emotion-controlled delivery</li>
            <li>✅ Emotion-driven Avatar Animation </li>
            <li>✅ Returns playable audio + 3D USD animation</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">🔐 Authentication</h2>
          <p className="text-gray-300 mb-2">
            Send your API key in the request header:
          </p>
          <pre className="bg-zinc-900 p-4 rounded text-green-400">
x-api-key: YOUR_API_KEY
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">🚀 Generate Animation</h2>

          <p className="mb-2 text-gray-300">Endpoint:</p>
          <pre className="bg-zinc-900 p-4 rounded text-blue-400 mb-4">
POST https://api.mimichat.space/generate
          </pre>

          <p className="mb-2 text-gray-300">Request Body:</p>
          <pre className="bg-zinc-900 p-4 rounded text-yellow-400 mb-4 overflow-x-auto">
{`{
  "text": "Hello bro",
  "character_model": "male_face.usd"(0R boy2.usd, girl.usd, girlwithhairs.usd),
  "emotion": "happy",
  "gender": "male"
}`}
          </pre>

          <p className="mb-2 text-gray-300">Success Response:</p>
          <pre className="bg-zinc-900 p-4 rounded text-green-400 overflow-x-auto">
{`{
  "status": "success",
  "audioUrl": "https://api.mimichat.space/audio/miudnhbz.wav",
  "usdUrl": "https://api.mimichat.space/usd_files/cache_miudnhbz_cache.usd"
}`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">🧪 Test With CURL</h2>
          <pre className="bg-zinc-900 p-4 rounded text-white text-sm overflow-x-auto">
{`curl -X POST https://api.mimichat.space/generate \\
-H "Content-Type: application/json" \\
-H "x-api-key: YOUR_API_KEY" \\
-d '{
  "text": "Hello bro",
  "character_model": "male_face.usd",
  "emotion": "happy",
  "gender": "male"
}'`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">💳 Pricing</h2>
          <ul className="text-gray-300 space-y-2">
            <li>✅ ₹10,000 / month</li>
            <li>✅ 10,000 API calls / day</li>
            <li>✅ High priority rendering</li>
            <li>✅ Dedicated voice & avatar inference</li>
          </ul>
        </section>

          <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <ul className="text-gray-300 space-y-2">
            <li>satyam@mimichat.space</li>
          </ul>
        </section>

        {/* FOOTER CTA (unchanged) */}
        {!apiKey && !loading && (
          <div className="text-center mt-20">
            <a
              href="/premium"
              className="bg-blue-600 px-8 py-4 rounded-xl text-lg hover:bg-blue-700 transition"
            >
              Unlock Full API Access
            </a>
          </div>
        )}

      </div>
    </div>
  );
}