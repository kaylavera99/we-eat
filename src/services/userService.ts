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
      console.log('Authenticated user:', auth.currentUser.uid); // Debugging
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const preferredLocationRef = collection(userDocRef, 'preferredLocations');
      
      // Query to check if the location already exists
      const q = query(preferredLocationRef, where("name", "==", place.name));
      const querySnapshot = await getDocs(q);
      
      let preferredLocationDocRef;
      
      if (!querySnapshot.empty) {
        // Update existing document
        preferredLocationDocRef = querySnapshot.docs[0].ref;
        console.log('Updating existing preferred location document:', preferredLocationDocRef.path); // Debugging
      } else {
        // Create new document
        preferredLocationDocRef = doc(preferredLocationRef);
        console.log('Creating new preferred location document:', preferredLocationDocRef.path); // Debugging
      }
      
      await setDoc(preferredLocationDocRef, {
        name: place.name,
        address: place.vicinity,
        coordinates: new GeoPoint(place.geometry.location.lat, place.geometry.location.lng)
      });

      console.log('Preferred location set:', place); // Debugging
    } catch (error) {
      console.error('Error setting preferred location:', error); // Debugging
      throw new Error('Failed to set preferred location');
    }
  } else {
    console.error('No authenticated user'); // Debugging
    throw new Error('No authenticated user');
  }
};


