import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonToast,
  IonImg,
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { fetchSavedMenus, MenuItem } from '../services/menuService';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import EditNotesModal from '../components/EditNotesModal';
import '../styles/SavedMenu.css';

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
  const { restaurantName: encodedRestaurantName } = useParams<{ restaurantName: string }>();
  const restaurantName = decodeURIComponent(encodedRestaurantName);
  const [restaurantThumbnail, setRestaurantThumbnail] = useState<string | null>(null);

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
          
          const savedMenus = await fetchSavedMenus();
          const savedMenu = savedMenus.find(menu => menu.restaurantName === restaurantName);
          if (savedMenu) {
            setMenuItems(savedMenu.dishes);
          }

          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            const allergens = Object.keys(userData.allergens)
              .filter(allergen => userData.allergens[allergen])
              .map(allergen => allergen.toLowerCase().trim());
            setUserAllergens(allergens);
          }

          const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
          preferredLocationsSnap.forEach((doc) => {
            const data = doc.data() as PreferredLocation;
            if (data.name === restaurantName) {
              setPreferredLocation(data);
            }
          });

          const querySnapshot = await getDocs(collection(db, 'restaurants'));
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name === restaurantName) {
            setRestaurantThumbnail(data.thumbnailUrl || null);
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
    setEditingItem(null); 
  };

  const truncateDescription = (description: string, maxLength: number) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const handleViewFullMenu = () => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`);
  };

  const handleDeleteItem = (itemToDelete: MenuItem) => {
    setMenuItems(menuItems.filter(item => item.id !== itemToDelete.id));
    setToastMessage(`${itemToDelete.name} removed from your saved menu.`);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Saved Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
  <IonButton className = 'secondary-button' expand="block" onClick={handleViewFullMenu}>
    View Full Menu
  </IonButton>
  

  {(preferredLocation || restaurantThumbnail) && (
    <div className="preferred-location-banner">
      <IonImg
        src={preferredLocation?.photoUrl || restaurantThumbnail!}
        alt={preferredLocation?.name || restaurantName}
        className = 'page-banner-img'
      />
      <h2>Your {preferredLocation?.name || restaurantName} Saved Menu</h2>
      <p>Preferred Location: {preferredLocation?.address || 'No specific location'}</p>
      <IonBadge color="primary">Menu Items: {menuItems.length}</IonBadge>
    </div>
  )}
  {userAllergens.length > 0 && (
    <p style={{ color: 'red' , textAlign:'center'}}>
      Menu items with allergens marked in red contain your allergens.
    </p>
  )}
        <IonList>
          {menuItems.map((item, index) => (
            <IonCard key={index} className="menu-item-card">
              <h2 className="menu-item-name">{item.name}</h2>
              <div className="menu-item-top-row">
                {item.imageUrl && (
                  <IonImg className="menu-thumbnail" src={item.imageUrl} alt={item.name} />
                )}
                <IonCardHeader>
                  <p className="menu-item-description">
                    {truncateDescription(item.description, 70)}
                  </p>
                  <p className="menu-item-allergens">
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
                  <p className="menu-item-note">Note: {item.note || 'None'}</p>
                </IonCardHeader>
              </div>
              <IonCardContent className = 'button-content'>
                <div className="menu-item-buttons-row">
                <IonButton className = 'secondary-button'  onClick={() => setEditingItem(item)}>
                    Edit Note
                  </IonButton>
                  <IonButton className = 'secondary-button delete' onClick={() => handleDeleteItem(item)}>
                    Delete
                  </IonButton>

                </div>
              </IonCardContent>
            </IonCard>
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
