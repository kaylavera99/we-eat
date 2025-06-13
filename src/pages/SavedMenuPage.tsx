import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
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
import { MenuItem } from "../types/menu";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import EditNotesModal from "../components/EditNotesModal";
import "../styles/SavedMenu.css";
import { deleteMenuItemFromSavedMenus } from "../services/menuService";
import { closeSharp, createOutline, trashSharp } from "ionicons/icons";
import { PreferredLocation, UserData } from "../types/user";
import SearchBar from "../components/SearchBar";


const truncateDescription = (
  description: string,
  maxLength: number
) => {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + "...";
};

const SavedMenuPage: React.FC = () => {
  const { savedMenuDocId } = useParams<{ savedMenuDocId: string }>();
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantThumbnail, setRestaurantThumbnail] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [viewingItem, setViewingItem] = useState<MenuItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = useState<PreferredLocation | null>(null);

  // ← NEW: “are we still waiting on Firestore to tell us about preferredLocation?”
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // 1) load saved-menu doc
        const menuDocRef = doc(db, "users", userId, "savedMenus", savedMenuDocId);
        const menuDocSnap = await getDoc(menuDocRef);

        if (menuDocSnap.exists()) {
          const data = menuDocSnap.data();
          setRestaurantName(data.restaurantName);
          setRestaurantId(data.restaurantId);
          const dishesSnap = await getDocs(collection(menuDocRef, "dishes"));
          const dishes: MenuItem[] = dishesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as MenuItem));
          setMenuItems(dishes);
          setFilteredItems(dishes);

          // 2) load restaurant thumbnail if we have its ID
          if (data.restaurantId) {
            const restaurantDoc = await getDoc(doc(db, "restaurants", data.restaurantId));
            if (restaurantDoc.exists()) {
              const restaurantData = restaurantDoc.data();
              setRestaurantThumbnail(restaurantData.thumbnailUrl || null);
            }
          }
        }

        // 3) load user-allergens
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserData;
          const allergens = Object.keys(userData.allergens)
            .filter(key => userData.allergens[key])
            .map(key => key.toLowerCase().trim());
          setUserAllergens(allergens);
        }

        // 4) load preferredLocations subcollection
        const preferredLocationsSnap = await getDocs(
          collection(userDocRef, "preferredLocations")
        );
        preferredLocationsSnap.forEach((docSnap) => {
          const data = docSnap.data() as PreferredLocation;
          if (data.name === restaurantName) {
            setPreferredLocation(data);
          }
        });
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        // ← NEW: whether we found one or not, we’re done loading
        setLoadingPrefs(false);
      }
    };

    fetchData();
  }, [savedMenuDocId, restaurantName]);

  const handleSearch = (query: string) => {
    const filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleViewFullMenu = () => {
    if (restaurantId) {
      history.push(`/restaurants/${restaurantId}/full`);
    } else {
      setToastMessage("Error: Restaurant ID not found.");
      setShowToast(true);
    }
  };

  const handleViewItem = (item: MenuItem) => {
    setViewingItem(item);
  };

  const handleDeleteItem = async (itemToDelete: MenuItem) => {
    try {
      if (itemToDelete.id && savedMenuDocId) {
        await deleteMenuItemFromSavedMenus(itemToDelete.id, savedMenuDocId);
        const updated = menuItems.filter(item => item.id !== itemToDelete.id);
        setMenuItems(updated);
        setFilteredItems(updated);
        setToastMessage(`${itemToDelete.name} removed from your saved menu.`);
        setShowToast(true);
      } else {
        setToastMessage(`Error: Missing item ID or saved menu ID.`);
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage(`Error: ${(error as Error).message}`);
      setShowToast(true);
    }
  };

  const handleSaveNotes = (updatedItem: MenuItem) => {
    const updated = menuItems.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    setMenuItems(updated);
    setFilteredItems(updated);
    if (viewingItem && viewingItem.id === updatedItem.id) {
      setViewingItem(updatedItem);
    }
    setToastMessage("Note updated successfully!");
    setShowToast(true);
    setEditingItem(null);
    setViewingItem(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{restaurantName} Saved Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="button-save-row">
          <IonButton className="btn-full" expand="block" onClick={handleViewFullMenu}>
            View Full Menu
          </IonButton>
        </div>

        {/*
          Don’t render *anything* here until loadingPrefs===false.
          Then fall back to your existing (preferredLocation||restaurantThumbnail)
        */}
        {!loadingPrefs && (preferredLocation || restaurantThumbnail) && (
          <div className="preferred-location-banner">
            <IonImg
              src={preferredLocation?.photoUrl || restaurantThumbnail!}
              alt={preferredLocation?.name || restaurantName}
              className="menu-banner"
            />
            <div className="info-column">
              <h2 className="info-name">
                {preferredLocation?.name || restaurantName}{" "}
              </h2>
              <p className="address-text-save">
                Preferred Location:{" "}
                {preferredLocation?.address || "No specific location"}
              </p>{" "}
              {userAllergens.length > 0 && (
                <p className="allergen-warn-save" style={{ color: "red" }}>
                  Menu items with allergens marked in red contain your allergens.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="menu-title-line">
          <h2 className="save-menu">Saved Menu Items</h2>
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
                      {truncateDescription(item.description, 75)}
                    </p>
                    <p className="allergen-label">
                      <strong>
                        <span style={{ color: "#02382E" }}>Allergens: </span>
                      </strong>
                      {item.allergens.map((allergen, i) => {
                        const isUserAllergen = userAllergens.includes(
                          allergen.toLowerCase().trim()
                        );
                        return (
                          <span
                            key={i}
                            style={{ color: isUserAllergen ? "red" : "black" }}
                          >
                            {allergen}
                            {i < item.allergens.length - 1 ? ", " : ""}
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
                    <IonButton onClick={() => handleViewItem(item)} className="btn-view">
                      View Item
                    </IonButton>
                    <IonButton
                      className="btn-delete"
                      color="danger"
                      onClick={() => handleDeleteItem(item)}
                    >
                      Delete Item
                    </IonButton>
                  </div>
                </div>
                <div className="created-img">
                  {item.imageUrl && (
                    <IonImg src={item.imageUrl} alt={item.name} className="menu-image" />
                  )}
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
            backdropDismiss
            showBackdrop
          >
            <div className="item-modal view-mod">
              <IonButton
                className="close-button"
                fill="clear"
                onClick={() => setViewingItem(null)}
              >
                <IonIcon
                  icon={closeSharp}
                  style={{ color: "var(--ion-color-primary)" }}
                />
              </IonButton>
              <IonImg
                className="save-view-img"
                src={viewingItem?.imageUrl}
                alt={viewingItem?.name}
              />
              <h2 className="modal-view-h2">{viewingItem?.name}</h2>
              <p className="modal-desc">{viewingItem?.description}</p>
              <p className="allergen-label-view">
                <strong>
                  <span style={{ color: "#02382E" }}>Allergens: </span>
                </strong>
                {viewingItem?.allergens.map((allergen, i) => {
                  const isUserAllergen = userAllergens.includes(
                    allergen.toLowerCase().trim()
                  );
                  return (
                    <span
                      key={i}
                      style={{ color: isUserAllergen ? "red" : "black" }}
                    >
                      {allergen}
                      {i < viewingItem.allergens.length - 1 ? ", " : ""}
                    </span>
                  );
                })}
              </p>
              <p>
                <strong>Note: </strong>
                {viewingItem?.note}
              </p>
              <div className="modal-btn-row-view">
                <IonButton onClick={() => setEditingItem(viewingItem)}>
                  <IonIcon slot="start" icon={createOutline} />
                  Edit
                </IonButton>
                <IonButton
                  color="danger"
                  onClick={() => {
                    handleDeleteItem(viewingItem);
                    setViewingItem(null);
                  }}
                >
                  <IonIcon slot="start" icon={trashSharp} />
                  Delete
                </IonButton>
              </div>
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
