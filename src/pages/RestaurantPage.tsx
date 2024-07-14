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
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { fetchFullMenuFromRestaurants, MenuCategory, MenuItem } from '../services/restaurantService';
import { addMenuItemToSavedMenus } from '../services/menuService';

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
        console.log("Fetching menu for:", restaurantName);
        const fullMenu = await fetchFullMenuFromRestaurants(restaurantName);
        setMenuCategories(fullMenu);
        console.log("Menu categories set:", fullMenu);
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantName]);

  const handleAddToSavedMenu = async (item: MenuItem) => {
    try {
      await addMenuItemToSavedMenus(item, restaurantName);
      setToastMessage('Menu item added to saved menu successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage(`Error adding menu item: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, index) => (
      <IonCard key={index}>
        <IonCardHeader>
          <IonCardTitle>{item.name}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>{item.description}</p>
          <p>Allergens: {item.allergens.join(', ')}</p>
          <IonButton onClick={() => handleAddToSavedMenu(item)}>Add to Saved Menu</IonButton>
        </IonCardContent>
      </IonCard>
    ));
  };

  const renderMenuCategories = (categories: MenuCategory[]) => {
    return categories.map((category, index) => (
      <div key={index}>
        <h5>{category.category}</h5>
        <IonList>{renderMenuItems(category.items)}</IonList>
      </div>
    ));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Full Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          renderMenuCategories(menuCategories)
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
