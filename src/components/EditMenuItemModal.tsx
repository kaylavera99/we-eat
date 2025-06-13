import React, { useState, useEffect, useRef } from "react";
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
  IonImg,
  IonTextarea,
} from "@ionic/react";
import {
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { MenuItem } from "../types/menu";
import {uploadImage } from "../services/storageService";
import { useImageUpload } from "../hooks/useImageUpload";
import "../styles/ModalStyles.css";

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (updatedItem: MenuItem) => void;
  initialItem?: MenuItem;
  restaurantName?: string;
  menuDocId: string;
}

const placeholderImage =
  "https://firebasestorage.googleapis.com/v0/b/weeat-1a169.appspot.com/o/restaurants%2Fplaceholder%20(1).webp?alt=media&token=0754de15-1a71-4da8-9ad0-8e88fffc0875";

const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  initialItem,
  menuDocId
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const { file: imageFile, previewUrl, handleFileChange } = useImageUpload();
  const nameRef = useRef(name);
  const descriptionRef = useRef(description);
  const allergensRef = useRef(allergens);
  const noteRef = useRef(note);
  const categoryRef = useRef(category);
  const imageUrlRef = useRef<string>(
    previewUrl || initialItem?.imageUrl || placeholderImage
  )

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDescription(initialItem.description);
      setAllergens(initialItem.allergens);
      setNote(initialItem.note || "");
      setCategory(initialItem.category);
 

      nameRef.current = initialItem.name;
      descriptionRef.current = initialItem.description;
      allergensRef.current = initialItem.allergens;
      noteRef.current = initialItem.note || "";
      categoryRef.current = initialItem.category;
      imageUrlRef.current = initialItem.imageUrl || placeholderImage;
    } else {
      setName("");
      setDescription("");
      setAllergens([]);
      setNote("");
      setCategory("");
     
    }
  }, [initialItem]);


  const handleSave = async () => {
     let imageDownloadUrl = previewUrl || initialItem?.imageUrl || placeholderImage;

    if (imageFile && initialItem?.id) {
      try {
        const userUid = auth.currentUser!.uid;
        const dishId = initialItem.id;

   
        const storagePath = 
          `profilePictures/${userUid}/createdMenus/${menuDocId}/dishes/${dishId}/${dishId}.jpg`;

        imageDownloadUrl = await uploadImage(
          imageFile,
          storagePath
        );
      } catch (err) {
        console.error("Error uploading image:", err);
        return;
      }
    }


    if (!initialItem?.id) return;
    const updatedItem: MenuItem = {
      ...initialItem,
      name,
      description,
      allergens,
      note,
      category,
      imageUrl: imageDownloadUrl,
    };


    try {
      const userUid = auth.currentUser!.uid;
      const menuDocRef = doc(db, "users", userUid, "createdMenus", menuDocId);
      const dishDocRef = doc(menuDocRef, "dishes", initialItem.id);

      await updateDoc(dishDocRef, {
        name:         updatedItem.name,
        description:  updatedItem.description,
        allergens:    updatedItem.allergens,
        note:         updatedItem.note,
        category:     updatedItem.category,
        imageUrl:     updatedItem.imageUrl,
      });


      onSaveItem(updatedItem);
      onClose();
    } catch (err) {
      console.error("Error saving menu item to Firestore:", err);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit Menu Item</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding modal-content">
        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Name
          </IonLabel>
          <IonInput
            className="input-field"
            value={name}
            onIonChange={(e) => {
              const newName = e.detail.value!;
              setName(newName);
              nameRef.current = newName;
            }}
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Description
          </IonLabel>
          <IonTextarea
            className="input-field"
            value={description}
            onIonChange={(e) => {
              const newDescription = e.detail.value!;
              setDescription(newDescription);
              descriptionRef.current = newDescription;
            }}
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Allergens
          </IonLabel>
          <IonInput
            className="input-field"
            value={allergens.join(", ")}
            onIonChange={(e) => {
              const newAllergens = e.detail
                .value!.split(",")
                .map((a) => a.trim());
              setAllergens(newAllergens);
              allergensRef.current = newAllergens;
            }}
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Note
          </IonLabel>
          <IonTextarea
            className="input-field"
            value={note}
            onIonChange={(e) => {
              const newNote = e.detail.value!;
              setNote(newNote);
              noteRef.current = newNote;
            }}
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Category
          </IonLabel>
          <IonInput
            className="input-field"
            value={category}
            onIonChange={(e) => {
              const newCategory = e.detail.value!;
              setCategory(newCategory);
              categoryRef.current = newCategory;
            }}
          />
        </IonItem>

        <IonItem lines="none" className="form-item item-upload">
          <IonLabel position="stacked" className="add-item-label">
            Image
          </IonLabel>
          <div className="image-form-wrap">
            
              <IonImg src={previewUrl || initialItem?.imageUrl || placeholderImage}
               alt="Menu item"
              className="modal-image"/>
            
            <input
              type="file"
              className="img-up-btn"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
        </IonItem>

        <IonButton expand="block" className="modal-button" onClick={handleSave}>
          Save
        </IonButton>
        <IonButton
          expand="block"
          color="light"
          className="modal-button"
          onClick={onClose}
        >
          Cancel
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default EditMenuItemModal;
