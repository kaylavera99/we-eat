import axios from 'axios';


const API_BASE = "https://proxy-server-we-eat-e24e32c11d10.herokuapp.com";


const PROXY_PLACES_URL = `${API_BASE}/proxy`;
const PROXY_GEOCODE_URL = `${API_BASE}/geocode`;

export const fetchRestaurantsFromGooglePlaces = async (
  lat: number,
  lng: number,
  radius: number,
  keyword: string
) => {
  try {
    const response = await axios.get(PROXY_PLACES_URL, {
      params: {
        location: `${lat},${lng}`,
        radius,
        keyword,
        type: 'restaurant',
       
      },
    });

    if (response.data.status && response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Error from Google Places via proxy: ${response.data.status}`);
    }

    return response.data.results ?? response.data;
  } catch (error: unknown) {
    console.error('Axios error message:', (error as Error).message);
    throw error;
  }
};

export const getCoordinatesFromAddress = async (address: string) => {
  try {
    const response = await axios.get(PROXY_GEOCODE_URL, {
      params: { address },
    });
   
    if (response.data?.lat != null && response.data?.lng != null) {
      return { lat: response.data.lat, lng: response.data.lng };
    }
    
    if (response.data?.status === 'OK') {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    }
    console.error('Error fetching coordinates:', response.data?.status || response.status);
    return null;
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    return null;
  }
};
