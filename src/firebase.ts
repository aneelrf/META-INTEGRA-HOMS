import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAMld_NwDXYdGW1jCMBeRPdTnZddPwu13w",
    authDomain: "meta-integra.firebaseapp.com",
    projectId: "meta-integra",
    storageBucket: "meta-integra.firebasestorage.app",
    messagingSenderId: "816087691607",
    appId: "1:816087691607:web:542e62846599daa47f8e12",
    measurementId: "G-BEQ04JQRFY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
