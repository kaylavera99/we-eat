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
  IonImg,
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { fetchCreatedMenus, MenuItem, updateMenuItemInCreatedMenus, deleteMenuItemFromCreatedMenus, addMenuItemToCreatedMenus } from '../services/menuService';
import EditMenuItemModal from '../components/EditMenuItemModal';
import AddMenuItemModal from '../components/AddMenuItemModal';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { searchRestaurants } from '../services/searchService';
import '../styles/CreatedMenu..css'; // Import custom CSS for the page

interface UserData {
  allergens: { [key: string]: boolean };
}

interface PreferredLocation {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photoUrl?: string;
}

const CreatedMenuPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = useState<PreferredLocation | null>(null);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, 'users', userId);

          // Fetch created menus
          const createdMenus = await fetchCreatedMenus();
          const createdMenu = createdMenus.find(menu => menu.restaurantName === restaurantName);
          if (createdMenu) {
            setMenuItems(createdMenu.dishes);
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

          // Fetch preferred locations and their photos
          const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
          const locations: { [key: string]: PreferredLocation } = {};
          const locationPromises = preferredLocationsSnap.docs.map(async (doc) => {
            const location = doc.data() as PreferredLocation;
            if (location.name === restaurantName) {
              locations[doc.id] = location;

              // Fetch photo URL for the location
              const results = await searchRestaurants(
                `${location.coordinates.latitude},${location.coordinates.longitude}`,
                5,
                location.name,
                { lat: location.coordinates.latitude, lng: location.coordinates.longitude }
              );
              if (results.length > 0) {
                location.photoUrl = results[0].photoUrl;
                setPreferredLocation(location);
              }
            }
          });

          await Promise.all(locationPromises);
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

  const handleViewFullMenu = () => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`);
  };

  const handleAddMenuItem = async (newItem: MenuItem) => {
    try {
      await addMenuItemToCreatedMenus(newItem, restaurantName);
      setMenuItems([...menuItems, newItem]);
      setToastMessage('Item added successfully!');
      setShowToast(true);
      setShowAddMenuItemModal(false); // Close modal
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
        {preferredLocation && (
          <div className="preferred-location-banner">
            <IonImg src={preferredLocation.photoUrl} alt={preferredLocation.name} />
            <h2>{preferredLocation.name}</h2>
            <p>Preferred Location: {preferredLocation.address}</p>
            <IonBadge color="primary">Menu Items: {menuItems.length}</IonBadge>
          </div>
        )}
        <IonButton expand="block" color="secondary" onClick={() => setShowAddMenuItemModal(true)}>
          Add Menu Item
        </IonButton>
        {userAllergens.length > 0 && (
          <p style={{ color: 'red' }}>
            Menu items with allergens marked in red contain your allergens.
          </p>
        )}
        <IonList>
          {menuItems.map((item, index) => (
            <IonItem key={index}>
              {item.imageUrl && <IonImg src={item.imageUrl} alt={item.name} className="menu-img" />} {/* Display the image */}
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
        <AddMenuItemModal
          isOpen={showAddMenuItemModal}
          onClose={() => setShowAddMenuItemModal(false)}
          onAddMenuItem={handleAddMenuItem}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreatedMenuPage;
