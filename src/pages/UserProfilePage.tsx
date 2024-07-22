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
  IonAvatar,
  IonImg,
  IonIcon
} from '@ionic/react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';
import { searchRestaurants } from '../services/searchService';
import '../styles/UserProfile.css';
import 'ionicons/icons';
import { locationOutline } from 'ionicons/icons';

interface PreferredLocation {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  name: string;
  photoUrl?: string;
}

interface UserData {
  name: string;
  lastName: string;
  email: string;
  allergens: {
    [key: string]: boolean;
  };
  preferredLocations: {
    [key: string]: PreferredLocation;
  };
  createdMenus: {
    [key: string]: any; // Placeholder for created menus structure
  };
  profileImageUrl?: string;
  address: string;
}

const UserProfilePage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [restaurantPhotos, setRestaurantPhotos] = useState<{ [key: string]: string }>({});
  const history = useHistory();

  const handleEditProfile = () => {
    history.push('/edit-profile');
  };

  const handleViewPersonalizedMenus = () => {
    history.push('/personalized-menu');
  };

  const handleNavigateCreate = () => {
    history.push('/create');
  };
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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

            const allergens = userDocData.allergens || {};

            console.log(allergens);
            const userData: UserData = {
              name: userDocData.firstName,
              email: userDocData.email,
              allergens: userDocData.allergens || {},
              preferredLocations: {},
              createdMenus: {},
              profileImageUrl: userDocData.profileImageUrl || '',
              address: userDocData.address,
              lastName: userDocData.lastName
            };

            console.log('User document data:', userDocData);
            console.log(userData.allergens)

            // Fetch Preferred Locations
            const preferredLocationsSnap = await getDocs(collection(userDocRef, 'preferredLocations'));
            const locations: { [key: string]: PreferredLocation } = {};
            const locationPromises = preferredLocationsSnap.docs.map(async (doc) => {
              const location = doc.data() as PreferredLocation;
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
                setRestaurantPhotos((prevPhotos) => ({
                  ...prevPhotos,
                  [location.name]: results[0].photoUrl,
                }));
              }
            });

            await Promise.all(locationPromises);

            userData.preferredLocations = locations;

            // Fetch Created Menus
            const createdMenusSnap = await getDocs(collection(userDocRef, 'createdMenus'));
            createdMenusSnap.forEach((doc) => {
              userData.createdMenus[doc.id] = doc.data();
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

  const renderAllergens = () => {
    if (userData && userData.allergens) {
      console.log(userData.allergens);
      return Object.entries(userData.allergens)
        .filter(([key, value]) => value) // Only include allergens with true values
        .map(([key]) => capitalize(key)) // Get the allergen names
        .join(', '); // Join them into a comma-separated list
        
    }

    
    return 'None';
  };

  const renderFullName = () => {
    if (userData && userData.name && userData.lastName) {
      return `${userData.name} ${userData.lastName}`;
    }
    return 'No name available';
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>User Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">          
            <div className = "page-header" >
              <h2 className = "page-title">Your Profile</h2>              
              <IonButton className="button" onClick={handleEditProfile}>
                Edit Profile
              </IonButton>
            </div>
     
          {userData && (
            <div className="profile-banner">
              <IonAvatar className = "profile-avatar">
                <IonImg src={userData.profileImageUrl} alt="Profile Picture" />
              </IonAvatar>
              <div className = "user-info">
              <h3>{renderFullName()}</h3>
              <h4><IonIcon icon={locationOutline}/>{userData.address}</h4>
              <h4><strong>Allergens: </strong>{renderAllergens()}</h4>
              </div>
              
            </div>
            
            
        )}
        <div className = 'hr-container'><hr className = "styled-hr"/></div>
        <div className="button-row">
          
          <div className="button-col">
        <IonButton className="button"onClick={handleViewPersonalizedMenus}>
          Your Menus
        </IonButton></div>
        <div className="button-col">
        <IonButton className="button"onClick={handleNavigateCreate}>
          Create Menu
        </IonButton></div>

        </div>


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
                      {location.photoUrl && <IonImg src={location.photoUrl} alt={location.name} className="location-thumbnail" />}
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
