import React, { useState } from 'react';
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
import axios from 'axios';
import { doc, setDoc, GeoPoint } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const GOOGLE_PLACES_API_KEY = 'AIzaSyADCxV3t9rLih5de7GhP7R8OlZ5RA1Y_tk';

interface Place {
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

const keywords = ["McDonald's", "Subway"];

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState<number>(5000); // Default to 5km
  const [results, setResults] = useState<Place[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
        const allResults: Place[] = [];
        for (const keyword of keywords) {
          console.log(`Searching for keyword: ${keyword}`);
          const { data } = await axios.get(
            `https://proxy-server-we-eat-e24e32c11d10.herokuapp.com/proxy`, // Your proxy endpoint
            {
              params: {
                location,
                radius,
                keyword,
                type: 'restaurant',
                key: GOOGLE_PLACES_API_KEY,
              },
            }
          );
          allResults.push(...data.results);
        }
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

  const handleSavePreferredLocation = async (place: Place) => {
    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const preferredLocation = {
          [`preferredLocations.${place.name}`]: {
            name: place.name,
            address: place.vicinity,
            coordinates: new GeoPoint(place.geometry.location.lat, place.geometry.location.lng),
          }
        };
        await setDoc(userDocRef, preferredLocation, { merge: true });
        setToastMessage('Preferred location saved');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Error saving preferred location');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search Restaurants</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonInput
          value={searchQuery}
          placeholder="Search for restaurants"
          onIonChange={(e) => setSearchQuery(e.detail.value!)}
        />
        <IonButton onClick={handleSearch}>Search</IonButton>
        <IonList>
          {results.map((place, index) => (
            <IonItem key={index} button onClick={() => handleSavePreferredLocation(place)}>
              <IonLabel>
                <h2>{place.name}</h2>
                <p>{place.vicinity}</p>
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
