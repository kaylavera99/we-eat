/* import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonButton,
  IonLoading,
  IonToast
} from '@ionic/react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface AllergenState {
  eggs: boolean;
  wheat: boolean;
  milk: boolean;
  soy: boolean;
}

const AllergenInfoPage: React.FC = () => {
  const [allergens, setAllergens] = useState<AllergenState>({
    eggs: false,
    wheat: false,
    milk: false,
    soy: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleAllergenChange = (allergen: keyof AllergenState) => {
    setAllergens({ ...allergens, [allergen]: !allergens[allergen] });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          allergens
        });
        setIsLoading(false);
        history.push('/home'); // Redirect to home page
      }
    } catch (error: any) {
      setIsLoading(false);
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Allergen Information</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel>Eggs</IonLabel>
          <IonCheckbox
            checked={allergens.eggs}
            onIonChange={() => handleAllergenChange('eggs')}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Wheat</IonLabel>
          <IonCheckbox
            checked={allergens.wheat}
            onIonChange={() => handleAllergenChange('wheat')}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Milk</IonLabel>
          <IonCheckbox
            checked={allergens.milk}
            onIonChange={() => handleAllergenChange('milk')}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Soy</IonLabel>
          <IonCheckbox
            checked={allergens.soy}
            onIonChange={() => handleAllergenChange('soy')}
          />
        </IonItem>
        <IonButton expand="full" onClick={handleSave}>
          Save
        </IonButton>
        <IonLoading isOpen={isLoading} message="Saving allergen information..." />
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

export default AllergenInfoPage;
 */