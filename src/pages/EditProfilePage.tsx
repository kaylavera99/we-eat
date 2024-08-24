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
  IonIcon
} from "@ionic/react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { uploadImage, compressImage } from "../services/storageService";
import "../styles/EditProfilePage.css";
import {personCircleSharp} from 'ionicons/icons';

interface AllergenState {
  eggs: boolean;
  wheat: boolean;
  dairy: boolean;
  soy: boolean;
  tree_nuts: boolean;
  fish: boolean;
  shellfish: boolean;
  peanuts: boolean;
  gluten: boolean;
}

const EditProfilePage: React.FC = () => {
  const [allergens, setAllergens] = useState<AllergenState>({
    eggs: false,
    wheat: false,
    dairy: false,
    soy: false,
    tree_nuts: false,
    fish: false,
    shellfish: false,
    peanuts: false,
    gluten: false,
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const docRef = doc(db, "users", auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const allergenData = userData.allergens || {};
            setAllergens({
              eggs: Boolean(allergenData.eggs),
              wheat: Boolean(allergenData.wheat),
              dairy: Boolean(allergenData.dairy),
              soy: Boolean(allergenData.soy),
              tree_nuts: Boolean(allergenData.tree_nuts),
              fish: Boolean(allergenData.fish),
              shellfish: Boolean(allergenData.shellfish),
              peanuts: Boolean(allergenData.peanuts),
              gluten: Boolean(allergenData.gluten),
            });
            setProfileImageUrl(userData.profileImageUrl);
            setFirstName(userData.firstName || "");
            setLastName(userData.lastName || "");
            setAddress(userData.address || "");
          }
        }
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchUserData();
  }, []);

  const handleAllergenChange = (allergen: keyof AllergenState) => {
    setAllergens((prevAllergens) => ({
      ...prevAllergens,
      [allergen]: !prevAllergens[allergen],
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImage(file);

      const localImageUrl = URL.createObjectURL(file);
      setProfileImageUrl(localImageUrl);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        let updatedProfileImageUrl = profileImageUrl;

        if (profileImage) {
          const compressedImage = await compressImage(profileImage);
          updatedProfileImageUrl = await uploadImage(
            compressedImage,
            auth.currentUser.uid
          );
        }

        const updatedAllergens = {
          eggs: Boolean(allergens.eggs),
          wheat: Boolean(allergens.wheat),
          dairy: Boolean(allergens.dairy),
          soy: Boolean(allergens.soy),
          tree_nuts: Boolean(allergens.tree_nuts),
          fish: Boolean(allergens.fish),
          shellfish: Boolean(allergens.shellfish),
          peanuts: Boolean(allergens.peanuts),
          gluten: Boolean(allergens.gluten),
        };

        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          firstName,
          lastName,
          address,
          allergens: updatedAllergens,
          profileImageUrl: updatedProfileImageUrl,
        });

        setIsLoading(false);
        setToastMessage("Profile updated successfully!");
        setShowToast(true);
        history.push("/profile");
      }
    } catch (error: any) {
      setIsLoading(false);
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
      <div className='page-banner-row'>
          <IonIcon slot="end" icon={personCircleSharp} style={{ color: 'black' }} />
          <h2>Edit Profile</h2>
        </div>
        <IonLabel position="stacked" className="input-field-profile">
          Profile Picture
        </IonLabel>
        <IonItem lines="none" className="flex-column">
          <div className = 'profile-container'>
  <div className="image-wrapper">
    {profileImageUrl && (
      <IonAvatar style={{ width: "100px", height: "100px", objectFit: "cover" }}>
        <IonImg src={profileImageUrl} alt="Profile Picture" />
      </IonAvatar>
    )}
  </div>
  <div className="upload-wrapper">
    <input
      type="file"
      accept="image/*"
      onChange={handleImageChange}
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
  </div></div>
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
        <div className="allergens-content-profile">
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.eggs}
              onIonChange={() => handleAllergenChange("eggs")}
            />
            <IonLabel className="input-field-profile">Eggs</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.gluten}
              onIonChange={() => handleAllergenChange("gluten")}
            />
            <IonLabel className="input-field-profile">Gluten</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.wheat}
              onIonChange={() => handleAllergenChange("wheat")}
            />
            <IonLabel className="input-field-profile">Wheat</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.dairy}
              onIonChange={() => handleAllergenChange("dairy")}
            />
            <IonLabel className="input-field-profile">Dairy</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.soy}
              onIonChange={() => handleAllergenChange("soy")}
            />
            <IonLabel className="input-field-profile">Soy</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.tree_nuts}
              onIonChange={() => handleAllergenChange("tree_nuts")}
            />
            <IonLabel className="input-field-profile">Tree Nuts</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.fish}
              onIonChange={() => handleAllergenChange("fish")}
            />
            <IonLabel className="input-field-profile">Fish</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={allergens.shellfish}
              onIonChange={() => handleAllergenChange("shellfish")}
            />
            <IonLabel className="input-field-profile">Shellfish</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonCheckbox
              mode="ios"
              slot="start"
              checked={allergens.peanuts}
              onIonChange={() => handleAllergenChange("peanuts")}
            />
            <IonLabel className="input-field-profile">Peanuts</IonLabel>
          </IonItem>
        </div>
        <IonButton expand="full" className = 'save-edit'onClick={handleSave}>
          Save
        </IonButton>
        <IonLoading isOpen={isLoading} message="Saving profile..." />
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
