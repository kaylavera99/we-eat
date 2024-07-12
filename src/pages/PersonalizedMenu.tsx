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
  IonButton,
} from '@ionic/react';
import { fetchMenuData, SavedMenu, MenuItem, addMenuItemToCreatedMenus } from '../services/menuService';
import AddMenuItemModal from '../components/AddMenuItemModal';

const PersonalizedMenuPage: React.FC = () => {
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [createdMenus, setCreatedMenus] = useState<SavedMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRestaurantName, setCurrentRestaurantName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { savedMenus, createdMenus } = await fetchMenuData();
        setSavedMenus(savedMenus);
        setCreatedMenus(createdMenus);
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddMenuItem = async (item: MenuItem) => {
    try {
      await addMenuItemToCreatedMenus(item, currentRestaurantName);
      const { createdMenus } = await fetchMenuData();
      setCreatedMenus(createdMenus);
      setToastMessage('Menu item added successfully!');
      setShowToast(true);
      setModalOpen(false);
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, index) => (
      <IonItem key={index}>
        <IonLabel>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <p>Allergens: {item.allergens.join(', ')}</p>
          <p>{item.note}</p>
        </IonLabel>
      </IonItem>
    ));
  };

  const renderMenuCategories = (dishes: MenuItem[]) => {
    const categories = dishes.reduce((acc: { [key: string]: MenuItem[] }, dish) => {
      if (!acc[dish.category]) acc[dish.category] = [];
      acc[dish.category].push(dish);
      return acc;
    }, {});

    return Object.entries(categories).map(([category, items]) => (
      <div key={category}>
        <h5>{category}</h5>
        {renderMenuItems(items)}
      </div>
    ));
  };

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
        ) : (
          <div>
            <h2>Saved Menus</h2>
            <IonList>
              {savedMenus.map((menu, index) => (
                <IonCard key={index}>
                  <IonCardHeader>
                    <IonCardTitle>{menu.restaurantName}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {renderMenuCategories(menu.dishes)}
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
            <h2>Created Menus</h2>
            <IonList>
              {createdMenus.map((menu, index) => (
                <IonCard key={index}>
                  <IonCardHeader>
                    <IonCardTitle>{menu.restaurantName}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {renderMenuCategories(menu.dishes)}
                    <IonButton onClick={() => { setCurrentRestaurantName(menu.restaurantName); setModalOpen(true); }}>Add Item</IonButton>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          </div>
        )}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
        <AddMenuItemModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onAddMenuItem={handleAddMenuItem}
          category="" // Empty category, user will specify in the modal
        />
      </IonContent>
    </IonPage>
  );
};

export default PersonalizedMenuPage;
