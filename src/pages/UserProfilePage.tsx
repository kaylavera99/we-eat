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
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';

interface MenuItem {
  name: string;
  description: string;
  allergens: string[];
  note?: string;
}

interface MenuCategory {
  category: string;
  items: { [key: string]: MenuItem };
}

interface CreatedMenu {
  restaurantName: string;
  items: {
    [key: string]: MenuCategory;
  };
}

interface PreferredLocation {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  name: string;
}

interface UserData {
  name: string;
  email: string;
  allergens: {
    [key: string]: boolean;
  };
  preferredLocations: {
    [key: string]: PreferredLocation;
  };
  createdMenus: {
    [key: string]: CreatedMenu;
  };
}

const UserProfilePage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleEditProfile = () => {
    history.push('/edit-profile');
  };

  const handleViewPersonalizedMenus = () => {
    history.push('/personalized-menu');
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userDocData = userDocSnap.data() || {};
            const userData: UserData = {
              name: userDocData.name,
              email: userDocData.email,
              allergens: userDocData.allergens || {},
              preferredLocations: {},
              createdMenus: {},
            };

            console.log('User document data:', userDocData);

            // Fetch Preferred Locations
            const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
            preferredLocationsSnap.forEach((doc) => {
              userData.preferredLocations[doc.id] = doc.data() as PreferredLocation;
            });

            // Fetch Created Menus
            const createdMenusSnap = await getDocs(collection(userDocRef, 'createdMenus'));
            createdMenusSnap.forEach((doc) => {
              userData.createdMenus[doc.id] = doc.data() as CreatedMenu;
            });

            console.log('Processed user data:', userData);
            setUserData(userData);
          } else {
            console.error('No such document!');
            setToastMessage('No such document!');
            setShowToast(true);
          }
        } else {
          console.error('User not authenticated');
          setToastMessage('User not authenticated');
          setShowToast(true);
        }
      } catch (error: any) {
        setToastMessage(error.message);
        setShowToast(true);
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>User Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Welcome to your profile!</h2>
        <IonButton expand="block" onClick={handleEditProfile}>
          Edit Profile
        </IonButton>
        <IonButton expand="block" onClick={handleViewPersonalizedMenus}>
          View Personalized Menus
        </IonButton>
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : userData ? (
          <IonList>
            {Object.keys(userData.preferredLocations).length > 0 ? (
              <div>
                <h3>Preferred Locations:</h3>
                {Object.entries(userData.preferredLocations).map(([key, location]) => (
                  <IonCard key={key}>
                    <IonCardHeader>
                      <IonCardTitle>{location.name}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p>{location.address}</p>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            ) : (
              <p>No preferred locations found.</p>
            )}
          </IonList>
        ) : (
          <p>Loading user data failed. Please try again later.</p>
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

export default UserProfilePage;
