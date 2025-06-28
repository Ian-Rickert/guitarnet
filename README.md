# GuitarNet 🎸

A React Native Expo app that connects guitarists based on shared musical interests and skill levels.

## Features

- **Google Authentication**: Sign in with your Google account
- **User Discovery**: Find guitarists by favorite artists and skill level
- **Profile Management**: Create and edit your profile with bio, songs, and favorite artists
- **Meeting Setup**: Connect with other guitarists via Zoom
- **Ultimate Guitar Integration**: Direct links to song tabs
- **Modern UI**: Dark theme with intuitive navigation

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth with Google Sign-in
- **Navigation**: React Navigation
- **UI**: Custom dark theme with modern design

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Firebase project

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore Database
3. Set up Google Sign-in in Authentication
4. Create a Firestore database in test mode
5. Get your Firebase config and update `firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Run the App

```bash
# For web
npm run web

# For iOS
npm run ios

# For Android
npm run android
```

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.js          # Authentication state management
├── navigation/
│   └── AppNavigator.js         # Navigation configuration
├── screens/
│   ├── HomeScreen.js           # Search and discover users
│   ├── LoginScreen.js          # Google sign-in
│   ├── ProfileScreen.js        # User profile management
│   └── MissionScreen.js        # App mission and info
└── services/
    └── userService.js          # Firestore user operations
```

## Database Schema

### Users Collection

```javascript
{
  email: string,
  displayName: string,
  photoURL: string,
  username: string,
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
  favoriteArtists: string[],
  songs: string[],
  bio: string,
  profilePic: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Features in Detail

### Home/Search Screen
- Search users by name
- Filter by favorite artists
- Filter by skill level
- View user cards with basic info

### Profile Screen
- View and edit profile information
- Choose from preset profile pictures
- Add/remove favorite artists
- Manage songs you can play
- Setup Zoom meetings
- Link to Ultimate Guitar tabs

### Mission Page
- Explains the app's purpose
- Details about the development process
- Future roadmap
- Technical information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 