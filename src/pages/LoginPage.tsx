import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
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
  IonToast
} from '@ionic/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  const handleLogin = async () => {
    setIsLoading(true);
    console.log('Attempting to log in with email:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();  // Get the ID token
      localStorage.setItem('authToken', token);  // Store the token in local storage
      console.log('Login successful, token:', token);
      setIsLoading(false);
      history.push('/home');
    } catch (error: any) {
      console.error('Login failed:', error.message);
      setIsLoading(false);
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonItem>
          <IonLabel position="floating">Email</IonLabel>
          <IonInput
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonChange={(e) => setPassword(e.detail.value!)}
          />
        </IonItem>
        <IonButton expand="full" onClick={handleLogin}>
          Login
        </IonButton>
        <IonLoading isOpen={isLoading} message="Logging in..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
        <div className="ion-text-center">
          <p>
            <Link to="/create-account">Create Account</Link>
          </p>
          <p>
            <Link to="/password-reset">Forgot Password?</Link>
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
