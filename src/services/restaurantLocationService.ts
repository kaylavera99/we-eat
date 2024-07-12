import { collection, doc, writeBatch, GeoPoint } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { fetchRestaurantsFromGooglePlaces, getCoordinatesFromAddress } from './googlePlacesService';

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
  const newLocationDocRef = doc(preferredLocationsRef);

  const geoPoint = new GeoPoint(coordinates.lat, coordinates.lng);

  await writeBatch(db)
    .set(newLocationDocRef, {
      name: restaurantName,
      address,
      coordinates: geoPoint,
    })
    .commit();
};
