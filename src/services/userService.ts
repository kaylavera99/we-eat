// src/services/userService.ts

import { doc, setDoc, GeoPoint } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export const setPreferredLocation = async (restaurantId: string, location: { address: string, coordinates: GeoPoint }) => {
  try {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { preferredLocation: { restaurantId, location } }, { merge: true });
      console.log('Preferred location set successfully');
    }
  } catch (error) {
    console.error('Error setting preferred location:', error);
  }
};
