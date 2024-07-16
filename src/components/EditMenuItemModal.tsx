import React, { useState, useEffect, useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea
} from '@ionic/react';
import { MenuItem } from '../services/menuService';
import { compressImage, uploadImage } from '../services/storageService'; // Import compression and upload functions

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (updatedItem: MenuItem) => void;
  initialItem?: MenuItem & { id?: string }; // Include id for editing
  restaurantName?: string;
}

const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({ isOpen, onClose, onSaveItem, initialItem, restaurantName }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // State for imageUrl
  const [imageFile, setImageFile] = useState<File | null>(null); // State for image file

  const nameRef = useRef('');
  const descriptionRef = useRef('');
  const allergensRef = useRef<string[]>([]);
  const noteRef = useRef('');
  const categoryRef = useRef('');
  const imageUrlRef = useRef('');

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDescription(initialItem.description);
      setAllergens(initialItem.allergens);
      setNote(initialItem.note || '');
      setCategory(initialItem.category);
      setImageUrl(initialItem.imageUrl || '');
      
      nameRef.current = initialItem.name;
      descriptionRef.current = initialItem.description;
      allergensRef.current = initialItem.allergens;
      noteRef.current = initialItem.note || '';
      categoryRef.current = initialItem.category;
      imageUrlRef.current = initialItem.imageUrl || '';
    } else {
      setName('');
      setDescription('');
      setAllergens([]);
      setNote('');
      setCategory('');
      setImageUrl('');

      nameRef.current = '';
      descriptionRef.current = '';
      allergensRef.current = [];
      noteRef.current = '';
      categoryRef.current = '';
      imageUrlRef.current = '';
    }
  }, [initialItem]);

  const handleImageChange = async (e: any) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
    }
  };

  const handleSave = async () => {
    let imageDownloadUrl = imageUrl;
    
    if (imageFile) {
      // Compress and upload the image
      try {
        const compressedFile = await compressImage(imageFile);
        imageDownloadUrl = await uploadImage(compressedFile, 'menu_items');
        setImageUrl(imageDownloadUrl);
        imageUrlRef.current = imageDownloadUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        // You might want to handle this error more gracefully in your UI
      }
    }

    const updatedItem = {
      ...initialItem,
      name: nameRef.current,
      description: descriptionRef.current,
      allergens: allergensRef.current,
      note: noteRef.current,
      category: categoryRef.current,
      imageUrl: imageUrlRef.current
    };

    onSaveItem(updatedItem);
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
          <IonInput
            value={name}
            onIonChange={e => {
              const newName = e.detail.value!;
              setName(newName);
              nameRef.current = newName;
            }}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea
            value={description}
            onIonChange={e => {
              const newDescription = e.detail.value!;
              setDescription(newDescription);
              descriptionRef.current = newDescription;
            }}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Allergens</IonLabel>
          <IonInput
            value={allergens.join(', ')}
            onIonChange={e => {
              const newAllergens = e.detail.value!.split(',').map(a => a.trim());
              setAllergens(newAllergens);
              allergensRef.current = newAllergens;
            }}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Note</IonLabel>
          <IonTextarea
            value={note}
            onIonChange={e => {
              const newNote = e.detail.value!;
              setNote(newNote);
              noteRef.current = newNote;
            }}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Category</IonLabel>
          <IonInput
            value={category}
            onIonChange={e => {
              const newCategory = e.detail.value!;
              setCategory(newCategory);
              categoryRef.current = newCategory;
            }}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Image</IonLabel>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </IonItem>
        {imageUrl && <img src={imageUrl} alt="Menu item" />} {/* Display the uploaded image */}
        <IonButton expand="block" onClick={handleSave}>
          Save
        </IonButton>
        <IonButton expand="block" color="light" onClick={onClose}/>
          Cancel
        </IonContent>
    </IonModal>
  );
};

export default EditMenuItemModal;
