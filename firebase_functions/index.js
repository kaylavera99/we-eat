/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.api = functions.https.onRequest((app) => {
    app.get('/users/:userId/menus', async (req, res) => {
        const userId = req.params.userId;
        const idToken = req.headers.authorization.split('Bearer ')[1];
        
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            if (decodedToken.uid !== userId) {
                return res.status(403).send('Unauthorized');
            }

            const userDocRef = admin.firestore().collection('users').doc(userId);
            const createdMenusSnapshot = await userDocRef.collection('createdMenus').get();
            const savedMenusSnapshot = await userDocRef.collection('savedMenus').get();

            const createdMenus = createdMenusSnapshot.docs.map(doc => doc.data());
            const savedMenus = savedMenusSnapshot.docs.map(doc => doc.data());

            res.json({ createdMenus, savedMenus });
        } catch (error) {
            res.status(500).send('Error fetching menus');
        }
    });
});
