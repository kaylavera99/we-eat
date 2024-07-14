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
import { fetchSavedMenus, MenuItem } from '../services/menuService';
import EditNotesModal from '../components/EditNotesModal';

const SavedMenuPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const savedMenus = await fetchSavedMenus();
        const savedMenu = savedMenus.find(menu => menu.restaurantName === restaurantName);
        if (savedMenu) {
          setMenuItems(savedMenu.dishes);
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      }
    };
    fetchData();
  }, [restaurantName]);

  const handleSaveNotes = (updatedItem: MenuItem) => {
    setMenuItems(menuItems.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    setToastMessage('Note updated successfully!');
    setShowToast(true);
    setEditingItem(null); // Close modal
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Saved Menu</IonTitle>
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
              <IonButton onClick={() => setEditingItem(item)}>Edit Note</IonButton>
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
          <EditNotesModal
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSaveNotes={handleSaveNotes}
            initialItem={editingItem}
            restaurantName={restaurantName}
            isCreatedMenu={false}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default SavedMenuPage;
