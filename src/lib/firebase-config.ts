// src/lib/firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-218111292-c95c3",
  "appId": "1:336506941102:web:e78850fa208401338a873f",
  "apiKey": "AIzaSyCEb1ILlBGUSmv1vRvSLtRaGL_t_noNLmw",
  "authDomain": "studio-218111292-c95c3.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "336506941102"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
