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
import { addMenuToCreatedMenus } from '../services/menuService';
import { addPreferredLocation } from '../services/restaurantLocationService';
import { useHistory } from 'react-router-dom';

const CreateMenuPage: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState('');
  const [note, setNote] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();
  const handleSubmit = async () => {
    const allergensArray = allergens.split(',').map(a => a.trim());
    const dish = {
      category,
      name,
      description,
      allergens: allergensArray,
      note,
    };

    const fullAddress = `${streetAddress}, ${city}, ${state} ${zipCode}`;

    try {
      await addMenuToCreatedMenus({ restaurantName, dishes: [dish] });
      await addPreferredLocation(restaurantName, fullAddress);

      setShowToast(true);
      setToastMessage('Menu and preferred location added successfully!');
      history.push('/personalized-menu');
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
            <IonLabel position="stacked">Category</IonLabel>
            <IonInput value={category} onIonChange={e => setCategory(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Name</IonLabel>
            <IonInput value={name} onIonChange={e => setName(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Allergens</IonLabel>
            <IonInput value={allergens} onIonChange={e => setAllergens(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Notes</IonLabel>
            <IonInput value={note} onIonChange={e => setNote(e.detail.value!)} />
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
