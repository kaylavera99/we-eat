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

export const fetchFullMenuFromRestaurants = async (restaurantId: string): Promise<MenuCategory[]> => {
  const categories: MenuCategory[] = [];

  const menuCollectionRef = collection(db, 'restaurants', restaurantId, 'menu');
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
      index: categoryData.index || 0,
      items,
    });
  }

  //  sort categories by index
  categories.sort((a, b) => a.index - b.index);

  return categories;
};
