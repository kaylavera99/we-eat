import React, { useState, useEffect } from "react";
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
  IonToast,
  IonIcon,
  IonList,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  addPreferredLocationForCreatedMenu,
  fetchZipCode,
} from "../services/restaurantLocationService";
import { useHistory, useLocation } from "react-router-dom";
import { uploadImage, compressImage } from "../services/storageService";
import { auth, db } from "../firebaseConfig";
import { doc, collection, setDoc } from "firebase/firestore";
import { createOutline } from "ionicons/icons";
import "../styles/CreateMenu.css";
import { searchRestaurants } from "../services/searchService";


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
  const location = useLocation<{ place: any }>();
  const place = location.state?.place;

  const [restaurantName, setRestaurantName] = useState(place?.name || "");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnail(event.target.files[0]);
    }
  };

  useEffect(() => {
    if (place) {
      setRestaurantName(place.name);
      const parts = place.vicinity?.split(", ");
      if (parts?.length === 2) {
        setStreetAddress(parts[0]);
        setCity(parts[1]);
      }
    }
  }, [place]);

  const handleSubmit = async () => {
  const fullAddress = `${streetAddress}, ${city}, ${state}, ${zipCode}`;

   try {
    // 1) Create the Firestore doc to get its ID
    const userDocRef = doc(db, "users", auth.currentUser!.uid);
    const createdMenusRef = collection(userDocRef, "createdMenus");
    const newMenuDocRef = doc(createdMenusRef);

    // 2) Prepare the thumbnailUrl
    let thumbnailUrl = "";

    if (thumbnail) {
      // user‐picked file
      const compressed = await compressImage(thumbnail);
      thumbnailUrl = await uploadImage(
        compressed,
        `profilePictures/${auth.currentUser!.uid}/createdMenus/${newMenuDocRef.id}/thumbnail.jpg`
      );
    } else if (place?.geometry && place.name) {
      // no file → fetch once from Google via proxy
      const results = await searchRestaurants(
        `${place.geometry.location.lat},${place.geometry.location.lng}`,
        1,
        place.name,
        { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
      );
      if (results.length > 0 && results[0].photoReference) {
        // build the proxy URL
        const proxyUrl = `https://proxy-server-we-eat-e24e32c11d10.herokuapp.com/photo?photoreference=${results[0].photoReference}&maxwidth=400`;
        // fetch the image bytes
        const res = await fetch(proxyUrl);
        const blob = await res.blob();
        // wrap in a File so uploadImage works
        const file = new File([blob], "thumbnail.jpg", { type: blob.type });
        // upload into your menuDocId folder
        thumbnailUrl = await uploadImage(
          file,
          `profilePictures/${auth.currentUser!.uid}/createdMenus/${newMenuDocRef.id}/thumbnail.jpg`
        );
      }
    }

    // 3) Persist your menu doc with that URL
    await setDoc(newMenuDocRef, { restaurantName, thumbnailUrl });

    // 4) Save preferred location & navigate
    await addPreferredLocationForCreatedMenu(restaurantName, fullAddress);
    setToastMessage("Restaurant details added successfully!");
    setShowToast(true);
    history.push(`/add-dishes/${newMenuDocRef.id}`);
  } catch (e: any) {
    setToastMessage(`Error: ${e.message}`);
    setShowToast(true);
  }
};
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="page-banner-row">
          <IonIcon slot="end" icon={createOutline} style={{ color: "black" }} />
          <h2>Create a Menu</h2>
        </div>
        <p className="create-menu-desc">
          First, let's add some information about the restaurant you're creating
          a menu for
        </p>
        <div className="create-menu-container">
          <IonList>
            <IonLabel position="stacked">Restaurant Name</IonLabel>
            <IonItem lines="none">
              <IonInput
                value={restaurantName}
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
            <IonItem
              className="state-item"
              lines="none"
              style={{ backgroundColor: "white" }}
            >
              <IonSelect
                slot="end"
                placeholder="Select State"
                value={state}
                onIonChange={(e) => setState(e.detail.value!)}
              >
                {states.map((stateObj) => (
                  <IonSelectOption
                    key={stateObj.code}
                    value={stateObj.name}
                    style={{ fontFamily: "--font-family-primary" }}
                  >
                    {stateObj.name}
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
            <IonLabel position="stacked">Thumbnail</IonLabel>
            <IonItem lines="none">
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </IonItem>
          </IonList>
        </div>
        <IonButton expand="block" onClick={handleSubmit}>
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

export default CreateMenuPage;
