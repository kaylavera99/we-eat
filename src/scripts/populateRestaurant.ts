// src/scripts/populateRestaurants.ts

import axios, { AxiosError } from 'axios';
import { collection, doc, writeBatch, GeoPoint } from 'firebase/firestore';
import {db} from '../firebaseConfig';



const GOOGLE_API_KEY = 'AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk';  // Replace with your actual API key
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

const fetchRestaurantsFromGooglePlaces = async (location: string, radius: number, keyword: string) => {
    try {
      const response = await axios.get(GOOGLE_PLACES_API_URL, {
        params: {
          location,
          radius,
          keyword,
          type: 'restaurant',
          key: GOOGLE_API_KEY,
        },
      });
      return response.data.results;
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
  
  const addRestaurantsToFirestore = async (latitude: number, longitude: number, radius: number, keyword: string) => {
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
  
        // Add delay between requests if needed
        await new Promise(resolve => setTimeout(resolve, 1000));
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
  


