import * as functions from 'firebase-functions';
import axios from 'axios';

const GOOGLE_PLACES_API_KEY = 'AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk';

export const fetchRestaurants = functions.https.onRequest(async (req, res) => {
  const { location, radius, keyword } = req.query;
  
  // Set CORS headers for the preflight request
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Respond to OPTIONS method
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { data } = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
      params: {
        location,
        radius,
        keyword,
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY
      }
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Google Places:', error);
    res.status(500).send('Error fetching data from Google Places');
  }
});
