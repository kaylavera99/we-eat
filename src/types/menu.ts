// Interfaces for Menu related objects
export interface MenuItem {
  id?: string;
  name: string;
  description: string;
  allergens: string[];
  note?: string;
  category: string;
  imageUrl?: string;
}

export interface MenuCategory {
    id?:string;
    category: string;
    items: MenuItem[];
    index:number;
}

// Used to add dishes to restaurants for first time
export interface Dish {
  id?: string;
  category: string;
  name: string;
  description: string;
  allergens: string[];
  note: string;
  imageUrl?: string;
}

// Parent class of child CreatedMenu and SavedMenu objects in 
// PersonalizedMenu
export interface BaseMenu {
  restaurantName: string;
  dishes: any[];
  photoUrl?: string;
  thumbnailUrl?: string;
  dishCount?: number;
  isCreated: boolean;
}

export interface Restaurant {
    id: string;
    name: string;
    menu: MenuCategory[];
    thumbnailUrl: string;
}