import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonLoading } from '@ionic/react';
import { getRecommendations } from '../services/menuService';
import { SavedMenu } from '../services/menuService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<SavedMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        console.log("User is authenticated: ", user);
        fetchRecommendations(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchRecommendations = async (userId: string) => {
    console.log("Fetching recommendations for user ID: ", userId);
    const recs = await getRecommendations(userId);
    console.log("Fetched recommendations: ", recs);
    setRecommendations(recs);
    setLoading(false);
  };

  if (loading) {
    return <IonLoading isOpen={loading} message="Loading recommendations..." />;
  }

  return (
    <IonPage>
      <IonContent>
        <IonList>
          {recommendations.map((menu, index) => (
            <IonItem key={index}>
              <IonLabel>{menu.restaurantName}</IonLabel>
              <IonList>
                {menu.dishes.map((dish, dishIndex) => (
                  <IonItem key={dishIndex}>
                    <IonLabel>{dish.name}</IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default RecommendationsPage;
