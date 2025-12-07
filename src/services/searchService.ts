
import axios from 'axios';
import {apiUrl, API_BASE} from './api';



const cache: Record<string, any[]> = {};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const searchRestaurants = async (
  location: string,
  radius: number,
  keyword: string,
  userLocation: { lat: number; lng: number; }
) => {
  const key = `${location}|${radius}|${keyword}`;

  if (cache[key]) {
    console.log(`[CACHE HIT] ${keyword} @ ${location} within ${radius}mi`);
    return cache[key];
  }

  console.log(`[CACHE MISS] fetching ${keyword} @ ${location} within ${radius}mi`);
  let allResults: any[] = [];

  try {
    const params = {
      location,
      radius: radius * 1609.34,
      keyword,
      type: 'restaurant',
      fields: 'name,geometry,icon,photos,vicinity',
    };
    console.log("API_BASE", API_BASE);
    console.log("proxyUrl", apiUrl('/proxy'));
    const { data } = await axios.get(apiUrl('/proxy'), { params });
    allResults = data.results || [];
    console.log(`[PROXY] returned ${allResults.length} results for "${keyword}"`);
  } catch (err) {
    console.error(`[PROXY ERROR] "${keyword}"`, err);
  }

  const formatted = allResults
    .map(r => {

      const dist = r.geometry?.location
        ? haversineDistance(
            userLocation.lat,
            userLocation.lng,
            r.geometry.location.lat,
            r.geometry.location.lng
          )
        : NaN;
      const ref = r.photos?.[0]?.photo_reference;
      return {
        name: r.name,
        vicinity: r.vicinity || r.formatted_address || '',
        geometry: r.geometry,
        placeId: r.place_id,
        distance: dist,
        icon: r.icon,
        photoReference: ref,
        photoUrl: ref ? apiUrl(`/photo?photoreference=${ref}&maxwidth=400`) : ""
      };
    })
    .filter(item => !isNaN(item.distance) && item.distance <= radius + 1)
    .sort((a, b) => a.distance - b.distance);

  console.log(`[FORMAT] ${formatted.length} items after filtering/sorting for "${keyword}"`);

  cache[key] = formatted;
  return formatted;
};
