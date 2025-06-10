import React, { useState, useEffect } from "react";
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
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { MenuItem } from "../services/menuService";
import { useImageUpload } from "../hooks/useImageUpload";
import { uploadImage } from "../services/storageService";
import "../styles/ModalStyles.css";

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMenuItem: (item: MenuItem) => void;
  restaurantName?: string;
  menuDocId: string;
}

const placeholderImage =
  "https://firebasestorage.googleapis.com/v0/b/weeat-1a169.appspot.com/o/restaurants%2Fplaceholder%20(1).webp?alt=media&token=0754de15-1a71-4da8-9ad0-8e88fffc0875";

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  onAddMenuItem,
  restaurantName,
  menuDocId
  
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  

  const { file: imageFile, previewUrl: imageUrl, handleFileChange } = useImageUpload();

  useEffect(() => {
    // reset fields when the modal is opened
    setName("");
    setDescription("");
    setAllergens([]);
    setNote("");
    setCategory("");
    handleFileChange({ target: { files: [] } } as any);
  }, [isOpen]);



  const handleSave = async () => {
    let imageDownloadUrl = imageUrl || placeholderImage;

    if (imageFile) {
      try {
        imageDownloadUrl = await uploadImage(
          imageFile,
          `profilePictures/${auth.currentUser!.uid}/createdMenus/${menuDocId}/${name}`
        );
      } catch (error) {
        console.error("Error uploading image:", error);
        return;
      }
    }


    const newItem: MenuItem = {
      name,
      description,
      allergens,
      note,
      category,
      imageUrl: imageDownloadUrl,
    };

    try {
      const userUid = auth.currentUser?.uid;

      if (!userUid) {
        console.error("Undefined values detected, cannot proceed with saving.");
        return;
      }

      const userDocRef = doc(db, "users", userUid);
      const createdMenusRef = doc(userDocRef, "createdMenus", menuDocId);
      const dishesCollectionRef = collection(createdMenusRef, "dishes");

      const docRef = await addDoc(dishesCollectionRef, newItem);
      newItem.id = docRef.id;

      await setDoc(docRef, { id: docRef.id }, { merge: true });

      onAddMenuItem(newItem);
      onClose();
    } catch (error) {
      console.error("Error saving menu item to Firestore:", error);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Menu Item</IonTitle>
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
            onIonChange={(e) => setName(e.detail.value!)}
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Description
          </IonLabel>
          <IonTextarea
            className="input-field"
            value={description}
            onIonChange={(e) => setDescription(e.detail.value!)}
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Allergens
          </IonLabel>
          <IonInput
            className="input-field"
            value={allergens.join(", ")}
            onIonChange={(e) =>
              setAllergens(e.detail.value!.split(",").map((a) => a.trim()))
            }
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Note
          </IonLabel>
          <IonTextarea
            className="input-field"
            value={note}
            onIonChange={(e) => setNote(e.detail.value!)}
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Category
          </IonLabel>
          <IonInput
            className="input-field"
            value={category}
            onIonChange={(e) => setCategory(e.detail.value!)}
          />
        </IonItem>

        <IonItem lines="none" className="form-item item-upload">
          {" "}
          <IonLabel position="stacked" className="add-item-label">
            Image
          </IonLabel>
          <div className="image-form-wrap">
            {imageUrl && (
              <IonImg src={imageUrl || placeholderImage} alt="Menu item" className="modal-image" />
            )}
            <input
              className="img-up-btn"
              type="file"
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

export default AddMenuItemModal;
