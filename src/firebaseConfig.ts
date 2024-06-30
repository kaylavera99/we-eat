import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBn_j-gfWv5lv-8A_wnlzTREQhrnHkpKnY",
    authDomain: "weeat-1a169.firebaseapp.com",
    databaseURL: "https://weeat-1a169-default-rtdb.firebaseio.com",
    projectId: "weeat-1a169",
    storageBucket: "weeat-1a169.appspot.com",
    messagingSenderId: "80172704491",
    appId: "1:80172704491:web:d376d7874f5fa1f71714ae",
    measurementId: "G-B52W9XYSEL"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence);
  export { auth };
  export const db = getFirestore(app);