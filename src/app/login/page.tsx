

// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signInWithGoogle } from "@/firebase/auth";

// const LoginPage = () => {
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleGoogleSignIn = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { user, needsUsername } = await signInWithGoogle();
//       if (needsUsername) {
//         router.push(`/choose-username?uid=${user.uid}`);
//       } else {
//         // router.push("/home");
//         window.location.href = '/home';
//       }
//     } catch (error) {
//       console.error("Sign-in error:", error);
//       setError("Failed to sign in. Please refresh the page and try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleGuestContinue = () => {
//   //   router.push("/demo");
//   // };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <h2 className="text-2xl font-bold mb-4">Welcome! Sign in to continue</h2>

//       <button
//         onClick={handleGoogleSignIn}
//         className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 mb-2"
//         disabled={loading}
//       >
//         {loading ? "Signing in..." : "Sign in with Google"}
//       </button>

//       {/* <button
//         onClick={handleGuestContinue}
//         className="bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300"
//       >
//         Continue as Guest
//       </button> */}

//       {error && <p className="text-red-500 mt-2">{error}</p>}
//     </div>
//   );
// };

// export default LoginPage;


// 'use client';

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signInWithGoogle } from "@/firebase/auth";

// export default function LoginPage() {
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleGoogleSignIn = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const { user, needsUsername } = await signInWithGoogle();
//       if (needsUsername) {
//         router.push(`/choose-username?uid=${user.uid}`);
//       } else {
//         window.location.href = '/home';
//       }
//     } catch (err) {
//       console.error(err);
//       setError("Failed to sign in. Please refresh and try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      
//       {/* Left Panel - Login */}
//       <div className="flex flex-col justify-center items-center md:items-start md:pl-16 p-6 md:w-1/2 space-y-6">
        
//         {/* Main Heading */}
//         <h1 className="font-pacifico text-4xl md:text-5xl text-center md:text-left text-gray-900 dark:text-white tracking-tight mb-6">
//           MimiChat
//         </h1>



//         <p className="text-gray-700 dark:text-gray-300 text-center md:text-left max-w-md">
//           Chat in 3D with animated avatars. Express your emotions and have fun conversations like never before.
//         </p>

//         {/* Animated Alien Emoji on Mobile */}
//         <div className="text-6xl animate-bounce md:hidden text-center mb-8">
//           👾
//         </div>

//         {/* Button Wrapper */}
//         <div className="w-full md:w-auto flex justify-center md:justify-start mt-auto md:mt-0">
//           <button
//             onClick={handleGoogleSignIn}
//             disabled={loading}
//             className="flex items-center justify-center gap-2 w-full md:w-auto bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 hover:scale-105 transition-transform disabled:bg-gray-400"
//           >
//             {loading ? "Signing in..." : "Sign in with Google"}
//           </button>
//         </div>




//         {error && <p className="text-red-500 mt-2">{error}</p>}
//       </div>

//       {/* Right Panel - Visual */}
//       <div className="hidden md:flex md:w-1/2 items-center justify-center relative bg-gradient-to-br from-purple-200 to-pink-200 dark:from-gray-700 dark:to-gray-800">
//         {/* Placeholder for avatar / image */}
//         <div className="w-3/4 h-3/4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex items-center justify-center">
//           <span className="text-8xl animate-bounce">👾</span>
//         </div>
//       </div>

//     </div>
//   );
// }
// 'use client';

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   signInWithGoogle,
//   signInWithEmailPassword,
//   signUpWithEmailPassword,
// } from "@/firebase/auth";

// export default function LoginPage() {
//   const router = useRouter();
//   const [step, setStep] = useState<1 | 2>(1);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [loadingEmail, setLoadingEmail] = useState(false);
//   const [loadingGoogle, setLoadingGoogle] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Step 1: Email
//   const handleNextEmail = () => {
//     if (!email) return setError("Please enter your email.");
//     setError(null);
//     setStep(2);
//   };

//   // Step 2: Password
//   const handlePasswordSubmit = async () => {
//     if (!password) return setError("Please enter a password.");
//     setLoadingEmail(true);
//     setError(null);

//     try {
//       let res;
//       try {
//         res = await signInWithEmailPassword(email, password);
//       } catch (err: any) {
//         if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
//           res = await signUpWithEmailPassword(email, password);
//         } else if (err.code === "auth/wrong-password") {
//           throw new Error("Incorrect password. Try again.");
//         } else {
//           throw err;
//         }
//       }

//       const { user, needsUsername } = res;
//       if (needsUsername) router.push(`/choose-username?uid=${user.uid}`);
//       else router.push("/home");
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || "Sign-in failed.");
//     } finally {
//       setLoadingEmail(false);
//     }
//   };

//   // Google login
//   const handleGoogleSignIn = async () => {
//     setLoadingGoogle(true);
//     setError(null);
//     try {
//       const { user, needsUsername } = await signInWithGoogle();
//       if (needsUsername) router.push(`/choose-username?uid=${user.uid}`);
//       else router.push("/home");
//     } catch (err: any) {
//       console.error(err);
//       setError("Google sign-in failed.");
//     } finally {
//       setLoadingGoogle(false);
//     }
//   };

//   return (
//     <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
//       {/* Left Panel */}
//       <div className="flex flex-col justify-center items-center md:items-start md:pl-16 p-6 md:w-1/2 space-y-6">
//         <h1 className="font-pacifico text-4xl md:text-5xl text-gray-900 dark:text-white mb-6">
//           MimiChat
//         </h1>

//         <p className="text-gray-700 dark:text-gray-300 max-w-md">
//           Chat in 3D with animated avatars. Express your emotions and have fun conversations like never before.
//         </p>

//         <div className="text-6xl animate-bounce md:hidden text-center mb-8">👾</div>

//         {/* Step 1 */}
//         {step === 1 && (
//           <div className="flex flex-col gap-3 w-full max-w-xs">
//             <input
//               type="email"
//               placeholder="Enter your email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
//             />
//             <button
//               onClick={handleNextEmail}
//               disabled={loadingEmail || loadingGoogle}
//               className={`${
//                 loadingGoogle
//                   ? "bg-blue-300 cursor-not-allowed"
//                   : loadingEmail
//                   ? "bg-gray-500 cursor-not-allowed"
//                   : "bg-blue-600 hover:bg-blue-700"
//               } text-white py-2 rounded-xl shadow-md transition transform hover:scale-105`}
//             >
//               Next
//             </button>
//           </div>
//         )}

//         {/* Step 2 */}
//         {step === 2 && (
//           <div className="flex flex-col gap-3 w-full max-w-xs">
//             <div className="relative">
//               <input
//                 type={showPassword ? "text" : "password"}
//                 placeholder="Enter your password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full pr-10 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword((s) => !s)}
//                 className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 {showPassword ? (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58A3 3 0 1113.42 13.42M9.88 5.27a16.88 16.88 0 00-5.5 6.73 2.98 2.98 0 00.26 1.92M14.12 18.73a16.88 16.88 0 005.5-6.73 2.98 2.98 0 00-.26-1.92" />
//                   </svg>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                   </svg>
//                 )}
//               </button>
//             </div>

//             <button
//               onClick={handlePasswordSubmit}
//               disabled={loadingEmail || loadingGoogle}
//               className={`${
//                 loadingGoogle
//                   ? "bg-blue-300 cursor-not-allowed"
//                   : loadingEmail
//                   ? "bg-gray-500 cursor-not-allowed"
//                   : "bg-blue-600 hover:bg-blue-700"
//               } text-white py-2 rounded-xl shadow-md transition transform hover:scale-105`}
//             >
//               {loadingEmail ? "Processing..." : "Sign In / Sign Up"}
//             </button>
//           </div>
//         )}

//         {/* OR Divider */}
//         <div className="w-full flex items-center justify-center gap-3 mt-2">
//           <span className="border-b border-gray-500 w-full"></span>
//           <span className="text-gray-500 dark:text-gray-400 text-sm">OR</span>
//           <span className="border-b border-gray-500 w-full"></span>
//         </div>

//         {/* Google Sign-in */}
//         <button
//           onClick={handleGoogleSignIn}
//           disabled={loadingGoogle || loadingEmail}
//           className={`flex items-center justify-center gap-2 w-full max-w-xs ${
//             loadingEmail
//               ? "bg-blue-300 cursor-not-allowed"
//               : loadingGoogle
//               ? "bg-gray-500 cursor-not-allowed"
//               : "bg-blue-500 hover:bg-blue-600"
//           } text-white px-6 py-2 rounded-lg shadow-lg hover:scale-105 transition transform mt-2`}
//         >
//           {loadingGoogle ? "Processing..." : "Sign in with Google"}
//         </button>

//         {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
//       </div>

//       {/* Right Panel */}
//       <div className="hidden md:flex md:w-1/2 items-center justify-center relative bg-gradient-to-br from-purple-200 to-pink-200 dark:from-gray-700 dark:to-gray-800">
//         <div className="w-3/4 h-3/4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex items-center justify-center">
//           <span className="text-8xl animate-bounce">👾</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// 'use client';

// // 👇 These two lines force Next.js to skip SSR and caching
// export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';

// import LoginPageClient from '@/components/LoginPageClient';

// export default function Page() {
//   return <LoginPageClient />;
// }

'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import LoginPageClient from '@/components/LoginPageClient';

export default function Page() {
  return <LoginPageClient />;
}
