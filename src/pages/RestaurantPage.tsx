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
  IonLoading,
  IonToast,
  IonButton,
  IonImg,
  IonBadge
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { fetchFullMenuFromRestaurants, MenuCategory, MenuItem } from '../services/restaurantService';
import { addMenuItemToSavedMenus } from '../services/menuService';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const RestaurantPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [restaurantDetails, setRestaurantDetails] = useState<{
    name: string;
    thumbnailUrl: string;
    preferredLocation: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fullMenu = await fetchFullMenuFromRestaurants(restaurantName);
        setMenuCategories(fullMenu);

        const userDocRef = doc(db, 'users', auth.currentUser?.uid!);
        const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
        let preferredLocation = '';

        preferredLocationsSnap.forEach((doc) => {
          if (doc.data().name === restaurantName) {
            preferredLocation = doc.data().address;
            console.log("Location", preferredLocation);
            
          }
        });



        const restaurantDocRef = doc(db, 'restaurants', "McDonald's");
        console.log("rest name", restaurantName)
        console.log("RestaurantDocRef: ", restaurantDocRef)
        const restaurantDocSnap = await getDoc(restaurantDocRef);
        console.log('Restaurant Doc Snap:', restaurantDocSnap);

        if (restaurantDocSnap.exists()) {
          const data = restaurantDocSnap.data();
          setRestaurantDetails({
            name: data.name,
            thumbnailUrl: data.thumbnailUrl,
            preferredLocation,
          });
          console.log('Restaurant Details:', {
            name: data.name,
            thumbnailUrl: data.thumbnailUrl,
            preferredLocation,
          });
        } else {
          console.log(`No data found for restaurant: ${restaurantName}`);
        }
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
          {item.imageUrl && <IonImg src={item.imageUrl} alt={item.name} />}
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
          <IonTitle>{restaurantDetails?.name || restaurantName} Full Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <div>
            {restaurantDetails && (
              <div className="restaurant-banner">
                <IonImg src={restaurantDetails.thumbnailUrl} alt={restaurantDetails.name} />
                <h2>{restaurantDetails.name}</h2>
                <p>Preferred Location: {restaurantDetails.preferredLocation}</p>
                <IonBadge color="primary">Menu Items: {menuCategories.reduce((acc, category) => acc + category.items.length, 0)}</IonBadge>
              </div>
            )}
            {renderMenuCategories(menuCategories)}
          </div>
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
