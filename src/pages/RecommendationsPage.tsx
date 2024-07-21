import React, { useEffect, useState } from 'react';
import { getDoc, collection, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import {
  IonPage, IonHeader, IonTitle, IonToolbar, IonContent, IonList,
  IonItem, IonLabel, IonLoading, IonToast, IonButton, IonImg
} from '@ionic/react';
import { getRecommendedMenus, fetchRestaurantMenu, fetchUserSavedMenuItems, MenuCategory } from '../services/recommendationService';
import { MenuItem, addMenuItemToSavedMenus } from '../services/menuService';

interface Restaurant {
  id: string;
  name: string;
  menu: MenuCategory[];
}

interface UserData {
  allergens: { [key: string]: boolean };
}

const RecommendationsPage: React.FC = () => {
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<{ id: string, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [restaurantMenus, setRestaurantMenus] = useState<{ [key: string]: Restaurant }>({});
  const [userMenuItems, setUserMenuItems] = useState<MenuItem[]>([]);
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
          console.log("Allergens:", allergens);
        }
      }
    };

    const fetchRecommendedMenus = async () => {
      setIsLoading(true);
      const recommendations = await getRecommendedMenus();
      console.log("Recommendations:", recommendations);
      setRecommendedRestaurants(recommendations);

      // Fetch user menu items
      const fetchedUserMenuItems = await fetchUserSavedMenuItems();
      setUserMenuItems(fetchedUserMenuItems);

      // Fetch menus for all recommended restaurants
      const menus: { [key: string]: Restaurant } = {};
      for (const restaurant of recommendations) {
        if (!menus[restaurant.id]) {
          const menu = await fetchRestaurantMenu(restaurant.id);
          menus[restaurant.id] = { id: restaurant.id, name: restaurant.name, menu };
        }
      }
      setRestaurantMenus(menus);

      setIsLoading(false);
    };

    fetchUserAllergens();
    fetchRecommendedMenus();
  }, []);

  const handleAddToPersonalizedMenu = async (restaurantId: string, item: MenuItem, category: string) => {
    try {
      await addMenuItemToSavedMenus(item, restaurantMenus[restaurantId].name);

      // Refresh user menu items after adding
      const updatedUserMenuItems = await fetchUserSavedMenuItems();
      setUserMenuItems(updatedUserMenuItems);

      setToastMessage('Item added to personalized menu');
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  const filterUserMenuItems = (restaurantId: string, items: MenuItem[]): MenuItem[] => {
    console.log("User Menu Items for Filtering:", userMenuItems);
    const filteredItems = items.filter(item => {
      const isInUserMenu = userMenuItems.some(userMenuItem => userMenuItem.id === item.id);
      console.log(`Item: ${item.name}, Is In User Menu: ${isInUserMenu}`);
      return !isInUserMenu;
    });
    console.log("Filtered Items:", filteredItems);
    return filteredItems;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Recommended Menus</IonTitle>
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
        ) : (
          <IonList>
            {recommendedRestaurants.map((restaurant) => (
              <div key={`${restaurant.id}-${restaurant.name}`}>
                <h2>{restaurant.name}</h2>
                {restaurantMenus[restaurant.id]?.menu?.map((menuCategory, index) => (
                  <div key={`${restaurant.id}-${menuCategory.category}-${index}`}>
                    <h3>{menuCategory.category}</h3>
                    <IonList>
                      {filterUserMenuItems(restaurant.id, menuCategory.items).map((item: MenuItem, itemIndex: number) => (
                        <IonItem key={`${restaurant.id}-${menuCategory.category}-${item.id}-${itemIndex}`}>
                          <IonImg src={item.imageUrl} alt={item.name} style={{ width: '100px', height: '100px' }} />
                          <IonLabel>
                            <h2>{item.name}</h2>
                            <p>{item.description}</p>
                            <p>
                              Allergens:{' '}
                              {item.allergens.map((allergen, index) => {
                                const isUserAllergen = userAllergens.includes(allergen.toLowerCase().trim());
                                console.log(`Allergen: ${allergen}, Is User Allergen: ${isUserAllergen}`);
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
                            onClick={() => handleAddToPersonalizedMenu(restaurant.id, item, menuCategory.category)}
                          >
                            Add to Personalized Menu
                          </IonButton>
                        </IonItem>
                      ))}
                    </IonList>
                  </div>
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

export default RecommendationsPage;
