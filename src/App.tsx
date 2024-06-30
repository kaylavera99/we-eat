import React, { useEffect, useState } from 'react';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
  IonLoading
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccount';
import HomePage from './pages/HomePage';
import UserProfilePage from './pages/UserProfilePage';
import AllergenInfoPage from './pages/AllergenInfoPage';
import PasswordResetPage from './pages/PasswordReset';
import RestaurantPage from './pages/RestaurantPage';
import EditProfilePage from './pages/EditProfilePage';
import PersonalizedMenuPage from './pages/PersonalizedMenu';
import PrivateRoute from './components/PrivateRoute';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        history.push('/login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [history]);

  if (isLoading) {
    return <IonLoading isOpen={isLoading} message="Loading..." />;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Switch>
              <Route path="/login" component={LoginPage} exact />
              <Route path="/create-account" component={CreateAccountPage} exact />
              <Route path="/password-reset" component={PasswordResetPage} exact />
              <PrivateRoute path="/allergens" component={AllergenInfoPage} exact />
              <PrivateRoute path="/edit-profile" component={EditProfilePage} exact />
              <PrivateRoute path="/personalized-menu" component={PersonalizedMenuPage} exact />
              <PrivateRoute path="/home" component={HomePage} exact />
              <PrivateRoute path="/tab1" component={Tab1} exact />
              <PrivateRoute path="/tab2" component={Tab2} exact />
              <PrivateRoute path="/tab3" component={Tab3} exact />
              <PrivateRoute path="/profile" component={UserProfilePage} exact />
              <PrivateRoute path="/restaurants" component={RestaurantPage} exact />
              <Redirect exact path="/" to="/home" />
            </Switch>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon aria-hidden="true" icon={triangle} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
           
            <IonTabButton tab="profile" href="/profile">
              <IonIcon aria-hidden="true" icon={ellipse} />
              <IonLabel>Profile</IonLabel>
            </IonTabButton>
            <IonTabButton tab="restaurants" href="/restaurants">
              <IonIcon aria-hidden="true" icon={triangle} />
              <IonLabel>Restaurants</IonLabel>
            </IonTabButton>
            <IonTabButton tab="personalized-menu" href="/personalized-menu">
              <IonIcon aria-hidden="true" icon={triangle} />
              <IonLabel>Personalized Menu</IonLabel>
            </IonTabButton>
            <IonTabButton tab="edit-profile" href="/edit-profile">
              <IonIcon aria-hidden="true" icon={triangle} />
              <IonLabel>Edit Profile</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
