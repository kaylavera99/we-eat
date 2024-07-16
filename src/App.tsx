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

import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccount';
import HomePage from './pages/HomePage';
import UserProfilePage from './pages/UserProfilePage';
import PasswordResetPage from './pages/PasswordReset';
import RestaurantPage from './pages/RestaurantPage';
import EditProfilePage from './pages/EditProfilePage';
import PersonalizedMenuPage from './pages/PersonalizedMenu';
import PrivateRoute from './components/PrivateRoute';
import CreateMenuPage from './pages/CreateMenuPage';
import SearchPage from './pages/SearchPage';
import ErrorBoundary from './components/ErrorBoundary';
import SavedMenuPage from './pages/SavedMenuPage'; // New import
import CreatedMenuPage from './pages/CreatedMenuPage'; // New import
import RecommendationsPage from './pages/RecommendationsPage';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
      if (!user) {
        history.push('/login');
      }
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
              <PrivateRoute path="/personalized-menu" component={PersonalizedMenuPage} exact />
              <PrivateRoute path="/create-menu" component={CreateMenuPage} exact />
              <PrivateRoute path="/restaurant/:restaurantName/full" component={RestaurantPage} exact />
              <PrivateRoute path="/restaurant/:restaurantName/saved" component={SavedMenuPage} exact />
              <PrivateRoute path="/restaurant/:restaurantName/created" component={CreatedMenuPage} exact />
              <PrivateRoute path="/search" component={SearchPage} exact />
              <PrivateRoute path="/edit-profile" component={EditProfilePage} exact />
              <PrivateRoute path="/home" component={HomePage} exact />
              <PrivateRoute path="/profile" component={UserProfilePage} exact />
              <PrivateRoute path="/recommendations" component={RecommendationsPage} exact />
              <Redirect exact from="/" to="/personalized-menu" />
              <PrivateRoute path="/profile">
                <ErrorBoundary>
                  <UserProfilePage />
                </ErrorBoundary>
              </PrivateRoute>
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
            <IonTabButton tab="search" href="/search">
              <IonIcon aria-hidden="true" icon={triangle} />
              <IonLabel>Search</IonLabel>
            </IonTabButton>
            <IonTabButton tab="recommendations" href="/recommendations">
              <IonIcon aria-hidden="true" icon={triangle} />
              <IonLabel>Recommendations</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
