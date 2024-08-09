const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const { query, where, getDocs } = require('firebase/firestore'); // Add Firestore query methods

const app = express();

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json()); // for parsing application/json

const GOOGLE_PLACES_API_KEY = 'AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk';
const GOOGLE_PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GOOGLE_PLACES_TEXT_SEARCH_API_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACES_PHOTO_API_URL = 'https://maps.googleapis.com/maps/api/place/photo';

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://weeat-1a169-default-rtdb.firebaseio.com'
});

// Middleware to verify tokens
const verifyToken = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(401).send('Unauthorized: No token provided');
  }

  const idToken = authorizationHeader.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).send('Unauthorized: Malformed token');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).send('Unauthorized: Invalid token');
  }
};

// Proxy route for Google Places API Nearby Search
app.get('/proxy', async (req, res) => {
  const { location, radius, keyword } = req.query;

  try {
    const response = await axios.get(GOOGLE_PLACES_API_URL, {
      params: {
        location,
        radius,
        keyword,
        type: 'restaurant',
        key: GOOGLE_PLACES_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from Google Places:', error);
    res.status(500).send('Error fetching data from Google Places');
  }
});

// Proxy route for Google Places API Text Search
app.get('/textsearch', async (req, res) => {
  const { query } = req.query;

  try {
    const response = await axios.get(GOOGLE_PLACES_TEXT_SEARCH_API_URL, {
      params: {
        query,
        key: GOOGLE_PLACES_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from Google Places:', error);
    res.status(500).send('Error fetching data from Google Places');
  }
});

// Proxy route for Google Places API Photo
app.get('/photo', async (req, res) => {
  const { photoreference, maxwidth } = req.query;

  try {
    const response = await axios.get(GOOGLE_PLACES_PHOTO_API_URL, {
      params: {
        photoreference,
        maxwidth: maxwidth || 400,
        key: GOOGLE_PLACES_API_KEY
      },
      responseType: 'stream'
    });

    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for one year
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching photo from Google Places:', error);
    res.status(500).send('Error fetching photo from Google Places');
  }
});


// Route to fetch user menus
app.get('/users/:userId/menus', verifyToken, async (req, res) => {
  const userId = req.params.userId;

  // Ensure the authenticated user matches the requested userId
  if (req.user.uid !== userId) {
    return res.status(403).send('Forbidden');
  }

  try {
    const userDocRef = admin.firestore().doc(`users/${userId}`);
    const createdMenusSnapshot = await userDocRef.collection('createdMenus').get();
    const savedMenusSnapshot = await userDocRef.collection('savedMenus').get();

    const createdMenus = createdMenusSnapshot.docs.map(doc => doc.data());
    const savedMenus = savedMenusSnapshot.docs.map(doc => doc.data());

    res.json({ createdMenus, savedMenus });
  } catch (error) {
    res.status(500).send(`Error fetching menus: ${error.message}`);
  }
});

// Route to add a menu item to created menus
app.post('/users/:userId/menus/created', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  const { menu } = req.body;

  if (req.user.uid !== userId) {
    return res.status(403).send('Forbidden');
  }

  try {
    const userDocRef = admin.firestore().doc(`users/${userId}`);
    const createdMenusRef = userDocRef.collection('createdMenus');
    await createdMenusRef.add(menu);
    res.status(201).send('Menu item added successfully');
  } catch (error) {
    res.status(500).send(`Error adding menu item: ${error.message}`);
  }
});

// Route to update a menu item in created menus
app.put('/users/:userId/menus/created/:menuId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  const menuId = req.params.menuId;
  const menuItem = req.body;

  if (req.user.uid !== userId) {
    return res.status(403).send('Forbidden');
  }

  try {
    const userDocRef = admin.firestore().doc(`users/${userId}`);
    const menuDocRef = userDocRef.collection('createdMenus').doc(menuId);
    await menuDocRef.update(menuItem);
    res.send('Menu item updated successfully');
  } catch (error) {
    res.status(500).send(`Error updating menu item: ${error.message}`);
  }
});

// Route to delete a menu item from created menus
app.delete('/users/:userId/menus/created/:menuId', verifyToken, async (req, res) => {
  const userId = req.params.userId;
  const menuId = req.params.menuId;

  if (req.user.uid !== userId) {
    return res.status(403).send('Forbidden');
  }

  try {
    const userDocRef = admin.firestore().doc(`users/${userId}`);
    const menuDocRef = userDocRef.collection('createdMenus').doc(menuId);
    await menuDocRef.delete();
    res.send('Menu item deleted successfully');
  } catch (error) {
    res.status(500).send(`Error deleting menu item: ${error.message}`);
  }
});

// Route to fetch the full menu of a restaurant
app.get('/restaurants/:restaurantName/menu', verifyToken, async (req, res) => {
  const restaurantName = req.params.restaurantName;

  try {
    const restaurantsRef = admin.firestore().collection('restaurants');
    const q = query(restaurantsRef, where("name", "==", restaurantName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const restaurantDocRef = querySnapshot.docs[0].ref;
      const menuSnapshot = await restaurantDocRef.collection('menu').get();

      const menuItems = menuSnapshot.docs.map(doc => doc.data());

      res.json(menuItems);
    } else {
      res.status(404).send('Restaurant not found');
    }
  } catch (error) {
    res.status(500).send(`Error fetching menu: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
