import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Cache for artists to avoid repeated database calls
let artistsCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get all artists from all chunks
export const getAllArtists = async () => {
  try {
    // Check if we have a valid cache
    if (artistsCache && lastCacheTime && (Date.now() - lastCacheTime) < CACHE_DURATION) {
      return artistsCache;
    }

    console.log('🔄 Fetching artists from Firestore...');
    
    const artistsCollection = collection(db, 'artists');
    const q = query(artistsCollection, orderBy('chunkIndex'));
    const querySnapshot = await getDocs(q);
    
    const allArtists = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.artists && Array.isArray(data.artists)) {
        allArtists.push(...data.artists);
      }
    });
    
    // Sort alphabetically and remove duplicates
    const uniqueArtists = [...new Set(allArtists)].sort();
    
    // Update cache
    artistsCache = uniqueArtists;
    lastCacheTime = Date.now();
    
    console.log(`✅ Loaded ${uniqueArtists.length} artists from ${querySnapshot.size} chunks`);
    
    return uniqueArtists;
  } catch (error) {
    console.error('❌ Error fetching artists:', error);
    return [];
  }
};

// Function to search artists
export const searchArtists = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }
    
    const allArtists = await getAllArtists();
    const term = searchTerm.toLowerCase().trim();
    
    // Filter artists that match the search term
    const matchingArtists = allArtists.filter(artist => 
      artist.toLowerCase().includes(term)
    );
    
    // Return top 20 results for performance
    return matchingArtists.slice(0, 20);
  } catch (error) {
    console.error('❌ Error searching artists:', error);
    return [];
  }
};

// Function to get popular artists (first 20 from the list)
export const getPopularArtists = async () => {
  try {
    const allArtists = await getAllArtists();
    return allArtists.slice(0, 20);
  } catch (error) {
    console.error('❌ Error getting popular artists:', error);
    return [];
  }
}; 