
// src/lib/firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "studio-218111292-c95c3",
  "appId": "1:336506941102:web:e78850fa208401338a873f",
  "apiKey": "AIzaSyCEb1ILlBGUSmv1vRvSLtRaGL_t_noNLmw",
  "authDomain": "studio-218111292-c95c3.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "336506941102"
};

// IMPORTANT: For your app to work, you must update your Firestore security rules.
// Go to your Firebase project console -> Firestore Database -> Rules
// and replace the default rules with the following:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads and writes only for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
