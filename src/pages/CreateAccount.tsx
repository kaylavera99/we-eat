import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonLoading,
  IonToast,
  IonCheckbox,
  IonAvatar,
  IonImg,
  IonInputPasswordToggle,
} from "@ionic/react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { uploadImage } from "../services/storageService";
import { useImageUpload } from "../hooks/useImageUpload";
import "../styles/CreateAccountPage.css";
import useCustomPadding from "../hooks/useCustomPadding";
import { PROFILE_PLACEHOLDER } from "../constants";
import { DEFAULT_ALLERGENS_STATE } from "../types/user";
import {useAllergens} from '../hooks/useAllergens';


const CreateAccountPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const {allergens,setAllergen} = useAllergens(DEFAULT_ALLERGENS_STATE);

  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const {file: profileFile, previewUrl: profilePreview, handleFileChange: handleProfileChange } = useImageUpload(PROFILE_PLACEHOLDER);
  const history = useHistory();

  const handleRegister = async () => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!password.match(passwordRegex)) {
      setPasswordError(
        "Password must contain at least 6 characters, including letters and numbers. Password cannot contain special characters"
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError("");
    if (!agreedToTerms) {
      setShowTermsError(true);
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      let profileImageUrl = PROFILE_PLACEHOLDER;

      if (profileFile) {
        
        profileImageUrl = await uploadImage(profileFile, `profilePictures/${user.uid}/profile-jpg`);
      }

      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        address,
        allergens,
        profileImageUrl,
      });

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (userDocSnap.exists()) {
        history.push("/home");
      } else {
        setToastMessage("Failed to load user data. Please try again.");
        setShowToast(true);
      }
    } catch (error: any) {
      setIsLoading(false);
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  useCustomPadding("#createAccountContent", "30px", "25px");

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="head-bar">
            <img
              src="/assets/WeEat_logo_transparent.webp"
              alt="WeEat Logo"
              className="create-account-img"
            />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent id="createAccountContent" className="ion-padding">
        <h1 className="pageTitle">Account Registration</h1>
        <IonLabel position="stacked">First Name</IonLabel>

        <IonItem lines="none" className="flex-column-item">
          <IonInput
            type="text"
            value={firstName}
            onIonChange={(e) => setFirstName(e.detail.value!)}
          />
        </IonItem>
        <IonLabel position="stacked">Last Name</IonLabel>

        <IonItem lines="none" className="flex-column-item">
          <IonInput
            type="text"
            value={lastName}
            onIonChange={(e) => setLastName(e.detail.value!)}
          />
        </IonItem>
        <IonLabel position="stacked">Email</IonLabel>

        <IonItem lines="none" className="flex-column-item">
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonLabel position="stacked">Password</IonLabel>

        <IonItem lines="none" className="flex-column-item">
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
          >
            <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
          </IonInput>
        </IonItem>
        <IonLabel position="stacked">Re-type Password</IonLabel>

        <IonItem lines="none" className="flex-column-item">
          <IonInput
            type="password"
            value={confirmPassword}
            onIonChange={(e) => setConfirmPassword(e.detail.value!)}
          >
            <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
          </IonInput>
        </IonItem>

        {passwordError && (
          <p className="error-message" style={{ color: "red" }}>
            {passwordError}
          </p>
        )}
        <IonLabel position="stacked">Address</IonLabel>
        <IonItem lines="none" className="flex-column-item">
          <IonInput
            type="text"
            value={address}
            onIonChange={(e) => setAddress(e.detail.value!)}
          />
        </IonItem>
        <IonLabel position="stacked">Profile Picture</IonLabel>

        <IonItem
          lines="none"
          className="flex-item"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div className="flex-column">
            <div className="image-wrapper">
              
                <IonAvatar className = "profile-picture"   style={{
                    width: "250px",
                    height: "250px",
                    objectFit: "cover",
                  }}>

                
                <IonImg src={profilePreview || PROFILE_PLACEHOLDER} alt="Profile Picture" />
                </IonAvatar>
              
            </div>
            <div className="upload-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileChange}
                className="input-btn"
                id="fileInput"
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

        <h3>Allergens</h3>

        <div className="allergens-content">
          <IonItem lines="none" className="flex-column-item">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "1rem",
                marginBottom: "1rem",
              }}
            >
              <IonCheckbox
                className="check-round"
                name="wheat"
                mode="ios"
                checked={allergens.wheat || false}
                onIonChange={e => setAllergen("wheat", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Wheat</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="dairy"
                checked={allergens.dairy || false}
                onIonChange={e => setAllergen("dairy", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Dairy</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="tree_nuts"
                checked={allergens.tree_nuts || false}
                onIonChange={e => setAllergen("tree_nuts", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Tree Nuts</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="shellfish"
                checked={allergens.shellfish || false}
                onIonChange={e => setAllergen("shellfish", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Shellfish</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="fish"
                checked={allergens.fish || false}
                onIonChange={e => setAllergen("fish", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Fish</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="soy"
                checked={allergens.soy || false}
                onIonChange={e => setAllergen("soy", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Soy</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="eggs"
                checked={allergens.eggs || false}
                onIonChange={e => setAllergen("eggs", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Eggs</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="peanuts"
                checked={allergens.peanuts || false}
                onIonChange={e => setAllergen("peanuts", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Peanuts</IonLabel>
            </div>
          </IonItem>

          <IonItem lines="none" className="flex-column-item">
            <div style={{ display: "flex", alignItems: "center" }}>
              <IonCheckbox
                name="gluten"
                checked={allergens.gluten || false}
                onIonChange={e => setAllergen("gluten", e.detail.checked)}
              />
              <IonLabel style={{ marginLeft: "0.5rem" }}>Gluten</IonLabel>
            </div>
          </IonItem>
        </div>

        <div className="terms-container">
          <h3>Terms & Conditions</h3>
          <div className="terms-content">
            <p>
              <strong>WeEat </strong>provides allergen information sourced from
              publicly available data on each restaurant's official website.
              While we strive to ensure accuracy, <strong>WeEat</strong> is not
              responsible for any instances of cross-contamination or
              inaccuracies in the provided information. Users are encouraged to
              verify allergen details directly with the restaurant to ensure
              their safety.
            </p>
            <div className="check-row">
              <IonCheckbox
                checked={agreedToTerms}
                onIonChange={(e) => {
                  setAgreedToTerms(e.detail.checked);
                  setShowTermsError(!e.detail.checked);
                }}
              />
              <IonLabel className="agree-text">
                I agree to the <a href="/terms">Terms and Conditions</a>
              </IonLabel>
            </div>
          </div>
        </div>

        {showTermsError && (
          <p className="error-message">
            You must agree to the terms and conditions before creating an
            account.
          </p>
        )}

        <IonButton
          className="primary-button"
          expand="block"
          onClick={handleRegister}
          style={{
            "--background": "var(--ion-color-secondary)",
            bprderRadius: "20px",
          }}
        >
          Register
        </IonButton>
        <IonLoading isOpen={isLoading} message="Creating account..." />
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

export default CreateAccountPage;
