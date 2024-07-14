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
  IonTextarea,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { MenuItem } from '../services/menuService';

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

  const nameRef = useRef('');
  const descriptionRef = useRef('');
  const allergensRef = useRef<string[]>([]);
  const noteRef = useRef('');
  const categoryRef = useRef('');

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDescription(initialItem.description);
      setAllergens(initialItem.allergens);
      setNote(initialItem.note || '');
      setCategory(initialItem.category);
      
      nameRef.current = initialItem.name;
      descriptionRef.current = initialItem.description;
      allergensRef.current = initialItem.allergens;
      noteRef.current = initialItem.note || '';
      categoryRef.current = initialItem.category;
    } else {
      setName('');
      setDescription('');
      setAllergens([]);
      setNote('');
      setCategory('');
      
      nameRef.current = '';
      descriptionRef.current = '';
      allergensRef.current = [];
      noteRef.current = '';
      categoryRef.current = '';
    }
  }, [initialItem]);

  const handleSave = () => {
    const updatedItem = {
      ...initialItem,
      name: nameRef.current,
      description: descriptionRef.current,
      allergens: allergensRef.current,
      note: noteRef.current,
      category: categoryRef.current
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

export default EditMenuItemModal;
