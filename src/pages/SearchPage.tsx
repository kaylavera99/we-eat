import React, { useState, useEffect, useCallback } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonToast,
  IonSearchbar,
  IonThumbnail,
  IonAlert,
  IonIcon,
  IonRange,
  IonModal,
  IonText,
} from "@ionic/react";
import { searchRestaurants } from "../services/searchService";
import { useHistory, useLocation } from "react-router-dom";
import { GeoPoint } from "firebase/firestore";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { fetchFullMenuFromRestaurants } from "../services/restaurantService";
import { getCoordinatesFromAddress } from "../services/googlePlacesService";
import { searchOutline, optionsOutline, filterOutline } from "ionicons/icons";
import '../styles/SearchPage.css';

interface Place {
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address?: string;
  coordinates?: GeoPoint;
  distance: number;
  icon: string;
  photoUrl: string;
}

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState<number>(5);
  const [results, setResults] = useState<Place[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const location = useLocation<{ query?: string }>();
  const history = useHistory();

  const handleSearch = useCallback(async () => {
    const trimmedSearchQuery = searchQuery.trim();
    if (!trimmedSearchQuery) {
      setToastMessage("Please enter a restaurant name to search");
      setShowToast(true);
      setIsSearching(false);
      return;
    }

    if (!navigator.geolocation) {
      setToastMessage("Geolocation is not supported by your browser");
      setShowToast(true);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = `${latitude},${longitude}`;

        try {
          const allResults: Place[] = await searchRestaurants(
            location,
            radius,
            trimmedSearchQuery,
            { lat: latitude, lng: longitude }
          );
          setResults(allResults);
        } catch (error) {
          setToastMessage("Error fetching data from Google Places");
          setShowToast(true);
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        setToastMessage("Unable to retrieve your location");
        setShowToast(true);
        setIsSearching(false);
      }
    );
  }, [searchQuery, radius]);

  useEffect(() => {
    const initialQuery = location.state?.query;
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setIsSearching(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (isSearching) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, radius, isSearching, handleSearch]);

  const handleAlertConfirm = async () => {
    if (selectedPlace) {
      const fullAddress = selectedPlace.vicinity;
      const coordinates = await getCoordinatesFromAddress(fullAddress);

      const placeWithAddress = {
        ...selectedPlace,
        coordinates,
        address: fullAddress,
      };

      history.push({
        pathname: `/restaurant/${encodeURIComponent(
          selectedPlace.name
        )}/create`,
        state: { place: placeWithAddress },
      });
    }
  };

  const handleNavigateToRestaurantPage = async (place: Place) => {
    const restaurantName = encodeURIComponent(place.name);

    try {
      const userHasSavedMenu = await checkIfUserHasSavedMenu(restaurantName);
      if (userHasSavedMenu) {
        history.push(
          `/restaurant/${encodeURIComponent(restaurantName)}/saved`,
          { place }
        );
        return;
      }

      const userHasCreatedMenu = await checkIfUserHasCreatedMenu(
        restaurantName
      );
      if (userHasCreatedMenu) {
        history.push(
          `/restaurant/${encodeURIComponent(restaurantName)}/created`,
          { place }
        );
        return;
      }

      const fullMenu = await fetchFullMenuFromRestaurants(restaurantName);
      if (fullMenu.length > 0) {
        history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`, {
          place,
        });
        return;
      }

      setSelectedPlace(place);
      setShowAlert(true);
    } catch (error) {
      setToastMessage(
        `Error navigating to ${place.name}: ${(error as Error).message}`
      );
      setShowToast(true);
    }
  };

  const handleSetAsPreferredLocation = async (place: Place) => {
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const preferredLocationsRef = collection(
        userDocRef,
        "preferredLocations"
      );
      const q = query(preferredLocationsRef, where("name", "==", place.name));
      const querySnapshot = await getDocs(q);

      const geoPoint = new GeoPoint(
        place.geometry.location.lat,
        place.geometry.location.lng
      );

      if (!querySnapshot.empty) {
        const existingDocRef = querySnapshot.docs[0].ref;
        await setDoc(existingDocRef, {
          name: place.name,
          address: place.vicinity,
          coordinates: geoPoint,
          photoUrl: place.photoUrl,
        });
        setToastMessage(`Updated ${place.name} as preferred location`);
      } else {
        const newLocationDocRef = doc(preferredLocationsRef);
        await setDoc(newLocationDocRef, {
          name: place.name,
          address: place.vicinity,
          coordinates: geoPoint,
          photoUrl: place.photoUrl,
        });
        setToastMessage(`Set ${place.name} as preferred location`);
      }

      setShowToast(true);
    } catch (error) {
      setToastMessage(
        `Error setting preferred location: ${(error as Error).message}`
      );
      setShowToast(true);
    }
  };

  const checkIfUserHasSavedMenu = async (restaurantName: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
  
    const encodedRestaurantName = encodeURIComponent(restaurantName);

    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const savedMenusRef = collection(userDocRef, "savedMenus");
    const q = query(savedMenusRef, where("restaurantName", "==", encodedRestaurantName));
    const querySnapshot = await getDocs(q);
  
    return !querySnapshot.empty;
  };
  
  const checkIfUserHasCreatedMenu = async (restaurantName: string): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const encodedRestaurantName = encodeURIComponent(restaurantName);

  
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const createdMenusRef = collection(userDocRef, "createdMenus");
    const q = query(createdMenusRef, where("restaurantName", "==", encodedRestaurantName));
    const querySnapshot = await getDocs(q);
  
    return !querySnapshot.empty;
  };
  

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search Restaurants</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="page-banner-row">
          <IonIcon slot="end" icon={searchOutline} style={{ color: "black" }} />
          <h2>Search Menus</h2>
        </div> 
        <IonItem className = 'search-container' lines='none'>
         
          <IonSearchbar
            value={searchQuery}
            placeholder="Search by restaurant name"
            onIonInput={(e: CustomEvent) => setSearchQuery(e.detail.value!)}
            debounce={500}
          />
          <IonButton className = 'filter-btn' slot="end" fill= 'clear'  onClick={() => setShowFilterModal(true)}>
            <IonIcon  style={{ color: "var(--ion-color-primary)", paddingLeft: '0' }} className = 'filter-icon' icon={filterOutline} />
          </IonButton>
          
        </IonItem>

        <IonButton
        className = 'search-button'
          expand="block"
          onClick={() => setIsSearching(true)}
          disabled={isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </IonButton>        <IonText className="ion-margin-top">
          <p className='dist-lbl'>Within: {radius} miles</p>
        </IonText>
        <IonList lines='none'>
          {results.map((place, index) => (
            <IonItem key={index} className = 'result-item'>
              {place.photoUrl && (
                <IonThumbnail slot="start">
                  <img src={place.photoUrl} alt={`${place.name}`} />
                </IonThumbnail>
              )}<div className = 'result-col'>
              <IonLabel className = 'result-info'>
                <h3 className = 'rest-name'>{place.name}</h3>
                <p className = 'rest-add'>{place.vicinity}</p>
                <p className = 'rest-dist'>Distance: {place.distance.toFixed(2)} miles</p>
              </IonLabel>
              <div className = 'result-btn-row'>
              <IonButton onClick={() => handleNavigateToRestaurantPage(place)}>
                View Menu
              </IonButton>
              <IonButton className = 'rest-save' onClick={() => handleSetAsPreferredLocation(place)}>
                Save Location
              </IonButton></div></div>
            </IonItem>
          ))}
        </IonList>

        <IonModal
          isOpen={showFilterModal}
          onDidDismiss={() => setShowFilterModal(false)}
        >
          <IonContent className="ion-padding">
            <IonRange
              min={0}
              max={50}
              step={5}
              snaps={true}
              value={radius}
              pin={true}
              onIonChange={(e) => setRadius(e.detail.value as number)}
            >
              <IonLabel
                slot="start"
                style={{
                  position: "absolute",
                  left: "0",
                  top: "-20px",
                  color: "black",
                  fontSize: "12px",
                }}
              >
                5
              </IonLabel>
            
            <IonLabel
              style={{
                position: "absolute",
                right: "0",
                top: "-20px",
                color: "black",
                fontSize: "12px",
              }}
              slot="end"
            >
              50
            </IonLabel></IonRange>
            <IonButton expand="block" className = 'search-button' onClick={() => setShowFilterModal(false)}>
              Set Distance
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={"Create Menu"}
          message={`There is no menu on WeEat for ${selectedPlace?.name}. Do you want to create one?`}
          buttons={[
            {
              text: "No",
              role: "cancel",
              handler: () => setShowAlert(false),
            },
            {
              text: "Yes",
              handler: handleAlertConfirm,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default SearchPage;
