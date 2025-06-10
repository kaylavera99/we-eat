import { useState } from "react";

export type AllergenState = Record<string, boolean>;

// checkbox list (CreateAccount)
export function useAllergensCheckbox(initial: AllergenState) {
  const [allergens, setAllergens] = useState<AllergenState>(initial);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAllergens(prev => ({ ...prev, [name]: checked }));
  };

  return { allergens, handleChange, setAllergens };
}

// toggle list (EditProfile)
export function useAllergensToggle(initial: AllergenState) {
  const [allergens, setAllergens] = useState<AllergenState>(initial);

  const handleToggle = (key: string) => {
    setAllergens(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return { allergens, handleToggle, setAllergens };
}
