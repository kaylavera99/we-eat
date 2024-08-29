import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonLoading,
  IonToast,
} from "@ionic/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsLoading(false);
      setToastMessage("Password reset email sent!");
      setShowToast(true);
      history.push("/login");
    } catch (error: any) {
      setIsLoading(false);
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Password Reset</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonButton expand="full" onClick={handleReset}>
          Reset Password
        </IonButton>
        <IonLoading isOpen={isLoading} message="Sending reset email..." />
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

export default PasswordResetPage;
