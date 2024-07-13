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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { fetchMenuData, SavedMenu, MenuItem, addMenuItemToCreatedMenus, deleteMenuItemFromCreatedMenus, deleteMenuItemFromSavedMenus, updateNotesInSavedMenus, updateMenuItemInCreatedMenus } from '../services/menuService';
import AddMenuItemModal from '../components/AddMenuItemModal';
import EditNotesModal from '../components/EditNotesModal';

const PersonalizedMenuPage: React.FC = () => {
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [createdMenus, setCreatedMenus] = useState<SavedMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentRestaurantName, setCurrentRestaurantName] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingNoteItem, setEditingNoteItem] = useState<MenuItem | null>(null);
  const history = useHistory();

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
      if (editingItem) {
        await updateMenuItemInCreatedMenus(item, currentRestaurantName, editingItem.id!);
      } else {
        await addMenuItemToCreatedMenus(item, currentRestaurantName);
      }

      const { createdMenus } = await fetchMenuData();
      setCreatedMenus(createdMenus);
      setToastMessage(editingItem ? 'Menu item updated successfully!' : 'Menu item added successfully!');
      setShowToast(true);
      setModalOpen(false);
      setEditingItem(null); // Reset editing item
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleEditNote = async (itemId: string, newNotes: string, restaurantName: string) => {
    try {
      await updateNotesInSavedMenus(itemId, newNotes, restaurantName);
      const { savedMenus } = await fetchMenuData();
      setSavedMenus(savedMenus);
      setToastMessage('Note updated successfully!');
      setShowToast(true);
      setNoteModalOpen(false);
      setEditingNoteItem(null); // Reset editing note item
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleDeleteMenuItem = async (item: MenuItem, restaurantName: string, isCreatedMenu: boolean) => {
    try {
      if (isCreatedMenu) {
        await deleteMenuItemFromCreatedMenus(item, restaurantName);
        const { createdMenus } = await fetchMenuData();
        setCreatedMenus(createdMenus);
      } else {
        await deleteMenuItemFromSavedMenus(item, restaurantName);
        const { savedMenus } = await fetchMenuData();
        setSavedMenus(savedMenus);
      }
      setToastMessage('Menu item deleted successfully!');
      setShowToast(true);
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const renderMenuItems = (items: MenuItem[], restaurantName: string, isCreatedMenu: boolean) => {
    return items.map((item, index) => (
      <IonItemSliding key={index}>
        <IonItem>
          <IonLabel>
            <h2>{item.name}</h2>
            <p>{item.description}</p>
            <p>Allergens: {item.allergens.join(', ')}</p>
            <p>Note: {item.note}</p>
          </IonLabel>
        </IonItem>
        <IonItemOptions side="end">
          {isCreatedMenu && (
            <>
              <IonItemOption color="primary" onClick={() => { setCurrentRestaurantName(restaurantName); setEditingItem(item); setModalOpen(true); }}>Edit</IonItemOption>
              <IonItemOption color="danger" onClick={() => handleDeleteMenuItem(item, restaurantName, true)}>Delete</IonItemOption>
            </>
          )}
          {!isCreatedMenu && (
            <>
              <IonItemOption color="primary" onClick={() => { setCurrentRestaurantName(restaurantName); setEditingNoteItem(item); setNoteModalOpen(true); }}>Edit Note</IonItemOption>
              <IonItemOption color="danger" onClick={() => handleDeleteMenuItem(item, restaurantName, false)}>Delete</IonItemOption>
            </>
          )}
        </IonItemOptions>
      </IonItemSliding>
    ));
  };

  const renderMenuCategories = (dishes: MenuItem[], restaurantName: string, isCreatedMenu: boolean) => {
    const categories = dishes.reduce((acc: { [key: string]: MenuItem[] }, dish) => {
      if (!acc[dish.category]) acc[dish.category] = [];
      acc[dish.category].push(dish);
      return acc;
    }, {});

    return Object.entries(categories).map(([category, items]) => (
      <div key={category}>
        <h5>{category}</h5>
        <IonList>
          {renderMenuItems(items, restaurantName, isCreatedMenu)}
        </IonList>
      </div>
    ));
  };
  const handleViewSavedMenu = (restaurantName: string) => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/saved`);
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
                    {renderMenuCategories(menu.dishes, menu.restaurantName, false)}
                    <IonButton onClick={() =>  handleViewSavedMenu(menu.restaurantName)}>
                      View Full Menu
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>

            <h2>Created Menus</h2>
            <IonList>
              {createdMenus.map((createdMenu, index) => (
                <IonCard key={index}>
                  <IonCardHeader>
                    <IonCardTitle>{createdMenu.restaurantName}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {renderMenuCategories(createdMenu.dishes, createdMenu.restaurantName, true)}
                    <IonButton onClick={() => { setCurrentRestaurantName(createdMenu.restaurantName); setEditingItem(null); setModalOpen(true); }}>
                      Add Item
                    </IonButton>
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
          initialItem={editingItem || undefined}
        />
        <EditNotesModal
          isOpen={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          onSaveNotes={handleEditNote}
          initialItem={editingNoteItem || undefined}
          restaurantName={currentRestaurantName}
        />
      </IonContent>
    </IonPage>
  );
};

export default PersonalizedMenuPage;
