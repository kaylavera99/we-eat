import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where, writeBatch, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { MenuCategory } from './restaurantService';

export interface MenuItem {
  id?: string; // Add the id field here
  name: string;
  description: string;
  allergens: string[];
  note?: string;
  category: string;
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
  const menuSnapshot = await getDocs(createdMenusRef);
  
  let menuDocRef = null;
  menuSnapshot.forEach(doc => {
    if (doc.data().restaurantName === restaurantName) {
      menuDocRef = doc.ref;
    }
  });

  if (!menuDocRef) {
    menuDocRef = await addDoc(createdMenusRef, {
      restaurantName,
    });
  }

  const dishesRef = collection(menuDocRef, 'dishes');
  await addDoc(dishesRef, { ...item });
};

export const updateMenuItemInCreatedMenus = async (item: MenuItem, restaurantName: string, itemId: string) => {
    if (!auth.currentUser) {
      throw new Error("No user is currently logged in.");
    }
  
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const createdMenusRef = collection(userDocRef, 'createdMenus');
    const menuSnapshot = await getDocs(createdMenusRef);
  
    let menuDocRef = null;
    menuSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Checking menu:', data.restaurantName);
      if (data.restaurantName === restaurantName) {
        menuDocRef = doc.ref;
      }
    });
  
    console.log('Menu Doc Ref:', menuDocRef);
  
    if (!menuDocRef) {
      throw new Error("Menu not found.");
    }
  
    const dishDocRef = doc(collection(menuDocRef, 'dishes'), itemId);
    await updateDoc(dishDocRef, { ...item } as { [x: string]: any });
  };

export const deleteMenuItemFromCreatedMenus = async (item: MenuItem, restaurantName: string) => {
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

  const qItem = query(dishesCollectionRef, where("name", "==", item.name), where("category", "==", item.category));
  const itemSnapshot = await getDocs(qItem);

  if (itemSnapshot.empty) {
    throw new Error(`Menu item ${item.name} does not exist in ${restaurantName}.`);
  }

  const batch = writeBatch(db);
  itemSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

export const deleteMenuItemFromSavedMenus = async (item: MenuItem, restaurantName: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const savedMenusRef = collection(userDocRef, 'savedMenus');

  const q = query(savedMenusRef, where("restaurantName", "==", restaurantName));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error(`Restaurant ${restaurantName} does not exist in saved menus.`);
  }

  const menuDocRef = querySnapshot.docs[0].ref;
  const dishesCollectionRef = collection(menuDocRef, 'dishes');

  const qItem = query(dishesCollectionRef, where("name", "==", item.name), where("category", "==", item.category));
  const itemSnapshot = await getDocs(qItem);

  if (itemSnapshot.empty) {
    throw new Error(`Menu item ${item.name} does not exist in ${restaurantName}.`);
  }

  const batch = writeBatch(db);
  itemSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};


export const updateNotesInSavedMenus = async (itemId: string, newNotes: string, restaurantName: string) => {
    if (!auth.currentUser) {
      throw new Error("No user is currently logged in.");
    }
  
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const savedMenusRef = collection(userDocRef, 'savedMenus');
  
    const q = query(savedMenusRef, where("restaurantName", "==", restaurantName));
    const querySnapshot = await getDocs(q);
  
    if (querySnapshot.empty) {
      throw new Error(`Restaurant ${restaurantName} does not exist in saved menus.`);
    }
  
    const menuDocRef = querySnapshot.docs[0].ref;
    const dishesCollectionRef = collection(menuDocRef, 'dishes');
  
    const dishDocRef = doc(dishesCollectionRef, itemId);
    await updateDoc(dishDocRef, { note: newNotes });
  };
  

const fetchMenuItems = async (menuDocRef: any): Promise<MenuItem[]> => {
  const dishesSnapshot = await getDocs(collection(menuDocRef, 'dishes'));
  return dishesSnapshot.docs.map(dishDoc => {
    const dishData = dishDoc.data();
    return {
      id: dishDoc.id,
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

export const getCreatedMenusForRestaurant = async (restaurantName: string): Promise<MenuCategory[]> => {
  if (!auth.currentUser) {
    return [];
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const createdMenusSnapshot = await getDocs(
    query(collection(userDocRef, 'createdMenus'), where('restaurantName', '==', restaurantName))
  );

  const categories: MenuCategory[] = [];
  for (const categoryDoc of createdMenusSnapshot.docs) {
    const categoryData = categoryDoc.data();
    const itemsCollectionRef = collection(categoryDoc.ref, 'dishes');
    const itemsSnapshot = await getDocs(itemsCollectionRef);

    const items: MenuItem[] = itemsSnapshot.docs.map(itemDoc => {
      const itemData = itemDoc.data();
      return {
        id: itemDoc.id,
        name: itemData.name,
        description: itemData.description,
        allergens: itemData.allergens,
        note: itemData.note,
        category: itemData.category,
      };
    });

    categories.push({
      id: categoryDoc.id,
      category: categoryData.category,
      items,
    });
  }

  return categories;
};

export const getSavedMenusForRestaurant = async (restaurantName: string): Promise<MenuCategory[]> => {
  if (!auth.currentUser) {
    return [];
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const savedMenusSnapshot = await getDocs(
    query(collection(userDocRef, 'savedMenus'), where('restaurantName', '==', restaurantName))
  );

  const categories: MenuCategory[] = [];
  for (const categoryDoc of savedMenusSnapshot.docs) {
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
        category: itemData.category,
      };
    });

    categories.push({
      id: categoryDoc.id,
      category: categoryData.category,
      items,
    });
  }

  return categories;
};

export const fetchFullMenuFromRestaurants = async (restaurantName: string): Promise<MenuCategory[]> => {
  const categories: MenuCategory[] = [];

  const restaurantsRef = collection(db, 'restaurants');
  const q = query(restaurantsRef, where("name", "==", restaurantName));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const restaurantDocRef = querySnapshot.docs[0].ref;
    const menuCollectionRef = collection(restaurantDocRef, 'menu');
    const menuSnapshot = await getDocs(menuCollectionRef);

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
          category: itemData.category,
        };
      });

      categories.push({
        id: categoryDoc.id,
        category: categoryData.category,
        items,
      });
    }
  }

  return categories;
};