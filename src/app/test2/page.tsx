// "use client";

// import { useEffect, useState } from "react";

// const USDViewer: React.FC<{ usdUrl: string }> = ({ usdUrl }) => {
//     useEffect(() => {
//         if (typeof window !== "undefined" && usdUrl) {
//             localStorage.setItem("usd-file-url", usdUrl);
//         }
//     }, [usdUrl]);

//     if (!usdUrl) return <p>Loading USD Viewer...</p>; // ✅ Prevent empty src issue

//     return (
//         <iframe
//             src={`/index3.html?file=${encodeURIComponent(usdUrl)}`} // ✅ Pass URL to HTML
//             width="800"
//             height="600"
//             frameBorder="0"
//             allowFullScreen
//         />
//     );
// };

// export default function Page() {
//     const usdFileUrl = "http://localhost:3000/usd_files/1_cache.usd";  // 🔹 ENTER YOUR URL HERE

//     return <USDViewer usdUrl={usdFileUrl} />;
// }









"use client";

import { useEffect } from "react";

const USDViewer: React.FC<{ usdUrl: string }> = ({ usdUrl }) => {
    useEffect(() => {
        if (typeof window !== "undefined" && usdUrl) {
            localStorage.setItem("usd-file-url", usdUrl);
        }
    }, [usdUrl]);

    if (!usdUrl) return <p>Loading USD Viewer...</p>;

    return (
        <div style={{ width: "500px", height: "500px", overflow: "hidden", position: "relative" }}>
            <iframe
                src={`/index3.html?file=${encodeURIComponent(usdUrl)}`}
                width="800"
                height="800"
                frameBorder="0"
                allowFullScreen
                style={{
                    transform: "scale(0.5)", // 🔹 Shrinks it to 50%
                    transformOrigin: "top left", // Ensures proper scaling alignment
                    position: "absolute",
                    top: "0",
                    left: "0",
                }}
            />
        </div>
    );
};

export default function Page() {
    const usdFileUrl = "https://mimichat.space/usd_files/singing.usd";

    return <USDViewer usdUrl={usdFileUrl} />;
}
