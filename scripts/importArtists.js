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

// Function to import artists from CSV
const importArtists = async () => {
  try {
    console.log('🎵 Starting artist import from CSV...');
    
    const artists = [];
    let rowCount = 0;
    
    // Read the CSV file
    fs.createReadStream('artists.csv')
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        // Extract artist name from artist_mb column
        if (row.artist_mb && row.artist_mb.trim() !== '') {
          artists.push(row.artist_mb.trim());
        }
        
        // Log progress every 10000 rows
        if (rowCount % 10000 === 0) {
          console.log(`📊 Processed ${rowCount} rows...`);
        }
      })
      .on('end', async () => {
        console.log(`✅ Finished reading CSV. Found ${artists.length} artists from ${rowCount} rows.`);
        
        // Remove duplicates
        const uniqueArtists = [...new Set(artists)];
        console.log(`🎯 After removing duplicates: ${uniqueArtists.length} unique artists.`);
        
        // Split artists into chunks of 5000 (to stay well under Firebase limits)
        const artistChunks = chunkArray(uniqueArtists, 5000);
        console.log(`📦 Splitting into ${artistChunks.length} chunks of 5000 artists each.`);
        
        // Create the artists collection
        const artistsCollection = collection(db, 'artists');
        
        // Add each chunk as a separate document
        for (let i = 0; i < artistChunks.length; i++) {
          const chunk = artistChunks[i];
          const chunkDocument = {
            chunkIndex: i + 1,
            totalChunks: artistChunks.length,
            artists: chunk,
            chunkSize: chunk.length,
            totalArtists: uniqueArtists.length,
            importedAt: new Date(),
            source: 'artists.csv',
            description: `Chunk ${i + 1} of ${artistChunks.length} - Artists from the artist_mb column`
          };
          
          try {
            const docRef = await addDoc(artistsCollection, chunkDocument);
            console.log(`✅ Created chunk ${i + 1}/${artistChunks.length} with ${chunk.length} artists (Doc ID: ${docRef.id})`);
          } catch (error) {
            console.error(`❌ Error creating chunk ${i + 1}:`, error);
          }
        }
        
        console.log(`🎉 Successfully imported all ${uniqueArtists.length} artists in ${artistChunks.length} chunks!`);
        console.log(`🔗 Collection: artists`);
        
        // Show some sample artists from the first chunk
        console.log('\n🎸 Sample artists from first chunk:');
        artistChunks[0].slice(0, 10).forEach((artist, index) => {
          console.log(`  ${index + 1}. ${artist}`);
        });
        
        if (artistChunks[0].length > 10) {
          console.log(`  ... and ${artistChunks[0].length - 10} more artists in this chunk`);
        }
        
        console.log(`\n📊 Total chunks created: ${artistChunks.length}`);
        console.log(`📊 Total unique artists: ${uniqueArtists.length}`);
        
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
      });
      
  } catch (error) {
    console.error('❌ Error importing artists:', error);
  }
};

// Run the import
importArtists(); 