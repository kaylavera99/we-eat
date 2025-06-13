import { useState, useCallback } from "react";
import { AllergenState } from "../types/user";

export function useAllergens(initial: AllergenState) {
  const [allergens, setAllergens] = useState<AllergenState>(initial);

  const setAllergen = useCallback(
    (key: keyof AllergenState, value: boolean) => {
      setAllergens(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const toggleAllergen = useCallback((key: keyof AllergenState) => {
    setAllergens(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const resetAllergens = useCallback((state: AllergenState) => {
    setAllergens(state);
  }, []);

  return { allergens, setAllergen, toggleAllergen, resetAllergens };
}
