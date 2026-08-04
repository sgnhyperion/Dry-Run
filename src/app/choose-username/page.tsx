// "use client";

// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { saveUsername } from "@/firebase/auth";

// const ChooseUsername = () => {
//   const [username, setUsername] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const userId = searchParams?.get("uid") ?? "";


//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!username.trim()) {
//       setError("Username cannot be empty.");
//       return;
//     }

//     try {
//       if (!userId) {
//         throw new Error("User ID is missing.");
//       }

//       await saveUsername(userId, username);
//       router.push("/upload-avatar"); // Redirect to chat after setting username
//     } catch (error) {
//       if (error instanceof Error) {
//         console.error("Error saving username:", error.message);
//         setError(error.message);
//       } else {
//         console.error("An unknown error occurred.");
//         setError("An unknown error occurred. Try again.");
//       }
//     }
//   };

//   return (
//     <div>
//       <h2>Choose a Username</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Enter a unique username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           className="text-black"
//         />
//         <button type="submit">Save Username</button>
//       </form>
//       {error && <p style={{ color: "red" }}>{error}</p>}
//     </div>
//   );
// };

// export default ChooseUsername;


// import { Suspense } from "react";
// import ChooseUsernameForm from "@/components/ChooseUsernameForm";

// export default function ChooseUsernamePage() {
//   return (
//     <div className="p-4">
//       {/* <h1 className="text-xl font-bold">Choose Username</h1> */}
//       <Suspense fallback={<p>Loading...</p>}>
//         <ChooseUsernameForm />
//       </Suspense>
//     </div>
//   );
// }


// app/choose-username/page.tsx
"use client";

import dynamic from "next/dynamic";

// Dynamically import the client-only form, disabling SSR
const ChooseUsernameForm = dynamic(
  () => import("@/components/ChooseUsernameForm"),
  {
    ssr: false, // IMPORTANT: disables server-side rendering
    loading: () => (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200">
        <p className="text-3xl md:text-5xl animate-bounce">👾</p>
        <p className="mt-4 text-gray-800 text-lg md:text-xl font-semibold animate-pulse">
          Loading...
        </p>
      </div>
    ),
  }
);

export default function ChooseUsernamePage() {
  return <ChooseUsernameForm />;
}
