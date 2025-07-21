// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPojGIwRGd4KCfuO1xM4guclyxuRKd9_M",
  authDomain: "sahayak-e74ef.firebaseapp.com",
  projectId: "sahayak-e74ef",
  storageBucket: "sahayak-e74ef.firebasestorage.app",
  messagingSenderId: "369439198562",
  appId: "1:369439198562:web:33abcf0f116bca35b9f03b",
  measurementId: "G-9QNXQVQ6SW"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
