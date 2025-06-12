
import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonImg,
  IonButton,
  IonAvatar,
} from "@ionic/react";
import { doc, collection, addDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { MenuItem } from "../services/menuService";
import { useImageUpload } from "../hooks/useImageUpload";
import { uploadImage } from "../services/storageService";
import "../styles/ModalStyles.css";

const placeholderImage =
  "https://firebasestorage.googleapis.com/v0/b/weeat-1a169.appspot.com/o/restaurants%2Fplaceholder%20(1).webp?alt=media&token=0754de15-1a71-4da8-9ad0-8e88fffc0875";

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMenuItem: (item: MenuItem) => void;
  menuDocId: string;
}

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  onAddMenuItem,
  menuDocId,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");

  // imageFile = compressed File, imagePreview = blob URL or placeholder
  const {
    file: imageFile,
    previewUrl: imagePreview,
    handleFileChange,
  } = useImageUpload(placeholderImage);

  // reset form when modal opens
  useEffect(() => {
    setName("");
    setDescription("");
    setAllergens([]);
    setNote("");
    setCategory("");
    handleFileChange({ target: { files: [] } } as any);
  }, [isOpen, handleFileChange]);

  const handleSave = async () => {
    try {
      const userUid = auth.currentUser?.uid;
      if (!userUid) return;

      // bare dish doc to Firestore to get its id
      const userDocRef = doc(db, "users", userUid);
      const menuRef = doc(userDocRef, "createdMenus", menuDocId);
      const dishesRef = collection(menuRef, "dishes");

      const bare: Omit<MenuItem, "id"> = {
        name,
        description,
        allergens,
        note,
        category,
        imageUrl: "", 
      };

      const docRef = await addDoc(dishesRef, bare);
      const dishId = docRef.id;

      // upload image into subfolder named by dishId
      let finalImageUrl = imagePreview || placeholderImage;
      if (imageFile) {
        // file name = dishId.jpg
        finalImageUrl = await uploadImage(
          imageFile,
          `profilePictures/${userUid}/createdMenus/${menuDocId}/dishes/${dishId}/${dishId}.jpg`
        );
      }

      //  Firestore doc with its id & imageUrl
      await setDoc(
        docRef,
        { id: dishId, imageUrl: finalImageUrl },
        { merge: true }
      );

      // callback with fully populated MenuItem
      onAddMenuItem({
        id: dishId,
        name,
        description,
        allergens,
        note,
        category,
        imageUrl: finalImageUrl,
      });

      onClose();
    } catch (e) {
      console.error("Error saving menu item:", e);
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
          <IonLabel position="stacked" className= "add-item-label">Name</IonLabel>
          <IonInput
            value={name}
            onIonChange={(e) => setName(e.detail.value!)}
            className = "input-field"
          />
        </IonItem>

      
        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className= "add-item-label">Description</IonLabel>
          <IonTextarea
            value={description}
            onIonChange={(e) => setDescription(e.detail.value!)}
            className = "input-field"
          />
        </IonItem>

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className= "add-item-label">Allergens (comma-separated)</IonLabel>
          <IonInput
            value={allergens.join(", ")}
            onIonChange={(e) =>
              setAllergens(
                e.detail.value!
                  .split(",")
                  .map((a) => a.trim())
                  .filter(Boolean)
              )
            }
            className = "input-field"
          />
        </IonItem>

       
        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className= "add-item-label">Note</IonLabel>
          <IonTextarea
            value={note}
            onIonChange={(e) => setNote(e.detail.value!)}
            className = "input-field"
          />
        </IonItem>

    
        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className= "add-item-label">Category</IonLabel>
          <IonInput
            value={category}
            onIonChange={(e) => setCategory(e.detail.value!)}
            className = "input-field"
          />
        </IonItem>

   
        <IonItem lines="none" className="form-item item-upload">
          <IonLabel position="stacked" className= "add-item-label">Image</IonLabel>
          <div className="image-form-wrap">
            <IonAvatar style={{ width: 100, height: 100, margin: "0 auto" }}>
              <IonImg src={imagePreview} alt="Preview" />
            </IonAvatar>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="img-up-btn"
            />
          </div>
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
