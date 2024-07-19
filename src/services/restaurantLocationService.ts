import {  collection, doc, writeBatch, GeoPoint, getDocs, query, where, setDoc, updateDoc} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { fetchRestaurantsFromGooglePlaces, getCoordinatesFromAddress } from './googlePlacesService';
import { searchRestaurants } from './searchService';

export const addRestaurantsToFirestore = async (lat: number, lng: number, radius: number, keywords: string[]) => {
  try {
    for (const keyword of keywords) {
      const restaurants = await fetchRestaurantsFromGooglePlaces(lat, lng, radius, keyword);

      const batch = writeBatch(db);

      restaurants.forEach((restaurant: any) => {
        const restaurantRef = doc(collection(db, 'restaurants'));
        const locationRef = doc(collection(restaurantRef, 'locations'));

        const geoPoint = new GeoPoint(restaurant.geometry.location.lat, restaurant.geometry.location.lng);

        batch.set(restaurantRef, {
          name: restaurant.name,
        });

        batch.set(locationRef, {
          address: restaurant.vicinity,
          coordinates: geoPoint,
        });
      });

      await batch.commit();
    }

    console.log('Added restaurants to Firestore successfully.');
  } catch (error: unknown) {
    console.error('Error adding restaurants to Firestore:', (error as Error).message);
  }
};
export const addPreferredLocation = async (restaurantName: string, address: string) => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const coordinates = await getCoordinatesFromAddress(address);

  if (!coordinates) {
    throw new Error('Failed to fetch coordinates from the address');
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const preferredLocationsRef = collection(userDocRef, 'preferredLocations');

  // Search for the restaurant to get the photo URL
  const results = await searchRestaurants(`${coordinates.lat},${coordinates.lng}`, 1, restaurantName, coordinates);
  const photoUrl = results.length > 0 ? results[0].photoUrl : '';

  const geoPoint = new GeoPoint(coordinates.lat, coordinates.lng);

  // Query the restaurants collection to find the restaurant document
  const restaurantQuery = query(collection(db, 'restaurants'), where('name', '==', restaurantName));
  const restaurantDocs = await getDocs(restaurantQuery);

  if (!restaurantDocs.empty) {
    const restaurantDoc = restaurantDocs.docs[0];
    const restaurantData = restaurantDoc.data();

    // Update the restaurant document with the photo URL if it doesn't already exist
    if (!restaurantData.photoUrl) {
      await updateDoc(restaurantDoc.ref, {
        photoUrl
      });
    }

    // Query the preferredLocations collection to find the preferred location document by the restaurant document ID
    const preferredLocationQuery = query(preferredLocationsRef, where('restaurantId', '==', restaurantDoc.id));
    const preferredLocationDocs = await getDocs(preferredLocationQuery);

    if (!preferredLocationDocs.empty) {
      const docRef = preferredLocationDocs.docs[0].ref;
      await updateDoc(docRef, {
        address,
        coordinates: geoPoint,
        photoUrl: restaurantData.photoUrl || photoUrl, // Use existing photoUrl if available
      });
    } else {
      const newLocationDocRef = doc(preferredLocationsRef);
      await setDoc(newLocationDocRef, {
        name: restaurantName,
        restaurantId: restaurantDoc.id, // Store the restaurant document ID
        address,
        coordinates: geoPoint,
        photoUrl: restaurantData.photoUrl || photoUrl // Use existing photoUrl if available
      });
    }
  } else {
    console.error(`No data found for restaurant: ${restaurantName}`);
    return;
  }
};

export const addPreferredLocationForCreatedMenu = async (restaurantName: string, fullAddress: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  // Fetch coordinates
  const coordinates = await getCoordinatesFromAddress(fullAddress);

  if (!coordinates) {
    throw new Error('Failed to fetch coordinates from the address');
  }

  const geoPoint = new GeoPoint(coordinates.lat, coordinates.lng);

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const preferredLocationsRef = collection(userDocRef, 'preferredLocations');

  // Query to check if the location already exists
  const q = query(preferredLocationsRef, where("name", "==", restaurantName));
  const querySnapshot = await getDocs(q);

  let preferredLocationDocRef;

  if (!querySnapshot.empty) {
    // Update existing document
    preferredLocationDocRef = querySnapshot.docs[0].ref;
  } else {
    // Create new document
    preferredLocationDocRef = doc(preferredLocationsRef);
  }

  await setDoc(preferredLocationDocRef, {
    name: restaurantName,
    address: fullAddress,
    coordinates: geoPoint,
  });
};