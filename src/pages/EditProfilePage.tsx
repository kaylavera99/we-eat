import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonButton,
  IonLoading,
  IonToast,
  IonImg,
  IonInput,
  IonAvatar,
  IonIcon,
} from "@ionic/react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { uploadImage } from "../services/storageService";
import { useImageUpload } from "../hooks/useImageUpload";
import "../styles/EditProfilePage.css";
import { personCircleSharp } from "ionicons/icons";
import { useAllergens } from "../hooks/useAllergens";
import { DEFAULT_ALLERGENS_STATE } from "../types/user";


const EditProfilePage: React.FC = () => {
  const { file: profileImage, previewUrl: profilePreview, handleFileChange} = useImageUpload();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();
  const { allergens, setAllergen } = useAllergens(DEFAULT_ALLERGENS_STATE);

    useEffect(() => {
    (async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const ref = doc(db, "users", auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setAddress(data.address || "");
          setProfileImageUrl(data.profileImageUrl || null);

          if (data.allergens) {
            (Object.entries(data.allergens) as Array<
              [keyof typeof DEFAULT_ALLERGENS_STATE, any]
            >).forEach(([k, v]) => {
              setAllergen(k, Boolean(v));
            });
          }
        }
      } catch (e: any) {
        console.error(e);
        setToastMessage(e.message);
        setShowToast(true);
      }
      setLoading(false);
    })();
  }, [setAllergen]);




  const handleSave = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        let updatedProfileImageUrl = profileImageUrl;

        if (profileImage) {
          updatedProfileImageUrl = await uploadImage(profileImage, `profilePictures/${auth.currentUser.uid}/profile-jpg`)

        }
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          firstName,
          lastName,
          address,
          allergens,
          profileImageUrl: updatedProfileImageUrl,
        });

        setLoading(false);
        setToastMessage("Profile updated successfully!");
        setShowToast(true);
        history.push("/profile");
      }
    } catch (error: any) {
      setLoading(false);
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="page-banner-row">
          <IonIcon
            slot="end"
            icon={personCircleSharp}
            style={{ color: "black" }}
          />
          <h2>Edit Profile</h2>
        </div>
        <IonLabel position="stacked" className="input-field-profile">
          Profile Picture
        </IonLabel>
        <IonItem lines="none" className="flex-column">
          <div className="profile-container">
            <div className="image-wrapper">
              {profileImageUrl && (
                <IonAvatar
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                  }}
                >
                  <IonImg src ={profilePreview || profileImageUrl } alt="Profile Picture" />
                </IonAvatar>
              )}
            </div>
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
        </IonItem>
        <IonLabel position="stacked" className="input-field-profile">
          First Name
        </IonLabel>
        <IonItem lines="none" className="flex-column">
          <IonInput
            value={firstName}
            onIonChange={(e) => setFirstName(e.detail.value!)}
          />
        </IonItem>
        <IonLabel position="stacked" className="input-field-profile">
          Last Name
        </IonLabel>
        <IonItem lines="none" className="flex-column">
          <IonInput
            value={lastName}
            onIonChange={(e) => setLastName(e.detail.value!)}
          />
        </IonItem>{" "}
        <IonLabel position="stacked" className="input-field-profile">
          Location
        </IonLabel>
        <IonItem lines="none" className="flex-column">
          <IonInput
            value={address}
            onIonChange={(e) => setAddress(e.detail.value!)}
          />
        </IonItem>
        <h3>Allergens</h3>
        {(
          Object.keys(DEFAULT_ALLERGENS_STATE) as Array<keyof typeof DEFAULT_ALLERGENS_STATE>
        ).map((key) => (
          <IonItem lines="none" key={key}>
            <IonCheckbox
              slot="start"
              checked={allergens[key]}
              onIonChange={e => setAllergen(key, e.detail.checked)}
            />
            <IonLabel>{key.replace("_", " ")}</IonLabel>
          </IonItem>
        ))}
        
        <IonButton expand="full" className="save-edit" onClick={handleSave}>
          Save
        </IonButton>
        <IonLoading isOpen={loading} message="Saving profile..." />
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

export default EditProfilePage;
