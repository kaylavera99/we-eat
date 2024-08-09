import React from 'react';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonMenu,
  IonMenuToggle,
  IonFooter,
  IonIcon
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { homeSharp, logOutOutline, person, restaurantOutline, searchOutline, compassOutline, createOutline } from 'ionicons/icons';
import '../styles/SlideMenu.css';
import useDisableScroll from '../hooks/useDisableScroll';

const SlideMenu: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  useDisableScroll('ion-menu ion-content'); // Use the custom hook


  const navigateTo = (path: string) => {
    history.push(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      history.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <IonMenu contentId="main-content" className="custom-menu">

      <IonContent className="custom-content">
      <IonList className="menu-list">
          <IonMenuToggle auto-hide="false">
            <IonItem 
              className={`slide-item ${location.pathname === '/home' ? 'active' : ''}`} 
              button 
              onClick={() => navigateTo('/home')}
            >
              <IonIcon slot="start" icon={homeSharp} />
              <IonLabel>Home</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem 
              className={`slide-item ${location.pathname === '/search' ? 'active' : ''}`} 
              button 
              onClick={() => navigateTo('/search')}
            >
              <IonIcon slot="start" icon={searchOutline} />
              <IonLabel>Search</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem 
              className={`slide-item ${location.pathname === '/profile' ? 'active' : ''}`} 
              button 
              onClick={() => navigateTo('/profile')}
            >
              <IonIcon slot="start" icon={person} />
              <IonLabel>Profile</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem 
              className={`slide-item ${location.pathname === '/personalized-menu' ? 'active' : ''}`} 
              button 
              onClick={() => navigateTo('/personalized-menu')}
            >
              <IonIcon slot="start" icon={restaurantOutline} />
              <IonLabel>Your Menus</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem 
              className={`slide-item ${location.pathname === '/create-menu' ? 'active' : ''}`} 
              button 
              onClick={() => navigateTo('/create-menu')}
            >
              <IonIcon slot="start" icon={createOutline} />
              <IonLabel>Create a Menu</IonLabel>
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle auto-hide="false">
            <IonItem 
              className={`slide-item ${location.pathname === '/recommendations' ? 'active' : ''}`} 
              button 
              onClick={() => navigateTo('/recommendations')}
            >
              <IonIcon slot="start" icon={compassOutline} />
              <IonLabel>Explore Menus</IonLabel>
            </IonItem>
          </IonMenuToggle>
          
        </IonList>
      </IonContent>
      <IonFooter>
        <IonList className = 'logout-footer'>
          <IonItem className = 'logout-btn' button onClick={handleLogout}>
            
            <IonLabel>LOG OUT</IonLabel>
            <IonIcon slot="end" icon={logOutOutline} style={{color:'white'
            }} />
          </IonItem>
        </IonList>
      </IonFooter>
    </IonMenu>
  );
};

export default SlideMenu;
