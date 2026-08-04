
// "use client";

// import { useState } from "react";
// import { useSearchParams } from "next/navigation";
// import { saveUsername, isUsernameTaken } from "@/firebase/auth";

// const ChooseUsernameForm = () => {
//   const [username, setUsername] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false); // optional success state
//   const searchParams = useSearchParams();
//   const userId = searchParams?.get("uid") ?? "";

//   // Handle form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault(); // prevent page reload
//     const trimmed = username.trim();

//     if (!trimmed) {
//       setError("Username cannot be empty.");
//       return;
//     }

//     if (!userId) {
//       setError("User ID is missing.");
//       return;
//     }

//     setError(null); // reset error on submit
//     setLoading(true);
//     setSuccess(false);

//     try {
//       const taken = await isUsernameTaken(trimmed);
//       if (taken) {
//         setError("This username is already taken.");
//         return;
//       }

//       await saveUsername(userId, trimmed);
//       setSuccess(true);
//       setError(null);
//       // Redirect after short delay so user sees success
//       setTimeout(() => {
//         window.location.href = "/home";
//       }, 500);
//     } catch (err) {
//       console.error(err);
//       setError("Something went wrong. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Clear error when user types
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setUsername(e.target.value);
//     if (error) setError(null);
//     if (success) setSuccess(false);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200">
//       <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 md:p-10 flex flex-col gap-6">
//       <h1 className="font-pacifico text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">
//         MimiChat
//       </h1>
//         <h2 className="text-2xl md:text-3xl font-extrabold text-center text-gray-900 tracking-wide">
//           Choose Your Username
//         </h2>
//         <p className="text-center text-gray-600 text-sm md:text-base">
//           Pick a unique username to get started. Make it memorable!
//         </p>

//         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//           <input
//             type="text"
//             placeholder="Enter a unique username"
//             value={username}
//             onChange={handleChange}
//             className="px-5 py-3 border border-gray-300 rounded-xl text-gray-900 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//           />

//           <button
//             type="submit"
//             disabled={loading}
//             className={`relative bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl shadow-md flex items-center justify-center transition-transform duration-200 ${
//               loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"
//             }`}
//           >
//             {loading && (
//               <span className="absolute left-4 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
//             )}
//             {loading ? "Checking..." : "Save Username"}
//           </button>

//           {/* Error Message */}
//           {error && (
//             <p className="text-red-600 text-sm text-center animate-fade-in">
//               {error}
//             </p>
//           )}

//           {/* Success Message */}
//           {success && (
//             <p className="text-green-600 text-sm text-center animate-fade-in">
//               Username saved successfully!
//             </p>
//           )}
//         </form>

//         <p className="text-center text-gray-500 text-xs md:text-sm">
//           mimichat
//         </p>
//       </div>
//     </div>
//   );
// };

// export default ChooseUsernameForm;

"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { saveUsername, isUsernameTaken, auth } from "@/firebase/auth";

const ChooseUsernameForm = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const searchParams = useSearchParams();
  const userId = searchParams?.get("uid") ?? "";
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return setError("Username cannot be empty.");
    if (!userId) return setError("User ID is missing.");

    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      const taken = await isUsernameTaken(trimmed);
      if (taken) return setError("This username is already taken.");

      await saveUsername(userId, trimmed);
      setSuccess(true);
      setError(null);

      setTimeout(() => {
        router.push("/home");
      }, 500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout logic
  const handleLogout = () => {
    setLoggingOut(true);
    auth.signOut()
      .then(() => router.replace("/login"))
      .catch((err) => {
        console.error("Logout failed:", err);
        setLoggingOut(false);
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-4
      bg-gradient-to-tr from-purple-300 via-pink-200 to-blue-200
      dark:bg-gray-900">
      
      {/* Top-left header */}
      <h1 className="font-pacifico text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">
        MimiChat
      </h1>

      {/* Centered form */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="
          w-full max-w-md
          p-8 md:p-10
          rounded-2xl shadow-xl
          flex flex-col gap-6
          bg-white/90 backdrop-blur-md
          dark:bg-gray-800
          dark:text-gray-200
          md:dark:bg-white/90
        ">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 dark:text-white tracking-wide">
            Choose Your Username
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 text-sm md:text-base">
            Pick a unique username to get started. Make it memorable!
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Enter a unique username"
              value={username}
              onChange={handleChange}
              className="px-5 py-3 border border-gray-300 rounded-xl text-gray-900 dark:text-gray-100 dark:bg-gray-700 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />

            <button
              type="submit"
              disabled={loading}
              className={`relative 
                bg-gradient-to-r from-blue-500 to-indigo-500
                dark:from-indigo-600 dark:to-blue-700
                text-white font-semibold py-3 rounded-xl shadow-md flex items-center justify-center transition-transform duration-200
                ${loading ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}
              `}
            >
              {loading && (
                <span className="absolute left-4 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {loading ? "Checking..." : "Save Username"}
            </button>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm text-center animate-fade-in">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-600 dark:text-green-400 text-sm text-center animate-fade-in">
                Username saved successfully!
              </p>
            )}
          </form>

          <div className="flex justify-center items-center mt-3 mb-4">
  <button
    onClick={handleLogout}
    className="px-6 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
  >
    Logout
  </button>
</div>

        </div>
      </div>
    </div>
  );
};

export default ChooseUsernameForm;
