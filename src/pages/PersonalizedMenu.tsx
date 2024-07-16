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
import {
  fetchMenuData,
  SavedMenu,
} from '../services/menuService';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import '../styles/PersonalizedMenu.css'; // Import custom CSS for the page

interface Restaurant {
  name: string;
  thumbnailUrl: string;
  address: string;
}

interface PreferredLocation {
  name: string;
  address: string;
  coordinates: any;
}

const PersonalizedMenuPage: React.FC = () => {
  const [savedMenus, setSavedMenus] = useState<SavedMenu[]>([]);
  const [createdMenus, setCreatedMenus] = useState<SavedMenu[]>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<{ [key: string]: Restaurant }>({});
  const [preferredLocations, setPreferredLocations] = useState<{ [key: string]: PreferredLocation }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { savedMenus, createdMenus } = await fetchMenuData();
        setSavedMenus(savedMenus);
        setCreatedMenus(createdMenus);

        const restaurantNames = new Set(savedMenus.map(menu => menu.restaurantName).concat(createdMenus.map(menu => menu.restaurantName)));
        const restaurantDetails: { [key: string]: Restaurant } = {};

        for (const name of restaurantNames) {
          const q = query(collection(db, 'restaurants'), where("name", "==", name));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            restaurantDetails[name] = {
              name,
              thumbnailUrl: data.thumbnailUrl || '',
              address: data.address || '',
            };
          });

          if (!restaurantDetails[name]) {
            console.log(`No data found for restaurant: ${name}`);
          }
        }

        setRestaurantDetails(restaurantDetails);

        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
          const preferredLocations: { [key: string]: PreferredLocation } = {};

          preferredLocationsSnap.forEach((doc) => {
            const data = doc.data();
            preferredLocations[doc.id] = {
              name: data.name,
              address: data.address,
              coordinates: data.coordinates,
            };
          });

          setPreferredLocations(preferredLocations);
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

  const handleViewSavedMenu = (restaurantName: string) => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/saved`);
  };

  const handleViewCreatedMenu = (restaurantName: string) => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/created`);
  };

  const handleViewFullMenu = (restaurantName: string) => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`);
  };

  const renderMenuCard = (menu: SavedMenu, isCreatedMenu: boolean) => {
    const restaurant = restaurantDetails[menu.restaurantName];
    const preferredLocation = Object.values(preferredLocations).find(
      (location) => location.name === menu.restaurantName
    );

    return (
      <IonCard key={menu.restaurantName}>
        <IonCardHeader>
          {restaurant?.thumbnailUrl && (
            <IonImg src={restaurant.thumbnailUrl} alt={restaurant.name} className="restaurant-thumbnail" />
          )}
          <IonCardTitle>{restaurant?.name}</IonCardTitle>
          <p>Preferred Location: {preferredLocation ? preferredLocation.address : 'N/A'}</p>
        </IonCardHeader>
        <IonCardContent>
          {isCreatedMenu ? (
            <IonButton onClick={() => handleViewCreatedMenu(menu.restaurantName)}>
              View Created Menu
            </IonButton>
          ) : (
            <IonButton onClick={() => handleViewSavedMenu(menu.restaurantName)}>
              View Saved Menu
            </IonButton>
          )}
          <IonButton onClick={() => handleViewFullMenu(menu.restaurantName)}>
            View Full Menu
          </IonButton>
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
          <IonList>
            <h2>Saved Menus</h2>
            {savedMenus.map((menu) => renderMenuCard(menu, false))}

            <h2>Created Menus</h2>
            {createdMenus.map((menu) => renderMenuCard(menu, true))}
          </IonList>
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
