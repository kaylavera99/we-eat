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
  IonThumbnail,
  IonImg,
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { fetchSavedMenus, MenuItem } from '../services/menuService';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import EditNotesModal from '../components/EditNotesModal';

interface UserData {
  allergens: { [key: string]: boolean };
}

interface PreferredLocation {
  name: string;
  address: string;
  coordinates: any;
  photoUrl?: string;
}

const SavedMenuPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = useState<PreferredLocation | null>(null);
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, 'users', userId);
          
          // Fetch saved menus
          const savedMenus = await fetchSavedMenus();
          const savedMenu = savedMenus.find(menu => menu.restaurantName === restaurantName);
          if (savedMenu) {
            setMenuItems(savedMenu.dishes);
          }

          // Fetch user allergens
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            const allergens = Object.keys(userData.allergens)
              .filter(allergen => userData.allergens[allergen])
              .map(allergen => allergen.toLowerCase().trim());
            setUserAllergens(allergens);
          }

          // Fetch preferred locations
          const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
          preferredLocationsSnap.forEach((doc) => {
            const data = doc.data() as PreferredLocation;
            if (data.name === restaurantName) {
              setPreferredLocation(data);
            }
          });
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

  const handleViewFullMenu = () => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Saved Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={handleViewFullMenu}>
          View Full Menu
        </IonButton>
        {preferredLocation && (
          <div className="preferred-location-banner">
            <IonImg src={preferredLocation.photoUrl} alt={preferredLocation.name} />
            <h2>{preferredLocation.name}</h2>
            <p>Preferred Location: {preferredLocation.address}</p>
            <IonBadge color="primary">Menu Items: {menuItems.length}</IonBadge>
          </div>
        )}
        {userAllergens.length > 0 && (
          <p style={{ color: 'red' }}>
            Menu items with allergens marked in red contain your allergens.
          </p>
        )}
        <IonList>
          {menuItems.map((item, index) => (
            <IonItem key={index}>
              {item.imageUrl && (
                <IonThumbnail slot="start">
                  <img src={item.imageUrl} alt={item.name} />
                </IonThumbnail>
              )}
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
