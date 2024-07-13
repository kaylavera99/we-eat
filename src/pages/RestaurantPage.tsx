import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonToast } from '@ionic/react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchFullMenuFromRestaurants, MenuCategory } from '../services/restaurantService';
import { setPreferredLocation } from '../services/userService';

interface Place {
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address?: string; // Optional to avoid conflicts
  coordinates?: { lat: number; lng: number }; // Optional to avoid conflicts
}

interface RestaurantDetails {
  menuCategories: MenuCategory[];
  place: Place;
}

const RestaurantPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const locationState = useLocation<{ place: Place }>().state;
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [place, setPlace] = useState<Place | null>(locationState?.place || null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const categories = await fetchFullMenuFromRestaurants(restaurantName);
        setMenuCategories(categories);
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantName]);

  const handleSetPreferredLocation = async () => {
    if (place) {
      try {
        await setPreferredLocation(place);
        setToastMessage('Preferred location saved');
        setShowToast(true);
      } catch (error) {
        setToastMessage(`Error saving preferred location: ${(error as Error).message}`);
        setShowToast(true);
      }
    } else {
      setToastMessage('No place information available');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            {menuCategories.map(category => (
              <div key={category.id}>
                <h5>{category.category}</h5>
                {category.items.map(item => (
                  <div key={item.id}>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <p>Allergens: {item.allergens.join(', ')}</p>
                    <p>{item.note}</p>
                  </div>
                ))}
              </div>
            ))}
            <IonButton expand="block" onClick={handleSetPreferredLocation}>
              Set as Preferred Location
            </IonButton>
          </>
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

export default RestaurantPage;
