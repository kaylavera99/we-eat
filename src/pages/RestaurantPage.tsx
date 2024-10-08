import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonLoading,
  IonToast,
  IonButton,
  IonImg,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import {
  fetchFullMenuFromRestaurants,
  MenuCategory,
  MenuItem,
} from "../services/restaurantService";
import { addMenuItemToSavedMenus } from "../services/menuService";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

interface UserData {
  allergens: { [key: string]: boolean };
}

const RestaurantPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [restaurantDetails, setRestaurantDetails] = useState<{
    name: string;
    thumbnailUrl: string;
  } | null>(null);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    const fetchUserAllergens = async () => {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          const allergens = Object.keys(userData.allergens)
            .filter((allergen) => userData.allergens[allergen])
            .map((allergen) => allergen.toLowerCase().trim());
          setUserAllergens(allergens);
        }
      }
    };

    const fetchRestaurantDetails = async (restaurantName: string) => {
      const q = query(
        collection(db, "restaurants"),
        where("name", "==", restaurantName)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const restaurantDoc = querySnapshot.docs[0];
        return restaurantDoc.data();
      } else {
        throw new Error(`No data found for restaurant: ${restaurantName}`);
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchUserAllergens();

        const fullMenu = await fetchFullMenuFromRestaurants(restaurantName);
        setMenuCategories(fullMenu);

        const restaurantData = await fetchRestaurantDetails(restaurantName);
        setRestaurantDetails({
          name: restaurantData.name,
          thumbnailUrl: restaurantData.thumbnailUrl,
        });

        // set the default selected category to first indexed category
        if (fullMenu.length > 0) {
          setSelectedCategory(fullMenu[0].category);
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [restaurantName]);

  const handleAddToSavedMenu = async (item: MenuItem) => {
    const convertedItem: import("../services/menuService").MenuItem = {
      ...item,
      allergens: Array.isArray(item.allergens)
        ? item.allergens
        : [item.allergens],
    };

    try {
      await addMenuItemToSavedMenus(convertedItem, restaurantName);
      setToastMessage("Menu item added to saved menu successfully!");
      setShowToast(true);
    } catch (error) {
      console.log(error);
      setToastMessage(`Error adding menu item: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, index) => {
      const allergensArray: string[] = Array.isArray(item.allergens)
        ? item.allergens
        : typeof item.allergens === "string"
        ? (item.allergens as string).split(",").map((a: string) => a.trim())
        : [];

      return (
        <IonCard key={index} className="menu-cards">
          <IonCardHeader>
            <h2 className="item-name">{item.name}</h2>

            <div className="image-div">
              {item.imageUrl && (
                <IonImg
                  className="menu-img"
                  src={item.imageUrl}
                  alt={item.name}
                />
              )}
            </div>
          </IonCardHeader>
          <IonCardContent>
            <div className="card-cont-flex">
              <p>{item.description}</p>
              <p className="allergens">
                <strong>Allergens: </strong>
                {allergensArray.map((allergen: string, index: number) => {
                  const isUserAllergen = userAllergens.includes(
                    allergen.toLowerCase().trim()
                  );
                  return (
                    <span
                      key={index}
                      style={{ color: isUserAllergen ? "red" : "black" }}
                    >
                      {allergen}
                      {index < allergensArray.length - 1 ? ", " : ""}
                    </span>
                  );
                })}
              </p>
            </div>
            <IonButton
              className="secondary-button"
              onClick={() => handleAddToSavedMenu(item)}
            >
              Add to Saved Menu
            </IonButton>
          </IonCardContent>
        </IonCard>
      );
    });
  };

  const renderMenuCategories = (categories: MenuCategory[]) => {
    return categories
      .filter((category) => category.category === selectedCategory)
      .map((category, index) => (
        <div key={index} className="list-container">
          <h5>{category.category}</h5>
          <IonList className="menu-list">
            {renderMenuItems(category.items)}
          </IonList>
        </div>
      ));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {restaurantDetails?.name || restaurantName} Full Menu
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <div>
            {restaurantDetails && (
              <div className="restaurant-banner">
                <IonImg
                  src={restaurantDetails.thumbnailUrl}
                  alt={restaurantDetails.name}
                  className="page-banner-img"
                />
                <h2>{restaurantDetails.name}</h2>
                {userAllergens.length > 0 && (
                  <p style={{ color: "red" }}>
                    Menu items with allergens marked in red contain your
                    allergens.
                  </p>
                )}
                <IonBadge color="primary" className="full-badge">
                  Menu Items:{" "}
                  {menuCategories.reduce(
                    (acc, category) => acc + category.items.length,
                    0
                  )}
                </IonBadge>
              </div>
            )}

            <IonSegment
              scrollable
              value={selectedCategory}
              onIonChange={(e) =>
                setSelectedCategory(e.detail.value!.toString())
              }
            >
              {menuCategories.map((category) => (
                <IonSegmentButton
                  key={category.category}
                  value={category.category}
                >
                  <IonLabel className="seg-button">
                    {category.category}
                  </IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            {renderMenuCategories(menuCategories)}
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

export default RestaurantPage;
