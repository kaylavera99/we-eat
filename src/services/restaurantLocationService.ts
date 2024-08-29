import { collection, doc, writeBatch, GeoPoint, getDocs, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { fetchRestaurantsFromGooglePlaces, getCoordinatesFromAddress } from './googlePlacesService';
import { searchRestaurants } from './searchService';

export const addRestaurantsToFirestore = async (lat: number, lng: number, radius: number, keywords: string[]) => {
  try {
    for (const keyword of keywords) {
      const restaurants = await fetchRestaurantsFromGooglePlaces(lat, lng, radius, keyword);

      const batch = writeBatch(db);

      restaurants.forEach((restaurant: any) => {
        const restaurantRef = doc(collection(db, 'restaurants'));
        const locationRef = doc(collection(restaurantRef, 'locations'));

        const geoPoint = new GeoPoint(restaurant.geometry.location.lat, restaurant.geometry.location.lng);

        batch.set(restaurantRef, {
          name: restaurant.name,
        });

        batch.set(locationRef, {
          address: restaurant.vicinity,
          coordinates: geoPoint,
        });
      });

      await batch.commit();
    }

    console.log('Added restaurants to Firestore successfully.');
  } catch (error: unknown) {
    console.error('Error adding restaurants to Firestore:', (error as Error).message);
  }
};
export const addPreferredLocation = async (restaurantName: string, address: string) => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const coordinates = await getCoordinatesFromAddress(address);

  if (!coordinates) {
    throw new Error('Failed to fetch coordinates from the address');
  }

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const preferredLocationsRef = collection(userDocRef, 'preferredLocations');

  const results = await searchRestaurants(`${coordinates.lat},${coordinates.lng}`, 1, restaurantName, coordinates);
  const photoUrl = results.length > 0 ? results[0].photoUrl : '';

  const geoPoint = new GeoPoint(coordinates.lat, coordinates.lng);

  const restaurantQuery = query(collection(db, 'restaurants'), where('name', '==', restaurantName));
  const restaurantDocs = await getDocs(restaurantQuery);

  if (!restaurantDocs.empty) {
    const restaurantDoc = restaurantDocs.docs[0];
    const restaurantData = restaurantDoc.data();

    if (!restaurantData.photoUrl) {
      await updateDoc(restaurantDoc.ref, {
        photoUrl
      });
    }

    const preferredLocationQuery = query(preferredLocationsRef, where('restaurantId', '==', restaurantDoc.id));
    const preferredLocationDocs = await getDocs(preferredLocationQuery);

    if (!preferredLocationDocs.empty) {
      const docRef = preferredLocationDocs.docs[0].ref;
      await updateDoc(docRef, {
        address,
        coordinates: geoPoint,
        photoUrl: restaurantData.photoUrl || photoUrl,
      });
    } else {
      const newLocationDocRef = doc(preferredLocationsRef);
      await setDoc(newLocationDocRef, {
        name: restaurantName,
        restaurantId: restaurantDoc.id,
        address,
        coordinates: geoPoint,
        photoUrl: restaurantData.photoUrl || photoUrl
      });
    }
  } else {
    console.error(`No data found for restaurant: ${restaurantName}`);
    return;
  }
};

export const addPreferredLocationForCreatedMenu = async (
  restaurantName: string,
  fullAddress: string,
  thumbnailUrl?: string
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const coordinates = await getCoordinatesFromAddress(fullAddress);

  if (!coordinates) {
    throw new Error('Failed to fetch coordinates from the address');
  }

  const geoPoint = new GeoPoint(coordinates.lat, coordinates.lng);

  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const preferredLocationsRef = collection(userDocRef, 'preferredLocations');

  const q = query(preferredLocationsRef, where("name", "==", restaurantName));
  const querySnapshot = await getDocs(q);

  let preferredLocationDocRef;

  if (!querySnapshot.empty) {
    preferredLocationDocRef = querySnapshot.docs[0].ref;
  } else {
    preferredLocationDocRef = doc(preferredLocationsRef);
  }

  await setDoc(preferredLocationDocRef, {
    name: restaurantName,
    address: fullAddress,
    coordinates: geoPoint,
    photoUrl: thumbnailUrl || ''
  });
};

export const fetchZipCode = async (street: string, city: string, state: string): Promise<string | null> => {
  const states = [
    { name: 'Alabama', code: 'AL' },
    { name: 'Alaska', code: 'AK' },
    { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' },
    { name: 'California', code: 'CA' },
    { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' },
    { name: 'Delaware', code: 'DE' },
    { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' },
    { name: 'Hawaii', code: 'HI' },
    { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' },
    { name: 'Indiana', code: 'IN' },
    { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' },
    { name: 'Kentucky', code: 'KY' },
    { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' },
    { name: 'Maryland', code: 'MD' },
    { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' },
    { name: 'Minnesota', code: 'MN' },
    { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' },
    { name: 'Montana', code: 'MT' },
    { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' },
    { name: 'New Hampshire', code: 'NH' },
    { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' },
    { name: 'New York', code: 'NY' },
    { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' },
    { name: 'Ohio', code: 'OH' },
    { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' },
    { name: 'Pennsylvania', code: 'PA' },
    { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' },
    { name: 'South Dakota', code: 'SD' },
    { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' },
    { name: 'Utah', code: 'UT' },
    { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' },
    { name: 'Washington', code: 'WA' },
    { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' },
    { name: 'Wyoming', code: 'WY' }
  ];


  try {
    const address = `${street}, ${city}, ${state}`;
    const coordinates = await getCoordinatesFromAddress(address);

    if (!coordinates) {
      console.error('Failed to get coordinates from address');
      return null;
    }

    const restaurants = await fetchRestaurantsFromGooglePlaces(coordinates.lat, coordinates.lng, 1000, 'restaurant');

    if (restaurants.length > 0) {
      const restaurant = restaurants[0];
      const addressComponents = restaurant.address_components;

      const postalCodeComponent = addressComponents.find((component: any) =>
        component.types.includes('postal_code')
      );

      return postalCodeComponent ? postalCodeComponent.long_name : null;
    } else {
      console.error('No restaurants found nearby to determine ZIP code');
      return null;
    }
  } catch (error) {
    console.error('Error fetching ZIP code using Google Places:', error);
    return null;
  }
};