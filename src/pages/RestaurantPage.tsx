import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonLoading, IonToast } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { fetchFullMenuFromRestaurants, MenuCategory } from '../services/restaurantService';

const RestaurantPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <IonList>
            {menuCategories.map(category => (
              <div key={category.id}>
                <h5>{category.category}</h5>
                {category.items.map(item => (
                  <IonItem key={item.id}>
                    <IonLabel>
                      <h2>{item.name}</h2>
                      <p>{item.description}</p>
                      <p>Allergens: {item.allergens.join(', ')}</p>
                      <p>{item.note}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </div>
            ))}
          </IonList>
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
