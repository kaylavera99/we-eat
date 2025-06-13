import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonLoading,
  IonToast,
  IonIcon,
  IonButton,
  IonItem,
  IonInput,
} from "@ionic/react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useHistory } from "react-router-dom";
import "../styles/AllRestaurantsPage.css";
import { fastFoodOutline, search } from "ionicons/icons";
import { Restaurant } from "../types/menu";


const AllRestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();

  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "restaurants"));
        const restaurantList: Restaurant[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Restaurant)
        );
        setRestaurants(restaurantList);
        setFilteredRestaurants(restaurantList); //  filtered list
        setIsLoading(false);
      } catch (error: any) {
        setIsLoading(false);
        setToastMessage(error.message);
        setShowToast(true);
      }
    };

    fetchRestaurants();
  }, []);

  const handleRestaurantClick = (restaurantId: string) => {
    history.push(`/restaurants/${restaurantId}/full`);
  };



  return (
    <IonPage>
      <IonHeader>
        <IonToolbar></IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <>
            <div className="page-banner-row-all">
              <IonIcon
                slot="end"
                className="menu-icon"
                icon={fastFoodOutline}
              />
              <h2>All Menus</h2>
            </div>
            <p className="page-desc-all">
              View all of the restaurant menus offered on WeEat
            </p>

            <IonItem className="search-box" style={{ borderRadius: "20px" }}>
              <IonInput
                placeholder="Search restaurants..."
                value={searchQuery}
                onIonInput={(e) => {
                  const query = String(e.target.value || "");
                  setSearchQuery(query);

                  if (query.trim() === "") {
                    setFilteredRestaurants(restaurants);
                  } else {
                    const filtered = restaurants.filter((restaurant) =>
                      restaurant.name
                        .toLowerCase()
                        .includes(query.toLowerCase().trim())
                    );
                    setFilteredRestaurants(filtered);
                  }
                }}
                className="search-bar"
              />

              <IonIcon icon={search} className="search-icon" />
            </IonItem>

           <div className="restaurant-list">
  {filteredRestaurants.length > 0 ? (
    filteredRestaurants.map((restaurant) => (
      <div className="restaurant-item" key={restaurant.id}>
        <img
          src={restaurant.thumbnailUrl}
          alt={restaurant.name}
          className="restaurant-thumbnail"
        />
        <div className="restaurant-details">
          <h5 className="restaurant-name">{restaurant.name}</h5>
          <IonButton
            onClick={() => handleRestaurantClick(restaurant.id)}
            size="small"
          >
            View Menu
          </IonButton>
        </div>
      </div>
    ))
  ) : (
    <div style={{ textAlign: "center", marginTop: "1rem", color: "#888" }}>
      Restaurant not found.
    </div>
  )}
</div>

          </>
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

export default AllRestaurantsPage;
