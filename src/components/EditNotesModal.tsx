// src/components/EditNotesModal.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonTextarea,
} from '@ionic/react';
import { MenuItem } from '../services/menuService';

interface EditNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (itemId: string, newNotes: string, restaurantName: string) => void;
  initialItem?: MenuItem & { id?: string }; // Include id for editing
  restaurantName?: string;
}

const EditNotesModal: React.FC<EditNotesModalProps> = ({ isOpen, onClose, onSaveNotes, initialItem, restaurantName }) => {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialItem) {
      setNote(initialItem.note || '');
    } else {
      setNote('');
    }
  }, [initialItem]);

  const handleSave = () => {
    if (initialItem && initialItem.id && restaurantName) {
      onSaveNotes(initialItem.id, note, restaurantName);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{initialItem ? 'Edit Note' : 'Add Note'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Note</IonLabel>
          <IonTextarea value={note} onIonChange={e => setNote(e.detail.value!)} />
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

export default EditNotesModal;
