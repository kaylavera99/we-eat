import React, { useEffect, useState, Suspense } from "react";
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonLoading,
  IonToast,
  IonButton,
  IonImg,
  IonModal,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonAccordion,
  IonAccordionGroup,
  IonIcon,
} from "@ionic/react";
import {
  addMenuItemToSavedMenus,
  MenuItem,
  fetchSavedMenus,
} from "../services/menuService";
import {
  fetchUserData,
  fetchRestaurantMenus,
  filterAndRankRestaurants,
  fetchAllRestaurants,
  filterMenuItemsByAllergens,
  Restaurant,
} from "../services/recommendationService";
import "../styles/RecommendationsPage.css";
import { compassOutline, bookmarkOutline, close } from "ionicons/icons";
import LazyImage from "../components/LazyLoading";
import useScreenWidth from "../hooks/useScreenWidth";

interface MenuCategory {
  category: string;
  items: MenuItem[];
  index: number;
}

const truncateDescription = (
  description: string,
  smallScreenMaxLength: number,
  largeScreenMaxLength: number,
  screenWidth: number
) => {
  const maxLength =
    screenWidth < 768 ? smallScreenMaxLength : largeScreenMaxLength;

  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + "...";
};

const RecommendationsPage: React.FC = () => {
  const screenWidth = useScreenWidth();
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<
    { id: string; name: string; thumbnailUrl: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [restaurantMenus, setRestaurantMenus] = useState<{
    [key: string]: Restaurant;
  }>({});
  const [userMenuItems, setUserMenuItems] = useState<MenuItem[]>([]);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [selectedRestaurantName, setSelectedRestaurantName] = useState<
    string | null
  >(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const allergens = await fetchUserData();
        setUserAllergens(allergens);

        const allRestaurants = await fetchAllRestaurants();
        const restaurantIds = allRestaurants.map((r: { id: string }) => r.id);

        const menus = await fetchRestaurantMenus(restaurantIds);

        const fetchedUserMenuItems = await fetchSavedMenus();
        const userMenuItemsFlat = fetchedUserMenuItems.flatMap(
          (menu) => menu.dishes
        );
        setUserMenuItems(userMenuItemsFlat);

        const recommendations = filterAndRankRestaurants(
          allRestaurants,
          menus,
          allergens,
          userMenuItemsFlat
        );
        const recommendationsWithThumbnails = recommendations.map(
          (restaurant) => {
            const foundRestaurant = allRestaurants.find(
              (r) => r.id === restaurant.id
            );
            return {
              ...restaurant,
              thumbnailUrl: foundRestaurant ? foundRestaurant.thumbnailUrl : "",
            };
          }
        );

        setRecommendedRestaurants(recommendationsWithThumbnails);
        setRestaurantMenus(menus);
      } catch (error) {
        console.error(error);
        setToastMessage("Failed to fetch recommendations");
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  useEffect(() => {
    const accordions = document.querySelectorAll(".rec-accordion");
    console.log("Accordions found: ", accordions.length);

    accordions.forEach((accordion) => {
      console.log("Attaching event to: ", accordion);

      accordion.addEventListener("ionAccordionDidExpand", () => {
        console.log("Accordion expanded ");
        accordion.classList.add("expanded"); 
        const accordionGroup = accordion.closest('.rest-acc-list');
      
        if (accordionGroup) {
          const boundingRect = accordionGroup.getBoundingClientRect();
          const offsetTop = boundingRect.top + window.scrollY;
          const scrollToPosition = offsetTop - 56; 
          
          console.log("Offset: ", offsetTop);
          console.log("Scroll: ", scrollToPosition);
          console.log("Bound: ", boundingRect);
          
          window.scrollTo({ top: scrollToPosition, behavior: 'smooth' });
        }
      });
      accordion.addEventListener("ionAccordionDidCollapse", () => {
        accordion.classList.remove("expanded");
        window.scrollBy(0, -10);
      });
    });

    const catAccordions = document.querySelectorAll(".category-accordion");
    catAccordions.forEach((categoryacc) => {
      categoryacc.addEventListener("ionAccordionDidExpand", () => {
        categoryacc.classList.add("expanded");
        categoryacc.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "start",
        });
      });
      categoryacc.addEventListener("ionAccordionDidCollapse", () => {
        categoryacc.classList.remove("expanded");
      });
    });
  }, []);

  const handleAddToPersonalizedMenu = async (
    restaurantName: string,
    item: MenuItem
  ) => {
    try {
      await addMenuItemToSavedMenus(item, restaurantName);

      const updatedUserMenuItems = await fetchSavedMenus();
      setUserMenuItems(updatedUserMenuItems.flatMap((menu) => menu.dishes));

      setToastMessage("Item added to personalized menu");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message);
      setShowToast(true);
    }
  };

  const handleViewItem = (item: MenuItem, restaurantName: string) => {
    setSelectedMenuItem(item);
    setSelectedRestaurantName(restaurantName);
    setShowModal(true);
  };

  const handleAddItemFromModal = async () => {
    if (selectedMenuItem && selectedRestaurantName) {
      try {
        await addMenuItemToSavedMenus(selectedMenuItem, selectedRestaurantName);

        const updatedUserMenuItems = await fetchSavedMenus();
        setUserMenuItems(updatedUserMenuItems.flatMap((menu) => menu.dishes));

        setToastMessage("Item added to personalized menu");
        setShowToast(true);
        setShowModal(false);
      } catch (error: any) {
        setToastMessage(error.message);
        setShowToast(true);
      }
    }
  };

  const filterUserMenuItems = (
    restaurantId: string,
    items: MenuItem[]
  ): MenuItem[] => {
    return items.filter(
      (item) =>
        !userMenuItems.some((userMenuItem) => userMenuItem.name === item.name)
    );
  };

  const filterItemsByAllergens = (items: MenuItem[]): MenuItem[] => {
    return filterMenuItemsByAllergens(items, userAllergens);
  };

  const handleAccordionClick = (event: React.MouseEvent<HTMLIonItemElement, MouseEvent>) => {
    console.log("Accordion clicked")
    const accordion = event.currentTarget;
    console.log("Accordion: " , accordion)

    const accordionGroup = accordion.closest('.rec-accordion');
    console.log("accordion group: ", accordionGroup)

    if (accordionGroup) {
      const boundingRect = accordion.getBoundingClientRect();
      console.log("Bounding : ", boundingRect)
      console.log("Bounding Rect: ", boundingRect.top)
      
      console.log("Window: ", window.scrollY)
      const offsetTop = boundingRect.top + window.scrollY;
      console.log("Offset Top: ", offsetTop)
      const scrollToPosition = boundingRect.height - 200; 
      console.log("Scroll: ", scrollToPosition)

      window.scrollTo(0,scrollToPosition);

      


      const itemElem = accordion.querySelector('.rest-rec-title');
      if (itemElem) {
        console.log("Element found: ", itemElem);
        itemElem.scrollTo(0, scrollToPosition)
      }window.scrollTo({ top: scrollToPosition, behavior: 'auto' });
    } 
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Recommended Menus</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="page-banner-row">
          <IonIcon
            slot="end"
            icon={compassOutline}
            style={{ color: "black" }}
          />
          <h2> Explore Menus</h2>
        </div>
        <p className="page-intro">
          Discover menu items that don't contain your allergens.
        </p>
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <IonList className="rest-rec-list">
            <IonAccordionGroup className = 'rest-acc-list'>
              {recommendedRestaurants.map((restaurant) => (
                <IonAccordion
                  key={`${restaurant.id}-${restaurant.name}`}
                  value={`restaurant-${restaurant.id}`}
                  className="rec-accordion"
                >
                  <IonItem
                    lines="none"
                    slot="header"
                    className="rest-rec-items"
                    onClick= {handleAccordionClick}
                  >
                    <div className="restaurant-thumbnail-container">
                      <Suspense fallback={<div>Loading image...</div>}>
                        <LazyImage
                          src={restaurant.thumbnailUrl}
                          alt={restaurant.name}
                        />
                      </Suspense>
                    </div>
                    <h2 className="rest-rec-title">{restaurant.name}</h2>
                  </IonItem>
                  <IonList lines="none" slot="content" className="rest-list">
                    <IonAccordionGroup className="cat-acc">
                      {restaurantMenus[restaurant.id]?.menu
                        .sort((a, b) => a.index - b.index)
                        .map(
                          (
                            menuCategory: MenuCategory,
                            categoryIndex: number
                          ) => {
                            const filteredItems = filterItemsByAllergens(
                              filterUserMenuItems(
                                restaurant.id,
                                menuCategory.items
                              )
                            );

                            return (
                              <IonAccordion
                                key={`${restaurant.id}-${menuCategory.category}-${categoryIndex}`}
                                value={`category-${restaurant.id}-${categoryIndex}`}
                                className="category-accordion"
                                
                              >
                                <IonItem lines="none" slot="header">
                                  <IonLabel>{menuCategory.category}</IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                  {filteredItems.length > 0 ? (
                                    filteredItems.map(
                                      (item: MenuItem, itemIndex: number) => (
                                        <IonItem
                                          lines="none"
                                          className="menu-list"
                                          key={`${restaurant.id}-${menuCategory.category}-${item.id}-${itemIndex}`}
                                        >
                                          <div className="menu-item-container">
                                            <div className="image-container">
                                              <Suspense
                                                fallback={
                                                  <div>Loading image...</div>
                                                }
                                              >
                                                <LazyImage
                                                  src={
                                                    item.imageUrl ||
                                                    "path/to/placeholder-image.jpg"
                                                  }
                                                  alt={item.name}
                                                />
                                              </Suspense>
                                            </div>
                                            <div className="menu-item-details">
                                              <IonLabel className="explore-titles">
                                                <h4>{item.name}</h4>
                                                <p className="menu-item-description">
                                                  {truncateDescription(
                                                    item.description,
                                                    100,
                                                    150,
                                                    screenWidth
                                                  )}
                                                </p>
                                                <p
                                                  className="allergen-line-page"
                                                  style={{ color: "black" }}
                                                >
                                                  <strong>Allergens: </strong>
                                                  {item.allergens.join(", ")}
                                                </p>
                                              </IonLabel>
                                              <div className="menu-item-buttons">
                                                <IonButton
                                                className = 'rec-view-item'
                                                  onClick={() =>
                                                    handleViewItem(
                                                      item,
                                                      restaurant.name
                                                    )
                                                  }
                                                >
                                                  View Item
                                                </IonButton>
                                                <IonButton
                                                  className="add-btn"
                                                  onClick={() =>
                                                    handleAddToPersonalizedMenu(
                                                      restaurant.name,
                                                      item
                                                    )
                                                  }
                                                >
                                                  Add to Menu
                                                </IonButton>
                                              </div>
                                            </div>
                                          </div>
                                        </IonItem>
                                      )
                                    )
                                  ) : (
                                    <IonItem lines="none" className="no-safe">
                                      <p>
                                        No safe menu items available at this
                                        time
                                      </p>
                                    </IonItem>
                                  )}
                                </IonList>
                              </IonAccordion>
                            );
                          }
                        )}
                    </IonAccordionGroup>
                  </IonList>
                </IonAccordion>
              ))}
            </IonAccordionGroup>
          </IonList>
        )}
        <IonModal
          className="view-modal"
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
          backdropDismiss={true}
        >
          <IonCard className="modal-card">
            <IonButton
              fill="clear"
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              <IonIcon icon={close} />
            </IonButton>
            <IonCardHeader className="head-col">
              <h3 className="modal-category">{selectedMenuItem?.category}</h3>
              <h2 className="modal-title">{selectedMenuItem?.name}</h2>
            </IonCardHeader>
            <IonCardContent className="modal-card-content">
              <div className="image-wrapper">
                <IonImg
                  className="food-img"
                  src={selectedMenuItem?.imageUrl}
                  alt={selectedMenuItem?.name}
                  style={{ borderRadius: "35px", overflow: "hidden" }}
                />
              </div>
              <p className="description">{selectedMenuItem?.description}</p>
              <p className="allergen-line">
                <strong>Allergens: </strong>
                {selectedMenuItem?.allergens.map((allergen, index) => (
                  <span key={index}>
                    {allergen}
                    {index < selectedMenuItem.allergens.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
              <div className="modal-btn">
                <IonButton onClick={handleAddItemFromModal}>
                  <IonIcon
                    slot="start"
                    icon={bookmarkOutline}
                    style={{ color: "white" }}
                  />
                  Add
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </IonModal>
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

export default RecommendationsPage;
