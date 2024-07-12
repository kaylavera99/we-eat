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
} from '@ionic/react';
import { MenuItem } from '../services/menuService';

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

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDescription(initialItem.description);
      setAllergens(initialItem.allergens);
      setNote(initialItem.note || '');
      setCategory(initialItem.category);
    } else {
      setName('');
      setDescription('');
      setAllergens([]);
      setNote('');
      setCategory('');
    }
  }, [initialItem]);

  const handleSave = () => {
    const newItem: MenuItem = { name, description, allergens, note, category };
    if (initialItem?.id) {
      newItem.id = initialItem.id; // Include id for editing
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
