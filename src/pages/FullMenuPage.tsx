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
  IonButton
} from '@ionic/react';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useParams } from 'react-router-dom';

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

interface UserData {
  allergens: { [key: string]: boolean };
}

const FullMenuPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userAllergens, setUserAllergens] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserAllergens = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          const allergens = Object.keys(userData.allergens)
            .filter(allergen => userData.allergens[allergen])
            .map(allergen => allergen.toLowerCase().trim());
          setUserAllergens(allergens);
        }
      }
    };

    const fetchRestaurantMenu = async () => {
      setIsLoading(true);
      try {
        const restaurantDocRef = doc(db, 'restaurants', restaurantId);
        const restaurantDocSnap = await getDoc(restaurantDocRef);
        if (restaurantDocSnap.exists()) {
          const restaurantData = restaurantDocSnap.data() as { name: string };
          const menuSnapshot = await getDocs(collection(db, 'restaurants', restaurantId, 'menu'));
          const menuCategories: MenuCategory[] = menuSnapshot.docs.map(menuDoc => {
            const menuData = menuDoc.data();
            return {
              category: menuData.category,
              items: menuData.items,
            } as MenuCategory;
          });
          setRestaurant({
            id: restaurantId,
            name: restaurantData.name,
            menu: menuCategories,
          });
        }
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchUserAllergens();
    fetchRestaurantMenu();
  }, [restaurantId]);

  const handleAddToPersonalizedMenu = async (item: MenuItem, category: string) => {
    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const preferredLocation = userData.preferredLocations[restaurant?.name || ''];
          const updatedItems = { ...preferredLocation.menu[category].items, [item.name]: item };

          await updateDoc(userDocRef, {
            [`preferredLocations.${restaurant?.name}.menu.${category}.items`]: updatedItems
          });

          setToastMessage('Item added to personalized menu');
          setShowToast(true);
        }
      }
    } catch (error: any) {
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurant?.name || 'Menu'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {userAllergens.length > 0 && (
          <p style={{ color: 'red' }}>
            Menu items with allergens marked in red contain your allergens.
          </p>
        )}
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : restaurant ? (
          <IonList>
            {restaurant.menu.map((menuCategory, index) => (
              <div key={index}>
                <h3>{menuCategory.category}</h3>
                <IonList>
                  {Object.entries(menuCategory.items).map(([key, item]: [string, MenuItem]) => (
                    <IonItem key={key}>
                      <IonLabel>
                        <h2>{item.name}</h2>
                        <p>{item.description}</p>
                        <p>
                          Allergens:{' '}
                          {item.allergens.map((allergen, index) => {
                            const isUserAllergen = userAllergens.includes(allergen.toLowerCase().trim());
                            return (
                              <span
                                key={index}
                                style={{ color: isUserAllergen ? 'red' : 'black' }}
                              >
                                {allergen}{index < item.allergens.length - 1 ? ', ' : ''}
                              </span>
                            );
                          })}
                        </p>
                      </IonLabel>
                      <IonButton
                        onClick={() => handleAddToPersonalizedMenu(item, menuCategory.category)}
                      >
                        Add to Personalized Menu
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            ))}
          </IonList>
        ) : (
          <p>No menu available.</p>
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

export default FullMenuPage;
