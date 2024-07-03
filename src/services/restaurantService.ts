// src/services/restaurantService.ts

import { collection, doc, writeBatch, GeoPoint } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { fetchRestaurantsFromGooglePlaces } from './googlePlacesService';
import axios from 'axios';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const addRestaurantsToFirestore = async (latitude: number, longitude: number, radius: number, keyword: string) => {
  try {
    const location = `${latitude},${longitude}`;
    const restaurants = await fetchRestaurantsFromGooglePlaces(location, radius, keyword);

    const batch = writeBatch(db);
    for (const restaurant of restaurants) {
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

      // Add delay between requests
      await delay(1000);
    }

    await batch.commit();
    console.log('Added restaurants to Firestore successfully.');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error message:', error.message);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
};
