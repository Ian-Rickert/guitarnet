import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';

// Search songs in the songs collection
export const searchSongs = async (searchQuery, maxResults = 20) => {
  try {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return [];
    }

    const queryLower = searchQuery.toLowerCase().trim();
    const results = [];
    
    // Get all documents from the songs collection
    const songsCollection = collection(db, 'songs');
    const querySnapshot = await getDocs(songsCollection);
    
    // Search through each chunk document
    for (const docSnapshot of querySnapshot.docs) {
      const chunkData = docSnapshot.data();
      
      if (chunkData.songs && Array.isArray(chunkData.songs)) {
        // Filter songs in this chunk that match the search query
        const matchingSongs = chunkData.songs.filter(song => {
          if (song.name && typeof song.name === 'string') {
            return song.name.toLowerCase().includes(queryLower);
          }
          return false;
        });
        
        // Add matching songs to results
        results.push(...matchingSongs.map(song => ({
          ...song,
          chunkId: docSnapshot.id,
          chunkIndex: chunkData.chunkIndex,
          alphabeticalRange: chunkData.alphabeticalRange
        })));
        
        // Stop if we have enough results
        if (results.length >= maxResults) {
          break;
        }
      }
    }
    
    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match gets highest priority
      if (aName === queryLower) return -1;
      if (bName === queryLower) return 1;
      
      // Starts with query gets second priority
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
      if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
      
      // Otherwise sort alphabetically
      return aName.localeCompare(bName);
    });
    
    // Return limited results
    return results.slice(0, maxResults);
    
  } catch (error) {
    console.error('Error searching songs:', error);
    return [];
  }
};

// Get songs by alphabetical range
export const getSongsByRange = async (startLetter, endLetter, maxResults = 50) => {
  try {
    const results = [];
    
    // Get all documents from the songs collection
    const songsCollection = collection(db, 'songs');
    const querySnapshot = await getDocs(songsCollection);
    
    // Find chunks that contain songs in the specified range
    for (const docSnapshot of querySnapshot.docs) {
      const chunkData = docSnapshot.data();
      
      if (chunkData.alphabeticalRange) {
        const range = chunkData.alphabeticalRange;
        
        // Check if this chunk overlaps with the requested range
        if (range.includes(startLetter) || range.includes(endLetter) || 
            (startLetter <= range.split('-')[0] && endLetter >= range.split('-')[1])) {
          
          if (chunkData.songs && Array.isArray(chunkData.songs)) {
            // Filter songs in this range
            const rangeSongs = chunkData.songs.filter(song => {
              if (song.name && typeof song.name === 'string') {
                const firstLetter = song.name.charAt(0).toUpperCase();
                return firstLetter >= startLetter && firstLetter <= endLetter;
              }
              return false;
            });
            
            results.push(...rangeSongs.map(song => ({
              ...song,
              chunkId: docSnapshot.id,
              chunkIndex: chunkData.chunkIndex,
              alphabeticalRange: chunkData.alphabeticalRange
            })));
          }
        }
      }
    }
    
    // Sort alphabetically
    results.sort((a, b) => a.name.localeCompare(b.name));
    
    return results.slice(0, maxResults);
    
  } catch (error) {
    console.error('Error getting songs by range:', error);
    return [];
  }
};

// Get song statistics
export const getSongStats = async () => {
  try {
    const songsCollection = collection(db, 'songs');
    const querySnapshot = await getDocs(songsCollection);
    
    let totalChunks = 0;
    let totalSongs = 0;
    const ranges = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      totalChunks++;
      if (data.songs && Array.isArray(data.songs)) {
        totalSongs += data.songs.length;
      }
      if (data.alphabeticalRange) {
        ranges.push(data.alphabeticalRange);
      }
    });
    
    return {
      totalChunks,
      totalSongs,
      ranges: ranges.sort()
    };
    
  } catch (error) {
    console.error('Error getting song stats:', error);
    return { totalChunks: 0, totalSongs: 0, ranges: [] };
  }
}; 