import * as functions from "firebase-functions";
import axios from "axios";

const GOOGLE_PLACES_API_KEY = "AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk";

export const fetchRestaurants = functions.https.onRequest(async (req, res) => {
  const {location, radius, keyword} = req.query;

  try {
    const {data} = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&keyword=${keyword}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`
    );
    res.set("Access-Control-Allow-Origin", "*");
    res.send(data);
  } catch (error) {
    res.status(500).send("Error fetching data from Google Places");
  }
});
