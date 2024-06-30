import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonLoading,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface MenuItem {
  name: string;
  description: string;
  allergens: string[];
}

interface MenuCategory {
  category: string;
  items: { [key: string]: MenuItem };
}

interface Restaurant {
  id: string;
  name: string;
  menu: MenuCategory[];
}

const RestaurantPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        const restaurantList: Restaurant[] = [];
        for (const docSnap of querySnapshot.docs) {
          const restaurantData = docSnap.data() as { name: string };
          console.log(`Restaurant Data for ${docSnap.id}:`, restaurantData);

          const menuSnapshot = await getDocs(collection(db, 'restaurants', docSnap.id, 'menu'));
          const menuCategories: MenuCategory[] = menuSnapshot.docs.map(menuDoc => {
            const menuData = menuDoc.data();
            return {
              category: menuData.category,
              items: menuData.items,
            } as MenuCategory;
          });
          console.log(`Menu for ${docSnap.id}:`, menuCategories);

          restaurantList.push({
            id: docSnap.id,
            name: restaurantData.name,
            menu: menuCategories,
          });
        }
        console.log('Restaurant List:', restaurantList);
        setRestaurants(restaurantList);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching restaurants:', error);
        setIsLoading(false);
        setToastMessage('Error fetching restaurants');
        setShowToast(true);
      }
    };

    fetchRestaurants();
  }, []);

  if (restaurants.length === 0 && !isLoading) {
    console.warn('No restaurants found.');
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Restaurants</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <IonList>
            {restaurants.map(restaurant => (
              <IonCard key={restaurant.id}>
                <IonCardHeader>
                  <IonCardTitle>{restaurant.name}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {restaurant.menu.length > 0 ? (
                    restaurant.menu.map((menuCategory, index) => (
                      <div key={index}>
                        <h3>{menuCategory.category}</h3>
                        <IonList>
                          {menuCategory.items && Object.entries(menuCategory.items).map(([key, item]: [string, MenuItem]) => (
                            <IonItem key={key}>
                              <IonLabel>
                                <h2>{item.name}</h2>
                                <p>{item.description}</p>
                                <p>Allergens: {item.allergens.join(', ')}</p>
                              </IonLabel>
                            </IonItem>
                          ))}
                        </IonList>
                      </div>
                    ))
                  ) : (
                    <p>No menu categories available.</p>
                  )}
                </IonCardContent>
              </IonCard>
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
