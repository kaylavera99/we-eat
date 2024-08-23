import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonLoading,
  IonToast,
  IonButton,
  IonAvatar,
  IonImg,
  IonIcon,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
} from "@ionic/react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useHistory } from "react-router-dom";
import { searchRestaurants } from "../services/searchService";
import "../styles/UserProfile.css";
import "ionicons/icons";
import {
  locationOutline,
  personCircleOutline,
  locationSharp,
} from "ionicons/icons";

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
    [key: string]: any;
  };
  profileImageUrl?: string;
  address: string;
}

const UserProfilePage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [restaurantPhotos, setRestaurantPhotos] = useState<{
    [key: string]: string;
  }>({});
  const history = useHistory();

  const handleEditProfile = () => {
    history.push("/edit-profile");
  };

  const handleViewPersonalizedMenus = () => {
    history.push("/personalized-menu");
  };

  const handleNavigateCreate = () => {
    history.push("/create-menu");
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userDocData = userDocSnap.data() || {};

            const allergens = userDocData.allergens || {};

            const userData: UserData = {
              name: userDocData.firstName,
              email: userDocData.email,
              allergens: userDocData.allergens || {},
              preferredLocations: {},
              createdMenus: {},
              profileImageUrl: userDocData.profileImageUrl || "",
              address: userDocData.address,
              lastName: userDocData.lastName,
            };

            const preferredLocationsSnap = await getDocs(
              collection(userDocRef, "preferredLocations")
            );
            const locations: { [key: string]: PreferredLocation } = {};
            const locationPromises = preferredLocationsSnap.docs.map(
              async (doc) => {
                const location = doc.data() as PreferredLocation;
                locations[doc.id] = location;

                const results = await searchRestaurants(
                  `${location.coordinates.latitude},${location.coordinates.longitude}`,
                  5,
                  location.name,
                  {
                    lat: location.coordinates.latitude,
                    lng: location.coordinates.longitude,
                  }
                );
                if (results.length > 0) {
                  location.photoUrl = results[0].photoUrl;
                  setRestaurantPhotos((prevPhotos) => ({
                    ...prevPhotos,
                    [location.name]: results[0].photoUrl,
                  }));
                }
              }
            );

            await Promise.all(locationPromises);

            userData.preferredLocations = locations;

            const createdMenusSnap = await getDocs(
              collection(userDocRef, "createdMenus")
            );
            createdMenusSnap.forEach((doc) => {
              userData.createdMenus[doc.id] = doc.data();
            });

            setUserData(userData);
          } else {
            setToastMessage("No such document!");
            setShowToast(true);
          }
        } else {
          setToastMessage("User not authenticated");
          setShowToast(true);
        }
      } catch (error: any) {
        setToastMessage(error.message);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const formatAllergen = (allergen: string) => {
    return allergen
      .split("_")
      .map((word) => capitalize(word))
      .join(" ");
  };

  const renderAllergens = () => {
    if (userData && userData.allergens) {
      return Object.entries(userData.allergens)
        .filter(([key, value]) => value)
        .map(([key]) => formatAllergen(key))
        .join(", ");
    }
    return "None";
  };

  const renderFullName = () => {
    if (userData && userData.name && userData.lastName) {
      return `${userData.name} ${userData.lastName}`;
    }
    return "No name available";
  };

  const handleRemovePreferredLocation = async (locationKey: string) => {
    if (!auth.currentUser) return;

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const locationDocRef = doc(userDocRef, "preferredLocations", locationKey);
      await deleteDoc(locationDocRef);

      setUserData((prevData) => {
        if (!prevData) return prevData;
        const updatedLocations = { ...prevData.preferredLocations };
        delete updatedLocations[locationKey];
        return { ...prevData, preferredLocations: updatedLocations };
      });

      setToastMessage("Preferred location removed");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>User Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding pad">
        
          <div className="page-header">
            <div className="page-banner-row-user">
              <IonIcon
                slot="end"
                className="menu-icon"
                icon={personCircleOutline}
              />
              <h2 className="page-title">Your Profile</h2>{" "}
            </div>
            <IonButton className="secondary-button" onClick={handleEditProfile}>
              Edit Profile
            </IonButton>
          </div>
<div className="page-color">
          {userData && (
            <div className="profile-banner">
              <div className="profile-spacer">
                <IonAvatar className="profile-avatar">
                  <IonImg
                    src={userData.profileImageUrl}
                    alt="Profile Picture"
                  />
                </IonAvatar>
                <div className="user-info">
                  <h3>{renderFullName()}</h3>
                  <div className="location-icon-row">
                    <IonIcon icon={locationSharp} /> <h4>{userData.address}</h4>
                  </div>
                  <h4>
                    <strong>Allergens: </strong>
                    {renderAllergens()}
                  </h4>
                </div>
              </div>
            </div>
          )}</div>
          <div className="hr-container"></div>
          <div className="button-row">
            <div className="button-col">
              <IonButton
                className="button"
                onClick={handleViewPersonalizedMenus}
              >
                Your Menus
              </IonButton>
            </div>
            <div className="button-col">
              <IonButton className="button" onClick={handleNavigateCreate}>
                Create Menu
              </IonButton>
            </div>
          </div>
      
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : userData ? (
          <IonList className = 'prof-list'>
            {Object.keys(userData.preferredLocations).length > 0 ? (
              <div>
                <h2>Your Restaurant Locations</h2>
                <IonAccordionGroup className="loc-acc">
                  {Object.entries(userData.preferredLocations).map(
                    ([key, location]) => (
                      <IonAccordion key={key} className="rest-acc">
                        <IonItem
                          slot="header"
                          lines="none"
                          className="loc-items"
                        >
                          <IonLabel>{location.name}</IonLabel>
                        </IonItem>
                        <div className="ion-pad" slot="content">
                          {location.photoUrl && (
                            <IonImg
                              src={location.photoUrl}
                              alt={location.name}
                              className="location-thumbnail"
                            />
                          )}
                          <p>{location.address}</p>
                          <IonButton
                            href={`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.latitude},${location.coordinates.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Directions
                          </IonButton>
                          <IonButton
                            color="danger"
                            onClick={() => handleRemovePreferredLocation(key)}
                          >
                            Remove
                          </IonButton>
                        </div>
                      </IonAccordion>
                    )
                  )}
                </IonAccordionGroup>
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
