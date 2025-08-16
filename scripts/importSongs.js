import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
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

// Function to import songs from CSV
const importSongs = async () => {
  try {
    console.log('🎵 Starting song import from CSV...');
    
    const songs = [];
    let rowCount = 0;
    
    // Read the CSV file
    fs.createReadStream('spotify_millsongdata 2.csv')
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        // Extract song name from song column
        if (row.song && row.song.trim() !== '') {
          songs.push({
            name: row.song.trim(),
            artist: row.artist ? row.artist.trim() : 'Unknown Artist',
            link: row.link ? row.link.trim() : '',
            // Remove text field to reduce document size
            // text: row.text ? row.text.trim() : '',
            originalRow: rowCount
          });
        }
        
        // Log progress every 10000 rows
        if (rowCount % 10000 === 0) {
          console.log(`📊 Processed ${rowCount} rows...`);
        }
      })
      .on('end', async () => {
        console.log(`✅ Finished reading CSV. Found ${songs.length} songs from ${rowCount} rows.`);
        
        // Remove duplicates based on song name and artist
        const uniqueSongs = [];
        const seenSongs = new Set();
        
        songs.forEach(song => {
          const songKey = `${song.name.toLowerCase()}-${song.artist.toLowerCase()}`;
          if (!seenSongs.has(songKey)) {
            seenSongs.add(songKey);
            uniqueSongs.push(song);
          }
        });
        
        console.log(`🎯 After removing duplicates: ${uniqueSongs.length} unique songs.`);
        
        // Sort songs alphabetically by name
        uniqueSongs.sort((a, b) => a.name.localeCompare(b.name));
        console.log('📚 Songs sorted alphabetically.');
        
        // Split songs into chunks of 1000 (to stay well under Firebase limits)
        const songChunks = chunkArray(uniqueSongs, 1000);
        console.log(`📦 Splitting into ${songChunks.length} chunks of 1000 songs each.`);
        
        // Create the songs collection
        const songsCollection = collection(db, 'songs');
        
        // Add each chunk as a separate document
        for (let i = 0; i < songChunks.length; i++) {
          const chunk = songChunks[i];
          const alphabeticalRange = getAlphabeticalRange(chunk, i, songChunks.length);
          
          const chunkDocument = {
            chunkIndex: i + 1,
            totalChunks: songChunks.length,
            alphabeticalRange: alphabeticalRange,
            songs: chunk,
            chunkSize: chunk.length,
            totalSongs: uniqueSongs.length,
            importedAt: new Date(),
            source: 'spotify_millsongdata 2.csv',
            description: `Chunk ${i + 1} of ${songChunks.length} - Songs from ${alphabeticalRange}`
          };
          
          try {
            const docRef = await addDoc(songsCollection, chunkDocument);
            console.log(`✅ Created chunk ${i + 1}/${songChunks.length} with ${chunk.length} songs (Doc ID: ${docRef.id})`);
            console.log(`   📍 Alphabetical range: ${alphabeticalRange}`);
            
            // Show sample songs from this chunk
            const sampleSongs = chunk.slice(0, 3).map(s => s.name);
            console.log(`   🎵 Sample songs: ${sampleSongs.join(', ')}`);
            
          } catch (error) {
            console.error(`❌ Error creating chunk ${i + 1}:`, error);
          }
        }
        
        console.log(`🎉 Successfully imported all ${uniqueSongs.length} songs in ${songChunks.length} chunks!`);
        console.log(`🔗 Collection: songs`);
        
        // Show some sample songs from the first chunk
        console.log('\n🎸 Sample songs from first chunk:');
        songChunks[0].slice(0, 10).forEach((song, index) => {
          console.log(`  ${index + 1}. ${song.name} - ${song.artist}`);
        });
        
        if (songChunks[0].length > 10) {
          console.log(`  ... and ${songChunks[0].length - 10} more songs in this chunk`);
        }
        
        console.log(`\n📊 Total chunks created: ${songChunks.length}`);
        console.log(`📊 Total unique songs: ${uniqueSongs.length}`);
        console.log(`📊 Average songs per chunk: ${Math.round(uniqueSongs.length / songChunks.length)}`);
        
        // Show alphabetical distribution
        console.log('\n🔤 Alphabetical distribution:');
        songChunks.forEach((chunk, index) => {
          const range = getAlphabeticalRange(chunk, index, songChunks.length);
          console.log(`  Chunk ${index + 1}: ${range} (${chunk.length} songs)`);
        });
        
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
      });
      
  } catch (error) {
    console.error('❌ Error importing songs:', error);
  }
};

// Run the import
importSongs(); 