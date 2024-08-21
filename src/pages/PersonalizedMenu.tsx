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
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonLoading,
  IonToast,
  IonImg,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import "../styles/PersonalizedMenu.css";
import { searchRestaurants } from "../services/searchService";
import { restaurantOutline } from "ionicons/icons";

interface Menu {
  restaurantName: string;
  dishes: any[];
  isCreated: boolean;
  photoUrl?: string;
  thumbnailUrl?: string;
  dishCount?: number;
}

interface PreferredLocation {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photoUrl?: string;
}

const PersonalizedMenuPage: React.FC = () => {
  const [createdMenus, setCreatedMenus] = useState<Menu[]>([]);
  const [savedMenus, setSavedMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, "users", userId);

          const preferredLocationsSnap = await getDocs(
            collection(userDocRef, "preferredLocations")
          );
          const locations: { [key: string]: PreferredLocation } = {};
          const locationPromises = preferredLocationsSnap.docs.map(
            async (doc) => {
              const location = doc.data() as PreferredLocation;
              locations[decodeURIComponent(location.name)] = location;
            }
          );
          await Promise.all(locationPromises);

          const savedMenusSnap = await getDocs(
            collection(userDocRef, "savedMenus")
          );
          const fetchedSavedMenus: Menu[] = [];
          for (const menuDoc of savedMenusSnap.docs) {
            const dishesSnap = await getDocs(collection(menuDoc.ref, "dishes"));
            console.log(
              `Saved Menu: ${menuDoc.id}, Dishes: ${dishesSnap.size}`
            );
            const data = menuDoc.data() as Menu;

            const restaurantQuery = query(
              collection(db, "restaurants"),
              where("name", "==", decodeURIComponent(data.restaurantName))
            );
            const restaurantSnapshot = await getDocs(restaurantQuery);
            let thumbnailUrl = "";
            if (!restaurantSnapshot.empty) {
              thumbnailUrl =
                restaurantSnapshot.docs[0].data().thumbnailUrl || "";
            }

            fetchedSavedMenus.push({
              ...data,
              isCreated: false,
              dishCount: dishesSnap.size,
              photoUrl: thumbnailUrl,
            });
          }

          // Fetch created menus
          const createdMenusSnap = await getDocs(
            collection(userDocRef, "createdMenus")
          );
          const fetchedCreatedMenus: Menu[] = [];
          for (const menuDoc of createdMenusSnap.docs) {
            const dishesSnap = await getDocs(collection(menuDoc.ref, "dishes"));
            const data = menuDoc.data() as Menu;

            let thumbnailUrl = "";

            // Use preferred location coordinates for fetching the thumbnailUrl
            const location = locations[decodeURIComponent(data.restaurantName)];
            if (location) {
              const results = await searchRestaurants(
                `${location.coordinates.latitude},${location.coordinates.longitude}`,
                5,
                decodeURIComponent(data.restaurantName),
                {
                  lat: location.coordinates.latitude,
                  lng: location.coordinates.longitude,
                }
              );
              if (results.length > 0) {
                thumbnailUrl = results[0].photoUrl || "";
              }
            } else {
              thumbnailUrl = data.thumbnailUrl || "";
            }

            fetchedCreatedMenus.push({
              ...data,
              isCreated: true,
              dishCount: dishesSnap.size,
              photoUrl: thumbnailUrl,
            });
          }

          setSavedMenus(fetchedSavedMenus);
          setCreatedMenus(fetchedCreatedMenus);

          if ([...fetchedSavedMenus, ...fetchedCreatedMenus].length === 0) {
            console.log("No menus found");
          }
        }
      } catch (error) {
        console.error("Error fetching menus:", error);
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewMenu = (restaurantName: string, isCreatedMenu: boolean) => {
    const path = isCreatedMenu
      ? `/restaurant/${encodeURIComponent(restaurantName)}/created`
      : `/restaurant/${encodeURIComponent(restaurantName)}/saved`;
    history.push(path);
  };

  const handleCreateMenu = () => {
    history.push("/create-menu");
  };

  const handleDeleteMenu = async (
    restaurantName: string,
    isCreatedMenu: boolean
  ) => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const encodedRestaurantName = encodeURIComponent(restaurantName);
        const userDocRef = doc(db, "users", userId);
        const menuCollection = isCreatedMenu ? "createdMenus" : "savedMenus";
        const menuQuery = query(
          collection(userDocRef, menuCollection),
          where("restaurantName", "==", encodedRestaurantName)
        );
        const querySnapshot = await getDocs(menuQuery);

        if (!querySnapshot.empty) {
          await deleteDoc(querySnapshot.docs[0].ref);
          setToastMessage("Menu deleted successfully.");
          setShowToast(true);

          // Update the menu list after deletion
          const updatedMenus = isCreatedMenu
            ? createdMenus.filter(
                (menu) => menu.restaurantName !== restaurantName
              )
            : savedMenus.filter(
                (menu) => menu.restaurantName !== restaurantName
              );

          if (isCreatedMenu) {
            setCreatedMenus(updatedMenus);
          } else {
            setSavedMenus(updatedMenus);
          }
        }
      }
    } catch (error) {
      setToastMessage(`Error deleting menu: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const renderMenuCard = (menu: Menu) => {
    return (
      <IonCard key={menu.restaurantName} className="rest-per-card">
        <h2 className="per-card-title">{menu.restaurantName}</h2>
        <div className="card-flex-content">
          <IonCardHeader className="personal-header">
            {menu.photoUrl ? (
              <IonImg
                src={menu.photoUrl}
                alt={menu.restaurantName}
                className="restaurant-thumbnail"
              />
            ) : (
              <div className="no-image-placeholder">No Image Available</div>
            )}
          </IonCardHeader>
          <IonCardContent className="per-card-content">
            <p>{menu.dishCount} Menu Item(s)</p>
            <div className="per-btn-row" style={{ height: "30px" }}>
              <IonButton
                className="custom-button"
                color="primary"
                onClick={() =>
                  handleViewMenu(menu.restaurantName, menu.isCreated)
                }
              >
                View
              </IonButton>
              <IonButton
                className="custom-button"
                color="danger"
                onClick={() =>
                  handleDeleteMenu(menu.restaurantName, menu.isCreated)
                }
              >
                Delete
              </IonButton>
            </div>
          </IonCardContent>
        </div>
      </IonCard>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Personalized Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <>
            <IonButton
              expand="block"
              onClick={handleCreateMenu}
              style={{ marginBottom: "20px" }}
              className="secondary-button"
            >
              Create a Menu
            </IonButton>
            <div className="page-banner-row-menus">
              <IonIcon
                  slot="end"
                  className="menu-icon"
                  icon={restaurantOutline}
                /><h2>
               
                
                Your Menus
              </h2>
            </div>
            <IonAccordionGroup className = 'per-acc'>
              <IonAccordion value="created" className="item-expanded">
                <IonItem slot="header" className="item-lbl">
                  <div className="item-banner">
                    <IonLabel>Created Menus</IonLabel>
                    <p>These are the menus you created.</p>
                  </div>
                </IonItem>
                <IonList slot="content">
                  {createdMenus.length > 0 ? (
                    createdMenus.map((menu) => renderMenuCard(menu))
                  ) : (
                    <p>No created menus found.</p>
                  )}
                </IonList>
              </IonAccordion>

              <IonAccordion
                value="saved"
                style={{ backgroundColor: "#f2efef" }}  className="item-expanded"
              >
                <IonItem slot="header" className="item-lbl">
                  <div className="item-banner">
                    <IonLabel>Saved Menus</IonLabel>
                    <p className="title-exp">
                      These are the menus in which you've saved items from on
                      WeEat.
                    </p>
                  </div>
                </IonItem>
                <IonList slot="content">
                  {savedMenus.length > 0 ? (
                    savedMenus.map((menu) => renderMenuCard(menu))
                  ) : (
                    <p>No saved menus found.</p>
                  )}
                </IonList>
              </IonAccordion>
            </IonAccordionGroup>
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

export default PersonalizedMenuPage;
