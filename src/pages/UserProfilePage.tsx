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
  IonAccordionGroup,
  IonAccordion,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton
} from '@ionic/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';


interface MenuItem {
  name: string;
  description: string;
  allergens: string[];
}

interface MenuCategory {
  category: string;
  items: { [key: string]: MenuItem };
}

interface Restaurant {
  id: string;
  name: string;
  menu: MenuCategory[];
}

const RestaurantPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleEditProfile = () => {
    history.push('/edit-profile');
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'restaurants'));
        const restaurantList: Restaurant[] = [];
        for (const docSnap of querySnapshot.docs) {
          const restaurantData = docSnap.data() as { name: string };
          console.log(`Restaurant Data for ${docSnap.id}:`, restaurantData);

          const menuSnapshot = await getDocs(collection(db, 'restaurants', docSnap.id, 'menu'));
          const menuCategories: MenuCategory[] = menuSnapshot.docs.map(menuDoc => {
            const menuData = menuDoc.data();
            return {
              category: menuData.category,
              items: menuData.items,
            } as MenuCategory;
          });
          console.log(`Menu for ${docSnap.id}:`, menuCategories);

          restaurantList.push({
            id: docSnap.id,
            name: restaurantData.name,
            menu: menuCategories,
          });
        }
        console.log('Restaurant List:', restaurantList);
        setRestaurants(restaurantList);
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Restaurants</IonTitle>
        </IonToolbar>
      </IonHeader>
      <h2>Welcome to your profile!</h2>
        {/* Add more profile details here */}
        <IonButton expand="block" onClick={handleEditProfile}>
          Edit Profile
        </IonButton>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <IonList>
            <IonAccordionGroup>
              {restaurants.map(restaurant => (
                <IonAccordion key={restaurant.id} value={restaurant.id}>
                  <IonItem slot="header" color="light">
                    <IonLabel>{restaurant.name}</IonLabel>
                  </IonItem>
                  <div slot="content">
                    {restaurant.menu.map((menuCategory, index) => (
                      <IonAccordionGroup key={index}>
                        <IonAccordion value={menuCategory.category}>
                          <IonItem slot="header" color="medium">
                            <IonLabel>{menuCategory.category}</IonLabel>
                          </IonItem>
                          <div slot="content">
                            <IonList>
                              {Object.entries(menuCategory.items).map(([key, item]: [string, MenuItem]) => (
                                <IonItem key={key}>
                                  <IonLabel>
                                    <h2>{item.name}</h2>
                                    <p>{item.description}</p>
                                    <p>Allergens: {item.allergens.join(', ')}</p>
                                  </IonLabel>
                                </IonItem>
                              ))}
                            </IonList>
                          </div>
                        </IonAccordion>
                      </IonAccordionGroup>
                    ))}
                  </div>
                </IonAccordion>
              ))}
            </IonAccordionGroup>
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

export default RestaurantPage;
