import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where, writeBatch, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { MenuCategory } from './restaurantService';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  allergens: string[];
  note?: string;
  category: string;
  imageUrl?: string;  // Add the imageUrl field
}

export interface SavedMenu {
  restaurantName: string;
  dishes: MenuItem[];
  thumbnailUrl?: string;
}

export interface UserData {
  name: string;
  email: string;
  allergens: { [key: string]: boolean };
}

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
      imageUrl: dishData.imageUrl  // Include imageUrl
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

// Utility function to get all menu items by category
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
export const getMenuByCategory = async (category: string): Promise<SavedMenu[]> => {
  const menusRef = collection(db, 'restaurants');
  const snapshot = await getDocs(menusRef);

  const matchingMenus: SavedMenu[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("Processing restaurant data: ", data);
    const menuItems = getAllMenuItemsByCategory(data.menu, category);
    if (menuItems.length > 0) {
      matchingMenus.push({
        restaurantName: data.name,
        dishes: menuItems
      });
    }
  });
  console.log("Matching Menus for category ", category, ": ", matchingMenus);
  return matchingMenus;
};

// GET RECOMMENDATIONS
export const getRecommendations = async (userId: string): Promise<SavedMenu[]> => {
  const { savedMenus, createdMenus } = await fetchMenuData();
  const userMenus = [...savedMenus, ...createdMenus];

  const categories = userMenus.flatMap(menu => menu.dishes.map(dish => dish.category));
  const uniqueCategories = Array.from(new Set(categories));

  console.log("User Menus: ", userMenus);
  console.log("Unique Categories: ", uniqueCategories);

  let recommendations: SavedMenu[] = [];
  for (const category of uniqueCategories) {
    const menus = await getMenuByCategory(category);
    recommendations = [...recommendations, ...menus];
  }
  console.log("Recommendations: ", recommendations);
  return recommendations;
};

// CREATED MENUS
export const addMenuToCreatedMenus = async (menu: SavedMenu) => {
  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const createdMenusRef = collection(userDocRef, 'createdMenus');
    const newMenuDocRef = doc(createdMenusRef);
    await setDoc(newMenuDocRef, menu);
  }
};

export const addMenuItemToCreatedMenus = async (item: MenuItem, restaurantName: string) => {
  if (!auth.currentUser) {
    throw new Error("No user is currently logged in.");
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const createdMenusRef = collection(userDocRef, 'createdMenus');
  const menuSnapshot = await getDocs(createdMenusRef);
  
  let menuDocRef: any = null;
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

  console.log("In the updateMenuItemInCreated");

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const createdMenusRef = collection(userDocRef, 'createdMenus');
  const q = query(createdMenusRef, where("restaurantName", "==", restaurantName));
  const querySnapshot = await getDocs(q);
  console.log("Query", querySnapshot);

  if (querySnapshot.empty) {
    throw new Error("Menu not found.");
  }

  const menuDocRef = querySnapshot.docs[0].ref;
  const dishDocRef = doc(collection(menuDocRef, 'dishes'), itemId);
  await updateDoc(dishDocRef, { ...item });
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
  console.log(`Updating note for item ${itemId} in restaurant ${restaurantName} with note: ${newNotes}`);
  
  await updateDoc(dishDocRef, { note: newNotes });
};

export const deleteMenuItemFromCreatedMenus = async (itemId: string, restaurantName: string) => {
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

  const dishDocRef = doc(dishesCollectionRef, itemId);
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
        imageUrl: itemData.imageUrl // Include imageUrl
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
export const deleteMenuItemFromSavedMenus = async (itemId: string, restaurantName: string) => {
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

  console.log(`Updating note for item ${itemId} in restaurant ${restaurantName} with note: ${newNotes}`);
  
  try {
    await updateDoc(dishDocRef, { note: newNotes });
    console.log(`Note updated successfully in Firestore for item ${itemId}`);
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
    const itemsCollectionRef = collection(menuDoc.ref, 'dishes'); // Ensure you use the correct collection name
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
        imageUrl: itemData.imageUrl // Include imageUrl
      };
    });

    console.log("Items data: ", menuData);

    categories.push({
      id: menuDoc.id,
      category: menuData.category,
      items,
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
    menuDocRef = querySnapshot.docs[0].ref;
  } else {
    menuDocRef = await addDoc(savedMenusRef, { restaurantName });
  }

  const dishesRef = collection(menuDocRef, 'dishes');
  console.log(item);
  await addDoc(dishesRef, { ...item });
};

export const fetchSavedMenus = async (): Promise<SavedMenu[]> => {
  const savedMenus: SavedMenu[] = [];

  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const savedMenusSnapshot = await getDocs(collection(userDocRef, 'savedMenus'));

    for (const menuDoc of savedMenusSnapshot.docs) {
      const menuData = menuDoc.data();
      const dishes = await fetchMenuItems(menuDoc.ref);
      console.log("Saved menus from the menu service: ", savedMenus);
      savedMenus.push({
        restaurantName: menuData.restaurantName,
        dishes,
      });
    }
  }

  return savedMenus;
};

//NEW RECOMMENDATIONS SERVICE
