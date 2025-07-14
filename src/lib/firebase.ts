// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0E8lRn0RIA2f0pd2H5DDm0EINvBwFlto",
  authDomain: "rodocheck-244cd.firebaseapp.com",
  projectId: "rodocheck-244cd",
  storageBucket: "rodocheck-244cd.appspot.com",
  messagingSenderId: "907683310999",
  appId: "1:907683310999:web:0a5b018dabbba17b75a8d2"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);


export { app, db, auth };
