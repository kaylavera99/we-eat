import React, { useState, useEffect } from 'react';
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
  IonToast
} from '@ionic/react';
import { fetchKeywords, searchRestaurants } from '../services/searchService';
import { useHistory } from 'react-router-dom';
import { GeoPoint } from 'firebase/firestore';

interface Place {
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address?: string; // Optional to avoid conflicts
  coordinates?: GeoPoint; // Optional to avoid conflicts
  distance: number;
}

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState<number>(5); // Default to 5 miles
  const [results, setResults] = useState<Place[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const history = useHistory();

  useEffect(() => {
    const fetchAllKeywords = async () => {
      try {
        const newKeywords = await fetchKeywords();
        setKeywords(newKeywords);
      } catch (error) {
        setToastMessage('Error fetching keywords');
        setShowToast(true);
      }
    };

    fetchAllKeywords();
  }, []);

  const handleSearch = async () => {
    if (!navigator.geolocation) {
      setToastMessage('Geolocation is not supported by your browser');
      setShowToast(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const location = `${latitude},${longitude}`;
      console.log('Location:', location); // Debugging info

      try {
        const allResults: Place[] = await searchRestaurants(location, radius, searchQuery || keywords, { lat: latitude, lng: longitude });
        console.log('Search results:', allResults); // Debugging info
        setResults(allResults);
      } catch (error) {
        setToastMessage('Error fetching data from Google Places');
        setShowToast(true);
      }
    }, (error) => {
      setToastMessage('Unable to retrieve your location');
      setShowToast(true);
    });
  };

  const handleNavigateToRestaurantPage = (place: Place) => {
    history.push(`/restaurant/${encodeURIComponent(place.name)}`, { place });
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
          <IonInput
            value={searchQuery}
            placeholder="Search by restaurant name"
            onIonChange={(e) => setSearchQuery(e.detail.value!)}
          />
        </IonItem>
        <IonButton expand="block" onClick={handleSearch}>Search</IonButton>
        <IonList>
          {results.map((place, index) => (
            <IonItem key={index} button onClick={() => handleNavigateToRestaurantPage(place)}>
              <IonLabel>
                <h2>{place.name}</h2>
                <p>{place.vicinity}</p>
                <p>Distance: {place.distance.toFixed(2)} miles</p> {/* Display distance */}
              </IonLabel>
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
