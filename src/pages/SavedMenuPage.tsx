import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
  IonImg,
  IonBadge,
  IonIcon,
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import { fetchSavedMenus, MenuItem } from "../services/menuService";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import EditNotesModal from "../components/EditNotesModal";
import "../styles/SavedMenu.css";
import useScreenWidth from "../hooks/useScreenWidth";
import { deleteMenuItemFromSavedMenus } from "../services/menuService"; // Import the delete function
import { closeSharp, createOutline, trashBinOutline, trashSharp } from "ionicons/icons";

interface UserData {
  allergens: { [key: string]: boolean };
}

interface PreferredLocation {
  name: string;
  address: string;
  coordinates: any;
  photoUrl?: string;
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

const SavedMenuPage: React.FC = () => {
  const { restaurantName: encodedRestaurantName } = useParams<{
    restaurantName: string;
  }>();
  const restaurantName = decodeURIComponent(encodedRestaurantName);
  const [restaurantThumbnail, setRestaurantThumbnail] = useState<string | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null); // State for viewing item
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] =
    useState<PreferredLocation | null>(null);
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDocRef = doc(db, "users", userId);

          const savedMenus = await fetchSavedMenus();
          const savedMenu = savedMenus.find(
            (menu) => menu.restaurantName === restaurantName
          );
          if (savedMenu) {
            setMenuItems(savedMenu.dishes);
          }

          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserData;
            const allergens = Object.keys(userData.allergens)
              .filter((allergen) => userData.allergens[allergen])
              .map((allergen) => allergen.toLowerCase().trim());
            setUserAllergens(allergens);
          }

          const preferredLocationsSnap = await getDocs(
            collection(userDocRef, "preferredLocations")
          );
          preferredLocationsSnap.forEach((doc) => {
            const data = doc.data() as PreferredLocation;
            if (data.name === restaurantName) {
              setPreferredLocation(data);
            }
          });

          const querySnapshot = await getDocs(collection(db, "restaurants"));
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name === restaurantName) {
              setRestaurantThumbnail(data.thumbnailUrl || null);
            }
          });
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      }
    };
    fetchData();
  }, [restaurantName]);

  const handleSaveNotes = (updatedItem: MenuItem) => {
    setMenuItems(
      menuItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );

    if (viewingItem && viewingItem.id === updatedItem.id) {
      setViewingItem(updatedItem);
    }
    setToastMessage("Note updated successfully!");
    setShowToast(true);
    setEditingItem(null);
    setViewingItem(null);
  };

  const truncateDescription = (description: string, maxLength: number) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  const handleViewFullMenu = () => {
    history.push(`/restaurant/${encodeURIComponent(restaurantName)}/full`);
  };

  const handleViewItem = (item: MenuItem) => {
    setViewingItem(item); // Set the item to view
  };

  const handleDeleteItem = async (itemToDelete: MenuItem) => {
    try {
      if (itemToDelete.id && restaurantName) {
        // Ensure both are defined
        // Call the service to delete the item from the saved menus in the database
        await deleteMenuItemFromSavedMenus(itemToDelete.id, restaurantName);

        // Update the local state to remove the item
        setMenuItems(menuItems.filter((item) => item.id !== itemToDelete.id));

        // Show a success message
        setToastMessage(`${itemToDelete.name} removed from your saved menu.`);
        setShowToast(true);
      } else {
        setToastMessage(`Error: Missing item ID or restaurant name.`);
        setShowToast(true);
      }
    } catch (error) {
      // Handle any errors that occur during the deletion process
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Saved Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton
          className="secondary-button"
          expand="block"
          onClick={handleViewFullMenu}
        >
          View Full Menu
        </IonButton>

        {(preferredLocation || restaurantThumbnail) && (
          <div className="preferred-location-banner">
            <IonImg
              src={preferredLocation?.photoUrl || restaurantThumbnail!}
              alt={preferredLocation?.name || restaurantName}
              className="menu-banner"
            />
            <div className="info-column">
              <h2>{preferredLocation?.name || restaurantName} </h2>
              <p className="address-text">
                Preferred Location:{" "}
                {preferredLocation?.address || "No specific location"}
              </p>{" "}
              {userAllergens.length > 0 && (
                <p className="allergen-warn" style={{ color: "red" }}>
                  Menu items with allergens marked in red contain your
                  allergens.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="menu-title-line">
          <h2>Saved Menu Items</h2>
          <IonBadge className="item-badge" color="primary">
            {menuItems.length} Menu Items(s)
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
                      <strong>
                        <span style={{ color: "#02382E" }}>Allergens: </span>
                      </strong>
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
                    <IonButton onClick={() => handleViewItem(item)}>
                      View Item
                    </IonButton>
                    <IonButton
                      color="danger"
                      onClick={() => handleDeleteItem(item)}
                    >
                      Delete Item
                    </IonButton>
                  </div>
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

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />

        {viewingItem && (
          <IonModal
            isOpen={!!viewingItem}
            onDidDismiss={() => setViewingItem(null)}
            backdropDismiss={true}
            showBackdrop={true} // Enables closing the modal by clicking outside
          >
            <div className="item-modal">
              {/* Close Button */}
              <IonButton
                className="close-button"
                fill="clear" /* Ensure there's no background */
                onClick={() => setViewingItem(null)}
              >
                <IonIcon
                  icon={closeSharp}
                  style={{ color: "var(--ion-color-primary)", paddingLeft: '0' }}
                />
              </IonButton>

              <IonImg src={viewingItem?.imageUrl} alt={viewingItem?.name} />
              <h2>{viewingItem?.name}</h2>
              <p>{viewingItem?.description}</p>
              <p>
              <strong>
                        <span style={{ color: "#02382E" }}>Allergens: </span>
                      </strong>
                {viewingItem?.allergens.map((allergen, index) => {
          const isUserAllergen = userAllergens.includes(allergen.toLowerCase().trim());
          return (
            <span
              key={index}
              style={{ color: isUserAllergen ? "red" : "black" }}
            >
              {allergen}
              {index < viewingItem.allergens.length - 1 ? ", " : ""}
            </span>
          );
        })}
              </p>
              <p>
                <strong>Note: </strong>
                {viewingItem?.note}
              </p>
              <div className = 'modal-btn-row'>
              <IonButton onClick={() => setEditingItem(viewingItem)}>
              <IonIcon
                    slot="start"
                    icon={createOutline}
                    style={{ color: "white" }}
                  />
                Edit 
              </IonButton>
              <IonButton
                color="danger"
                onClick={() => {
                  handleDeleteItem(viewingItem);
                  setViewingItem(null);
                }}
              >                  <IonIcon
              slot="start"
              icon={trashSharp}
              style={{ color: "white" }}
            />
                Delete 
              </IonButton></div>
            </div>
          </IonModal>
        )}

        {editingItem && (
          <EditNotesModal
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            onSaveNotes={handleSaveNotes}
            initialItem={editingItem}
            restaurantName={restaurantName}
            isCreatedMenu={false}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default SavedMenuPage;
