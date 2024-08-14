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
import { MenuItem } from "../services/menuService";
import { compressImage, uploadImage } from "../services/storageService"; // Import compression and upload functions
import "../styles/ModalStyles.css";

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (updatedItem: MenuItem) => void;
  initialItem?: MenuItem & { id?: string }; // Include id for editing
  restaurantName?: string;
}

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
  const [imageUrl, setImageUrl] = useState(""); // State for imageUrl
  const [imageFile, setImageFile] = useState<File | null>(null); // State for image file

  const nameRef = useRef("");
  const descriptionRef = useRef("");
  const allergensRef = useRef<string[]>([]);
  const noteRef = useRef("");
  const categoryRef = useRef("");
  const imageUrlRef = useRef("");

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setDescription(initialItem.description);
      setAllergens(initialItem.allergens);
      setNote(initialItem.note || "");
      setCategory(initialItem.category);
      setImageUrl(initialItem.imageUrl || "");

      nameRef.current = initialItem.name;
      descriptionRef.current = initialItem.description;
      allergensRef.current = initialItem.allergens;
      noteRef.current = initialItem.note || "";
      categoryRef.current = initialItem.category;
      imageUrlRef.current = initialItem.imageUrl || "";
    } else {
      setName("");
      setDescription("");
      setAllergens([]);
      setNote("");
      setCategory("");
      setImageUrl("");

      nameRef.current = "";
      descriptionRef.current = "";
      allergensRef.current = [];
      noteRef.current = "";
      categoryRef.current = "";
      imageUrlRef.current = "";
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
        imageDownloadUrl = await uploadImage(compressedFile, "menu_items");
        setImageUrl(imageDownloadUrl);
        imageUrlRef.current = imageDownloadUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    const updatedItem = {
      ...initialItem,
      name: nameRef.current,
      description: descriptionRef.current,
      allergens: allergensRef.current,
      note: noteRef.current,
      category: categoryRef.current,
      imageUrl: imageUrlRef.current,
    };

    onSaveItem(updatedItem);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {initialItem ? "Edit Menu Item" : "Add Menu Item"}
          </IonTitle>
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

        <IonItem lines="none" className="form-item">
          <IonLabel position="stacked" className="add-item-label">
            Image
            
          </IonLabel>{" "}
          {imageUrl && (
            <IonImg src={imageUrl} alt="Menu item" className="modal-image" />
          )}<input type="file" accept="image/*" onChange={handleImageChange} />
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
