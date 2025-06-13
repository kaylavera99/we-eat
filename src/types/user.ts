
export interface AllergenState {
  eggs: boolean;
  wheat: boolean;
  dairy: boolean;
  soy: boolean;
  tree_nuts: boolean;
  fish: boolean;
  shellfish: boolean;
  peanuts: boolean;
  gluten: boolean;
}

export const DEFAULT_ALLERGENS_STATE: AllergenState = {
  eggs: false,
  wheat: false,
  dairy: false,
  soy: false,
  tree_nuts: false,
  fish: false,
  shellfish: false,
  peanuts: false,
  gluten: false,
};

export interface PreferredLocation {
  name: string;
  address: string;
  coordinates:
    | { latitude: number; longitude: number }
    | Record<string, any>;
  photoUrl?: string;
}


export interface UserData {
  // basic profile
  name?: string;
  lastName?: string;
  email?: string;

  // EditProfile toggle buttons
  allergens: { [key: string]: boolean };

  // UserProfile page, and all preferred locations
  preferredLocations?: { [key: string]: PreferredLocation };
  createdMenus: { [key: string]: any };

  // optional profile pic + address
  profileImageUrl?: string;
  address?: string;
}