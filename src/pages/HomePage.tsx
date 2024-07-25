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
  IonFab,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput
} from '@ionic/react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useHistory } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { add, person } from 'ionicons/icons';
import { profile } from 'console';
import 'ionicons';
import { personCircle, arrowForward, search } from 'ionicons/icons'; // Import arrowForward icon
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Restaurant {
  id: string;
  name: string;
  thumbnailUrl: string;
}

const HomePage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setFirstName(userData.firstName);
          }

          const querySnapshot = await getDocs(collection(db, 'restaurants'));
          const restaurantList: Restaurant[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Restaurant));
          setRestaurants(restaurantList);
        }
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchUserData();
  }, []);

  const goToSearchPage = (query?: string) => {
    history.push({
      pathname: '/search',
      state: { query },
    });
  };



  const goToCreateMenuPage = () => {
    history.push('/create-menu');
  };

  const goToPersonalizedMenuPage = () => {
    history.push('/personalized-menu');
  };

  const goToProfilePage = () => {
    history.push('/profile');
  };

  const goToAllRestaurantsPage = () => {
    history.push('/all-restaurants'); // Create a route to display all restaurants
  };

  const handleRestaurantClick = (restaurantName: string) => {
    history.push(`/restaurant/${restaurantName}/full`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    history.push('/login');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      history.push({
        pathname: '/search',
        state: { query: searchQuery },
      });
    }
  };

  const handleSearchQuery = () => {
    history.push('/search');
  };


  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
          <IonFab vertical="center" horizontal="end" slot="fixed">
            <IonFabButton onClick={goToProfilePage}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding' style={{ '--background': 'var(--ion-background-color)' }}>
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <div>
 <div className='header'>
              <div className='header-banner'>
                <h1>Let's Eat, {firstName}!</h1>
                <IonFabButton onClick={goToProfilePage}>
                  <IonIcon icon={person} />
                </IonFabButton>
              </div>
              <IonItem className = 'search-box' style={{ borderRadius: '20px'}}>
                
                <IonInput
                placeholder='Search'
                  value={searchQuery}
                  onIonChange={(e) => setSearchQuery(e.detail.value!)} className='search-bar'
                  style={{ borderRadius: '20px'}}
                />
                <IonButton slot="end" onClick={handleSearch} className = 'custom-search-button'>
                  <IonIcon icon={search} className= 'search-icon' style={{background:'none'}}/>
                </IonButton>
              </IonItem>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-around', marginTop: '10px' }}>
                <IonButton expand="block" onClick={handleSearchQuery}>
                  Search Restaurants
                </IonButton>
                <IonButton expand="block" onClick={goToPersonalizedMenuPage}>
                  Your Menus
                </IonButton>
              </div>
            </div>
            <div className = "car-header">
            <h2>
              All Restaurants</h2>
              <IonButton
                className="rounded-icon-button"
                size="small"
                onClick={goToAllRestaurantsPage}
                style={{ marginLeft: '10px', padding: 0 , borderRadius: '20px'}}
              >
                <IonIcon className="rounded-icon" icon={arrowForward} />
              </IonButton>
            
            </div>
            <Slider {...settings}>
              {restaurants.map(restaurant => (
                <div
                  className="card m-2"
                  style={{ width: '8rem', cursor: 'pointer' , gap: '10px'}}
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant.name)}
                >
                  <img src={restaurant.thumbnailUrl} className="card-img-top" alt={restaurant.name} style ={{maxHeight:'100px', objectFit:'cover'}}/>
                  <div className="card-body">
                    <h4 className="card-title">{restaurant.name}</h4>
                  </div>
                </div>
              ))}
            </Slider>
            <h2>Recommended Menus</h2>
            {/* Implement logic to display recommended menus here */}
            <Slider {...settings}>
              {restaurants.map(restaurant => (
                <div
                  className="card m-2"
                  style={{ width: '8rem', cursor: 'pointer' }}
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant.name)}
                >
                  <img src={restaurant.thumbnailUrl} className="card-img-top" alt={restaurant.name} style ={{maxHeight:'100px', objectFit:'cover'}}/>
                  <div className="card-body">
                    <h4 className="card-title">{restaurant.name}</h4>
                  </div>
                </div>
              ))}</Slider>
            <div className="fcta-banner">
              <div className="row">
                <div className="col">
                  <h3>Don't See A Menu You're Looking For?</h3>
                </div>
                <div className="col">
                  <IonButton expand="block" onClick={goToCreateMenuPage}>
                    Create Your Own
                  </IonButton>
                </div>
              </div>
            </div>
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
