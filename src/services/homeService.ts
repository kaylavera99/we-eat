import {collection, doc, getDocs} from "firebase/firestore";
import {db} from "../firebaseConfig";
import { Restaurant } from "../types/menu";

export type HomeMenuCard = {
    key: string;
    title: string;
    photoUrl: string;
    dishCount?: number;
    to: string;
    kind: "created" | "saved";
  };

const safeDecode = (v: any): string => {
    try {
      return decodeURIComponent(v ?? "");
    } catch {
      return v ?? "";
    }
  };

const buildThumbMaps = (restaurants: Restaurant[]) => {
    const byId = new Map<string, string>();
    const byName = new Map<string, string>();
    restaurants.forEach((r) => {
      if (r?.id) byId.set(r.id, (r as any).thumbnailUrl || "");
      if ((r as any)?.name) byName.set(safeDecode((r as any).name).trim(), (r as any).thumbnailUrl || "");
    });

    return { byId, byName };
};

export const fetchYourMenusForHome = async (
    userId: string, restaurants: Restaurant[]
    ): Promise<HomeMenuCard[]> => {
        const { byId, byName } = buildThumbMaps(restaurants);
        const userDocRef = doc(db, "users", userId);

        const [savedSnap, createdSnap] = await Promise.all([
        getDocs(collection(userDocRef, "savedMenus")),
        getDocs(collection(userDocRef, "createdMenus")),
        ]); 
        
        const saved: HomeMenuCard[] = savedSnap.docs.map((doc) => {
        const data = doc.data();
        const restaurantName = safeDecode(data.restaurantName).trim();
        const restaurantId = data.restaurantId;

        const photoUrl = byId.get(restaurantId) || byName.get(restaurantName) || data.photoUrl || data.thumbnailUrl || "";
        
        const dishCount = Array.isArray(data.dishes) ? data.dishes.length : data.dishCount || 0;

        return {
            key: `saved-${doc.id}`,
            title: restaurantName,
            photoUrl,
            dishCount,
            to: `/saved-menus/${doc.id}`,
            kind: "saved",
        };
        });
        const created: HomeMenuCard[] = createdSnap.docs.map((doc) => {
        const data = doc.data();
        const restaurantName = safeDecode(data.restaurantName).trim();
        const restaurantId = data.restaurantId;
        const photoUrl = byId.get(restaurantId) || byName.get(restaurantName) || data.photoUrl || data.thumbnailUrl || "";
        const dishCount = Array.isArray(data.dishes) ? data.dishes.length : data.dishCount || 0;
        return {
            key: `created-${doc.id}`,
            title: restaurantName,
            photoUrl,
            dishCount,
            to: `/created-menus/${doc.id}`,
            kind: "created",
        };
        });
        return [...created, ...saved];
    };