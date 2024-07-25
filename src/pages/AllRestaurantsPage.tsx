// src/pages/AllRestaurantsPage.tsx

import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';

interface Restaurant {
  id: string;
  name: string;
  thumbnailUrl: string;
}

const AllRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        const restaurantList: Restaurant[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Restaurant));
        setRestaurants(restaurantList);
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchRestaurants();
  }, []);

  const handleRestaurantClick = (restaurantName: string) => {
    history.push(`/restaurant/${restaurantName}/full`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>All Restaurants</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <div className="d-flex flex-wrap">
            {restaurants.map(restaurant => (
              <div
                className="card m-2"
                style={{ width: '10rem' }}
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant.name)}
              >
                <img src={restaurant.thumbnailUrl} className="card-img-top" alt={restaurant.name} />
                <div className="card-body">
                  <h5 className="card-title">{restaurant.name}</h5>
                </div>
              </div>
            ))}
          </div>
        )}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default AllRestaurantsPage;
