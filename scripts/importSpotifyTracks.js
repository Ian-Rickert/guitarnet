import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';
import csv from 'csv-parser';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAV6O60ckyH85RPdidw96HxnDZQGb-4ei0",
  authDomain: "guitarnet-6a13f.firebaseapp.com",
  projectId: "guitarnet-6a13f",
  storageBucket: "guitarnet-6a13f.firebasestorage.app",
  messagingSenderId: "220242683677",
  appId: "1:220242683677:web:c16b3ed9f99a7fc038e3f4",
  measurementId: "G-2ZCG6JV3LL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to split array into chunks
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Function to get alphabetical range for chunk
const getAlphabeticalRange = (songs, chunkIndex, totalChunks) => {
  if (songs.length === 0) return 'A-Z';
  
  const firstSong = songs[0];
  const lastSong = songs[songs.length - 1];
  
  // Get first letter of first and last song name
  const firstLetter = firstSong.name.charAt(0).toUpperCase();
  const lastLetter = lastSong.name.charAt(0).toUpperCase();
  
  return `${firstLetter}-${lastLetter}`;
};

// Function to get existing songs from Firebase to avoid duplicates
const getExistingSongs = async () => {
  try {
    console.log('🔍 Fetching existing songs from Firebase to check for duplicates...');
    
    const songsCollection = collection(db, 'songs');
    const querySnapshot = await getDocs(songsCollection);
    
    const existingSongs = new Set();
    let totalExistingSongs = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.songs && Array.isArray(data.songs)) {
        data.songs.forEach(song => {
          // Create a unique key for each song (name + artist)
          const songKey = `${song.name.toLowerCase()}-${song.artist.toLowerCase()}`;
          existingSongs.add(songKey);
          totalExistingSongs++;
        });
      }
    });
    
    console.log(`✅ Found ${totalExistingSongs} existing songs in ${querySnapshot.size} documents`);
    console.log(`🎯 Unique song keys: ${existingSongs.size}`);
    
    return existingSongs;
    
  } catch (error) {
    console.error('❌ Error fetching existing songs:', error);
    return new Set();
  }
};

// Function to import new songs from CSV
const importNewSongs = async () => {
  try {
    console.log('🎵 Starting import of new songs from spotify_tracks.csv...');
    
    // Get existing songs to avoid duplicates
    const existingSongs = await getExistingSongs();
    
    const newSongs = [];
    let rowCount = 0;
    let duplicateCount = 0;
    
    // Read the CSV file
    fs.createReadStream('spotify_tracks.csv')
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        // Extract song name and artist from the new CSV structure
        if (row.track_name && row.track_name.trim() !== '') {
          const songName = row.track_name.trim();
          const artistName = row.artist_name ? row.artist_name.trim() : 'Unknown Artist';
          
          // Create unique key for this song
          const songKey = `${songName.toLowerCase()}-${artistName.toLowerCase()}`;
          
          // Check if this song already exists
          if (!existingSongs.has(songKey)) {
            newSongs.push({
              name: songName,
              artist: artistName,
              trackId: row.track_id ? row.track_id.trim() : '',
              albumName: row.album_name ? row.album_name.trim() : '',
              year: row.year ? parseInt(row.year) : null,
              popularity: row.popularity ? parseInt(row.popularity) : null,
              trackUrl: row.track_url ? row.track_url.trim() : '',
              language: row.language ? row.language.trim() : '',
              originalRow: rowCount
            });
          } else {
            duplicateCount++;
          }
        }
        
        // Log progress every 10000 rows
        if (rowCount % 10000 === 0) {
          console.log(`📊 Processed ${rowCount} rows... (${newSongs.length} new songs, ${duplicateCount} duplicates)`);
        }
      })
      .on('end', async () => {
        console.log(`✅ Finished reading CSV. Processed ${rowCount} rows.`);
        console.log(`🎯 Found ${newSongs.length} new unique songs`);
        console.log(`🔄 Skipped ${duplicateCount} duplicate songs`);
        
        if (newSongs.length === 0) {
          console.log('🎉 No new songs to import! All songs already exist in the database.');
          return;
        }
        
        // Sort new songs alphabetically by name
        newSongs.sort((a, b) => a.name.localeCompare(b.name));
        console.log('📚 New songs sorted alphabetically.');
        
        // Split songs into chunks of 1000 (to stay well under Firebase limits)
        const songChunks = chunkArray(newSongs, 1000);
        console.log(`📦 Splitting into ${songChunks.length} chunks of 1000 songs each.`);
        
        // Create the songs collection
        const songsCollection = collection(db, 'songs');
        
        // Get the current highest chunk index to continue numbering
        const existingChunksQuery = query(collection(db, 'songs'), orderBy('chunkIndex', 'desc'), limit(1));
        const existingChunksSnapshot = await getDocs(existingChunksQuery);
        let nextChunkIndex = 1;
        
        if (!existingChunksSnapshot.empty) {
          const lastChunk = existingChunksSnapshot.docs[0].data();
          nextChunkIndex = lastChunk.chunkIndex + 1;
        }
        
        console.log(`📊 Starting new chunks from index ${nextChunkIndex}`);
        
        // Add each chunk as a separate document
        for (let i = 0; i < songChunks.length; i++) {
          const chunk = songChunks[i];
          const alphabeticalRange = getAlphabeticalRange(chunk, i, songChunks.length);
          const currentChunkIndex = nextChunkIndex + i;
          
          const chunkDocument = {
            chunkIndex: currentChunkIndex,
            totalChunks: songChunks.length,
            alphabeticalRange: alphabeticalRange,
            songs: chunk,
            chunkSize: chunk.length,
            totalSongs: newSongs.length,
            importedAt: new Date(),
            source: 'spotify_tracks.csv',
            description: `Chunk ${currentChunkIndex} - New songs from ${alphabeticalRange} (spotify_tracks.csv)`
          };
          
          try {
            const docRef = await addDoc(songsCollection, chunkDocument);
            console.log(`✅ Created chunk ${currentChunkIndex} with ${chunk.length} songs (Doc ID: ${docRef.id})`);
            console.log(`   📍 Alphabetical range: ${alphabeticalRange}`);
            
            // Show sample songs from this chunk
            const sampleSongs = chunk.slice(0, 3).map(s => s.name);
            console.log(`   🎵 Sample songs: ${sampleSongs.join(', ')}`);
            
          } catch (error) {
            console.error(`❌ Error creating chunk ${currentChunkIndex}:`, error);
          }
        }
        
        console.log(`🎉 Successfully imported all ${newSongs.length} new songs in ${songChunks.length} chunks!`);
        console.log(`🔗 Collection: songs`);
        console.log(`📊 New chunks created: ${songChunks.length}`);
        console.log(`📊 Total new unique songs: ${newSongs.length}`);
        console.log(`📊 Duplicates skipped: ${duplicateCount}`);
        
        // Show some sample songs from the first new chunk
        if (songChunks.length > 0) {
          console.log('\n🎸 Sample new songs from first chunk:');
          songChunks[0].slice(0, 10).forEach((song, index) => {
            console.log(`  ${index + 1}. ${song.name} - ${song.artist}`);
          });
          
          if (songChunks[0].length > 10) {
            console.log(`  ... and ${songChunks[0].length - 10} more songs in this chunk`);
          }
        }
        
        // Show alphabetical distribution
        console.log('\n🔤 Alphabetical distribution of new songs:');
        songChunks.forEach((chunk, index) => {
          const range = getAlphabeticalRange(chunk, index, songChunks.length);
          console.log(`  Chunk ${nextChunkIndex + index}: ${range} (${chunk.length} songs)`);
        });
        
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
      });
      
  } catch (error) {
    console.error('❌ Error importing new songs:', error);
  }
};

// Run the import
importNewSongs(); 