
import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonLabel,
  IonItem,
  IonInput,
  IonButton,
  IonAvatar,
  IonImg,
  IonIcon,
  IonToast,
} from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import {
  doc,
  collection,
  addDoc,
  setDoc
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { uploadImage } from "../services/storageService";
import { useImageUpload } from "../hooks/useImageUpload";
import { DISH_PLACEHOLDER } from "../constants";
import { pizzaOutline } from "ionicons/icons";
import "../styles/AddDishes.css"

interface Dish {
  id?: string;
  category: string;
  name: string;
  description: string;
  allergens: string[];
  note: string;
  imageUrl?: string;
}

const AddDishesPage: React.FC = () => {
  const { menuId } = useParams<{ menuId: string }>();
  const history = useHistory();

  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allergens, setAllergens] = useState("");
  const [note, setNote] = useState("");

  const {
    file: dishFile,
    previewUrl: dishPreview,
    handleFileChange: handleDishChange
  } = useImageUpload(DISH_PLACEHOLDER);


  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleSubmit = async () => {
    try {
    
      const allergenArray = allergens
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a);

      const dishData: Omit<Dish, "id"> = {
        category,
        name,
        description,
        allergens: allergenArray,
        note,
    
      };

      const userUid = auth.currentUser!.uid;
      const menuRef = doc(db, "users", userUid, "createdMenus", menuId);
      const dishesRef = collection(menuRef, "dishes");

  
      const newDishRef = await addDoc(dishesRef, dishData);
      const dishId = newDishRef.id;

    

      let finalImageUrl = dishPreview; // placeholder or last preview
      if (dishFile) {
        finalImageUrl = await uploadImage(
          dishFile,
          `profilePictures/${userUid}/createdMenus/${menuId}/dishes/${dishId}/menuItem.jpg`
        );
      }

     
      await setDoc(
        newDishRef,
        { id: dishId, imageUrl: finalImageUrl },
        { merge: true }
      );

      setToastMessage("Dish added!");
      setShowToast(true);
      history.push("/personalized-menu");
    } catch (err: any) {
      console.error(err);
      setToastMessage(`Error: ${err.message}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Menu Item</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding add-dishes-page">
        <div className="page-banner-row-add">
          <IonIcon icon = {pizzaOutline} slot="start"/>
          <h2>Add Menu Item</h2>
        </div>

        <IonList lines="none">
          <IonLabel className="dishes-lbl" position="stacked">Category</IonLabel>
          <IonItem className  = "dishes-item">
            <IonInput
              value={category}
              onIonChange={(e) => setCategory(e.detail.value!)}
            />
          </IonItem>

          <IonLabel className="dishes-lbl"  position="stacked">Name</IonLabel>
          <IonItem>
            <IonInput
              value={name}
              onIonChange={(e) => setName(e.detail.value!)}
            />
          </IonItem>

          <IonLabel  className="dishes-lbl"  position="stacked">Description</IonLabel>
          <IonItem>
            <IonInput
              value={description}
              onIonChange={(e) => setDescription(e.detail.value!)}
            />
          </IonItem>

          <IonLabel  className="dishes-lbl"  position="stacked">Allergens (comma-separated)</IonLabel>
          <IonItem>
            <IonInput
              value={allergens}
              onIonChange={(e) => setAllergens(e.detail.value!)}
            />
          </IonItem>

          <IonLabel  className="dishes-lbl"  position="stacked">Note</IonLabel>
          <IonItem>
            <IonInput
              value={note}
              onIonChange={(e) => setNote(e.detail.value!)}
            />
          </IonItem>

          <IonLabel  className="dishes-lbl"  position="stacked">Image</IonLabel>
          <div className = "upload-wrapper">
          <IonItem style={{ flexDirection: "column", alignItems: "center" }} lines="none" className = "dish-avatar-wrap">
            <IonAvatar style={{ width: 150, height: 150, marginBottom: 12, paddingTop:8 }}>
              <IonImg
                src={dishPreview}
                alt="Dish Preview"
                style={{ objectFit: "cover" }}
              />
            </IonAvatar> </IonItem> <IonItem>
            <div className = "dish-upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleDishChange}
              style={{ display: "none" }}
              id="dishFileInput"
            />
            <IonButton onClick={() => document.getElementById("dishFileInput")!.click()}>
              Choose File
            </IonButton></div>
          </IonItem></div>
        </IonList>

        <IonButton expand="block" onClick={handleSubmit}>
          Submit
        </IonButton>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddDishesPage;
