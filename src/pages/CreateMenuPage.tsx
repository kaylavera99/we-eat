import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonLabel,
  IonItem,
  IonToast,
  IonIcon,
  IonList,
} from '@ionic/react';
import { addPreferredLocationForCreatedMenu } from '../services/restaurantLocationService';
import { useHistory, useLocation } from 'react-router-dom';
import { uploadImage, compressImage } from '../services/storageService';
import { auth, db } from '../firebaseConfig';
import { doc, collection, setDoc } from 'firebase/firestore';
import { createOutline } from 'ionicons/icons';
import '../styles/CreateMenu.css'


const CreateMenuPage: React.FC = () => {
  const location = useLocation<{ place: any }>();
  const place = location.state?.place;
  
  const [restaurantName, setRestaurantName] = useState(place?.name || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    if (place) {
      setRestaurantName(place.name);
      parseAddress(place.vicinity);
    }
  }, [place]);

  const parseAddress = (vicinity: string) => {
    const addressParts = vicinity.split(', ');
    if (addressParts.length === 2) {
      setStreetAddress(addressParts[0]);
      setCity(addressParts[1]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnail(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const fullAddress = `${streetAddress}, ${city}, ${state}, ${zipCode}`;

    try {
      let thumbnailUrl = '';
      if (thumbnail && auth.currentUser) {
        const compressedImage = await compressImage(thumbnail);
        thumbnailUrl = await uploadImage(compressedImage, `profilePictures/${auth.currentUser.uid}/createdMenus/${restaurantName}`);
      } else if (!thumbnail && place?.photoUrl) {
        thumbnailUrl = place.photoUrl;
      }

      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const createdMenusRef = collection(userDocRef, 'createdMenus');
        const newMenuDocRef = doc(createdMenusRef);
        await setDoc(newMenuDocRef, { restaurantName, thumbnailUrl });

        await addPreferredLocationForCreatedMenu(restaurantName, fullAddress);
        setShowToast(true);
        setToastMessage('Restaurant details added successfully!');
        history.push(`/add-dishes/${newMenuDocRef.id}`); 
      }
    } catch (error) {
      setShowToast(true);
      setToastMessage(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
      <div className='page-banner-row'>
      <IonIcon slot="end" icon={createOutline} style={{color:'black' }} /><h2> Create a Menu</h2></div>
      <p>First, let's add some information about the restaurant you're creating a menu for:</p>
      <div className='create-menu-container'>
        <IonList>
        <IonLabel position="stacked">Restaurant Name</IonLabel>
        <IonItem>
            <IonInput value={restaurantName} onIonChange={e => setRestaurantName(e.detail.value!)} />
          </IonItem>
          <IonLabel position="stacked">Street Address</IonLabel>
          <IonItem>
            <IonInput value={streetAddress} onIonChange={e => setStreetAddress(e.detail.value!)} />
          </IonItem>
          <IonLabel position="stacked">City</IonLabel>
          <IonItem>
            <IonInput value={city} onIonChange={e => setCity(e.detail.value!)} />
          </IonItem>
          <IonLabel position="stacked">State</IonLabel>

          <IonItem>
            <IonInput value={state} onIonChange={e => setState(e.detail.value!)} />
          </IonItem>
          <IonLabel position="stacked">Zip Code</IonLabel>
          <IonItem>
            <IonInput value={zipCode} onIonChange={e => setZipCode(e.detail.value!)} />
          </IonItem>
          <IonLabel position="stacked">Thumbnail</IonLabel>

          <IonItem>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </IonItem>
        </IonList></div>
        <IonButton expand="block" onClick={handleSubmit}>
          Submit
        </IonButton>
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

export default CreateMenuPage;
