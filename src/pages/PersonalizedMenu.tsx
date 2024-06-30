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

interface Restaurant {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

const PersonalizedMenuPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchPersonalizedMenus = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const userAllergens = userData.allergens || {};
            console.log('User Allergens:', userAllergens); // Debug: Check user allergens

            const restaurantQuery = await getDocs(collection(db, 'restaurants'));
            const restaurantList: Restaurant[] = [];

            for (const restaurantDoc of restaurantQuery.docs) {
              const restaurantData = restaurantDoc.data() as { name: string };
              console.log(`Restaurant Data for ${restaurantDoc.id}:`, restaurantData);

              const menuQuery = await getDocs(collection(db, 'restaurants', restaurantDoc.id, 'menu'));
              let menuItems: MenuItem[] = [];

              for (const menuDoc of menuQuery.docs) {
                const menuData = menuDoc.data();
                const items = menuData.items;

                for (const key in items) {
                  if (items.hasOwnProperty(key)) {
                    const menuItem = items[key] as MenuItem;
                    const itemAllergens = menuItem.allergens || [];
                    
                    // Ensure itemAllergens is an array
                    if (Array.isArray(itemAllergens)) {
                      const hasAllergens = itemAllergens.some(allergen => userAllergens[allergen]);
                      if (!hasAllergens) {
                        menuItems.push(menuItem);
                      }
                    } else {
                      console.warn(`Item allergens for ${menuItem.name} is not an array:`, itemAllergens);
                    }
                  }
                }
              }

              console.log('Menu Items for', restaurantData.name, ':', menuItems); // Debug: Check menu items
              if (menuItems.length > 0) {
                restaurantList.push({
                  id: restaurantDoc.id,
                  name: restaurantData.name,
                  menuItems: menuItems
                });
              }
            }

            console.log('Restaurants:', restaurantList); // Debug: Check restaurants list
            setRestaurants(restaurantList);
          }
        }
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchPersonalizedMenus();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Personalized Menus</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <IonList>
            {restaurants.length > 0 ? (
              restaurants.map(restaurant => (
                <IonCard key={restaurant.id}>
                  <IonCardHeader>
                    <IonCardTitle>{restaurant.name}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      {restaurant.menuItems.map((menuItem, index) => (
                        <IonItem key={index}>
                          <IonLabel>
                            <h2>{menuItem.name}</h2>
                            <p>{menuItem.description}</p>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  </IonCardContent>
                </IonCard>
              ))
            ) : (
              <p>No restaurants found</p>
            )}
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

export default PersonalizedMenuPage;
