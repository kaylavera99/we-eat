// src/services/googlePlacesService.ts

import axios, { AxiosError } from 'axios';


const GOOGLE_API_KEY = 'AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk';
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';


export const fetchRestaurantsFromGooglePlaces = async (lat: number, lng: number, radius: number, keyword: string) => {
    try {
      const response = await axios.get(GOOGLE_PLACES_API_URL, {
        params: {
          location: `${lat},${lng}`,
          radius: radius,
          keyword: keyword,
          type: 'restaurant',
          key: GOOGLE_API_KEY,
        },
      });
  
      if (response.data.status !== 'OK') {
        throw new Error(`Error fetching data from Google Places: ${response.data.status}`);
      }
  
      return response.data.results;
    } catch (error: unknown) {
      console.error('Axios error message:', (error as Error).message);
      throw error;
    }
  };


  // src/services/googlePlacesService.ts

  export const getCoordinatesFromAddress = async (address: string) => {
    const formattedAddress = address.replace(/\s/g, '+'); // Replace spaces with + for URL compatibility
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${formattedAddress}&key=${GOOGLE_API_KEY}`;
    
    console.log("Request URL: ", url);
  
    try {
      const response = await axios.get(url);
      if (response.data.status === 'OK') {
        const { lat, lng } = response.data.results[0].geometry.location;
        return { lat, lng };
      } else {
        console.error('Error fetching coordinates:', response.data.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }
  };