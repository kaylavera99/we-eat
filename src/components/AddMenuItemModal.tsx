import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { MenuItem } from '../services/menuService';

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMenuItem: (item: MenuItem) => void;
  category: string;
}

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({ isOpen, onClose, onAddMenuItem }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');

  const handleAddMenuItem = () => {
    const newItem: MenuItem = {
      name,
      description,
      allergens,
      note,
      category
    };
    onAddMenuItem(newItem);
    setName('');
    setDescription('');
    setAllergens([]);
    setNote('');
    setCategory('');
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Menu Item</IonTitle>
          <IonButton slot="end" onClick={onClose}>Close</IonButton>
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
          <IonSelect multiple={true} value={allergens} onIonChange={e => setAllergens(e.detail.value!)}>
            <IonSelectOption value="Wheat">Wheat</IonSelectOption>
            <IonSelectOption value="Dairy">Dairy</IonSelectOption>
            <IonSelectOption value="Soy">Soy</IonSelectOption>
            <IonSelectOption value="Shellfish">Shellfish</IonSelectOption>
            {/* Add more allergens as needed */}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Note</IonLabel>
          <IonTextarea value={note} onIonChange={e => setNote(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Category</IonLabel>
          <IonInput value={category} onIonChange={e => setCategory(e.detail.value!)} />
        </IonItem>
        <IonButton expand="block" onClick={handleAddMenuItem}>Add Item</IonButton>
      </IonContent>
    </IonModal>
  );
};

export default AddMenuItemModal;
