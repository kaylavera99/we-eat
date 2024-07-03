// src/services/restaurantService.ts

// restaurantLocationService.ts
import { collection, doc, writeBatch, GeoPoint } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { fetchRestaurantsFromGooglePlaces } from './googlePlacesService';

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
