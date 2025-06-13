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
