import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonLoading, IonToast, IonButton } from '@ionic/react';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { fetchFullMenuFromRestaurants, fetchMenuData, MenuItem, SavedMenu } from '../services/menuService';
import { setPreferredLocation } from '../services/userService';
import { MenuCategory } from '../services/restaurantService';

const RestaurantPage: React.FC = () => {
  const { restaurantName, menuType } = useParams<{ restaurantName: string; menuType: string }>();
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [savedMenu, setSavedMenu] = useState<SavedMenu | null>(null);
  const [preferredLocation, setPreferredLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (menuType === 'full') {
          const categories = await fetchFullMenuFromRestaurants(restaurantName);
          setMenuCategories(categories);
        } else {
          const { savedMenus, createdMenus } = await fetchMenuData();
          const menu = (menuType === 'saved' ? savedMenus : createdMenus).find(m => m.restaurantName === restaurantName);
          setSavedMenu(menu || null);
          if (menuType === 'saved') {
            // Fetch preferred location if it's a saved menu
            const userPreferredLocation = savedMenus.find(m => m.restaurantName === restaurantName)?.restaurantName;
            setPreferredLocation(userPreferredLocation || null);
          }
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantName, menuType]);

  const handleViewFullMenu = () => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Menu ({menuType})</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <IonList>
            {menuType === 'full' ? (
              menuCategories.map(category => (
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
              ))
            ) : savedMenu ? (
              savedMenu.dishes.map((item: MenuItem) => (
                <IonItem key={item.id}>
                  <IonLabel>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <p>Allergens: {item.allergens.join(', ')}</p>
                    <p>{item.note}</p>
                  </IonLabel>
                </IonItem>
              ))
            ) : (
              <p>No menu available</p>
            )}
            {preferredLocation && <p>Preferred Location: {preferredLocation}</p>}
          </IonList>
        )}
        {menuType !== 'full' && <IonButton onClick={handleViewFullMenu}>View Full Menu</IonButton>}
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
