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
  IonThumbnail
} from '@ionic/react';
import { searchRestaurants } from '../services/searchService';
import { useHistory } from 'react-router-dom';
import { GeoPoint } from 'firebase/firestore';
import { doc, getDocs, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { fetchFullMenuFromRestaurants } from '../services/restaurantService';
import { fetchSavedMenus, fetchCreatedMenus } from '../services/menuService';

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
  const [radius, setRadius] = useState<number>(5); // Default to 5 miles
  const [results, setResults] = useState<Place[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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
    if (isSearching) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500); // Debounce time

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, radius, isSearching, handleSearch]);

  const handleNavigateToRestaurantPage = async (place: Place) => {
    const restaurantName = place.name;

    try {
      // Check if the full menu exists in the restaurant database
      const fullMenu = await fetchFullMenuFromRestaurants(restaurantName);
      if (fullMenu.length > 0) {
        history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`, { place });
        return;
      }

      // Check if the user has a saved menu for this restaurant
      const userHasSavedMenu = await checkIfUserHasSavedMenu(restaurantName);
      if (userHasSavedMenu) {
        history.push(`/restaurant/${encodeURIComponent(restaurantName)}/saved`, { place });
        return;
      }

      // Check if the user has a created menu for this restaurant
      const userHasCreatedMenu = await checkIfUserHasCreatedMenu(restaurantName);
      if (userHasCreatedMenu) {
        history.push(`/restaurant/${encodeURIComponent(restaurantName)}/created`, { place });
        return;
      }

      // If no menu is found, navigate to the create menu page
      setToastMessage(`No menu available for ${restaurantName}. You can create one.`);
      setShowToast(true);
      history.push(`/restaurant/${encodeURIComponent(restaurantName)}/create`, { place });
    } catch (error) {
      setToastMessage(`Error navigating to ${place.name}: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  // This is a helper function to check if the user has a saved menu for the restaurant
  const checkIfUserHasSavedMenu = async (restaurantName: string): Promise<boolean> => {
    if (!auth.currentUser) return false;

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const savedMenusRef = collection(userDocRef, 'savedMenus');
    const q = query(savedMenusRef, where("restaurantName", "==", restaurantName));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  };

  // This is a helper function to check if the user has a created menu for the restaurant
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
            <IonItem key={index} button onClick={() => handleNavigateToRestaurantPage(place)}>
              {place.icon && (
                <IonThumbnail slot="start">
                  <img src={place.photoUrl} alt={`${place.name}`} />
                </IonThumbnail>
              )}
              <IonLabel>
                <h2>{place.name}</h2>
                <p>{place.vicinity}</p>
                <p>Distance: {place.distance.toFixed(2)} miles</p> {/* Display distance */}
              </IonLabel>
              {place.icon && (
                <IonThumbnail slot="end">
                 
                </IonThumbnail>
              )}
            </IonItem>
          ))}
        </IonList>
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

export default SearchPage;
