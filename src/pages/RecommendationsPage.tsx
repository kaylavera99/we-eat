import React, { useEffect, useState, Suspense } from 'react';
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
  IonCardTitle,
  IonCardSubtitle,
  IonAccordion,
  IonAccordionGroup,
  IonItemDivider,
  IonIcon
} from '@ionic/react';
import { addMenuItemToSavedMenus, MenuItem, fetchSavedMenus } from '../services/menuService';
import { fetchUserData, fetchRestaurantMenus, filterAndRankRestaurants, fetchAllRestaurants, filterMenuItemsByAllergens, Restaurant } from '../services/recommendationService';
import '../styles/RecommendationsPage.css';
import { compassOutline } from 'ionicons/icons';
const LazyImage = React.lazy(() => import('../components/LazyLoading'));


interface MenuCategory {
  category: string;
  items: MenuItem[];
}

interface UserData {
  allergens: { [key: string]: boolean };
}

const RecommendationsPage: React.FC = () => {
  const [recommendedRestaurants, setRecommendedRestaurants] = useState<{ id: string, name: string, thumbnailUrl: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [restaurantMenus, setRestaurantMenus] = useState<{ [key: string]: Restaurant }>({});
  const [userMenuItems, setUserMenuItems] = useState<MenuItem[]>([]);
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedRestaurantName, setSelectedRestaurantName] = useState<string | null>(null);
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
        const userMenuItemsFlat = fetchedUserMenuItems.flatMap(menu => menu.dishes);
        setUserMenuItems(userMenuItemsFlat);

        const recommendations = filterAndRankRestaurants(allRestaurants, menus, allergens, userMenuItemsFlat);
        const recommendationsWithThumbnails = recommendations.map(restaurant => {
          const foundRestaurant = allRestaurants.find(r => r.id === restaurant.id);
          return {
            ...restaurant,
            thumbnailUrl: foundRestaurant ? foundRestaurant.thumbnailUrl : ''
          };
        });

        setRecommendedRestaurants(recommendationsWithThumbnails);
        setRestaurantMenus(menus);
      } catch (error) {
        console.error(error);
        setToastMessage('Failed to fetch recommendations');
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleAddToPersonalizedMenu = async (restaurantName: string, item: MenuItem) => {
    try {
      await addMenuItemToSavedMenus(item, restaurantName);

      const updatedUserMenuItems = await fetchSavedMenus();
      setUserMenuItems(updatedUserMenuItems.flatMap(menu => menu.dishes));

      setToastMessage('Item added to personalized menu');
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
        setUserMenuItems(updatedUserMenuItems.flatMap(menu => menu.dishes));

        setToastMessage('Item added to personalized menu');
        setShowToast(true);
        setShowModal(false);
      } catch (error: any) {
        setToastMessage(error.message);
        setShowToast(true);
      }
    }
  };

  const filterUserMenuItems = (restaurantId: string, items: MenuItem[]): MenuItem[] => {
    return items.filter(item => !userMenuItems.some(userMenuItem => userMenuItem.name === item.name));
  };

  const filterItemsByAllergens = (items: MenuItem[]): MenuItem[] => {
    return filterMenuItemsByAllergens(items, userAllergens);
  };

  const truncateDescription = (description: string, maxLength: number) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Recommended Menus</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className='page-banner-row'>       
        <IonIcon slot="end" icon={compassOutline} style={{color:'black' }} /><h2> Explore Menus</h2></div>
        <p className='page-intro'>Discover menu items that don't contain your allergens.</p>
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <IonList>
            <IonAccordionGroup>
  {recommendedRestaurants.map((restaurant) => (
    <IonAccordion key={`${restaurant.id}-${restaurant.name}`}>
      <IonItem slot="header">
      <Suspense fallback={<div>Loading image...</div>}>
                      <LazyImage
                        src={restaurant.thumbnailUrl}
                        alt={restaurant.name}
                        style={{ width: '50px', height: '50px', marginRight: '10px' }}
                      />
                    </Suspense>
        <h2>{restaurant.name}</h2>
      </IonItem>
      <div className="ion-padding" slot="content">
        {restaurantMenus[restaurant.id]?.menu?.map((menuCategory: MenuCategory, index: number) => (
          <div key={`${restaurant.id}-${menuCategory.category}-${index}`}>
            <IonItemDivider>
              <h3>{menuCategory.category}</h3>
            </IonItemDivider>
            <IonList>
              {filterItemsByAllergens(filterUserMenuItems(restaurant.id, menuCategory.items)).map((item: MenuItem, itemIndex: number) => (
                <IonItem className='menu-list' key={`${restaurant.id}-${menuCategory.category}-${item.id}-${itemIndex}`}>
                  <div className="menu-item-container">
                  <Suspense fallback={<div>Loading image...</div>}>
                                  <LazyImage
                                    src={item.imageUrl || 'path/to/placeholder-image.jpg'}
                                    alt={item.name}
                                    style={{ width: '100px', height: '100px' }}
                                  />
                                </Suspense>
                    <div className="menu-item-details">
                      <IonLabel>
                        <h4>{item.name}</h4>
                        <p>{truncateDescription(item.description, 70)}</p>
                        <p>
                          Allergens: {item.allergens.join(', ')}
                        </p>
                      </IonLabel>
                      <div className="menu-item-buttons">
                        <IonButton onClick={() => handleViewItem(item, restaurant.name)}>View Item</IonButton>
                        <IonButton onClick={() => handleAddToPersonalizedMenu(restaurant.name, item)}>Add to Menu</IonButton>
                      </div>
                    </div>
                  </div>
                </IonItem>
              ))}
            </IonList>
          </div>
        ))}
      </div>
    </IonAccordion>
  ))}
</IonAccordionGroup>
          </IonList>
        )}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{selectedMenuItem?.name}</IonCardTitle>
              <IonCardSubtitle>{selectedMenuItem?.category}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <IonImg src={selectedMenuItem?.imageUrl} alt={selectedMenuItem?.name} />
              <p>{selectedMenuItem?.description}</p>
              <p>
                Allergens:{' '}
                {selectedMenuItem?.allergens.map((allergen, index) => (
                  <span key={index}>
                    {allergen}{index < selectedMenuItem.allergens.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
              <IonButton onClick={handleAddItemFromModal}>Add</IonButton>
              <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
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
