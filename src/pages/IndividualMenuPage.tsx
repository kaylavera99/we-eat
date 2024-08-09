import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { RouteComponentProps } from 'react-router';
import { fetchCreatedMenus, fetchSavedMenus } from '../services/menuService';
import { MenuItem, SavedMenu } from '../services/menuService';

interface IndividualMenuPageProps extends RouteComponentProps<{
  restaurantName: string;
  menuType: string;
}> {}

const IndividualMenuPage: React.FC<IndividualMenuPageProps> = ({ match }) => {
  const [menu, setMenu] = useState<SavedMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let fetchedMenu: SavedMenu | null = null;
        console.log("Params", match.params.menuType)

        if (match.params.menuType === 'created') {
          const createdMenus = await fetchCreatedMenus();
          fetchedMenu = createdMenus.find(menu => menu.restaurantName === decodeURIComponent(match.params.restaurantName)) || null;
        } else if (match.params.menuType === 'saved') {
          const savedMenus = await fetchSavedMenus();
          fetchedMenu = savedMenus.find(menu => menu.restaurantName === decodeURIComponent(match.params.restaurantName)) || null;
        } else {
        }

        if (fetchedMenu) {
          setMenu(fetchedMenu);
        } else {
          setToastMessage('Menu not found.');
          setShowToast(true);
        }
      } catch (error) {
        setToastMessage(`Error: ${(error as Error).message}`);
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [match.params.restaurantName, match.params.menuType]);

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, index) => (
      <IonItem key={index}>
        <IonLabel>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <p>Allergens: {item.allergens.join(', ')}</p>
          <p>Note: {item.note}</p>
        </IonLabel>
      </IonItem>
    ));
  };

  const renderMenuCategories = (dishes: MenuItem[]) => {
    const categories = dishes.reduce((acc: { [key: string]: MenuItem[] }, dish) => {
      if (!acc[dish.category]) acc[dish.category] = [];
      acc[dish.category].push(dish);
      return acc;
    }, {});

    return Object.entries(categories).map(([category, items]) => (
      <div key={category}>
        <h5>{category}</h5>
        <IonList>
          {renderMenuItems(items)}
        </IonList>
      </div>
    ));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{decodeURIComponent(match.params.restaurantName)}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {isLoading ? (
          <IonLoading isOpen={isLoading} message="Loading..." />
        ) : (
          <div>
            {menu ? (
              <>
                <h2>Menu</h2>
                {renderMenuCategories(menu.dishes)}
              </>
            ) : (
              <p>No menu found.</p>
            )}
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

export default IndividualMenuPage;
