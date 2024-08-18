import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
  IonImg,
  IonBadge,
  IonIcon,
  IonButtons,
  IonPopover,
  IonFab,
  IonFabButton,
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import {
  fetchCreatedMenus,
  MenuItem,
  updateMenuItemInCreatedMenus,
  deleteMenuItemFromCreatedMenus,
  addMenuItemToCreatedMenus,
} from "../services/menuService";
import EditMenuItemModal from "../components/EditMenuItemModal";
import AddMenuItemModal from "../components/AddMenuItemModal";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { searchRestaurants } from "../services/searchService";
import "../styles/CreatedMenu..css";
import { addOutline, ellipsisVertical } from "ionicons/icons";

interface UserData {
  allergens: { [key: string]: boolean };
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

const CreatedMenuPage: React.FC = () => {
  const { restaurantName } = useParams<{ restaurantName: string }>();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] =
    useState<PreferredLocation | null>(null);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [showPopover, setShowPopover] = useState<{
    isOpen: boolean;
    event: Event | undefined;
  }>({ isOpen: false, event: undefined });

  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, "users", userId);

          

          // Fetch created menus
          const createdMenus = await fetchCreatedMenus();
          const createdMenu = createdMenus.find(
            (menu) => menu.restaurantName === restaurantName
          );
          if (createdMenu) {
            setMenuItems(createdMenu.dishes);
          }

          // fetch user allergens
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            const allergens = Object.keys(userData.allergens)
              .filter((allergen) => userData.allergens[allergen])
              .map((allergen) => allergen.toLowerCase().trim());
            setUserAllergens(allergens);
          }

          // fetch preferred locations and their photos
          const preferredLocationsSnap = await getDocs(
            collection(userDocRef, "preferredLocations")
          );
          const locations: { [key: string]: PreferredLocation } = {};
          const locationPromises = preferredLocationsSnap.docs.map(
            async (doc) => {
              const location = doc.data() as PreferredLocation;
              if (location.name === restaurantName) {
                locations[doc.id] = location;

                // fetch photo URL for the location
                const results = await searchRestaurants(
                  `${location.coordinates.latitude},${location.coordinates.longitude}`,
                  5,
                  location.name,
                  {
                    lat: location.coordinates.latitude,
                    lng: location.coordinates.longitude,
                  }
                );
                if (results.length > 0) {
                  location.photoUrl = results[0].photoUrl;
                  setPreferredLocation(location);
                }
              }
            }
          );

          await Promise.all(locationPromises);
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      }
    };
    fetchData();
  }, [restaurantName]);

  const handleSaveItem = async (updatedItem: MenuItem) => {
    try {
      await updateMenuItemInCreatedMenus(
        updatedItem,
        restaurantName,
        updatedItem.id!
      );
      setMenuItems(
        menuItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      setToastMessage("Item updated successfully!");
      setShowToast(true);
      setEditingItem(null);
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteMenuItemFromCreatedMenus(itemId, restaurantName);
      setMenuItems(menuItems.filter((item) => item.id !== itemId));
      setToastMessage("Item deleted successfully!");
      setShowToast(true);
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleAddMenuItem = async (newItem: MenuItem) => {
    try {
      await addMenuItemToCreatedMenus(newItem, restaurantName);
      setMenuItems([...menuItems, newItem]);
      setToastMessage("Item added successfully!");
      setShowToast(true);
      setShowAddMenuItemModal(false);
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Created Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {preferredLocation && (
          <div className="preferred-location-banner">
            <IonImg
              className="menu-banner"
              src={preferredLocation.photoUrl}
              alt={preferredLocation.name}
            />
            <div className="info-column">
              <h2>{preferredLocation.name}</h2>
              <p className="address-text">
                Address: {preferredLocation.address}
              </p>

              {userAllergens.length > 0 && (
                <p className="allergen-warn" style={{ color: "red" }}>
                  Menu items with allergens marked in red contain your
                  allergens.
                </p>
              )}
            </div>
          </div>
        )}
        <IonFab vertical="top" horizontal="end" slot="fixed">
          <IonFabButton
            className="add-fab"
            size="small"
            color="secondary"
            onClick={() => setShowAddMenuItemModal(true)}
          >
            <IonIcon icon={addOutline} style={{ color: "white" }} />
          </IonFabButton>
        </IonFab>

        <div className="menu-title-line">
          <h2>Menu Items</h2>
          <IonBadge className="item-badge" color="primary">
            {menuItems.length} Menu Item(s)
          </IonBadge>
        </div>
        <IonList className="full-list" lines="none">
          <div className="created-list">
            {menuItems.map((item, index) => (
              <IonItem key={index} className="created-item">
                <div className="menu-item-card-col">
                  <IonLabel>
                    <h3 className="item-h3">{item.name}</h3>
                    <p>{item.description}</p>
                    <p className="allergen-label">
                      <strong>Allergens: </strong>
                      {item.allergens.map((allergen, index) => {
                        const isUserAllergen = userAllergens.includes(
                          allergen.toLowerCase().trim()
                        );
                        return (
                          <span
                            key={index}
                            style={{ color: isUserAllergen ? "red" : "black" }}
                          >
                            {allergen}
                            {index < item.allergens.length - 1 ? ", " : ""}
                          </span>
                        );
                      })}
                    </p>
                    <p className="note-label">
                      <strong>Note: </strong>
                      {item.note}
                    </p>
                  </IonLabel>
                  <div className="create-btn-row">
                    <IonButton onClick={() => setEditingItem(item)}>
                      Edit Item
                    </IonButton>
                    <IonButton
                      color="danger"
                      onClick={() => handleDeleteItem(item.id!)}
                    >
                      Delete Item
                    </IonButton>
                  </div>{" "}
                </div>
                <div className="created-img">
                  {item.imageUrl && (
                    <IonImg
                      src={item.imageUrl}
                      alt={item.name}
                      className="menu-image"
                    />
                  )}{" "}
                </div>
              </IonItem>
            ))}
          </div>
        </IonList>

        <IonPopover
          isOpen={showPopover.isOpen}
          event={showPopover.event}
          onDidDismiss={() =>
            setShowPopover({ isOpen: false, event: undefined })
          }
        >
          <IonList>
            <IonItem
              button
              onClick={() => {
                //  edit restaurant logic
                setShowPopover({ isOpen: false, event: undefined });
              }}
            >
              Edit Restaurant
            </IonItem>
            <IonItem
              button
              color="danger"
              onClick={() => {
                // delete menu logic
                setShowPopover({ isOpen: false, event: undefined });
              }}
            >
              Delete Menu
            </IonItem>
          </IonList>
        </IonPopover>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />

        {editingItem && (
          <EditMenuItemModal
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSaveItem={handleSaveItem}
            initialItem={editingItem}
            restaurantName={restaurantName}
          />
        )}
        <AddMenuItemModal
          isOpen={showAddMenuItemModal}
          onClose={() => setShowAddMenuItemModal(false)}
          onAddMenuItem={handleAddMenuItem}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreatedMenuPage;
