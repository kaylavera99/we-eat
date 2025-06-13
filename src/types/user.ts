
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
