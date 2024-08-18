
import axios from 'axios';
import { GeoPoint } from 'firebase/firestore';

const GEOCODING_API_KEY = 'AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk';

export const geocodeAddress = async (address: string): Promise<GeoPoint> => {
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
    params: {
      address,
      key: GEOCODING_API_KEY,
    },
  });

  if (response.data.status === 'OK') {
    const location = response.data.results[0].geometry.location;
    return new GeoPoint(location.lat, location.lng);
  } else {
    throw new Error(`Geocoding API error: ${response.data.status}`);
  }
};
