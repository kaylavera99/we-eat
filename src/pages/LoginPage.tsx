import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonToast,
  IonRow,
  IonCol,
  IonInputPasswordToggle,
  IonText,
} from "@ionic/react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useHistory } from "react-router-dom";

import { auth } from "../firebaseConfig";
import "../styles/LoginPage.css";
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission behavior

    // Debug logging to see the current state values
    console.log("Email:", email);
    console.log("Password:", password);

    if (!email || !password) {
      setToastMessage("Email and password are required.");
      setShowToast(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to home page or any other page after successful login
    } catch (error: any) {
      setToastMessage(`Login failed: ${error.message}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage className="login-content" style={{ background: "#c5d9d0" }}>
      <IonHeader></IonHeader>
      <IonContent
        className="ion-padding login-content"
        style={{ "--background": "var(--ion-color-primary)" }}
      >
        <div className="login-form-container">
          <img
            src="/assets/WeEat_logo_transparent.png"
            alt="WeEat Logo"
            className="login-logo"
          />
          <form onSubmit={handleLogin}>
            <IonLabel className="login-lbl" position="stacked">
              Email
            </IonLabel>
            <IonItem className="login-item">
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                required
              />
            </IonItem>{" "}
            <IonLabel className="login-lbl" position="stacked">
              Password
            </IonLabel>
            <IonItem className="login-item">
              <IonInput
                type="password"
                value={password}
                onIonInput={(e: any) => setPassword(e.target.value)}
                required
              >
                <IonInputPasswordToggle slot="end"></IonInputPasswordToggle>
              </IonInput>
            </IonItem>
            <IonRow style={{ justifyContent: "flex-end" }}>
              <IonText
                className="forgot-password-link"
                onClick={() => history.push("/password-reset")}
              >
                Forgot Password?
              </IonText>
            </IonRow>
            <IonButton
              className="secondary-button"
              style={{ "--background": "var(--ion-color-secondary)" }}
              expand="block"
              type="submit"
            >
              Login
            </IonButton>
            <IonButton
              expand="block"
              style={{ "--background": "var(--ion-color-light" }}
              fill="default"
              onClick={() => history.push("/create-account")}
            >
              Create Account
            </IonButton>
          </form>

          <IonToast
            isOpen={showToast}
            message={toastMessage}
            duration={2000}
            onDidDismiss={() => setShowToast(false)}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
