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
  IonIcon
} from "@ionic/react";
import { useParams } from "react-router-dom";
import {fetchFullMenuFromRestaurants} from "../services/restaurantService";
import { addMenuItemToSavedMenus } from "../services/menuService";
import { doc, getDoc} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import SearchBar from '../components/SearchBar';
import { searchOutline } from "ionicons/icons";
import {MenuItem, MenuCategory} from '../types/menu';
import {UserData} from '../types/user';



const RestaurantPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const { restaurantId } = useParams<{ restaurantId: string }>();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<MenuCategory[]>([]); 
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

    const fetchRestaurantDetails = async (restaurantId: string) => {
    const restaurantDocRef = doc(db, "restaurants", restaurantId);
    const restaurantSnap = await getDoc(restaurantDocRef);
    console.log("This is the rest snap", restaurantSnap);

    if (restaurantSnap.exists()) {
      return restaurantSnap.data();
    } else {
      throw new Error(`No data found for restaurant with ID: ${restaurantId}`);
    }
  };

    const fetchData = async () => {
      setIsLoading(true);
      try {
        await fetchUserAllergens();

        const fullMenu = await fetchFullMenuFromRestaurants(restaurantId);
        setMenuCategories(fullMenu);
        setFilteredCategories(fullMenu); // set initial filtered categories to full menu

        const restaurantData = await fetchRestaurantDetails(restaurantId);
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
  }, [restaurantId]);

  const handleAddToSavedMenu = async (item: MenuItem) => {
    const convertedItem: import("../types/menu").MenuItem = {
      ...item,
      allergens: Array.isArray(item.allergens)
        ? item.allergens
        : [item.allergens],
    };

    try {
      await addMenuItemToSavedMenus(convertedItem, restaurantDetails?.name || "");
      setToastMessage("Menu item added to saved menu successfully!");
      setShowToast(true);
    } catch (error) {
      console.log(error);
      setToastMessage(`Error adding menu item: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleSearch = (query: string) => {
  setSearchQuery(query);

  if (query.trim() === "") {
    setFilteredCategories(menuCategories); // show all items
  } else {
    const filtered = menuCategories.map((category) => {
      const filteredItems = category.items.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      );

      return {
        ...category,
        items: filteredItems,
      };
    });

    setFilteredCategories(filtered);
  }
};


  const handleSearchButtonClick = () => {
    handleSearch(searchQuery); // trigger search when button is clicked
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
            {category.items.length > 0 ? (
    renderMenuItems(category.items)
  ) : ( 
  
      <h4 style = {{color: "#585858", textAlign: "center", fontWeight: "normal"}}>No menu items found</h4>

  )}
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
                    Menu items with allergens marked in red contain your allergens.
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

            <SearchBar onSearch={handleSearch} />

            <IonButton 
              className="search-button"
              expand="block"
              onClick={handleSearchButtonClick} 
            >
              <IonIcon slot="start" icon={searchOutline} />
              Search
            </IonButton>

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

            {renderMenuCategories(filteredCategories)} 
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
