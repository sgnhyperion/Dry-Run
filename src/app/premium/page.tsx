// "use client";

// import { useState } from "react";
// import Script from "next/script";
// import { auth } from "@/firebase/auth";

// export default function PremiumPage() {
//   const [loading, setLoading] = useState(false);

//   const handlePayment = async () => {
//     try {
//       setLoading(true);

//       const user = auth.currentUser;
//       if (!user) {
//         alert("Please login first");
//         return;
//       }

//       // ✅ USE mimichat.space (not api subdomain)
//       const res = await fetch("/api/create-order", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ userId: user.uid }),
//       });

//       const order = await res.json();

//       const options = {
//         key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // ✅ public key only
//         amount: order.amount,
//         currency: order.currency,
//         name: "Mimichat API Access",
//         description: "₹1000 Monthly API Plan",
//         order_id: order.orderId,

//         handler: async function (response: any) {
//           const verifyRes = await fetch(
//             "/api/verify-payment",
//             {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 userId: user.uid,
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               }),
//             }
//           );

//           const verifyData = await verifyRes.json();

//           if (verifyData.success) {
//             alert("✅ API Access Activated!");
//             window.location.href = "/docs?paid=1";
//           } else {
//             alert("❌ Payment verification failed");
//           }
//         },

//         prefill: {
//           email: user.email ?? "",
//         },

//         theme: {
//           color: "#0f172a",
//         },
//       };

//       // @ts-expect-error Razorpay is loaded via external script
//       const razorpay = new window.Razorpay(options);
//       razorpay.open();
//     } catch (err) {
//       console.error("Payment error:", err);
//       alert("Payment failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <Script src="https://checkout.razorpay.com/v1/checkout.js" />

//       <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
//         <h1 className="text-4xl font-bold mb-4">Mimichat API Access</h1>
//         <p className="text-gray-400 mb-2">
//           Get access to TTS, avatar generation & emotions API
//         </p>

//         <div className="bg-zinc-900 p-8 rounded-xl mt-6 w-full max-w-md text-center">
//           <h2 className="text-3xl font-bold mb-2">₹1000 / Month</h2>

//           <ul className="text-left text-gray-300 mb-6 space-y-2">
//             <li>✅ 1,000 API calls/day</li>
//             <li>✅ Realistic TTS voices</li>
//             <li>✅ Emotional avatars</li>
//             <li>✅ Priority generation</li>
//             <li>✅ API key dashboard</li>
//           </ul>

//           <button
//             onClick={handlePayment}
//             disabled={loading}
//             className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
//           >
//             {loading ? "Processing..." : "Buy API Access"}
//           </button>
//         </div>
//       </div>
//     </>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { auth } from "@/firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false); // New state to track subscription status
  const [statusLoading, setStatusLoading] = useState(true); // New state for initial check
  const [userUid, setUserUid] = useState<string | null>(null); // State to hold UID

  // 1. Initial Check for Active Subscription
  useEffect(() => {
    // Listener for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserUid(user.uid);
        // Fetch the user's token for the server verification
        const token = await user.getIdToken();
        
        // Fetch the key status using the existing API route
        try {
          const res = await fetch("/api/route", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();

          // Check if an API key was successfully returned
          if (data.apiKey && data.plan !== "free") {
            setIsPaid(true);
          }
        } catch (error) {
          console.error("Failed to fetch subscription status:", error);
        } finally {
          setStatusLoading(false);
        }
      } else {
        // User logged out
        setUserUid(null);
        setIsPaid(false);
        setStatusLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Run only on component mount

  // 2. Payment Handling Logic (Remains mostly the same)
  const handlePayment = async () => {
    try {
      setLoading(true);

      if (!userUid) {
        alert("Please login first");
        return;
      }
      
      // Request order creation
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userUid }),
      });

      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Mimichat API Access",
        description: "₹10000 Monthly API Plan",
        order_id: order.orderId,

        handler: async function (response: any) {
          const user = auth.currentUser;
          if (!user) { return; }

          const verifyRes = await fetch(
            "/api/verify-payment",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.uid,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            alert("✅ API Access Activated! Redirecting to docs...");
            // Update state and redirect after successful payment
            setIsPaid(true); 
            window.location.href = "/docs?paid=1";
          } else {
            alert("❌ Payment verification failed");
          }
        },

        prefill: {
          email: auth.currentUser?.email ?? "",
        },

        theme: {
          color: "#0f172a",
        },
      };

      // @ts-expect-error Razorpay is loaded via external script
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // 3. Render Logic
  let buttonContent;
  let buttonDisabled = loading || statusLoading;

  if (statusLoading) {
    buttonContent = "Checking Status...";
    buttonDisabled = true;
  } else if (isPaid) {
    buttonContent = "API Access is ACTIVE";
    buttonDisabled = true;
  } else if (loading) {
    buttonContent = "Processing...";
    buttonDisabled = true;
  } else {
    buttonContent = "Buy API Access";
    buttonDisabled = false;
  }


  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
        <h1 className="text-4xl font-bold mb-4">Mimichat API Access</h1>
        <p className="text-gray-400 mb-2">
          Get access to TTS, avatar generation & emotions API
        </p>

        <div className="bg-zinc-900 p-8 rounded-xl mt-6 w-full max-w-md text-center">
          <h2 className="text-3xl font-bold mb-2">₹10,000 / Month</h2>

          <ul className="text-left text-gray-300 mb-6 space-y-2">
            <li>✅ 10,000 API calls/day</li>
            <li>✅ Realistic TTS voices</li>
            <li>✅ Emotional avatars</li>
            <li>✅ Priority generation</li>
            <li>✅ API key dashboard</li>
          </ul>

          <button
            onClick={handlePayment}
            disabled={buttonDisabled}
            // Change color if active or loading
            className={`w-full py-3 rounded-lg transition ${
              isPaid
                ? "bg-green-600 cursor-not-allowed" // Green if paid
                : "bg-blue-600 hover:bg-blue-700" // Blue if not paid
            } ${buttonDisabled && !isPaid ? "opacity-60 cursor-wait" : ""}`}
          >
            {buttonContent}
          </button>
        </div>
      </div>
    </>
  );
}