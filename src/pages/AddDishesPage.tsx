import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonLabel,
  IonItem,
  IonIcon,
  IonToast,
  IonList,
  IonImg,
} from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import { doc, collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { uploadImage, compressImage } from "../services/storageService";
import "../styles/AddDishes.css";
import { pizzaOutline } from "ionicons/icons";

interface Dish {
  category: string;
  name: string;
  description: string;
  allergens: string[];
  note: string;
  imageUrl?: string;
}
const placeholderImage = "https://firebasestorage.googleapis.com/v0/b/weeat-1a169.appspot.com/o/restaurants%2Fplaceholder%20(1).webp?alt=media&token=0754de15-1a71-4da8-9ad0-8e88fffc0875";
const AddDishesPage: React.FC = () => {
  const { menuId } = useParams<{ menuId: string }>(); // Use menuId from URL
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allergens, setAllergens] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState<File | null>(null); // new state for dish image
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(placeholderImage);

  const history = useHistory();



  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);

      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const handleSubmit = async () => {
    const allergensArray = allergens.split(",").map((a) => a.trim());
    let imageUrl = imagePreviewUrl || placeholderImage;

    try {
      if (image && auth.currentUser) {
        const compressedImage = await compressImage(image);
        imageUrl = await uploadImage(
          compressedImage,
          `profilePictures/${auth.currentUser.uid}/createdMenus/${menuId}/menuItems/${name}`
        );
      }

      console.log('This is the image Url', imageUrl)

      const dish: Dish = {
        category,
        name,
        description,
        allergens: allergensArray,
        note,
        imageUrl,
      };

      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const createdMenusRef = collection(userDocRef, "createdMenus");
        const newMenuDocRef = doc(createdMenusRef, menuId);
        const dishesRef = collection(newMenuDocRef, "dishes");

        console.log('Dish to be added:', dish);

        await addDoc(dishesRef, dish);
      }

      setShowToast(true);
      setToastMessage("Dish added successfully!");
      history.push("/personalized-menu");
    } catch (error) {
      setShowToast(true);
      setToastMessage(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Dishes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="page-banner-row-add">
          <IonIcon slot="end" className="menu-icon" icon={pizzaOutline} />
          <h2>Add Menu Item</h2>
        </div>
        <IonList lines="none">
          <IonLabel className="dishes-lbl">Category</IonLabel>
          <IonItem className="dishes-item">
            <IonInput
              value={category}
              onIonChange={(e) => setCategory(e.detail.value!)}
            />
          </IonItem>
          <IonLabel className="dishes-lbl" position="stacked">
            Name
          </IonLabel>
          <IonItem className="dishes-item">
            <IonInput
              className="dishes-input"
              value={name}
              onIonChange={(e) => setName(e.detail.value!)}
            />
          </IonItem>
          <IonLabel className="dishes-lbl" position="stacked">
            Description
          </IonLabel>
          <IonItem className="dishes-item">
            <IonInput
              value={description}
              onIonChange={(e) => setDescription(e.detail.value!)}
            />
          </IonItem>
          <IonLabel className="dishes-lbl" position="stacked">
            Allergens
          </IonLabel>
          <IonItem className="dishes-item">
            <IonInput
              value={allergens}
              onIonChange={(e) => setAllergens(e.detail.value!)}
            />
          </IonItem>
          <IonLabel className="dishes-lbl" position="stacked">
            Notes
          </IonLabel>
          <IonItem className="dishes-item">
            <IonInput value={note} onIonChange={(e) => setNote(e.detail.value!)} />
          </IonItem>
          <IonLabel className="dishes-lbl" position="stacked">
            Image
          </IonLabel>
          <div className="dish-image-wrapper">
          {imagePreviewUrl && (
              <div className="dish-img-item">
                <IonImg className="dish-img" src={imagePreviewUrl} alt="Dish Image Preview" />
              </div>
            )}
            <div className="upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input-btn"
                id="fileInput"
                style={{ display: "none" }}
              />
              <IonButton
                onClick={() => document.getElementById("fileInput")?.click()}
                className="custom-upload-btn"
              >
                Choose File
              </IonButton>
            </div>
          </div>
        </IonList>
        <IonButton expand="block" className="secondary-button" onClick={handleSubmit}>
          Submit
        </IonButton>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddDishesPage;
