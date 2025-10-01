import { collection, getDocs, doc, addDoc, deleteDoc, query, where, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import {MenuItem, MenuCategory} from '../types/menu'
import {UserData} from '../types/user'


export interface SavedMenu {
  restaurantName: string;
  dishes: MenuItem[];
  restaurantId?: string;
  thumbnailUrl?: string;
}


// Used in fetchMenuData, fetchSavedMenus
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
      imageUrl: dishData.imageUrl
    } as MenuItem;
  });
};


export const fetchMenuData = async (): Promise<{ savedMenus: SavedMenu[], createdMenus: SavedMenu[] }> => {
  const savedMenus: SavedMenu[] = [];
  const createdMenus: SavedMenu[] = [];

  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);

    const savedMenusSnapshot = await getDocs(collection(userDocRef, 'savedMenus'));
    for (const menuDoc of savedMenusSnapshot.docs) {
      const menuData = menuDoc.data();
      const dishes = await fetchMenuItems(menuDoc.ref);

      savedMenus.push({
        restaurantName: menuData.restaurantName,
        dishes,
      });
    }

    const createdMenusSnapshot = await getDocs(collection(userDocRef, 'createdMenus'));
    for (const menuDoc of createdMenusSnapshot.docs) {
      const menuData = menuDoc.data();
      const dishes = await fetchMenuItems(menuDoc.ref);

      createdMenus.push({
        restaurantName: menuData.restaurantName,
        dishes,
      });
    }
  }

  return { savedMenus, createdMenus };
};


// Utility function to get all menu items by category
// Used in getMenuItemsByCategory
const getAllMenuItemsByCategory = (menu: { [category: string]: { dishes: MenuItem[] } } | undefined, category: string): MenuItem[] => {
  if (!menu) return [];
  return Object.entries(menu).reduce((acc: MenuItem[], [cat, value]) => {
    if (cat === category) {
      acc.push(...value.dishes);
    }
    return acc;
  }, []);
};

// GETTING MENU BY CATEGORY
// Used in getRecommendations
export const getMenuByCategory = async (category: string): Promise<SavedMenu[]> => {
  const menusRef = collection(db, 'restaurants');
  const snapshot = await getDocs(menusRef);

  const matchingMenus: SavedMenu[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const menuItems = getAllMenuItemsByCategory(data.menu, category);
    if (menuItems.length > 0) {
      matchingMenus.push({
        restaurantName: data.name,
        dishes: menuItems
      });
    }
  });
  return matchingMenus;
};



// GET RECOMMENDATIONS
export const getRecommendations = async (): Promise<SavedMenu[]> => {
  const { savedMenus, createdMenus } = await fetchMenuData();
  const userMenus = [...savedMenus, ...createdMenus];

  const categories = userMenus.flatMap(menu => menu.dishes.map(dish => dish.category));
  const uniqueCategories = Array.from(new Set(categories));


  let recommendations: SavedMenu[] = [];
  for (const category of uniqueCategories) {
    const menus = await getMenuByCategory(category);
    recommendations = [...recommendations, ...menus];
  }
  return recommendations;
};

// CREATED MENUS - REFACTORED 
export const addMenuToCreatedMenus = async (menu: SavedMenu) => {
  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const createdMenusRef = collection(userDocRef, 'createdMenus');
    const newMenuDocRef = doc(createdMenusRef);
    await setDoc(newMenuDocRef, menu);
  }
};

export const addMenuItemToCreatedMenus = async (item: MenuItem, menuDocId: string) => {
  const userDocRef = doc(db, "users", auth.currentUser!.uid);
  const menuDocRef = doc(userDocRef, "createdMenus", menuDocId);
  const dishesRef = collection(menuDocRef, "dishes");
  await addDoc(dishesRef, item);
};

export const updateMenuItemInCreatedMenus = async (item: MenuItem, menuDocId: string, itemId: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser!.uid);
  const menuDocRef = doc(userDocRef, 'createdMenus', menuDocId);
  const dishDocRef = doc(menuDocRef, "dishes", itemId);
  await updateDoc(dishDocRef, {...item});


};

export const updateNotesInCreatedMenus = async (itemId: string, newNotes: string, restaurantName: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const createdMenusRef = collection(userDocRef, 'createdMenus');
  const menuSnapshot = await getDocs(createdMenusRef);

  let menuDocRef: any = null;
  menuSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.restaurantName === restaurantName) {
      menuDocRef = doc.ref;
    }
  });


  if (!menuDocRef) {
    throw new Error("Menu not found.");
  }

  const dishDocRef = doc(collection(menuDocRef, 'dishes'), itemId);

  await updateDoc(dishDocRef, { note: newNotes });
};

export const deleteMenuItemFromCreatedMenus = async (itemId: string, menuDocId: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const menuDocRef = doc(userDocRef, "createdMenus", menuDocId);
  const dishDocRef = doc(menuDocRef, "dishes", itemId)

  await deleteDoc(dishDocRef);
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
        imageUrl: itemData.imageUrl
      };
    });

    categories.push({
      id: categoryDoc.id,
      category: categoryData.category,
      items,
      index: categoryData.index || 0,
    });
  }

  return categories;
};

export const fetchCreatedMenus = async (): Promise<SavedMenu[]> => {
  const createdMenus: SavedMenu[] = [];

  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const createdMenusSnapshot = await getDocs(collection(userDocRef, 'createdMenus'));

    for (const menuDoc of createdMenusSnapshot.docs) {
      const menuData = menuDoc.data();
      const dishes = await fetchMenuItems(menuDoc.ref);
      createdMenus.push({
        restaurantName: menuData.restaurantName,
        dishes,
      });
    }
  }

  return createdMenus;
};

// SAVED MENUS
export const deleteMenuItemFromSavedMenus = async (itemId: string, savedMenuDocId: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const savedMenuRef = doc(userDocRef, 'savedMenus', savedMenuDocId);
  const dishDocRef = doc(savedMenuRef, 'dishes', itemId);
  console.log("Deleting dish at path:", dishDocRef.path);


  await deleteDoc(dishDocRef);
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
  try {
    await updateDoc(dishDocRef, { note: newNotes });
  } catch (error) {
    console.error(`Failed to update note for item ${itemId} in restaurant ${restaurantName}: ${error}`);
    throw error;
  }
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
  for (const menuDoc of savedMenusSnapshot.docs) {
    const menuData = menuDoc.data();
    const itemsCollectionRef = collection(menuDoc.ref, 'dishes');
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
        imageUrl: itemData.imageUrl
      };
    });

    categories.push({
      id: menuDoc.id,
      category: menuData.category,
      items,
      index: menuData.index
    });
  }

  return categories;
};

export const updateMenuItemInSavedMenus = async (item: MenuItem, restaurantName: string, itemId: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const savedMenusRef = collection(userDocRef, 'savedMenus');
  const q = query(savedMenusRef, where("restaurantName", "==", restaurantName));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Menu not found.");
  }

  const menuDocRef = querySnapshot.docs[0].ref;
  const dishDocRef = doc(collection(menuDocRef, 'dishes'), itemId);
  await updateDoc(dishDocRef, { ...item });
};

export const addMenuItemToSavedMenus = async (item: MenuItem, restaurantName: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  if (!item.category) {
    throw new Error("Menu item must have a category");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const savedMenusRef = collection(userDocRef, 'savedMenus');
  const q = query(savedMenusRef, where("restaurantName", "==", restaurantName));
  const querySnapshot = await getDocs(q);

  let menuDocRef: any = null;

  if (!querySnapshot.empty) {
    // Menu already exists
    menuDocRef = querySnapshot.docs[0].ref;

    // Check for duplicate item
    const dishesRef = collection(menuDocRef, 'dishes');
    const existingQuery = query(dishesRef, where("name", "==", item.name));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      console.log("Item already exists in saved menu");
      return;
    }

    // Add new item > AddDish
    const { id, ...itemWithoutId } = item;
    await addDoc(dishesRef, itemWithoutId);
  } else {
    // Menu does not exist yet — create it > CreateMenu
    const restaurantQuery = query(
      collection(db, "restaurants"),
      where("name", "==", restaurantName)
    );
    const restaurantSnapshot = await getDocs(restaurantQuery);

    if (restaurantSnapshot.empty) {
      throw new Error(`Restaurant ${restaurantName} not found in database.`);
    }

    const restaurantId = restaurantSnapshot.docs[0].id;

    // Create new saved menu with restaurantId
    menuDocRef = await addDoc(savedMenusRef, {
      restaurantName,
      restaurantId,
    });

    // Add first item
    const dishesRef = collection(menuDocRef, 'dishes');
    await addDoc(dishesRef, { ...item });
  }
};



export const fetchSavedMenus = async (): Promise<SavedMenu[]> => {
  const savedMenus: SavedMenu[] = [];

  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const savedMenusSnapshot = await getDocs(collection(userDocRef, 'savedMenus'));

    for (const menuDoc of savedMenusSnapshot.docs) {
      const menuData = menuDoc.data();
      const dishes = await fetchMenuItems(menuDoc.ref);
      savedMenus.push({
        restaurantName: decodeURIComponent(menuData.restaurantName),
        dishes,
      });
    }
  }

  return savedMenus;
};

