import React, { useEffect, useState } from 'react';
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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

interface AllergenState {
  eggs: boolean;
  wheat: boolean;
  milk: boolean;
  soy: boolean;
  tree_nuts: boolean;
  fish: boolean;
  shellfish: boolean;
  peanuts: boolean;
}

const EditProfilePage: React.FC = () => {
  const [allergens, setAllergens] = useState<AllergenState>({
    eggs: false,
    wheat: false,
    milk: false,
    soy: false,
    tree_nuts: false,
    fish: false,
    shellfish: false,
    peanuts: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setAllergens(userData.allergens);
          }
        }
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchUserData();
  }, []);

  const handleAllergenChange = (allergen: keyof AllergenState) => {
    setAllergens((prevAllergens) => ({
      ...prevAllergens,
      [allergen]: !prevAllergens[allergen],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          allergens
        });
        setIsLoading(false);
        setToastMessage('Profile updated successfully!');
        setShowToast(true);
        history.push('/profile'); // Redirect to profile page
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
          <IonTitle>Edit Profile</IonTitle>
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
        <IonItem>
          <IonLabel>Tree Nuts</IonLabel>
          <IonCheckbox
            checked={allergens.tree_nuts}
            onIonChange={() => handleAllergenChange('tree_nuts')}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Fish</IonLabel>
          <IonCheckbox
            checked={allergens.fish}
            onIonChange={() => handleAllergenChange('fish')}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Shellfish</IonLabel>
          <IonCheckbox
            checked={allergens.shellfish}
            onIonChange={() => handleAllergenChange('shellfish')}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Peanuts</IonLabel>
          <IonCheckbox
            checked={allergens.peanuts}
            onIonChange={() => handleAllergenChange('peanuts')}
          />
        </IonItem>
        <IonButton expand="full" onClick={handleSave}>
          Save
        </IonButton>
        <IonLoading isOpen={isLoading} message="Saving profile..." />
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

export default EditProfilePage;
