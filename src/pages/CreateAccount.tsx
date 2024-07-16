import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonLoading,
  IonToast,
  IonCheckbox
} from '@ionic/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { uploadImage, compressImage } from '../services/storageService'; // Import the new service

const CreateAccountPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [allergens, setAllergens] = useState<{ [key: string]: boolean }>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleAllergenChange = (e: any) => {
    const { name, checked } = e.target;
    setAllergens((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleImageChange = (e: any) => {
    if (e.target.files.length > 0) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      let profileImageUrl = '';

      if (profileImage) {
        const compressedImage = await compressImage(profileImage);
        profileImageUrl = await uploadImage(compressedImage, user.uid);
      }

      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email,
        address,
        allergens,
        profileImageUrl,
      });

      setIsLoading(false);
      history.push('/allergens'); // Redirect to allergens page
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
          <IonTitle>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">First Name</IonLabel>
          <IonInput type="text" value={firstName} onIonChange={(e) => setFirstName(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Last Name</IonLabel>
          <IonInput type="text" value={lastName} onIonChange={(e) => setLastName(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput type="email" value={email} onIonChange={(e) => setEmail(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
          <IonInput type="password" value={password} onIonChange={(e) => setPassword(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Address</IonLabel>
          <IonInput type="text" value={address} onIonChange={(e) => setAddress(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel>Allergens</IonLabel>
          <IonItem lines="none">
            <IonLabel>Wheat</IonLabel>
            <IonCheckbox name="wheat" checked={allergens.wheat || false} onIonChange={handleAllergenChange} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Dairy</IonLabel>
            <IonCheckbox name="dairy" checked={allergens.dairy || false} onIonChange={handleAllergenChange} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Tree Nuts</IonLabel>
            <IonCheckbox name="tree_nuts" checked={allergens.tree_nuts || false} onIonChange={handleAllergenChange} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Shellfish</IonLabel>
            <IonCheckbox name="shellfish" checked={allergens.shellfish || false} onIonChange={handleAllergenChange} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Fish</IonLabel>
            <IonCheckbox name="fish" checked={allergens.fish || false} onIonChange={handleAllergenChange} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Soy</IonLabel>
            <IonCheckbox name="soy" checked={allergens.soy || false} onIonChange={handleAllergenChange} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Eggs</IonLabel>
            <IonCheckbox name="eggs" checked={allergens.eggs || false} onIonChange={handleAllergenChange} />
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Peanuts</IonLabel>
            <IonCheckbox name="peanuts" checked={allergens.peanuts || false} onIonChange={handleAllergenChange} />
          </IonItem>
        </IonItem>
        <IonItem>
          <IonLabel>Profile Image</IonLabel>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </IonItem>
        <IonButton expand="full" onClick={handleRegister}>
          Register
        </IonButton>
        <IonLoading isOpen={isLoading} message="Creating account..." />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} />
      </IonContent>
    </IonPage>
  );
};

export default CreateAccountPage;
