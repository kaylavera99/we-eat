import React, { useEffect, useState } from "react";
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
  IonInput,
} from "@ionic/react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useHistory } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { add, person } from "ionicons/icons";
import "ionicons";
import { arrowForward, search } from "ionicons/icons";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Restaurant {
  id: string;
  name: string;
  thumbnailUrl: string;
}

const HomePage: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();

  const fetchUserDataWithRetry = async (userUid: string, retries = 3) => {
    while (retries > 0) {
      const userDocRef = doc(db, "users", userUid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data();
      }
      retries--;
      await new Promise((resolve) => setTimeout(resolve, 500)); // wait a bit before retrying
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setIsLoading(true);

          await new Promise((resolve) => setTimeout(resolve, 500));

          const userData = await fetchUserDataWithRetry(user.uid);
          if (userData) {
            setFirstName(userData.firstName || "Guest");
          } else {
            setFirstName("Else Guest");
          }

          const querySnapshot = await getDocs(collection(db, "restaurants"));
          const restaurantList: Restaurant[] = querySnapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Restaurant)
          );
          setRestaurants(restaurantList);
        } catch (error: any) {
          setToastMessage(error.message);
          setShowToast(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const goToCreateMenuPage = () => {
    history.push("/create-menu");
  };

  const goToPersonalizedMenuPage = () => {
    history.push("/personalized-menu");
  };

  const goToProfilePage = () => {
    history.push("/profile");
  };

  const goToAllRestaurantsPage = () => {
    history.push("/all-restaurants");
  };

  const handleRestaurantClick = (restaurantName: string) => {
    history.push(`/restaurant/${restaurantName}/full`);
  };

  const goToExploreMenusPage = () => {
    history.push("/recommendations");
  };

  const handleLogout = async () => {
    await signOut(auth);
    history.push("/login");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      history.push({
        pathname: "/search",
        state: { query: searchQuery },
      });
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 2000,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
          <IonFab
            vertical="center"
            horizontal="end"
            slot="fixed"
            className="fab-btn"
          >
            <IonFabButton className="fab-btn" onClick={goToProfilePage}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        </IonToolbar>
      </IonHeader>
      <IonContent
        className="ion-padding"
        style={{ "--background": "var(--ion-background-color)" }}
      >
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <div>
            <div className="header">
              <div className="header-banner">
                <h1>Let's Eat, {firstName}!</h1>
                <IonFabButton onClick={goToProfilePage}>
                  <IonIcon icon={person} />
                </IonFabButton>
              </div>
              <IonItem className="search-box" style={{ borderRadius: "20px" }}>
                <IonInput
                  placeholder="Search"
                  value={searchQuery}
                  onIonChange={(e) => setSearchQuery(e.detail.value!)}
                  className="search-bar"
                  style={{ borderRadius: "20px" }}
                />
                <IonButton
                  slot="end"
                  onClick={handleSearch}
                  className="custom-search-button"
                >
                  <IonIcon
                    icon={search}
                    className="search-icon"
                    style={{ background: "none" }}
                  />
                </IonButton>
              </IonItem>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "space-around",
                  marginTop: "10px",
                }}
              >
                <IonButton
                  expand="block"
                  className="banner-btn"
                  onClick={goToCreateMenuPage}
                >
                  Create Menu
                </IonButton>
                <IonButton
                  expand="block"
                  className="banner-btn"
                  onClick={goToPersonalizedMenuPage}
                >
                  Your Menus
                </IonButton>
              </div>
            </div>
            <div className="car-header">
              <h2>All Restaurants</h2>

              <IonButton
                className="rounded-icon-button"
                size="small"
                onClick={goToAllRestaurantsPage}
                style={{ marginLeft: "10px", padding: 0, borderRadius: "20px" }}
              >
                <IonIcon className="rounded-icon" icon={arrowForward} />
              </IonButton>
            </div>
            <p>Explore all the menus we have to offer</p>
            <Slider {...settings}>
              {restaurants.map((restaurant) => (
                <div
                  className="card m-2"
                  style={{}}
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant.name)}
                >
                  <img
                    src={restaurant.thumbnailUrl}
                    className="card-img-top"
                    alt={restaurant.name}
                    style={{}}
                  />
                  <div className="card-body">
                    <h4 className="card-title">{restaurant.name}</h4>
                  </div>
                </div>
              ))}
            </Slider>
            <div className="car-header">
              <h2>Explore Menus</h2>
              <IonButton
                className="rounded-icon-button"
                size="small"
                onClick={goToExploreMenusPage}
                style={{ marginLeft: "10px", padding: 0, borderRadius: "20px" }}
              >
                <IonIcon className="rounded-icon" icon={arrowForward} />
              </IonButton>
            </div>
            <p>Menu's we think you'd like</p>

            <Slider {...settings}>
              {restaurants.map((restaurant) => (
                <div
                  className="card m-2"
                  style={{ cursor: "pointer" }}
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant.name)}
                >
                  <img
                    src={restaurant.thumbnailUrl}
                    className="card-img-top"
                    alt={restaurant.name}
                    style={{ maxHeight: "100px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h4 className="card-title">{restaurant.name}</h4>
                  </div>
                </div>
              ))}
            </Slider>
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
