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
import { useHistory, useParams } from 'react-router-dom';
import { doc, collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { uploadImage, compressImage } from '../services/storageService';

interface Dish {
  category: string;
  name: string;
  description: string;
  allergens: string[];
  note: string;
  imageUrl?: string;
}

const AddDishesPage: React.FC = () => {
  const { menuId } = useParams<{ menuId: string }>(); // Use menuId from URL
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState('');
  const [note, setNote] = useState('');
  const [image, setImage] = useState<File | null>(null); // New state for dish image
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const allergensArray = allergens.split(',').map(a => a.trim());
    let imageUrl = '';

    try {
      if (image && auth.currentUser) {
        const compressedImage = await compressImage(image);
        imageUrl = await uploadImage(compressedImage, `profilePictures/${auth.currentUser.uid}/createdMenus/${menuId}/menuItems/${name}`);
      }

      const dish: Dish = {
        category,
        name,
        description,
        allergens: allergensArray,
        note,
        imageUrl,
      };

      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const createdMenusRef = collection(userDocRef, 'createdMenus');
        const newMenuDocRef = doc(createdMenusRef, menuId);
        const dishesRef = collection(newMenuDocRef, 'dishes');
        await addDoc(dishesRef, dish);
      }

      setShowToast(true);
      setToastMessage('Dish added successfully!');
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
          <IonTitle>Add Dishes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
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
          <IonItem>
            <IonLabel position="stacked">Image</IonLabel>
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

export default AddDishesPage;
