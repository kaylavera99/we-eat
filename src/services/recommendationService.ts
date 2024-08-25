import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { fetchSavedMenus, MenuItem } from './menuService';

export interface MenuCategory {
  id: string;
  category: string;
  items: MenuItem[];
  index: number;
}

export interface Restaurant {
  id: string;
  name: string;
  menu: MenuCategory[];
  thumbnailUrl: string;
}

interface UserData {
  allergens: { [key: string]: boolean };
}

export const fetchUserData = async (): Promise<string[]> => {
  const allergens: string[] = [];
  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as UserData;
      const userAllergens = Object.keys(userData.allergens)
        .filter(allergen => userData.allergens[allergen])
        .map(allergen => allergen.toLowerCase().trim());
      allergens.push(...userAllergens);
    }
  }
  return allergens;
};

export const fetchAllRestaurants = async (): Promise<{ id: string; name: string; thumbnailUrl: string; }[]> => {
  const restaurants: { id: string; name: string; thumbnailUrl: string; }[] = [];
  const querySnapshot = await getDocs(collection(db, 'restaurants'));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    restaurants.push({
      id: doc.id,
      name: data.name,
      thumbnailUrl: data.thumbnailUrl
    });
  });
  return restaurants;
};

export const fetchFullMenuFromRestaurantById = async (restaurantId: string): Promise<MenuCategory[]> => {
  const categories: MenuCategory[] = [];
  const restaurantDocRef = doc(db, 'restaurants', restaurantId);
  const menuCollectionRef = collection(restaurantDocRef, 'menu');
  const menuSnapshot = await getDocs(menuCollectionRef);

  if (!menuSnapshot.empty) {
    for (const categoryDoc of menuSnapshot.docs) {
      const categoryData = categoryDoc.data();
      const itemsCollectionRef = collection(categoryDoc.ref, 'items');
      const itemsSnapshot = await getDocs(itemsCollectionRef);

      const items: MenuItem[] = itemsSnapshot.docs.map(itemDoc => {
        const itemData = itemDoc.data();
        return {
          id: itemDoc.id,
          name: itemData.name,
          description: itemData.description,
          allergens: itemData.allergens,
          note: itemData.note,
          category: categoryData.category,
          imageUrl: itemData.imageUrl
        };
      });

      categories.push({
        id: categoryDoc.id,
        category: categoryData.category,
        items,
        index: categoryData.index
      });
    }
  } else {
    console.log("No menu found for restaurant:", restaurantId);
  }

  return categories;
};

export const fetchRestaurantMenus = async (restaurantIds: string[]): Promise<{ [key: string]: Restaurant }> => {
  const menus: { [key: string]: Restaurant } = {};
  for (const id of restaurantIds) {
    const categories: MenuCategory[] = [];
    const restaurantDocRef = doc(db, 'restaurants', id);
    const menuCollectionRef = collection(restaurantDocRef, 'menu');
    const menuSnapshot = await getDocs(menuCollectionRef);

    if (!menuSnapshot.empty) {
      for (const categoryDoc of menuSnapshot.docs) {
        const categoryData = categoryDoc.data();
        const itemsCollectionRef = collection(categoryDoc.ref, 'items');
        const itemsSnapshot = await getDocs(itemsCollectionRef);

        const items: MenuItem[] = itemsSnapshot.docs.map(itemDoc => {
          const itemData = itemDoc.data();
          return {
            id: itemDoc.id,
            name: itemData.name,
            description: itemData.description,
            allergens: itemData.allergens,
            note: itemData.note,
            category: categoryData.category,
            imageUrl: itemData.imageUrl
          };
        });

        categories.push({
          id: categoryDoc.id,
          category: categoryData.category,
          items,
          index: categoryData.index
        });
      }
    } else {
      console.log("No menu found for restaurant:", id);
    }

    menus[id] = { id, name: '', menu: categories, thumbnailUrl: '' };
  }
  return menus;
};

export const filterAndRankRestaurants = (
  restaurants: { id: string; name: string; thumbnailUrl: string; }[],
  menus: { [key: string]: Restaurant },
  userAllergens: string[],
  userMenuItems: MenuItem[]
): { id: string; name: string; thumbnailUrl: string; }[] => {
  return restaurants.filter((restaurant) => {
    const menu = menus[restaurant.id]?.menu || [];
    const hasSafeItems = menu.some(category =>
      category.items.some(item =>
        item.allergens.every(allergen =>
          !userAllergens.includes(allergen.toLowerCase().trim())
        )
      )
    );
    return hasSafeItems;
  });
};

export const getRecommendedMenus = async (): Promise<{ id: string; name: string, thumbnailUrl: string; }[]> => {
  const userAllergens = await fetchUserData();
  const allRestaurants = await fetchAllRestaurants();
  const restaurantIds = allRestaurants.map(r => r.id);
  const menus = await fetchRestaurantMenus(restaurantIds);
  const userMenuItems = await fetchSavedMenus();

  return filterAndRankRestaurants(allRestaurants, menus, userAllergens, userMenuItems.flatMap(menu => menu.dishes));
};

export const filterMenuItemsByAllergens = (
  items: MenuItem[],
  userAllergens: string[]
): MenuItem[] => {
  return items.filter(item =>
    Array.isArray(item.allergens) && item.allergens.every(allergen =>
      !userAllergens.includes(allergen.toLowerCase().trim())
    )
  );
};
