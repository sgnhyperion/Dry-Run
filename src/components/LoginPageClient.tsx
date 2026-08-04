"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithGoogle,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from "@/firebase/auth";
import { FcGoogle } from "react-icons/fc"; 
import { auth, db } from "@/firebase/auth"; // adjust import path if different

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPageClient() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // 🔹 NEW

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get user's Firestore document
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() && userDoc.data().username) {
        // ✅ Has username → go to home
        router.replace("/home");
      } else {
        // 📝 Logged in but no username → go to choose username page
        router.replace("/choose-username");
      }
    } else {
      // ❌ Not logged in → show login page
      setCheckingAuth(false);
    }
  });

  return () => unsubscribe();
}, [router]);


  // 🔹 Show loader while checking Firebase session
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#F5F7FF] to-[#EAF0FF] dark:from-gray-900 dark:to-gray-800">
        <div className="text-6xl animate-spin-slow">👾</div>
        <p className="mt-4 text-gray-700 dark:text-gray-200 text-lg font-medium">
          loading...
        </p>
      </div>
    );
  }

  const handleNextEmail = () => {
    if (!email) return setError("Please enter your email.");
    setError(null);
    setStep(2);
  };


//   const handlePasswordSubmit = async () => {
//   if (!password) return setError("Please enter a password.");
//   setLoadingEmail(true);
//   setError(null);

//   try {
//     // Attempt to sign in first
//     const { user, needsUsername } = await signInWithEmailPassword(email, password);
//     if (needsUsername) router.push(`/choose-username?uid=${user.uid}`);
//     else router.push("/home");
//   } catch (err: any) {
//     console.log("Sign-in error code:", err.code);

//     if (err.code === "auth/user-not-found") {
//       // Only sign up if the user does NOT exist
//       try {
//         const { user, needsUsername } = await signUpWithEmailPassword(email, password);
//         router.push(`/choose-username?uid=${user.uid}`);
//       } catch (signupErr: any) {
//         console.error("Sign-up error:", signupErr);

//         // If email already exists → password is probably wrong
//         if (signupErr.code === "auth/email-already-in-use") {
//           setError("Email already exists. Please enter correct password.");
//         } else {
//           setError(signupErr.message || "Sign-up failed.");
//         }
//       }
//     } else if (err.code === "auth/wrong-password") {
//       setError("Incorrect password. Try again.");
//     } else {
//       setError(err.message || "Sign-in failed.");
//     }
//   } finally {
//     setLoadingEmail(false);
//   }
// };

const handlePasswordSubmit = async () => {
  if (!password) return setError("Please enter a password.");
  setLoadingEmail(true);
  setError(null);

  try {
    // Attempt to sign in first
    const { user, needsUsername } = await signInWithEmailPassword(email, password);
    if (needsUsername) router.push(`/choose-username?uid=${user.uid}`);
    else router.push("/home");
  } catch (err: any) {
    console.log("Sign-in error code:", err.code);

    // Map Firebase errors to user-friendly messages
    const errorMap: Record<string, string> = {
      "auth/user-not-found": "No account found with this email. Please sign up first.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-email": "Invalid email format. Please check and try again.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/email-already-in-use": "Email already exists. Try logging in instead.",
    };

    const friendlyMessage = errorMap[err.code] || "Login failed. Please try again.";

    // If the user doesn't exist, attempt signup
    if (err.code === "auth/user-not-found") {
      try {
        const { user, needsUsername } = await signUpWithEmailPassword(email, password);
        router.push(`/choose-username?uid=${user.uid}`);
      } catch (signupErr: any) {
        const signupFriendlyMessage =
          errorMap[signupErr.code] || "Signup failed. Please try again.";
        setError(signupFriendlyMessage);
      }
    } else {
      setError(friendlyMessage);
    }
  } finally {
    setLoadingEmail(false);
  }
};



  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      const { user, needsUsername } = await signInWithGoogle();
      if (needsUsername) router.push(`/choose-username?uid=${user.uid}`);
      else router.push("/home");
    } catch (err: any) {
      console.error(err);
      setError("Google sign-in failed.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Left Panel */}
      <div className="flex flex-col justify-center items-center md:items-start md:justify-center md:pl-20 p-8 md:w-1/2 space-y-6 animate-fadeIn min-h-[90vh]">

      <h1 className="font-pacifico text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 drop-shadow-md">
        MimiChat
      </h1>

      <p className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-200">
        Login or Signup
      </p>


        {/* <p className="text-gray-700 dark:text-gray-300 max-w-md">
          Chat in 3D with animated avatars. Express your emotions and have fun conversations like never before.
        </p> */}

        <div className="text-6xl animate-bounce md:hidden text-center mb-8">👾</div>

        {step === 1 && (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"

            />
            <button
              onClick={handleNextEmail}
              disabled={loadingEmail || loadingGoogle}
              className={`${
                loadingGoogle
                  ? "bg-blue-300 cursor-not-allowed"
                  : loadingEmail
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white py-2 rounded-xl shadow-md transition transform hover:scale-105`}
            >
              Next
            </button>
                <button
      onClick={() => router.push("/share")}
      className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-2 hover:underline transition-all"
    >
      Continue as Guest →
    </button>

          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <button
              onClick={handlePasswordSubmit}
              disabled={loadingEmail || loadingGoogle}
              className={`${
                loadingGoogle
                  ? "bg-blue-300 cursor-not-allowed"
                  : loadingEmail
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white py-2 rounded-xl shadow-md transition transform hover:scale-105`}
            >
              {loadingEmail ? "Processing..." : "Sign In / Sign Up"}
            </button>
          </div>
        )}

        <div className="w-full flex items-center justify-center gap-3 mt-2">
          <span className="border-b border-gray-500 w-full"></span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">OR</span>
          <span className="border-b border-gray-500 w-full"></span>
        </div>


        <button
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle || loadingEmail}
          className={`flex items-center justify-center gap-3 w-full max-w-xs border border-gray-300 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-medium px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:scale-105 duration-200`}
        >
          {loadingGoogle ? (
            "Processing..."
          ) : (
            <>
              <FcGoogle size={22} />
              <span>Sign in with Google</span>
            </>
          )}
        </button>




        {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
      </div>

      <div className="hidden md:flex md:w-1/2 items-center justify-center relative bg-gradient-to-br from-purple-200 to-pink-200 dark:from-gray-700 dark:to-gray-800">
        <div className="w-3/4 h-3/4 bg-white dark:bg-gray-900 rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all duration-500 hover:shadow-[0_15px_60px_rgba(0,0,0,0.25)]">
  <span className="text-8xl animate-bounce hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(124,58,237,0.4)]">
    👾
  </span>
</div>

      </div>
    </div>
  );
}

