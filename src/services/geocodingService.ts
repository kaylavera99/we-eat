
import axios from 'axios';
import { apiUrl } from './api';
import { GeoPoint } from 'firebase/firestore';

const GEOCODING_API_KEY =  process.env.GOOGLE_PLACES_API_KEY;
const PROXY_BASE = "https://proxy-server-we-eat-e24e32c11d10.herokuapp.com";

export const geocodeAddress = async (address: string): Promise<GeoPoint> => {
  const response = await axios.get(apiUrl("/geocode"), {
    params: { address }
  });

  if (response.data?.lat == null && response.data?.lng == null) {
    throw new Error('Invalid geocoding response: missing coordinates');
  }


  if (response.data.status === 'OK') {
    const location = response.data.results[0].geometry.location;
    return new GeoPoint(location.lat, location.lng);
  } else {
    throw new Error(`Geocoding API error: ${response.data.status}`);
  }
};
