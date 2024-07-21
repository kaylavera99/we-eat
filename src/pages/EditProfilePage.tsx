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
  IonToast,
  IonImg,
} from '@ionic/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { uploadImage, compressImage } from '../services/storageService';

interface AllergenState {
  eggs: boolean;
  wheat: boolean;
  dairy: boolean;
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
    dairy: false,
    soy: false,
    tree_nuts: false,
    fish: false,
    shellfish: false,
    peanuts: false,
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
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
            const allergenData = userData.allergens || {};
            setAllergens({
              eggs: Boolean(allergenData.eggs),
              wheat: Boolean(allergenData.wheat),
              dairy: Boolean(allergenData.dairy),
              soy: Boolean(allergenData.soy),
              tree_nuts: Boolean(allergenData.tree_nuts),
              fish: Boolean(allergenData.fish),
              shellfish: Boolean(allergenData.shellfish),
              peanuts: Boolean(allergenData.peanuts),
            });
            setProfileImageUrl(userData.profileImageUrl);
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

  const handleImageChange = (e: any) => {
    if (e.target.files.length > 0) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        let updatedProfileImageUrl = profileImageUrl;

        if (profileImage) {
          const compressedImage = await compressImage(profileImage);
          updatedProfileImageUrl = await uploadImage(compressedImage, auth.currentUser.uid);
        }

        const updatedAllergens = {
          eggs: Boolean(allergens.eggs),
          wheat: Boolean(allergens.wheat),
          dairy: Boolean(allergens.dairy),
          soy: Boolean(allergens.soy),
          tree_nuts: Boolean(allergens.tree_nuts),
          fish: Boolean(allergens.fish),
          shellfish: Boolean(allergens.shellfish),
          peanuts: Boolean(allergens.peanuts),
        };

        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          allergens: updatedAllergens,
          profileImageUrl: updatedProfileImageUrl,
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
          <IonLabel>Profile Picture</IonLabel>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </IonItem>
        {profileImageUrl && <IonImg src={profileImageUrl} alt="Profile Picture" />}
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
          <IonLabel>Dairy</IonLabel>
          <IonCheckbox
            checked={allergens.dairy}
            onIonChange={() => handleAllergenChange('dairy')}
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
