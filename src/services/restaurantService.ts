import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  allergens: string[];
  note?: string;
  category: string;
  imageUrl?: string;  // Add the imageUrl field
}


export interface MenuCategory {
  id: string;
  category: string;
  items: MenuItem[];
}

export const fetchFullMenuFromRestaurants = async (encodedRestaurantName: string): Promise<MenuCategory[]> => {
  const restaurantName = decodeURIComponent(encodedRestaurantName);
  const categories: MenuCategory[] = [];
  console.log("Fetching full menu for restaurant:", restaurantName);
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
          category: categoryData.category,
          imageUrl: itemData.imageUrl  // Include imageUrl
        };
      });

      categories.push({
        id: categoryDoc.id,
        category: categoryData.category,
        items,
      });
    }
    console.log("Fetched categories:", categories);
  } else {
    console.log("No menu found for restaurant:", restaurantName);
  }

  return categories;
};