import { doc, setDoc, collection, getDocs, query, where, GeoPoint } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

interface Place {
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export const setPreferredLocation = async (place: Place): Promise<void> => {
  if (auth.currentUser) {
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const preferredLocationRef = collection(userDocRef, 'preferredLocations');

      const q = query(preferredLocationRef, where("name", "==", place.name));
      const querySnapshot = await getDocs(q);

      let preferredLocationDocRef;

      if (!querySnapshot.empty) {
        preferredLocationDocRef = querySnapshot.docs[0].ref;
      } else {
        preferredLocationDocRef = doc(preferredLocationRef);
      }

      await setDoc(preferredLocationDocRef, {
        name: place.name,
        address: place.vicinity,
        coordinates: new GeoPoint(place.geometry.location.lat, place.geometry.location.lng)
      });

    } catch (error) {
      throw new Error('Failed to set preferred location');
    }
  } else {
    throw new Error('No authenticated user');
  }
};


