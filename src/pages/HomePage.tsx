// src/pages/HomePage.tsx

import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonLoading,
  IonToast,
  IonButton,
} from '@ionic/react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchUserName = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setName(userData.name);
          }
        }
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchUserName();
  }, []);

  const goToSearchPage = () => {
    history.push('/search');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <div>
            <h2>Welcome, {name}!</h2>
            <IonButton expand="block" onClick={goToSearchPage}>
              Search Restaurants
            </IonButton>
          </div>
        )}
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

export default HomePage;
