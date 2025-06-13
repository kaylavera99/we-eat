import { collection, getDocs} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {MenuItem, MenuCategory} from '../types/menu'


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
