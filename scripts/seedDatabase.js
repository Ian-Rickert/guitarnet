import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

// Fake data arrays
const usernames = [
  'GuitarHero', 'RockStar', 'BluesMaster', 'JazzCat', 'MetalHead',
  'AcousticDreamer', 'ElectricSoul', 'FingerPicker', 'StrumMaster', 'LeadGuitarist',
  'RhythmKing', 'SoloQueen', 'ChordWizard', 'ScaleMaster', 'ToneSeeker',
  'MelodyMaker', 'HarmonyHunter', 'GrooveGuru', 'VibeVoyager', 'SoundExplorer'
];

const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const favoriteArtists = [
  'Jimi Hendrix', 'Eric Clapton', 'Jimmy Page', 'Eddie Van Halen', 'Slash',
  'David Gilmour', 'Stevie Ray Vaughan', 'BB King', 'Carlos Santana', 'Mark Knopfler',
  'John Mayer', 'Tom Morello', 'Kirk Hammett', 'Angus Young', 'Tony Iommi',
  'Ritchie Blackmore', 'Yngwie Malmsteen', 'Steve Vai', 'Joe Satriani', 'John Petrucci'
];

const songs = [
  'Stairway to Heaven', 'Sweet Child O Mine', 'Hotel California', 'Wonderwall', 'Nothing Else Matters',
  'Smoke on the Water', 'Sunshine of Your Love', 'Purple Haze', 'Layla', 'Comfortably Numb',
  'Bohemian Rhapsody', 'Wish You Were Here', 'Black', 'Creep', 'Zombie',
  'Wonderwall', 'Champagne Supernova', 'Don\'t Look Back in Anger', 'Live Forever', 'Supersonic'
];

const bios = [
  'Passionate guitarist who loves blues and rock. Always looking to jam with fellow musicians!',
  'Intermediate player focusing on acoustic fingerpicking. Love folk and country music.',
  'Metal enthusiast who enjoys complex riffs and solos. Looking for bandmates!',
  'Jazz guitarist with 5 years of experience. Love improvisation and complex harmonies.',
  'Beginner guitarist excited to learn and grow. Looking for mentors and practice partners.',
  'Classical guitarist who also enjoys modern rock. Love exploring different genres.',
  'Blues player with a passion for soulful melodies. Always up for a good jam session.',
  'Rock guitarist who loves classic rock and modern alternative. Seeking collaboration opportunities.',
  'Fingerstyle specialist who enjoys acoustic arrangements. Love sharing music with others.',
  'Electric guitarist focused on lead playing and solos. Always practicing and improving.'
];

const profilePics = ['🎸', '🎵', '🎶', '🎼', '🎹', '🥁', '🎤', '🎧'];

// Generate random user data
const generateRandomUser = () => {
  const username = usernames[Math.floor(Math.random() * usernames.length)];
  const skillLevel = skillLevels[Math.floor(Math.random() * skillLevels.length)];
  const profilePic = profilePics[Math.floor(Math.random() * profilePics.length)];
  const bio = bios[Math.floor(Math.random() * bios.length)];
  
  // Generate 2-4 random favorite artists
  const userArtists = [];
  const numArtists = Math.floor(Math.random() * 3) + 2; // 2-4 artists
  const shuffledArtists = [...favoriteArtists].sort(() => 0.5 - Math.random());
  for (let i = 0; i < numArtists; i++) {
    userArtists.push(shuffledArtists[i]);
  }
  
  // Generate 3-6 random songs
  const userSongs = [];
  const numSongs = Math.floor(Math.random() * 4) + 3; // 3-6 songs
  const shuffledSongs = [...songs].sort(() => 0.5 - Math.random());
  for (let i = 0; i < numSongs; i++) {
    userSongs.push(shuffledSongs[i]);
  }
  
  return {
    username,
    skillLevel,
    profilePic,
    bio,
    favoriteArtists: userArtists,
    songs: userSongs,
    email: `${username.toLowerCase()}@example.com`,
    displayName: username,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Seed the database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    const usersCollection = collection(db, 'users');
    const numUsers = 20; // Create 20 fake users
    
    for (let i = 0; i < numUsers; i++) {
      const userData = generateRandomUser();
      await addDoc(usersCollection, userData);
      console.log(`✅ Created user: ${userData.username} (${userData.skillLevel})`);
    }
    
    console.log(`🎉 Successfully created ${numUsers} users in the database!`);
    console.log('You can now test the search and discovery features in your GuitarNet app.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// Run the seeding
seedDatabase(); 