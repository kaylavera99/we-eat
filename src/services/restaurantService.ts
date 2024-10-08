import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  allergens: string[] | string;
  note?: string;
  category: string;
  imageUrl?: string;
}


export interface MenuCategory {
  id: string;
  category: string;
  items: MenuItem[];
  index: number;
}

export const fetchFullMenuFromRestaurants = async (encodedRestaurantName: string): Promise<MenuCategory[]> => {
  const restaurantName = decodeURIComponent(encodedRestaurantName);
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
          category: categoryData.category,
          imageUrl: itemData.imageUrl
        };
      });

      categories.push({
        id: categoryDoc.id,
        category: categoryData.category,
        index: categoryData.index || 0, // default to 0 if no index is found
        items,
      });
    }

    // sort categories by index
    categories.sort((a, b) => a.index - b.index);

  } else {
    console.log("No menu found for restaurant:", restaurantName);
  }

  return categories;
};
