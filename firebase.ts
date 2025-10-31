// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVh0fewtNtD6HLH-r-r9R8cE28MWHCQ4Q",
  authDomain: "ai-code-mentor-e9347.firebaseapp.com",
  projectId: "ai-code-mentor-e9347",
  storageBucket: "ai-code-mentor-e9347.firebasestorage.app",
  messagingSenderId: "995199337484",
  appId: "1:995199337484:web:deab9b752f207a35ebda29",
  measurementId: "G-JCM4SV1ER4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { 
  auth, 
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
};
