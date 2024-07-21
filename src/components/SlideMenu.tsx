import React from 'react';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonMenuToggle,
  IonFooter,
  IonIcon
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { documentOutline, homeOutline, homeSharp, logOutOutline, person, readerOutline, restaurant, restaurantOutline, searchOutline, thumbsUp, thumbsUpOutline } from 'ionicons/icons';

const SlideMenu: React.FC = () => {
  const history = useHistory();

  const navigateTo = (path: string) => {
    history.push(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      history.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <IonMenu contentId="main-content">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonMenuToggle auto-hide="false">
            <IonItem button onClick={() => navigateTo('/home')}>
              <IonLabel><IonIcon icon= {homeSharp}/>Home</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem button onClick={() => navigateTo('/search')}>
              <IonLabel><IonIcon icon= {searchOutline}/>Search</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem button onClick={() => navigateTo('/profile')}>
              <IonLabel><IonIcon icon= {person}/>Profile</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem button onClick={() => navigateTo('/personalized-menu')}>
              <IonLabel><IonIcon icon= {restaurantOutline}/>Your Menus</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem button onClick={() => navigateTo('/create-menu')}>
              <IonLabel><IonIcon icon= {documentOutline}/>Create a Menu</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem button onClick={() => navigateTo('/recommendations')}>
              <IonLabel><IonIcon icon= {thumbsUp}/>Recommendations</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
      <IonFooter>
        <IonList>
          <IonItem button onClick={handleLogout}>
            <IonLabel>Log Out<IonIcon icon= {logOutOutline}/></IonLabel>
          </IonItem>
        </IonList>
      </IonFooter>
    </IonMenu>
  );
};

export default SlideMenu;
