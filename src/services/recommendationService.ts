import { getDocs, collection, doc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { MenuItem, SavedMenu } from './menuService';

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  menu: MenuCategory[];
}

export const fetchUserSavedMenuItems = async (): Promise<MenuItem[]> => {
  const menuItems: MenuItem[] = [];
  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);

    // Fetch saved menu items
    const savedMenusSnap = await getDocs(collection(userDocRef, 'savedMenus'));
    for (const menuDoc of savedMenusSnap.docs) {
      const dishesSnap = await getDocs(collection(menuDoc.ref, 'dishes'));
      dishesSnap.forEach(dishDoc => {
        const dishData = dishDoc.data();
        menuItems.push(dishData as MenuItem);
      });
    }

  }
  //console.log("Fetched User Saved Menu Items:", menuItems);
  return menuItems;
};

export const fetchRestaurantMenu = async (restaurantId: string): Promise<MenuCategory[]> => {
  const menuCategories: MenuCategory[] = [];
  const menuSnap = await getDocs(collection(db, 'restaurants', restaurantId, 'menu'));
  for (const menuDoc of menuSnap.docs) {
    const itemsSnap = await getDocs(collection(menuDoc.ref, 'items'));
    const items: MenuItem[] = itemsSnap.docs.map(itemDoc => {
      const itemData = itemDoc.data();
      itemData.id = itemDoc.id; // Ensure the ID is included
      return itemData as MenuItem;
    });
    const menuData = menuDoc.data();
    menuCategories.push({ category: menuData.category, items });
  }
  //console.log(`Fetched Menu for Restaurant ID ${restaurantId}:`, menuCategories);
  return menuCategories;
};

export const getRecommendedMenus = async (): Promise<{ id: string, name: string }[]> => {
  const userMenuItems = await fetchUserSavedMenuItems();
  const recommendedRestaurants = await fetchRecommendedRestaurants(userMenuItems);
  return recommendedRestaurants;
};

const fetchRecommendedRestaurants = async (userMenuItems: MenuItem[]): Promise<{ id: string, name: string }[]> => {
  const recommendedRestaurants = new Map<string, string>();
  const userCategories = userMenuItems.map(item => item.category);
  //console.log("User Categories:", userCategories);

  const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
  for (const restaurantDoc of restaurantsSnap.docs) {
    const restaurantData = restaurantDoc.data();
  //  console.log("Restaurant Data:", restaurantData);

    const menuSnap = await getDocs(collection(restaurantDoc.ref, 'menu'));
    for (const menuDoc of menuSnap.docs) {
      const menuData = menuDoc.data();
      //console.log("Menu Data:", menuData);

      if (userCategories.includes(menuData.category)) {
        recommendedRestaurants.set(restaurantDoc.id, restaurantData.name);
       // console.log(`Matched Category: ${menuData.category} in ${restaurantData.name}`);
      }
    }
  }

  console.log("Recommended Restaurants:", Array.from(recommendedRestaurants.entries()));
  return Array.from(recommendedRestaurants.entries()).map(([id, name]) => ({ id, name }));
};
