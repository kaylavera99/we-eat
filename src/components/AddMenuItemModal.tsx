import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonTextarea,
  IonImg
} from '@ionic/react';
import { MenuItem } from '../services/menuService';
import { compressImage, uploadImage } from '../services/storageService';

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMenuItem: (item: MenuItem) => void;
  initialItem?: MenuItem & { id?: string }; // Include id for editing
}

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({ isOpen, onClose, onAddMenuItem, initialItem }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // State for imageUrl
  const [imageFile, setImageFile] = useState<File | null>(null); // State for image file

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDescription(initialItem.description);
      setAllergens(initialItem.allergens);
      setNote(initialItem.note || '');
      setCategory(initialItem.category);
      setImageUrl(initialItem.imageUrl || '');
    } else {
      setName('');
      setDescription('');
      setAllergens([]);
      setNote('');
      setCategory('');
      setImageUrl('');
    }
  }, [initialItem]);

  const handleImageChange = async (e:  React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
    }
  };

  const handleSave = async () => {
    let imageDownloadUrl = imageUrl;
    
    if (imageFile) {
      try {
        const compressedFile = await compressImage(imageFile);
        imageDownloadUrl = await uploadImage(compressedFile, 'menu_items');
        setImageUrl(imageDownloadUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    const newItem: MenuItem = { name, description, allergens, note, category, imageUrl: imageDownloadUrl };
    if (initialItem?.id) {
      newItem.id = initialItem.id; 
    }
    onAddMenuItem(newItem);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{initialItem ? 'Edit Menu Item' : 'Add Menu Item'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput value={name} onIonChange={e => setName(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Allergens</IonLabel>
          <IonInput value={allergens.join(', ')} onIonChange={e => setAllergens(e.detail.value!.split(',').map(a => a.trim()))} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Note</IonLabel>
          <IonTextarea value={note} onIonChange={e => setNote(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Category</IonLabel>
          <IonInput value={category} onIonChange={e => setCategory(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Image</IonLabel>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </IonItem>
        {imageUrl && <IonImg src={imageUrl} />} {/* Display the uploaded image */}
        <IonButton expand="block" onClick={handleSave}>
          Save
        </IonButton>
        <IonButton expand="block" color="light" onClick={onClose}>
          Cancel
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default AddMenuItemModal;
