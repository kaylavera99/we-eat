import { collection, getDocs, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import axios from 'axios';

const PROXY_SERVER_URL = 'https://proxy-server-we-eat-e24e32c11d10.herokuapp.com';
const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';


//Calculating distance from users location
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3958.8; // earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


export const fetchKeywords = async (): Promise<string[]> => {
  const newKeywords: string[] = [];

  const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
  restaurantsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.name) {
      newKeywords.push(data.name);
    }
  });

  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const createdMenusSnapshot = await getDocs(collection(userDocRef, 'createdMenus'));
    createdMenusSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.restaurantName) {
        newKeywords.push(data.restaurantName);
      }
    });
  }

  return newKeywords;
};

export const searchRestaurants = async (location: string, radius: number, searchQuery: string, userLocation: { lat: number, lng: number }) => {
  const allResults: any[] = [];

  const params = {
    location,
    radius: radius * 1609.34,
    keyword: searchQuery,
    type: 'restaurant',
    fields: 'name,geometry,icon,photos,vicinity',
    key: GOOGLE_PLACES_API_KEY
  };

  try {
    const { data } = await axios.get(`${PROXY_SERVER_URL}/proxy`, { params });
    allResults.push(...data.results);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error fetching data for keyword: ${searchQuery}`, error.response?.data || error.message);
    } else {
      console.error(`Error fetching data for keyword: ${searchQuery}`, error);
    }
  }

  const formattedResults = allResults.map((result) => {
    const vicinity = result.vicinity || result.formatted_address || '';
    const distance = result.geometry && result.geometry.location
      ? haversineDistance(userLocation.lat, userLocation.lng, result.geometry.location.lat, result.geometry.location.lng)
      : NaN;
    const photoReference = result.photos?.[0]?.photo_reference;
    const photoUrl = photoReference ? `${PROXY_SERVER_URL}/photo?photoreference=${photoReference}&maxwidth=400` : '';
    return {
      name: result.name,
      vicinity,
      geometry: result.geometry,
      distance,
      icon: result.icon,
      photoUrl
    };
  }).filter(result => !isNaN(result.distance) && result.distance <= (radius + 1)); // margin of error

  formattedResults.sort((a, b) => a.distance - b.distance);
  return formattedResults;
};
