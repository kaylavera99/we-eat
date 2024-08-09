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
  IonTextarea,
} from '@ionic/react';
import { MenuItem, updateNotesInSavedMenus, updateNotesInCreatedMenus } from '../services/menuService';

interface EditNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNotes: (updatedItem: MenuItem) => void;
  initialItem?: MenuItem & { id?: string }; 
  restaurantName?: string;
  isCreatedMenu?: boolean; 
}

const EditNotesModal: React.FC<EditNotesModalProps> = ({ isOpen, onClose, onSaveNotes, initialItem, restaurantName, isCreatedMenu = false }) => {
  const [note, setNote] = useState('');
  const noteRef = useRef(''); 
  useEffect(() => {
    if (initialItem) {
      setNote(initialItem.note || '');
      noteRef.current = initialItem.note || ''; 
    } else {
      setNote('');
      noteRef.current = ''; 
    }
  }, [initialItem]);

  const handleSave = async () => {
    const updatedNote = noteRef.current; 
    console.log("Current note before save:", updatedNote); 

    if (initialItem && initialItem.id && restaurantName) {
      const updatedItem = { ...initialItem, note: updatedNote };
      console.log("Saving updated note:", updatedNote);

      try {
        if (isCreatedMenu) {
          await updateNotesInCreatedMenus(initialItem.id!, updatedNote, restaurantName);
        } else {
          await updateNotesInSavedMenus(initialItem.id!, updatedNote, restaurantName);
        }
        onSaveNotes(updatedItem);
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    } else {
      console.log("No updates or missing data");
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
          <IonTextarea 
            value={note} 
            onIonChange={e => { 
              const newNote = e.detail.value!;
              console.log("Updating note state:", newNote);
              setNote(newNote);
              noteRef.current = newNote; // Update the ref whenever the note changes
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

export default EditNotesModal;
