// src/pages/FetchAndStorePage.tsx

import React from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { addRestaurantsToFirestore } from '../services/restaurantLocationService';

const FetchAndStorePage: React.FC = () => {
  const handleFetchAndStore = async () => {
    try {
      // Example: Fetch McDonald's locations in New York City within a 20-mile radius
      const location = '40.712776,-74.005974'; // New York City coordinates
      const radius = 32186; // 20 miles in meters
      const keyword = 'McDonald\'s';

      await addRestaurantsToFirestore(location, radius, keyword);
      alert('Restaurants added to Firestore successfully.');
    } catch (error) {
      alert('Error adding restaurants to Firestore.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Fetch and Store Restaurants</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={handleFetchAndStore}>
          Fetch and Store Restaurants
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default FetchAndStorePage;
