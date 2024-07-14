import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { fetchCreatedMenus, MenuItem, updateMenuItemInCreatedMenus, deleteMenuItemFromCreatedMenus } from '../services/menuService';
import EditMenuItemModal from '../components/EditMenuItemModal';

const CreatedMenuPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const createdMenus = await fetchCreatedMenus();
        const createdMenu = createdMenus.find(menu => menu.restaurantName === restaurantName);
        if (createdMenu) {
          setMenuItems(createdMenu.dishes);
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      }
    };
    fetchData();
  }, [restaurantName]);

  const handleSaveItem = async (updatedItem: MenuItem) => {
    try {
      await updateMenuItemInCreatedMenus(updatedItem, restaurantName, updatedItem.id!);
      setMenuItems(menuItems.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      setToastMessage('Item updated successfully!');
      setShowToast(true);
      setEditingItem(null); // Close modal
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMenuItemFromCreatedMenus(itemId, restaurantName);
      setMenuItems(menuItems.filter(item => item.id !== itemId));
      setToastMessage('Item deleted successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Created Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          {menuItems.map((item, index) => (
            <IonItem key={index}>
              <IonLabel>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <p>Allergens: {item.allergens.join(', ')}</p>
                <p>Note: {item.note}</p>
              </IonLabel>
              <IonButton onClick={() => setEditingItem(item)}>Edit Item</IonButton>
              <IonButton color="danger" onClick={() => handleDeleteItem(item.id!)}>
                Delete Item
              </IonButton>
            </IonItem>
          ))}
        </IonList>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
        {editingItem && (
          <EditMenuItemModal
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSaveItem={handleSaveItem}
            initialItem={editingItem}
            restaurantName={restaurantName}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default CreatedMenuPage;
