import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonLoading,
  IonToast,
  IonImg,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { doc, getDocs, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import '../styles/PersonalizedMenu.css';

interface PreferredLocation {
  name: string;
  address: string;
  coordinates: any;
  photoUrl?: string;
}

interface Menu {
  restaurantName: string;
  dishes: any[];
  isCreated: boolean;
  photoUrl?: string;
  thumbnailUrl?: string;
}

const PersonalizedMenuPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<{ [key: string]: PreferredLocation }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, 'users', userId);
  
          // Fetch saved menus
          const savedMenusSnap = await getDocs(collection(userDocRef, 'savedMenus'));
          const savedMenus: Menu[] = [];
          for (const doc of savedMenusSnap.docs) {
            const data = doc.data() as Menu;
            const q = query(collection(db, 'restaurants'), where("name", "==", decodeURIComponent(data.restaurantName)));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
              const restaurantData = doc.data();
              savedMenus.push({
                ...data,
                isCreated: false,
                photoUrl: restaurantData.thumbnailUrl || restaurantData.thumbnail,
              });
            });
          }
  
          // Fetch created menus
          const createdMenusSnap = await getDocs(collection(userDocRef, 'createdMenus'));
          const createdMenus: Menu[] = [];
          createdMenusSnap.forEach((doc) => {
            const data = doc.data() as Menu;
            createdMenus.push({
              ...data,
              isCreated: true,
              photoUrl: data.thumbnailUrl, // Ensure the thumbnailUrl is used
            });
          });
  
          setMenus([...savedMenus, ...createdMenus]);
  
          // Fetch preferred locations
          const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
          const preferredLocations: { [key: string]: PreferredLocation } = {};
          preferredLocationsSnap.forEach((doc) => {
            const data = doc.data();
            preferredLocations[decodeURIComponent(data.name)] = { // Key by restaurant name
              name: decodeURIComponent(data.name),
              address: data.address,
              coordinates: data.coordinates,
              photoUrl: data.photoUrl,
            };
          });
          setPreferredLocations(preferredLocations);
  
          console.log("Fetched Preferred Locations:", preferredLocations);
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const handleViewMenu = (restaurantName: string, isCreatedMenu: boolean) => {
    const path = isCreatedMenu ? `/restaurant/${encodeURIComponent(restaurantName)}/created` : `/restaurant/${encodeURIComponent(restaurantName)}/saved`;
    history.push(path);
  };

  const handleGetDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(url, '_blank');
  };

  const handleCreateMenu = () => {
    history.push('/create-menu');
  };

  const renderMenuCard = (menu: Menu) => {
    const restaurant = preferredLocations[decodeURIComponent(menu.restaurantName)];
    console.log(restaurant);
  
    return (
      <IonCard key={menu.restaurantName}>
        <IonCardHeader>
          {menu.photoUrl && (
            <IonImg src={menu.photoUrl} alt={menu.restaurantName} className="restaurant-thumbnail" />
          )}
          <IonCardTitle>{menu.restaurantName}</IonCardTitle>
          <p>Preferred Location: {restaurant ? restaurant.address : 'N/A'}</p>
        </IonCardHeader>
        <IonCardContent>
          <IonButton onClick={() => handleViewMenu(menu.restaurantName, menu.isCreated)}>
            View Menu
          </IonButton>
          {restaurant && (
            <IonButton onClick={() => handleGetDirections(restaurant.address)}>
              Directions
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>
    );
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
          <>
            <IonButton expand="block" onClick={handleCreateMenu} style={{ marginBottom: '20px' }}>
              Create a Menu
            </IonButton>
            <IonList>
              <h2>Menus</h2>
              {menus.map((menu) => renderMenuCard(menu))}
            </IonList>
          </>
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

export default PersonalizedMenuPage;
