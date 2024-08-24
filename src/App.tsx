import React, { useEffect, useState } from 'react';
import { Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
  IonLoading,
  IonMenuButton,
  IonHeader,
  IonToolbar, 
  IonButton,
  IonButtons
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeSharp, person, searchOutline, compassOutline } from 'ionicons/icons';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { AuthProvider, useAuth } from './contexts/authContext';
import SlideMenu from './components/SlideMenu';
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
import SavedMenuPage from './pages/SavedMenuPage';
import CreatedMenuPage from './pages/CreatedMenuPage';
import RecommendationsPage from './pages/RecommendationsPage';
import AddDishesPage from './pages/AddDishesPage';
import AllRestaurantsPage from './pages/AllRestaurantsPage';
import '@fortawesome/fontawesome-free/css/all.min.css';
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
import './styles/UserProfile.css';
import './styles/HomePage.css';
import './styles/PersonalizedMenu.css';
import './styles/RestaurantPage.css';
import './styles/CreatedMenu..css';
import './styles/SlideMenu.css';

setupIonicReact();

const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const history = useHistory();
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('User state changed:', user);

      setIsLoading(false); 
      if (user) {
       
        if (location.pathname === '/login' || location.pathname==='/create-account') {
          history.push('/home');
        }
      } else {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/create-account' && currentPath !== '/password-reset') {
          sessionStorage.setItem('redirectPath', currentPath);
          history.push('/login');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [history, location.pathname]);

  const handleSignOut = () => {
    signOut(auth).then(() => {
      sessionStorage.setItem('redirectPath', '/login');
      history.push('/login');
    });
  };

  if (isLoading) {
    return <IonLoading isOpen={isLoading} message="Loading..." />;
  }

  return (
    <>
      {currentUser && <SlideMenu />}
      {currentUser && (
        <IonHeader>
          <IonToolbar
            style={{
              backgroundColor: '#02382E',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <IonButtons slot="start" style={{ fontSize: '1.5em' }}>
              <IonMenuButton style={{ fontSize: '1.5em' }} />
            </IonButtons>
            <div
              className="toolbar-content"
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src="/assets/WeEat_logo_transparent.webp"
                alt="WeEat Logo"
                className="app-logo"
                style={{ height: '55px', marginTop: '20px', marginBottom: '20px', bottom: 0 }}
              />
            </div>
          </IonToolbar>
        </IonHeader>
      )}
      {currentUser && (
        <IonButton onClick={handleSignOut} color="danger">
          Sign Out
        </IonButton>
      )}

      <IonTabs>
        <IonRouterOutlet id="main-content">
          <Switch>
            <Route path="/login" component={LoginPage} exact />
            <Route path="/create-account" component={CreateAccountPage} exact />
            <Route path="/password-reset" component={PasswordResetPage} exact />
            <PrivateRoute path="/home" component={HomePage} exact />
            <PrivateRoute path="/personalized-menu" component={PersonalizedMenuPage} exact />
            <PrivateRoute path="/create-menu" component={CreateMenuPage} exact />
            <Route exact path="/add-dishes/:menuId" component={AddDishesPage} />
            <Route exact path="/personalized-menu" component={PersonalizedMenuPage} />
            <PrivateRoute path="/restaurant/:restaurantName/full" component={RestaurantPage} exact />
            <PrivateRoute path="/restaurant/:restaurantName/saved" component={SavedMenuPage} exact />
            <PrivateRoute path="/restaurant/:restaurantName/created" component={CreatedMenuPage} exact />
            <PrivateRoute path="/search" component={SearchPage} exact />
            <PrivateRoute path="/all-restaurants" component={AllRestaurantsPage} exact />
            <Route path="/restaurant/:restaurantName/create" component={CreateMenuPage} />
            <PrivateRoute path="/edit-profile" component={EditProfilePage} exact />
            <PrivateRoute path="/profile" component={UserProfilePage} exact />
            <PrivateRoute path="/recommendations" component={RecommendationsPage} exact />
            <Redirect exact from="/" to="/login" />
            <PrivateRoute path="/profile">
              <ErrorBoundary>
                <UserProfilePage />
              </ErrorBoundary>
            </PrivateRoute>
          </Switch>
        </IonRouterOutlet>
        <IonTabBar
          slot="bottom"
          style={{
            display: currentUser ? 'flex' : 'none',
            '--background': 'var(--ion-tab-bar-background-color)',
            '--color': 'var(--ion-tab-bar-color)',
            '--color-selected': 'var(--ion-tab-bar-selected-color)',
          }}
        >
          <IonTabButton tab="home" href="/home">
            <IonIcon icon={homeSharp} />
            <IonLabel className="tab-bar-label">Home</IonLabel>
          </IonTabButton>

          <IonTabButton tab="search" href="/search">
            <IonIcon icon={searchOutline} />
            <IonLabel className="tab-bar-label">Search</IonLabel>
          </IonTabButton>
          <IonTabButton tab="recommendations" href="/recommendations">
            <IonIcon aria-hidden="true" icon={compassOutline} />
            <IonLabel className="tab-bar-label">Explore</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" href="/profile">
            <IonIcon icon={person} />
            <IonLabel className="tab-bar-label">Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <AppContent />
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
