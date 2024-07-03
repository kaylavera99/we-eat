// src/pages/PersonalizedMenuPage.tsx

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
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface MenuItem {
  name: string;
  description: string;
  allergens: string[];
}

interface MenuCategory {
  category: string;
  items: { [key: string]: MenuItem };
}

interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface Restaurant {
  id: string;
  name: string;
  locations: Location[];
  menu: MenuCategory[];
}

const PersonalizedMenuPage: React.FC = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchPreferredLocationMenu = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const { restaurantId, location } = userData.preferredLocation;
            console.log('Preferred Location:', restaurantId, location); // Debug: Check preferred location

            const restaurantDocRef = doc(db, 'restaurants', restaurantId);
            const restaurantDocSnap = await getDoc(restaurantDocRef);
            if (restaurantDocSnap.exists()) {
              const restaurantData = restaurantDocSnap.data() as { name: string };
              console.log(`Restaurant Data for ${restaurantId}:`, restaurantData);

              const menuSnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'menu'));
              const menuCategories: MenuCategory[] = menuSnapshot.docs.map(menuDoc => {
                const menuData = menuDoc.data();
                return {
                  category: menuData.category,
                  items: menuData.items,
                } as MenuCategory;
              });

              console.log('Menu Items:', menuCategories); // Debug: Check menu items
              setRestaurant({
                id: restaurantId,
                name: restaurantData.name,
                locations: [location],
                menu: menuCategories,
              });
            }
          }
        }
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchPreferredLocationMenu();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Personalized Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : restaurant ? (
          <IonList>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{restaurant.name} - {restaurant.locations[0].address}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {restaurant.menu.map((menuCategory, index) => (
                  <div key={index}>
                    <h3>{menuCategory.category}</h3>
                    <IonList>
                      {Object.entries(menuCategory.items).map(([key, item]: [string, MenuItem]) => (
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
                ))}
              </IonCardContent>
            </IonCard>
          </IonList>
        ) : (
          <p>No preferred restaurant set.</p>
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

export default PersonalizedMenuPage;
