import React, { useState, useEffect } from "react";
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
  IonSelect,
  IonSelectOption,
  IonRadioGroup,
  IonRadio,
  IonAvatar,
  IonImg,
  IonButton,
  IonIcon,
  IonToast,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { doc, collection, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { uploadImage } from "../services/storageService";
import { searchRestaurants } from "../services/searchService";
import { useImageUpload } from "../hooks/useImageUpload";
import { MENU_PLACEHOLDER } from "../constants";
import { createOutline } from "ionicons/icons";
import {
  addPreferredLocationForCreatedMenu,
  fetchZipCode,
} from "../services/restaurantLocationService";
import "../styles/CreateMenu.css"
interface Place {
  name: string;
  geometry: { location: { lat: number; lng: number } };
  vicinity?: string;
}
interface LocationState {
  place?: Place;
}

const states = [
  { name: "Alabama", code: "AL" },
  { name: "Alaska", code: "AK" },
  { name: "Arizona", code: "AZ" },
  { name: "Arkansas", code: "AR" },
  { name: "California", code: "CA" },
  { name: "Colorado", code: "CO" },
  { name: "Connecticut", code: "CT" },
  { name: "Delaware", code: "DE" },
  { name: "Florida", code: "FL" },
  { name: "Georgia", code: "GA" },
  { name: "Hawaii", code: "HI" },
  { name: "Idaho", code: "ID" },
  { name: "Illinois", code: "IL" },
  { name: "Indiana", code: "IN" },
  { name: "Iowa", code: "IA" },
  { name: "Kansas", code: "KS" },
  { name: "Kentucky", code: "KY" },
  { name: "Louisiana", code: "LA" },
  { name: "Maine", code: "ME" },
  { name: "Maryland", code: "MD" },
  { name: "Massachusetts", code: "MA" },
  { name: "Michigan", code: "MI" },
  { name: "Minnesota", code: "MN" },
  { name: "Mississippi", code: "MS" },
  { name: "Missouri", code: "MO" },
  { name: "Montana", code: "MT" },
  { name: "Nebraska", code: "NE" },
  { name: "Nevada", code: "NV" },
  { name: "New Hampshire", code: "NH" },
  { name: "New Jersey", code: "NJ" },
  { name: "New Mexico", code: "NM" },
  { name: "New York", code: "NY" },
  { name: "North Carolina", code: "NC" },
  { name: "North Dakota", code: "ND" },
  { name: "Ohio", code: "OH" },
  { name: "Oklahoma", code: "OK" },
  { name: "Oregon", code: "OR" },
  { name: "Pennsylvania", code: "PA" },
  { name: "Rhode Island", code: "RI" },
  { name: "South Carolina", code: "SC" },
  { name: "South Dakota", code: "SD" },
  { name: "Tennessee", code: "TN" },
  { name: "Texas", code: "TX" },
  { name: "Utah", code: "UT" },
  { name: "Vermont", code: "VT" },
  { name: "Virginia", code: "VA" },
  { name: "Washington", code: "WA" },
  { name: "West Virginia", code: "WV" },
  { name: "Wisconsin", code: "WI" },
  { name: "Wyoming", code: "WY" },
];

const CreateMenuPage: React.FC = () => {
  const { place } = useLocation<LocationState>().state || {};
  const history = useHistory();

  const [restaurantName, setRestaurantName] = useState(place?.name || "");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [mode, setMode] = useState<"google" | "upload">("google");

  const [googlePreview, setGooglePreview] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const {
    file: thumbnailFile,
    previewUrl: thumbnailPreview,
    handleFileChange: handleThumbnailChange,
  } = useImageUpload();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // prefill address from place.vicinity
  useEffect(() => {
    if (place?.vicinity) {
      const parts = place.vicinity.split(", ");
      if (parts.length >= 2) {
        setStreetAddress(parts[0]);
        setCity(parts[1]);
      }
    }
  }, [place]);

  // auto-fetch ZIP
  useEffect(() => {
    if (streetAddress && city && stateName) {
      fetchZipCode(streetAddress, city, stateName).then((zc) => {
        if (zc) setZipCode(zc);
      });
    }
  }, [streetAddress, city, stateName]);

  // when switching to google mode,  fetch one preview
  useEffect(() => {
    if (mode === "google" && place?.geometry) {
      setLoadingGoogle(true);
      const { lat, lng } = place.geometry.location;
      searchRestaurants(`${lat},${lng}`, 1, restaurantName, { lat, lng })
        .then((r) => {
          if (r[0]?.photoUrl) setGooglePreview(r[0].photoUrl);
        })
        .finally(() => setLoadingGoogle(false));
    }
  }, [mode, place, restaurantName]);

  const handleSubmit = async () => {
    const fullAddress = `${streetAddress}, ${city}, ${stateName}, ${zipCode}`;

    try {
      // reserve new Firestore ID
      const userDocRef = doc(db, "users", auth.currentUser!.uid);
      const menusRef = collection(userDocRef, "createdMenus");
      const newMenuDocRef = doc(menusRef);
      const menuId = newMenuDocRef.id;

      // decide which image to upload
      let thumbnailUrl = "";

      if (mode === "google" && googlePreview) {
        // download via proxy then re-upload
        const res = await fetch(googlePreview);
        const blob = await res.blob();
        const file = new File([blob], "thumbnail.jpg", { type: blob.type });
        thumbnailUrl = await uploadImage(
          file,
          `profilePictures/${auth.currentUser!.uid}/createdMenus/${menuId}/thumbnail.jpg`
        );
      } else if (mode === "upload" && thumbnailFile) {
        thumbnailUrl = await uploadImage(
          thumbnailFile,
          `profilePictures/${auth.currentUser!.uid}/createdMenus/${menuId}/thumbnail.jpg`
        );
      }

      // ensure folder exists by uploading placeholder if still empty
      if (!thumbnailUrl) {
        const phRes = await fetch(MENU_PLACEHOLDER);
        const phBlob = await phRes.blob();
        const phFile = new File([phBlob], "placeholder.jpg", {
          type: phBlob.type,
        });
        thumbnailUrl = await uploadImage(
          phFile,
          `profilePictures/${auth.currentUser!.uid}/createdMenus/${menuId}/thumbnail.jpg`
        );
      }

      // save menu doc
      await setDoc(newMenuDocRef, { restaurantName, thumbnailUrl });

      await addPreferredLocationForCreatedMenu(
        restaurantName,
        fullAddress
      );
      setToastMessage("Restaurant created—now add dishes!");
      setShowToast(true);
      history.push(`/add-dishes/${menuId}`);
    } catch (err: any) {
      setToastMessage(`Error: ${err.message}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div className="page-banner-row">
              <IonIcon icon={createOutline} slot="start" />
              Create a Menu
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding create-menu-page">
        <div className="page-banner-row">
          <IonIcon slot="end" icon={createOutline} style={{ color: "black" }} />
          <h2>Create a Menu</h2>
        </div>
        <p className="create-menu-desc">
          First, add info about the restaurant you’re creating a menu for.
        </p>

        <IonList lines="none" className="create-menu-container">
          <IonLabel position="stacked">Restaurant Name</IonLabel>
          <IonItem lines="none">
            <IonInput
              value={restaurantName}
              placeholder="e.g. Pasta Palace"
              onIonChange={(e) => setRestaurantName(e.detail.value!)}
            />
          </IonItem>

          <IonLabel position="stacked">Street Address</IonLabel>
          <IonItem lines="none">
            <IonInput
              value={streetAddress}
              onIonChange={(e) => setStreetAddress(e.detail.value!)}
            />
          </IonItem>

          <IonLabel position="stacked">City</IonLabel>
          <IonItem lines="none">
            <IonInput
              value={city}
              onIonChange={(e) => setCity(e.detail.value!)}
            />
          </IonItem>

          <IonLabel position="stacked">State</IonLabel>
          <IonItem lines="none">
            <IonSelect
              value={stateName}
              placeholder="Select State"
              onIonChange={(e) => setStateName(e.detail.value!)}
            >
              {states.map((s) => (
                <IonSelectOption key={s.code} value={s.name}>
                  {s.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonLabel position="stacked">Zip Code</IonLabel>
          <IonItem lines="none">
            <IonInput
              value={zipCode}
              onIonChange={(e) => setZipCode(e.detail.value!)}
            />
          </IonItem>
        </IonList>

        <div className="thumbnail-section">
          <IonLabel>Restaurant Thumbnail</IonLabel>
          <IonRadioGroup
            value={mode}
            onIonChange={(e) => setMode(e.detail.value as "google" | "upload")}
          >
            <IonItem lines="none">
              <IonRadio slot="start" value="google" />
              <IonLabel>Fetch from Google</IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonRadio slot="start" value="upload" />
              <IonLabel>Upload Image</IonLabel>
            </IonItem>
          </IonRadioGroup>
        </div>

        {mode === "upload" && (
          <div className="preview-wrap">
            <IonLabel position = "stacked">Preview</IonLabel>
            <IonItem lines="none" className=" image-form-wrap">
              <IonAvatar className="preview-avatar">
                <IonImg
                  src={thumbnailPreview || MENU_PLACEHOLDER}
                  alt="Thumbnail Preview"
                />
              </IonAvatar></IonItem>
            <IonItem>
            <div className="upload-btn-wrap">
              <input
                id="thumbInput"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                style={{ display: "none" }}
                className="img-up-btn"
              />
              <IonButton
                className="img-up-btn button"
                onClick={() => document.getElementById("thumbInput")!.click()}
              >
                Choose File
              </IonButton></div>
            </IonItem>
          </div>
        )}

        <IonButton expand="block" className="next-btn" onClick={handleSubmit}>
          Next
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

export default CreateMenuPage;