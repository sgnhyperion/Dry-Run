// import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, } from "firebase/auth";
// import { getFirestore, doc, getDoc, setDoc, updateDoc, query, where, collection, getDocs } from "firebase/firestore";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { app } from "./config";

// const auth = getAuth(app);
// const db = getFirestore(app);
// const storage = getStorage(app);

// export const signInWithGoogle = async () => {
//   const provider = new GoogleAuthProvider();

//   try {
//     const result = await signInWithPopup(auth, provider);
//     const user = result.user;

//     if (!user) throw new Error("No user data found.");

//     const userRef = doc(db, "users", user.uid);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) {
//       // User is new → create their profile with a default avatar
//       await setDoc(userRef, {
//         uid: user.uid,
//         username: null, // Will be set later
//         email: user.email,
//         avatarImages: [], // User can upload later
//         createdAt: new Date(),
//         lastSeen: null,
//         online: false,
//         digestEnabled: true,          // Default: allow digest emails
//         digestFrequency: "daily",     // Default frequency
//         lastDigestSent: null          // No digest sent yet
//       });

//       return { user, needsUsername: true };
//     }

//     // Existing user → Check if they have a username
//     const userData = userSnap.data();
//     const needsUsername = !userData?.username;

//     return { user, needsUsername };
//   } catch (error) {
//     console.error("Google Sign-In Error:", error);
//     throw error;
//   }
// };

// export const saveUsername = async (userId: string, username: string) => {
//   const trimmedUsername = username.trim();
//   if (!trimmedUsername) throw new Error("Username cannot be empty.");

//   const usernameLower = trimmedUsername.toLowerCase();
//     // ✅ Optional: Check if username already exists (case-insensitive)
//   const q = query(
//     collection(db, "users"),
//     where("username_lowercase", "==", usernameLower)
//   );
//   const existing = await getDocs(q);
//   if (!existing.empty) {
//     throw new Error("Username already taken. Please choose another one.");
//   }

//   const userRef = doc(db, "users", userId);
//   await setDoc(
//     userRef,
//     {
//       username: trimmedUsername,
//       username_lowercase: usernameLower,
//     },
//     { merge: true } // keeps other fields intact
//   );
// }

// // Upload avatar images to Firebase Storage
// export const uploadAvatar = async (userId: string, file: File) => {
//   if (!file) throw new Error("No file selected.");

//   const storageRef = ref(storage, `avatars/${userId}/${file.name}`);

//   try {
//     const snapshot = await uploadBytes(storageRef, file);
//     const downloadURL = await getDownloadURL(snapshot.ref);

//     // Update user's Firestore profile with the new avatar URL
//     const userRef = doc(db, "users", userId);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) throw new Error("User not found.");

//     const userData = userSnap.data();
//     const avatarImages = userData.avatarImages || [];

//     if (avatarImages.length >= 4) throw new Error("Maximum of 4 images allowed.");

//     avatarImages.push(downloadURL);

//     await updateDoc(userRef, { avatarImages });

//     return downloadURL;
//   } catch (error) {
//     console.error("Avatar Upload Error:", error);
//     throw error;
//   }
// };

// // Check username case-insensitively
// export const isUsernameTaken = async (username: string) => {
//   const usersRef = collection(db, "users");
//   const q = query(
//     usersRef,
//     where("username_lowercase", "==", username.toLowerCase())
//   );
//   const querySnapshot = await getDocs(q);
//   return !querySnapshot.empty;
// };

// export { auth, db, storage };

// // email and password thing

// // ---------------------- Email/Password Auth ----------------------
// export const signUpWithEmailPassword = async (email: string, password: string) => {
//   try {
//     const methods = await fetchSignInMethodsForEmail(auth, email);

//     let userCredential;
//     if (methods.length > 0) {
//       // User exists → sign in
//       userCredential = await signInWithEmailAndPassword(auth, email, password);
//     } else {
//       // Create new user
//       userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     }

//     const user = userCredential.user;

//     // Check Firestore profile
//     const userRef = doc(db, "users", user.uid);
//     const userSnap = await getDoc(userRef);

//     let needsUsername = true;
//     if (userSnap.exists()) {
//       const data = userSnap.data();
//       needsUsername = !data?.username;
//     } else {
//       await setDoc(userRef, {
//         uid: user.uid,
//         username: null,
//         email: user.email,
//         avatarImages: [],
//         createdAt: new Date(),
//         lastSeen: null,
//         online: false,
//         digestEnabled: true,          // Default: allow digest emails
//         digestFrequency: "daily",     // Default frequency
//         lastDigestSent: null          // No digest sent yet
//       });
//       needsUsername = true;
//     }

//     return { user, needsUsername };
//   } catch (error: any) {
//     if (error.code === "auth/email-already-in-use") {
//       // Parallel creation: sign in and check Firestore
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       const userRef = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       let needsUsername = true;
//       if (userSnap.exists()) {
//         const data = userSnap.data();
//         needsUsername = !data?.username;
//       } else {
//         await setDoc(userRef, {
//           uid: user.uid,
//           username: null,
//           email: user.email,
//           avatarImages: [],
//           createdAt: new Date(),
//           lastSeen: null,
//           online: false,
//           digestEnabled: true,          // Default: allow digest emails
//           digestFrequency: "daily",     // Default frequency
//           lastDigestSent: null          // No digest sent yet
//         });
//         needsUsername = true;
//       }

//       return { user, needsUsername };
//     }

//     throw error;
//   }
// };



// export const signInWithEmailPassword = async (email: string, password: string) => {
//   try {
//     const methods = await fetchSignInMethodsForEmail(auth, email);

//     if (methods.length === 0) {
//       // New user → create account safely
//       return await signUpWithEmailPassword(email, password);
//     }

//     // Existing user → sign in
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     // Firestore profile
//     const userRef = doc(db, "users", user.uid);
//     const userSnap = await getDoc(userRef);

//     if (!userSnap.exists()) {
//       await setDoc(userRef, {
//         uid: user.uid,
//         username: null,
//         email: user.email,
//         avatarImages: [],
//         createdAt: new Date(),
//         lastSeen: null,
//         online: false,
//         digestEnabled: true,          // Default: allow digest emails
//         digestFrequency: "daily",     // Default frequency
//         lastDigestSent: null          // No digest sent yet
//       });
//       return { user, needsUsername: true };
//     }

//     const userData = userSnap.data();
//     const needsUsername = userData?.username == null || userData.username === "";
//     return { user, needsUsername };
//   } catch (error: any) {
//     // Only sign up if user truly doesn't exist
//     if (error.code === "auth/user-not-found") {
//       return await signUpWithEmailPassword(email, password);
//     }
//     throw error;
//   }
// };



import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  collection,
  getDocs,
} from "firebase/firestore";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { app } from "./config";

/* -------------------- Firebase Init -------------------- */

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* -------------------- Helpers -------------------- */

const createUserProfileIfMissing = async (user: any) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      username: null,
      username_lowercase: null,
      email: user.email,
      avatarImages: [],
      createdAt: new Date(),
      lastSeen: null,
      online: false,
      digestEnabled: true,
      digestFrequency: "daily",
      lastDigestSent: null,
    });
    return true; // needs username
  }

  const data = snap.data();
  return !data?.username;
};

/* -------------------- Google Auth -------------------- */

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  if (!result.user) throw new Error("Google sign-in failed");

  const needsUsername = await createUserProfileIfMissing(result.user);

  return { user: result.user, needsUsername };
};

/* -------------------- Email / Password Auth -------------------- */

export const signUpWithEmailPassword = async (
  email: string,
  password: string
) => {
  const methods = await fetchSignInMethodsForEmail(auth, email);

  let credential;
  if (methods.length > 0) {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } else {
    credential = await createUserWithEmailAndPassword(auth, email, password);
  }

  const needsUsername = await createUserProfileIfMissing(credential.user);

  return { user: credential.user, needsUsername };
};

export const signInWithEmailPassword = async (
  email: string,
  password: string
) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const needsUsername = await createUserProfileIfMissing(credential.user);
    return { user: credential.user, needsUsername };
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      return await signUpWithEmailPassword(email, password);
    }
    throw error;
  }
};

/* -------------------- Username -------------------- */

export const isUsernameTaken = async (username: string) => {
  const q = query(
    collection(db, "users"),
    where("username_lowercase", "==", username.toLowerCase())
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

export const saveUsername = async (userId: string, username: string) => {
  const trimmed = username.trim();
  if (!trimmed) throw new Error("Username cannot be empty");

  const lower = trimmed.toLowerCase();
  if (await isUsernameTaken(lower)) {
    throw new Error("Username already taken");
  }

  await updateDoc(doc(db, "users", userId), {
    username: trimmed,
    username_lowercase: lower,
  });
};

/* -------------------- Avatar Upload -------------------- */

export const uploadAvatar = async (userId: string, file: File) => {
  if (!file) throw new Error("No file selected");

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) throw new Error("User not found");

  const data = snap.data();
  const avatars = data.avatarImages || [];

  if (avatars.length >= 4) {
    throw new Error("Maximum of 4 images allowed");
  }

  const storageRef = ref(storage, `avatars/${userId}/${file.name}`);
  const upload = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(upload.ref);

  await updateDoc(userRef, {
    avatarImages: [...avatars, url],
  });

  return url;
};
