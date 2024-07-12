import { collection, doc, getDocs, addDoc, query, where, writeBatch, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export interface MenuItem {
  name: string;
  description: string;
  allergens: string[];
  note?: string;
  category: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface SavedMenu {
  restaurantName: string;
  dishes: MenuItem[];
}

export interface UserData {
  name: string;
  email: string;
  allergens: { [key: string]: boolean };
}

export const addMenuToCreatedMenus = async (menu: SavedMenu) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const createdMenusRef = collection(userDocRef, 'createdMenus');
  await addDoc(createdMenusRef, {
    restaurantName: menu.restaurantName,
    dishes: menu.dishes
  });
};

export const addMenuItemToCreatedMenus = async (item: MenuItem, restaurantName: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const createdMenusRef = collection(userDocRef, 'createdMenus');

  const q = query(createdMenusRef, where("restaurantName", "==", restaurantName));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error(`Restaurant ${restaurantName} does not exist in created menus.`);
  }

  const menuDocRef = querySnapshot.docs[0].ref;
  const dishesCollectionRef = collection(menuDocRef, 'dishes');

  await addDoc(dishesCollectionRef, item);
};

const fetchMenuItems = async (menuDocRef: any): Promise<MenuItem[]> => {
  const dishesSnapshot = await getDocs(collection(menuDocRef, 'dishes'));
  return dishesSnapshot.docs.map(dishDoc => {
    const dishData = dishDoc.data();
    return {
      name: dishData.name,
      description: dishData.description,
      allergens: dishData.allergens,
      note: dishData.note,
      category: dishData.category,
    } as MenuItem;
  });
};

export const fetchMenuData = async (): Promise<{ savedMenus: SavedMenu[], createdMenus: SavedMenu[] }> => {
  const savedMenus: SavedMenu[] = [];
  const createdMenus: SavedMenu[] = [];

  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as UserData;
      console.log("User Data: ", userData);

      const savedMenusSnapshot = await getDocs(collection(userDocRef, 'savedMenus'));
      for (const menuDoc of savedMenusSnapshot.docs) {
        const menuData = menuDoc.data();
        const dishes = await fetchMenuItems(menuDoc.ref);
        savedMenus.push({
          restaurantName: menuData.restaurantName,
          dishes,
        });
      }

      console.log("Saved Menus: ", savedMenus);

      const createdMenusSnapshot = await getDocs(collection(userDocRef, 'createdMenus'));
      for (const menuDoc of createdMenusSnapshot.docs) {
        const menuData = menuDoc.data();
        const dishes = await fetchMenuItems(menuDoc.ref);
        createdMenus.push({
          restaurantName: menuData.restaurantName,
          dishes,
        });
      }

      console.log("Created Menus: ", createdMenus);
    }
  }

  return { savedMenus, createdMenus };
};
