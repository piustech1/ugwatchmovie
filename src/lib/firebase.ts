import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

const firebaseConfig = {
  apiKey: "AIzaSyCnnbF_xvHjqYkpkf3poktjuDf-iOHPo4w",
  authDomain: "ugwatch-285f7.firebaseapp.com",
  databaseURL: "https://ugwatch-285f7-default-rtdb.firebaseio.com",
  projectId: "ugwatch-285f7",
  storageBucket: "ugwatch-285f7.firebasestorage.app",
  messagingSenderId: "1091918498632",
  appId: "1:1091918498632:web:1e24c62a186e41310e817d",
  measurementId: "G-CFN88SS36N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
