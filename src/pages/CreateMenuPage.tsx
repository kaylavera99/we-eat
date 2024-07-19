import React, { useState } from 'react';
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
  IonList,
} from '@ionic/react';
import { addPreferredLocationForCreatedMenu } from '../services/restaurantLocationService';
import { useHistory } from 'react-router-dom';
import { uploadImage, compressImage } from '../services/storageService';
import { auth, db } from '../firebaseConfig';
import { doc, collection, setDoc } from 'firebase/firestore';

const CreateMenuPage: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnail(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const fullAddress = `${streetAddress}, ${city}`;

    try {
      let thumbnailUrl = '';
      if (thumbnail && auth.currentUser) {
        const compressedImage = await compressImage(thumbnail);
        thumbnailUrl = await uploadImage(compressedImage, `profilePictures/${auth.currentUser.uid}/createdMenus/${restaurantName}`);
      }

      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const createdMenusRef = collection(userDocRef, 'createdMenus');
        const newMenuDocRef = doc(createdMenusRef);
        await setDoc(newMenuDocRef, { restaurantName, thumbnailUrl });

        await addPreferredLocationForCreatedMenu(restaurantName, fullAddress);
        setShowToast(true);
        setToastMessage('Restaurant details added successfully!');
        history.push(`/add-dishes/${newMenuDocRef.id}`); // Pass the new menu document ID
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
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Restaurant Name</IonLabel>
            <IonInput value={restaurantName} onIonChange={e => setRestaurantName(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Street Address</IonLabel>
            <IonInput value={streetAddress} onIonChange={e => setStreetAddress(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">City</IonLabel>
            <IonInput value={city} onIonChange={e => setCity(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">State</IonLabel>
            <IonInput value={state} onIonChange={e => setState(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Zip Code</IonLabel>
            <IonInput value={zipCode} onIonChange={e => setZipCode(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Thumbnail</IonLabel>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </IonItem>
        </IonList>
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
