"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/auth";
import { doc, getDoc } from "firebase/firestore";
// import { useRouter } from "next/navigation";

const UploadAvatarPage = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  // const router = useRouter();

  // Check if user is already premium
  useEffect(() => {
    const fetchPremiumStatus = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().premium) {
        setIsPremium(true);
      }
    };

    fetchPremiumStatus();
  }, []);

  // Razorpay Payment Function
  // const handlePurchase = async () => {
  //   const userId = auth.currentUser?.uid;
  //   const email = auth.currentUser?.email;
  //   if (!userId || !email) {
  //     setError("You must be logged in to buy premium.");
  //     return;
  //   }

  //   try {
  //     // Create an order on the server
  //     const response = await fetch("/api/create-order", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ userId, email }),
  //     });

  //     const { orderId, amount, currency } = await response.json();

  //     // Load Razorpay
  //     const razorpay = new (window as any).Razorpay({
  //       key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  //       amount,
  //       currency,
  //       name: "3D Avatar",
  //       description: "Buy premium to upload images",
  //       order_id: orderId,
  //       handler: async function (response: any) {
  //         // Save payment status in Firestore
  //         await fetch("/api/verify-payment", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ userId, razorpayPaymentId: response.razorpay_payment_id }),
  //         });

  //         setIsPremium(true);
  //       },
  //       theme: { color: "#3399cc" },
  //     });

  //     razorpay.open();
  //   } catch (err) {
  //     console.error(err);
  //     setError("Payment failed. Try again.");
  //   }
  // };


  const handlePurchase = async () => {
    const userId = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (!userId || !email) {
      setError("You must be logged in to buy premium.");
      return;
    }
  
    // Redirect to your PayPal Payment Link
    window.location.href = ""; // Replace with your actual link
  };
  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.length !== 4) {
      setError("You must upload exactly 4 images.");
      return;
    }

    setFiles(selectedFiles);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload Your Avatar</h2>
  
      {!isPremium ? (
        <>
          <p className="text-gray-600 text-sm mb-4">
            Get your custom 3D avatar.
          </p>
          <button
            onClick={handlePurchase}
            className="w-full bg-black hover:bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg transition"
          >
            Buy Premium – ₹3500
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-600 text-sm mb-4">
            Upload <span className="font-medium text-gray-800">exactly 4 images</span> of yourself to generate your 3D avatar.
          </p>
  
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
  
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
  
          <button
            onClick={() => alert("Upload logic goes here!")}
            disabled={files.length !== 4}
            className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition ${
              files.length === 4
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Upload 4 Images
          </button>
        </>
      )}
    </div>
  );
  
};

export default UploadAvatarPage;
