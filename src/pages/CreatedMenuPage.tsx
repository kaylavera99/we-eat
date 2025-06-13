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
  IonPopover,
  IonFab,
  IonFabButton,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import {
  updateMenuItemInCreatedMenus,
  deleteMenuItemFromCreatedMenus,
} from "../services/menuService";
import { MenuItem } from "../types/menu";
import EditMenuItemModal from "../components/EditMenuItemModal";
import AddMenuItemModal from "../components/AddMenuItemModal";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import "../styles/CreatedMenu..css";
import { addOutline } from "ionicons/icons";
import { PreferredLocation, UserData } from "../types/user";




const CreatedMenuPage: React.FC = () => {
  const { menuDocId } = useParams<{ menuDocId: string }>();
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = useState<PreferredLocation | null>(null);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [showPopover, setShowPopover] = useState({ isOpen: false, event: undefined as Event | undefined });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const menuDocRef = doc(db, "users", userId, "createdMenus", menuDocId);
        const menuDocSnap = await getDoc(menuDocRef);

        if (menuDocSnap.exists()) {
          const data = menuDocSnap.data();
          setRestaurantName(data.restaurantName);
          const dishesSnap = await getDocs(collection(menuDocRef, "dishes"));
          const dishes: MenuItem[] = dishesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
          setMenuItems(dishes);
        }

        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          const allergens = Object.keys(userData.allergens)
            .filter((key) => userData.allergens[key])
            .map((key) => key.toLowerCase().trim());
          setUserAllergens(allergens);
        }

        const preferredLocationsSnap = await getDocs(collection(userDocRef, "preferredLocations"));
        preferredLocationsSnap.forEach((doc) => {
          const data = doc.data() as PreferredLocation;
          if (data.name === restaurantName) {
            setPreferredLocation(data);
          }
        });
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      }
    };
    fetchData();
  }, [menuDocId, restaurantName]);

  const handleSaveItem = async (updatedItem: MenuItem) => {
    try {
      await updateMenuItemInCreatedMenus(updatedItem, menuDocId, updatedItem.id!);
      setMenuItems(menuItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
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
      await deleteMenuItemFromCreatedMenus(itemId, menuDocId);
      setMenuItems(menuItems.filter((item) => item.id !== itemId));
      setToastMessage("Item deleted successfully!");
      setShowToast(true);
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleAddMenuItem =  (newItem: MenuItem) => {
    try {
      setMenuItems((items) => [...items, newItem]);
      setToastMessage("Item added successfully!");
      setShowToast(true);
    setShowAddMenuItemModal(false);;
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const truncateDescription = (description: string, maxLength: number) => {
    return description.length <= maxLength ? description : description.substring(0, maxLength) + "...";
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
              <h2 className="info-name">{preferredLocation.name}</h2>
              <p className="address-text-save">
                Address: {preferredLocation.address}
              </p>

              {userAllergens.length > 0 && (
                <p className="allergen-warn-save" style={{ color: "red" }}>
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
          <h2 className="save-menu">Menu Items</h2>
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
                    <p className="menu-item-description">
                      {" "}
                      {truncateDescription(item.description, 75)}
                    </p>
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
                    <IonButton
                      onClick={() => setEditingItem(item)}
                      className="btn-view"
                    >
                      Edit Item
                    </IonButton>
                    <IonButton
                      className="btn-delete"
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
                setShowPopover({ isOpen: false, event: undefined });
              }}
            >
              Edit Restaurant
            </IonItem>
            <IonItem
              button
              color="danger"
              onClick={() => {
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
            menuDocId={menuDocId}
          />
        )}
        <AddMenuItemModal
          isOpen={showAddMenuItemModal}
          onClose={() => setShowAddMenuItemModal(false)}
          onAddMenuItem={handleAddMenuItem}
          
          menuDocId={menuDocId}
        />
      </IonContent>
    </IonPage>
  );
};

export default CreatedMenuPage;
