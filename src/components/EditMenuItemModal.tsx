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
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { MenuItem } from "../services/menuService";
import { compressImage, uploadImage } from "../services/storageService";
import "../styles/ModalStyles.css";

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (updatedItem: MenuItem) => void;
  initialItem?: MenuItem;
  restaurantName?: string;
}

const placeholderImage =
  "https://firebasestorage.googleapis.com/v0/b/weeat-1a169.appspot.com/o/restaurants%2Fplaceholder%20(1).webp?alt=media&token=0754de15-1a71-4da8-9ad0-8e88fffc0875";

const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  initialItem,
  restaurantName,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState(placeholderImage); // default to placeholder image
  const [imageFile, setImageFile] = useState<File | null>(null); // state for image file

  const nameRef = useRef(name);
  const descriptionRef = useRef(description);
  const allergensRef = useRef(allergens);
  const noteRef = useRef(note);
  const categoryRef = useRef(category);
  const imageUrlRef = useRef(imageUrl);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDescription(initialItem.description);
      setAllergens(initialItem.allergens);
      setNote(initialItem.note || "");
      setCategory(initialItem.category);
      setImageUrl(initialItem.imageUrl || placeholderImage);

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
      setImageUrl(placeholderImage);
    }
  }, [initialItem]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);

      const previewUrl = URL.createObjectURL(file);
      setImageUrl(previewUrl);
      imageUrlRef.current = previewUrl;
    }
  };

  const handleSave = async () => {
    let imageDownloadUrl = imageUrlRef.current;

    if (imageFile) {
      try {
        const compressedFile = await compressImage(imageFile);
        imageDownloadUrl = await uploadImage(compressedFile, "menu_items");
        setImageUrl(imageDownloadUrl);
        imageUrlRef.current = imageDownloadUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        return;
      }
    }

    if (!restaurantName || !initialItem?.id) {
      console.error(
        "Required values (restaurantName, initialItem.id) are undefined."
      );
      return;
    }

    //   updated item with  fields using refs
    const updatedItem = {
      ...initialItem,
      name: nameRef.current,
      description: descriptionRef.current,
      allergens: allergensRef.current,
      note: noteRef.current,
      category: categoryRef.current,
      imageUrl: imageUrlRef.current,
    };

    try {
      const userUid = auth.currentUser?.uid;

      if (!userUid) {
        console.error("User not authenticated.");
        return;
      }

      const userDocRef = doc(db, "users", userUid);
      const createdMenusRef = collection(userDocRef, "createdMenus");

      const encodedRestaurantName = decodeURIComponent(restaurantName);

      const q = query(
        createdMenusRef,
        where("restaurantName", "==", encodedRestaurantName)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Restaurant menu not found.");
      }

      const restaurantDocRef = querySnapshot.docs[0].ref;
      const dishesCollectionRef = collection(restaurantDocRef, "dishes");
      const menuItemDocRef = doc(dishesCollectionRef, initialItem.id!);

      await updateDoc(menuItemDocRef, updatedItem);
      onSaveItem(updatedItem);
      onClose();
    } catch (error) {
      console.error("Error saving menu item to Firestore:", error);
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
            {imageUrl && (
              <IonImg src={imageUrl} alt="Menu item" className="modal-image" />
            )}
            <input
              type="file"
              className="img-up-btn"
              accept="image/*"
              onChange={handleImageChange}
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
