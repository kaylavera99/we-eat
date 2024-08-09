import React, { useState, useEffect, useCallback } from 'react';
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
  IonIcon
} from '@ionic/react';
import { searchRestaurants } from '../services/searchService';
import { useHistory, useLocation } from 'react-router-dom';
import { GeoPoint } from 'firebase/firestore';
import { doc, getDocs, collection, query, where, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { fetchFullMenuFromRestaurants } from '../services/restaurantService';
import { getCoordinatesFromAddress } from '../services/googlePlacesService';
import { searchOutline } from 'ionicons/icons';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState<number>(5);
  const [results, setResults] = useState<Place[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const location = useLocation<{ query?: string }>();
  const history = useHistory();

  const handleSearch = useCallback(async () => {
    const trimmedSearchQuery = searchQuery.trim();
    if (!trimmedSearchQuery) {
      setToastMessage('Please enter a restaurant name to search');
      setShowToast(true);
      setIsSearching(false);
      return;
    }

    if (!navigator.geolocation) {
      setToastMessage('Geolocation is not supported by your browser');
      setShowToast(true);
      setIsSearching(false);
      return;
    }

    setIsSearching(true); // Set searching state before geolocation
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const location = `${latitude},${longitude}`;

      try {
        const allResults: Place[] = await searchRestaurants(location, radius, trimmedSearchQuery, { lat: latitude, lng: longitude });
        setResults(allResults);
      } catch (error) {
        setToastMessage('Error fetching data from Google Places');
        setShowToast(true);
      } finally {
        setIsSearching(false);
      }
    }, (error) => {
      setToastMessage('Unable to retrieve your location');
      setShowToast(true);
      setIsSearching(false);
    });
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
      }, 500); // Debounce time

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
        pathname: `/restaurant/${encodeURIComponent(selectedPlace.name)}/create`,
        state: { place: placeWithAddress }
      });
    }
  };

  const handleNavigateToRestaurantPage = async (place: Place) => {
    const restaurantName = place.name;

    try {
      // Check if the user has a saved menu for this restaurant
      const userHasSavedMenu = await checkIfUserHasSavedMenu(restaurantName);
      if (userHasSavedMenu) {
        console.log("User has saved Menu");
        history.push(`/restaurant/${encodeURIComponent(restaurantName)}/saved`, { place });
        return;
      }

      // Check if the user has a created menu for this restaurant
      const userHasCreatedMenu = await checkIfUserHasCreatedMenu(restaurantName);
      if (userHasCreatedMenu) {
        console.log("User has created Menu");
        history.push(`/restaurant/${encodeURIComponent(restaurantName)}/created`, { place });
        return;
      }

      // Check if the full menu exists in the restaurant database
      const fullMenu = await fetchFullMenuFromRestaurants(restaurantName);
      if (fullMenu.length > 0) {
        console.log("Full menu exists");
        history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`, { place });
        return;
      }

      // If no menu is found, show alert to create a new menu
      setSelectedPlace(place);
      setShowAlert(true);
    } catch (error) {
      setToastMessage(`Error navigating to ${place.name}: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleSetAsPreferredLocation = async (place: Place) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const preferredLocationsRef = collection(userDocRef, 'preferredLocations');
      const q = query(preferredLocationsRef, where("name", "==", place.name));
      const querySnapshot = await getDocs(q);

      const geoPoint = new GeoPoint(place.geometry.location.lat, place.geometry.location.lng);

      if (!querySnapshot.empty) {
        // If the location already exists, update it
        const existingDocRef = querySnapshot.docs[0].ref;
        await setDoc(existingDocRef, {
          name: place.name,
          address: place.vicinity,
          coordinates: geoPoint,
          photoUrl: place.photoUrl
        });
        setToastMessage(`Updated ${place.name} as preferred location`);
      } else {
        // If the location does not exist, add a new one
        const newLocationDocRef = doc(preferredLocationsRef);
        await setDoc(newLocationDocRef, {
          name: place.name,
          address: place.vicinity,
          coordinates: geoPoint,
          photoUrl: place.photoUrl
        });
        setToastMessage(`Set ${place.name} as preferred location`);
      }

      setShowToast(true);
    } catch (error) {
      setToastMessage(`Error setting preferred location: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const checkIfUserHasSavedMenu = async (restaurantName: string): Promise<boolean> => {
    if (!auth.currentUser) return false;

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const savedMenusRef = collection(userDocRef, 'savedMenus');
    const q = query(savedMenusRef, where("restaurantName", "==", restaurantName));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  };

  const checkIfUserHasCreatedMenu = async (restaurantName: string): Promise<boolean> => {
    if (!auth.currentUser) return false;

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const createdMenusRef = collection(userDocRef, 'createdMenus');
    const q = query(createdMenusRef, where("restaurantName", "==", restaurantName));
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
        <div className='page-banner-row'>
          <IonIcon slot="end" icon={searchOutline} style={{ color: 'black' }} /><h2> Search Menus</h2>
        </div>
        <IonItem>
          <IonLabel position="stacked">Enter radius in miles</IonLabel>
          <IonInput
            type="number"
            value={radius}
            placeholder="Enter radius in miles"
            onIonChange={(e) => setRadius(parseInt(e.detail.value!, 10))}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Search by restaurant name</IonLabel>
          <IonSearchbar
            value={searchQuery}
            placeholder="Search by restaurant name"
            onIonInput={(e: CustomEvent) => setSearchQuery(e.detail.value!)}
            debounce={500} // Adjust debounce time as needed
          />
        </IonItem>
        <IonButton expand="block" onClick={() => setIsSearching(true)} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </IonButton>
        <IonList>
          {results.map((place, index) => (
            <IonItem key={index}>
              {place.photoUrl && (
                <IonThumbnail slot="start">
                  <img src={place.photoUrl} alt={`${place.name}`} />
                </IonThumbnail>
              )}
              <IonLabel>
                <h2>{place.name}</h2>
                <p>{place.vicinity}</p>
                <p>Distance: {place.distance.toFixed(2)} miles</p> {/* Display distance */}
              </IonLabel>
              <IonButton onClick={() => handleNavigateToRestaurantPage(place)}>
                View Menu
              </IonButton>
              <IonButton onClick={() => handleSetAsPreferredLocation(place)}>
                Set as Preferred Location
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
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Create Menu'}
          message={`There is no menu on WeEat for ${selectedPlace?.name}. Do you want to create one?`}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => setShowAlert(false)
            },
            {
              text: 'Yes',
              handler: handleAlertConfirm
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default SearchPage;
