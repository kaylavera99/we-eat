const express = require('express');
const admin = require('firebase-admin');

const serviceAccount = require('./weeat-1a169-firebase-adminsdk-h7v29-a6434e1825.json');


// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://weeat-1a169-default-rtdb.firebaseio.com'
});

const app = express();
app.use(express.json()); // for parsing application/json

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

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
