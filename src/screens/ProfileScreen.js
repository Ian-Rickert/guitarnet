import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { searchArtists } from '../services/artistService';
import { searchSongs } from '../services/songService';

const ProfileScreen = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [newSongInput, setNewSongInput] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadData, setAudioUploadData] = useState({
    songName: '',
    description: ''
  });
  const [isAddingArtist, setIsAddingArtist] = useState(false);
  const [artistSearchQuery, setArtistSearchQuery] = useState('');
  const [artistSearchResults, setArtistSearchResults] = useState([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioStatus, setAudioStatus] = useState({});
  const [audioProgress, setAudioProgress] = useState({});
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [songSearchResults, setSongSearchResults] = useState([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);
  const [showNoResultsMessage, setShowNoResultsMessage] = useState(false);
  const [customSongInput, setCustomSongInput] = useState('');
  const [isAddingCustomSong, setIsAddingCustomSong] = useState(false);

  const presetPics = [
    '🎸', '🎵', '🎶', '🎼', '🎹', '🥁', '🎤', '🎧'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    loadProfile();
  }, []);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.unloadAsync();
      }
    };
  }, []);

  // Update progress for currently playing audio
  useEffect(() => {
    let progressInterval;
    
    if (currentAudio) {
      progressInterval = setInterval(async () => {
        try {
          const status = await currentAudio.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            const audioId = currentAudio._id;
            setAudioProgress(prev => ({
              ...prev,
              [audioId]: {
                position: status.positionMillis,
                duration: status.durationMillis,
                progress: status.positionMillis / status.durationMillis
              }
            }));
          }
        } catch (error) {
          console.error('Error getting audio status:', error);
        }
      }, 100);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [currentAudio]);

  // Debounced search for artists
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (artistSearchQuery.trim().length >= 2) {
        setIsSearchingArtists(true);
        const results = await searchArtists(artistSearchQuery);
        setArtistSearchResults(results);
        setIsSearchingArtists(false);
      } else {
        setArtistSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [artistSearchQuery]);

  // Debounced search for songs
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (songSearchQuery.trim().length >= 2) {
        setIsSearchingSongs(true);
        const results = await searchSongs(songSearchQuery, 15);
        setSongSearchResults(results);
        setIsSearchingSongs(false);
        
        // Show no results message if search returned empty and query is still valid
        if (results.length === 0 && songSearchQuery.trim().length >= 2) {
          setShowNoResultsMessage(true);
        } else {
          setShowNoResultsMessage(false);
        }
      } else {
        setSongSearchResults([]);
        setShowNoResultsMessage(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [songSearchQuery]);

  const loadProfile = async () => {
    try {
      // Always load the current user's profile, ignore route params
      const userId = user?.uid;
      if (!userId) {
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data());
        setEditData(docSnap.data());
        setEmailInput(docSnap.data().email || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, editData);
      setProfile(editData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const saveEmail = async () => {
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { email: emailInput });
      setProfile({ ...profile, email: emailInput });
      setEditData({ ...editData, email: emailInput });
      setIsEditingEmail(false);
      Alert.alert('Success', 'Email updated successfully!');
    } catch (error) {
      console.error('Error updating email:', error);
      Alert.alert('Error', 'Failed to update email');
    }
  };

  const addSong = async () => {
    try {
      if (!newSongInput.trim()) {
        Alert.alert('Error', 'Please enter a song name');
        return;
      }

      const currentSongs = profile.songs || [];
      
      if (currentSongs.length >= 15) {
        Alert.alert('Error', 'Maximum 15 songs allowed');
        return;
      }

      if (currentSongs.includes(newSongInput.trim())) {
        Alert.alert('Error', 'This song is already in your list');
        return;
      }

      const updatedSongs = [...currentSongs, newSongInput.trim()];
      
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { songs: updatedSongs });
      
      setProfile({ ...profile, songs: updatedSongs });
      setEditData({ ...editData, songs: updatedSongs });
      setNewSongInput('');
      setIsAddingSong(false);
      
      // Set the search query to the newly added song so it appears in results
      setSongSearchQuery(newSongInput.trim());
      // The search effect will automatically run and show the results
      
      Alert.alert('Success', 'Song added successfully!');
    } catch (error) {
      console.error('Error adding song:', error);
      Alert.alert('Error', 'Failed to add song');
    }
  };

  const selectSongFromSearch = async (selectedSong) => {
    try {
      const songName = selectedSong.name;
      const currentSongs = profile.songs || [];
      
      if (currentSongs.length >= 15) {
        Alert.alert('Error', 'Maximum 15 songs allowed');
        return;
      }

      if (currentSongs.includes(songName)) {
        Alert.alert('Error', 'This song is already in your list');
        return;
      }

      const updatedSongs = [...currentSongs, songName];
      
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { songs: updatedSongs });
      
      setProfile({ ...profile, songs: updatedSongs });
      setEditData({ ...editData, songs: updatedSongs });
      
      // Set the search query to the newly added song so it appears in results
      setSongSearchQuery(songName);
      // The search effect will automatically run and show the results
      setIsAddingSong(false);
      
      Alert.alert('Success', `"${songName}" added successfully!`);
    } catch (error) {
      console.error('Error adding song:', error);
      Alert.alert('Error', 'Failed to add song');
    }
  };

  const removeSong = async (songToRemove) => {
    try {
      const currentSongs = profile.songs || [];
      const updatedSongs = currentSongs.filter(song => song !== songToRemove);
      
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { songs: updatedSongs });
      
      setProfile({ ...profile, songs: updatedSongs });
      setEditData({ ...editData, songs: updatedSongs });
      
      Alert.alert('Success', 'Song removed successfully!');
    } catch (error) {
      console.error('Error removing song:', error);
      Alert.alert('Error', 'Failed to remove song');
    }
  };

  const addArtist = async (artistName) => {
    try {
      const currentArtists = profile.favoriteArtists || [];
      
      if (currentArtists.includes(artistName)) {
        Alert.alert('Error', 'This artist is already in your list');
        return;
      }

      const updatedArtists = [...currentArtists, artistName];
      
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { favoriteArtists: updatedArtists });
      
      setProfile({ ...profile, favoriteArtists: updatedArtists });
      setEditData({ ...editData, favoriteArtists: updatedArtists });
      
      // Reset search
      setArtistSearchQuery('');
      setArtistSearchResults([]);
      setIsAddingArtist(false);
      
      Alert.alert('Success', 'Artist added successfully!');
    } catch (error) {
      console.error('Error adding artist:', error);
      Alert.alert('Error', 'Failed to add artist');
    }
  };

  const removeArtist = async (artistToRemove) => {
    try {
      const currentArtists = profile.favoriteArtists || [];
      const updatedArtists = currentArtists.filter(artist => artist !== artistToRemove);
      
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { favoriteArtists: updatedArtists });
      
      setProfile({ ...profile, favoriteArtists: updatedArtists });
      setEditData({ ...editData, favoriteArtists: updatedArtists });
      
      Alert.alert('Success', 'Artist removed successfully!');
    } catch (error) {
      console.error('Error removing artist:', error);
      Alert.alert('Error', 'Failed to remove artist');
    }
  };

  const openUltimateGuitar = (song) => {
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(song)}`;
    Linking.openURL(searchUrl);
  };

  const setupMeeting = () => {
    const zoomUrl = 'https://zoom.us/join';
    Linking.openURL(zoomUrl);
  };

  const selectSkillLevel = (skill) => {
    setEditData({...editData, skillLevel: skill});
    setShowSkillPicker(false);
  };

  const startEmailEdit = () => {
    setEmailInput(profile.email || '');
    setIsEditingEmail(true);
  };

  const cancelEmailEdit = () => {
    setIsEditingEmail(false);
    setEmailInput(profile.email || '');
  };

  const startAddingSong = () => {
    setIsAddingSong(true);
    setNewSongInput('');
    setSongSearchQuery('');
    setSongSearchResults([]);
    setShowNoResultsMessage(false);
    setCustomSongInput('');
  };

  const cancelAddingSong = () => {
    setIsAddingSong(false);
    setNewSongInput('');
    setSongSearchQuery('');
    setSongSearchResults([]);
    setShowNoResultsMessage(false);
    setCustomSongInput('');
  };

  const startAddingArtist = () => {
    setIsAddingArtist(true);
    setArtistSearchQuery('');
    setArtistSearchResults([]);
  };

  const cancelAddingArtist = () => {
    setIsAddingArtist(false);
    setArtistSearchQuery('');
    setArtistSearchResults([]);
  };

  const selectArtistFromSearch = (artist) => {
    addArtist(artist);
  };

  const addCustomSongToDatabase = async (songName, artistName = 'Unknown Artist') => {
    try {
      // Find the appropriate chunk to add this song to
      const songsCollection = collection(db, 'songs');
      
      // Create a new song object with user-added marker
      const newSong = {
        name: songName.trim(),
        artist: artistName.trim(),
        userAdded: true,
        addedBy: user.uid,
        addedAt: new Date(),
        source: 'user_custom'
      };

      // Get all chunks and find the best place to insert this song
      const querySnapshot = await getDocs(songsCollection);
      let targetChunk = null;
      let targetChunkIndex = -1;
      let bestChunk = null;
      let bestChunkIndex = -1;

      // First, try to find a chunk that already contains songs in the same alphabetical range
      const songFirstLetter = songName.trim().charAt(0).toUpperCase();
      
      for (const docSnapshot of querySnapshot.docs) {
        const chunkData = docSnapshot.data();
        if (chunkData.songs && Array.isArray(chunkData.songs) && chunkData.songs.length > 0) {
          // Check if this chunk has songs in the same alphabetical range
          const firstSongLetter = chunkData.songs[0].name.charAt(0).toUpperCase();
          const lastSongLetter = chunkData.songs[chunkData.songs.length - 1].name.charAt(0).toUpperCase();
          
          // If the song fits in this chunk's alphabetical range and there's space
          if (songFirstLetter >= firstSongLetter && songFirstLetter <= lastSongLetter && chunkData.songs.length < 1000) {
            targetChunk = docSnapshot;
            targetChunkIndex = chunkData.chunkIndex;
            break;
          }
          
          // Keep track of the first chunk with space as fallback
          if (chunkData.songs.length < 1000 && !bestChunk) {
            bestChunk = docSnapshot;
            bestChunkIndex = chunkData.chunkIndex;
          }
        }
      }

      // If we found a chunk in the right alphabetical range, use it
      if (targetChunk) {
        // Insert the song in the correct alphabetical position
        const existingSongs = [...targetChunk.data().songs];
        existingSongs.push(newSong);
        existingSongs.sort((a, b) => a.name.localeCompare(b.name));
        
        await updateDoc(targetChunk.ref, { songs: existingSongs });
        console.log(`Added custom song to existing chunk ${targetChunkIndex} in alphabetical order`);
      } else if (bestChunk) {
        // Use the fallback chunk with space
        const existingSongs = [...bestChunk.data().songs];
        existingSongs.push(newSong);
        existingSongs.sort((a, b) => a.name.localeCompare(b.name));
        
        await updateDoc(bestChunk.ref, { songs: existingSongs });
        console.log(`Added custom song to fallback chunk ${bestChunkIndex}`);
      } else {
        // Create new chunk if all existing chunks are full
        const newChunk = {
          chunkIndex: querySnapshot.size + 1,
          totalChunks: querySnapshot.size + 1,
          alphabeticalRange: `${songFirstLetter}-${songFirstLetter}`,
          songs: [newSong],
          chunkSize: 1,
          totalSongs: 1,
          importedAt: new Date(),
          source: 'user_custom',
          description: `Custom song "${songName}" added by user`
        };
        
        await addDoc(songsCollection, newChunk);
        console.log('Created new chunk for custom song');
      }

      return true;
    } catch (error) {
      console.error('Error adding custom song to database:', error);
      return false;
    }
  };

  const addCustomSong = async () => {
    try {
      if (!customSongInput.trim()) {
        Alert.alert('Error', 'Please enter a song name');
        return;
      }

      const currentSongs = profile.songs || [];
      
      if (currentSongs.length >= 15) {
        Alert.alert('Error', 'Maximum 15 songs allowed');
        return;
      }

      if (currentSongs.includes(customSongInput.trim())) {
        Alert.alert('Error', 'This song is already in your list');
        return;
      }

      const songName = customSongInput.trim();
      
      // Try to add to database first
      const dbSuccess = await addCustomSongToDatabase(songName);
      
      // Add to user's profile regardless of database success
      const updatedSongs = [...currentSongs, songName];
      
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { songs: updatedSongs });
      
      setProfile({ ...profile, songs: updatedSongs });
      setEditData({ ...editData, songs: updatedSongs });
      setCustomSongInput('');
      setIsAddingCustomSong(false);
      setShowNoResultsMessage(false);
      
      if (dbSuccess) {
        // Test if the song can be found immediately after adding
        console.log(`Testing search for newly added song: "${songName}"`);
        const testResults = await searchSongs(songName, 5);
        console.log('Search test results:', testResults);
        
        if (testResults.length > 0) {
          const found = testResults.some(song => song.name.toLowerCase() === songName.toLowerCase());
          if (found) {
            console.log('✅ Custom song found in search immediately after adding!');
          } else {
            console.log('❌ Custom song not found in search results');
          }
        } else {
          console.log('❌ No search results found for custom song');
        }
        
        // Set the search query to the newly added song so it appears in results
        setSongSearchQuery(songName);
        // The search effect will automatically run and show the results
        
        Alert.alert('Success', `"${songName}" added to your profile and database!`);
      } else {
        Alert.alert('Success', `"${songName}" added to your profile! (Database update failed)`);
      }
    } catch (error) {
      console.error('Error adding custom song:', error);
      Alert.alert('Error', 'Failed to add custom song');
    }
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Check file size (7MB limit)
        if (file.size > 7 * 1024 * 1024) {
          Alert.alert('Error', 'File size must be 7MB or less');
          return;
        }

        // Check if user has reached the 5 audio limit
        const currentAudios = profile.audioUploads || [];
        if (currentAudios.length >= 5) {
          Alert.alert('Error', 'Maximum 5 audio files allowed per profile');
          return;
        }

        // Load audio to check duration
        const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
        const status = await sound.getStatusAsync();
        await sound.unloadAsync();

        // Check duration (3 minutes = 180 seconds)
        if (status.durationMillis > 180000) {
          Alert.alert('Error', 'Audio must be 3 minutes or less');
          return;
        }

        // Show upload form
        setAudioUploadData({
          songName: '',
          description: '',
          file: file
        });
        setIsUploadingAudio(true);
      }
    } catch (error) {
      console.error('Error picking audio file:', error);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const uploadAudio = async () => {
    try {
      if (!audioUploadData.songName.trim() || !audioUploadData.description.trim()) {
        Alert.alert('Error', 'Please enter both song name and description');
        return;
      }

      const file = audioUploadData.file;
      const fileName = `${user.uid}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `audio_uploads/${fileName}`);

      // Upload file to Firebase Storage
      const response = await fetch(file.uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Create audio object
      const audioData = {
        id: Date.now().toString(),
        fileName: fileName,
        songName: audioUploadData.songName.trim(),
        description: audioUploadData.description.trim(),
        downloadURL: downloadURL,
        uploadDate: new Date().toISOString(),
        fileSize: file.size,
        duration: file.size // We'll store file size as duration for now
      };

      // Add to user's audio uploads
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        audioUploads: arrayUnion(audioData)
      });

      // Update local state
      const updatedAudios = [...(profile.audioUploads || []), audioData];
      setProfile({ ...profile, audioUploads: updatedAudios });
      setEditData({ ...editData, audioUploads: updatedAudios });

      // Reset form
      setAudioUploadData({ songName: '', description: '' });
      setIsUploadingAudio(false);

      Alert.alert('Success', 'Audio uploaded successfully!');
    } catch (error) {
      console.error('Error uploading audio:', error);
      Alert.alert('Error', 'Failed to upload audio');
    }
  };

  const removeAudio = async (audioId) => {
    try {
      const audioToRemove = profile.audioUploads.find(audio => audio.id === audioId);
      if (!audioToRemove) return;

      // Delete from Firebase Storage
      const storageRef = ref(storage, `audio_uploads/${audioToRemove.fileName}`);
      await deleteObject(storageRef);

      // Remove from Firestore
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        audioUploads: arrayRemove(audioToRemove)
      });

      // Update local state
      const updatedAudios = profile.audioUploads.filter(audio => audio.id !== audioId);
      setProfile({ ...profile, audioUploads: updatedAudios });
      setEditData({ ...editData, audioUploads: updatedAudios });

      Alert.alert('Success', 'Audio removed successfully!');
    } catch (error) {
      console.error('Error removing audio:', error);
      Alert.alert('Error', 'Failed to remove audio');
    }
  };

  const playAudio = async (audioURL, audioId) => {
    try {
      // If there's already audio playing, stop it first
      if (currentAudio) {
        await currentAudio.stopAsync();
        await currentAudio.unloadAsync();
      }

      // Create new audio instance
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioURL },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioStatus(prev => ({
              ...prev,
              [audioId]: {
                isPlaying: status.isPlaying,
                isLoaded: status.isLoaded,
                position: status.positionMillis,
                duration: status.durationMillis
              }
            }));
          }
        }
      );

      // Set up audio for seeking
      sound._id = audioId;
      setCurrentAudio(sound);
      
      // Initialize progress
      setAudioProgress(prev => ({
        ...prev,
        [audioId]: {
          position: 0,
          duration: 0,
          progress: 0
        }
      }));

      // Set status
      setAudioStatus(prev => ({
        ...prev,
        [audioId]: {
          isPlaying: true,
          isLoaded: true,
          position: 0,
          duration: 0
        }
      }));

    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const pauseAudio = async (audioId) => {
    try {
      if (currentAudio) {
        await currentAudio.pauseAsync();
        setAudioStatus(prev => ({
          ...prev,
          [audioId]: {
            ...prev[audioId],
            isPlaying: false
          }
        }));
      }
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const resumeAudio = async (audioId) => {
    try {
      if (currentAudio) {
        await currentAudio.playAsync();
        setAudioStatus(prev => ({
          ...prev,
          [audioId]: {
            ...prev[audioId],
            isPlaying: true
          }
        }));
      }
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const seekAudio = async (audioId, seekTo) => {
    try {
      if (currentAudio) {
        const status = await currentAudio.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = seekTo * status.durationMillis;
          await currentAudio.setPositionAsync(newPosition);
          
          setAudioProgress(prev => ({
            ...prev,
            [audioId]: {
              ...prev[audioId],
              position: newPosition,
              progress: seekTo
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.profilePic}>{profile.profilePic || '🎸'}</Text>
          <Text style={styles.username}>{profile.username || 'Guitarist'}</Text>
          <Text style={styles.skillLevel}>{profile.skillLevel || 'Beginner'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout }
              ]
            );
          }}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
        
        {/* Email Section */}
        <View style={styles.emailSection}>
          {isEditingEmail ? (
            <View style={styles.emailEditContainer}>
              <TextInput
                style={styles.emailInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter your email"
                placeholderTextColor="#666666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.emailEditButtons}>
                <TouchableOpacity style={styles.saveEmailButton} onPress={saveEmail}>
                  <Text style={styles.emailButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelEmailButton} onPress={cancelEmailEdit}>
                  <Text style={styles.emailButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emailContainer}>
              {profile.email ? (
                <View style={styles.emailDisplayContainer}>
                  <Text style={styles.emailText}>{profile.email}</Text>
                  <TouchableOpacity style={styles.editEmailButton} onPress={startEmailEdit}>
                    <Text style={styles.editEmailIcon}>✏️</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addEmailButton} onPress={startEmailEdit}>
                  <Text style={styles.addEmailButtonText}>Add Email</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

      {isEditing ? (
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          
          <Text style={styles.label}>Profile Picture:</Text>
          <ScrollView horizontal style={styles.picSelector}>
            {presetPics.map((pic, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.picOption, editData.profilePic === pic && styles.selectedPic]}
                onPress={() => setEditData({...editData, profilePic: pic})}
              >
                <Text style={styles.picText}>{pic}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Username:</Text>
          <TextInput
            style={styles.input}
            value={editData.username || ''}
            onChangeText={(text) => setEditData({...editData, username: text})}
            placeholder="Enter username"
          />

          <Text style={styles.label}>Skill Level:</Text>
          <TouchableOpacity
            style={styles.skillPickerButton}
            onPress={() => setShowSkillPicker(!showSkillPicker)}
          >
            <Text style={styles.skillPickerButtonText}>
              {editData.skillLevel || 'Select Skill Level'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showSkillPicker && (
            <View style={styles.skillPickerDropdown}>
              {skillLevels.map((skill, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.skillOption,
                    editData.skillLevel === skill && styles.selectedSkillOption
                  ]}
                  onPress={() => selectSkillLevel(skill)}
                >
                  <Text style={[
                    styles.skillOptionText,
                    editData.skillLevel === skill && styles.selectedSkillOptionText
                  ]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Bio (max 500 words):</Text>
          <TextInput
            style={styles.textArea}
            value={editData.bio || ''}
            onChangeText={(text) => setEditData({...editData, bio: text})}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{profile.bio || 'No bio yet...'}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Favorite Artists</Text>
              <Text style={styles.artistCount}>
                {profile.favoriteArtists?.length || 0}
              </Text>
            </View>

            {isAddingArtist ? (
              <View style={styles.addArtistContainer}>
                <TextInput
                  style={styles.artistSearchInput}
                  value={artistSearchQuery}
                  onChangeText={setArtistSearchQuery}
                  placeholder="Search for artists..."
                  placeholderTextColor="#666666"
                />
                
                {isSearchingArtists && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Searching artists...</Text>
                  </View>
                )}

                {artistSearchResults.length > 0 && (
                  <View style={styles.artistSearchResults}>
                    <FlatList
                      data={artistSearchResults}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.artistSearchResult}
                          onPress={() => selectArtistFromSearch(item)}
                        >
                          <Text style={styles.artistSearchResultText}>{item}</Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item) => item}
                      nestedScrollEnabled={true}
                      style={styles.artistSearchResultsList}
                    />
                  </View>
                )}

                <View style={styles.artistInputButtons}>
                  <TouchableOpacity style={styles.cancelArtistButton} onPress={cancelAddingArtist}>
                    <Text style={styles.artistButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addArtistPrompt} onPress={startAddingArtist}>
                <Text style={styles.addArtistPromptText}>+ Add Artist</Text>
              </TouchableOpacity>
            )}

            <View style={styles.artistsContainer}>
              {profile.favoriteArtists?.map((artist, index) => (
                <View key={index} style={styles.artistChipContainer}>
                  <Text style={styles.artistChip}>{artist}</Text>
                  <TouchableOpacity 
                    style={styles.removeArtistButton}
                    onPress={() => removeArtist(artist)}
                  >
                    <Text style={styles.removeArtistText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )) || <Text style={styles.noData}>No artists added</Text>}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Songs I Can Play</Text>
              <Text style={styles.songCount}>
                {profile.songs?.length || 0}/15
              </Text>
            </View>
            
            {isAddingSong ? (
              <View style={styles.addSongContainer}>
                <TextInput
                  style={styles.songInput}
                  value={songSearchQuery}
                  onChangeText={setSongSearchQuery}
                  placeholder="Search for songs..."
                  placeholderTextColor="#666666"
                />
                
                {isSearchingSongs && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Searching songs...</Text>
                  </View>
                )}

                {songSearchResults.length > 0 && (
                  <View style={styles.songSearchResultsContainer}>
                    <FlatList
                      data={songSearchResults}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.songSearchResult}
                          onPress={() => selectSongFromSearch(item)}
                        >
                          <Text style={styles.songSearchResultText}>{item.name}</Text>
                          <Text style={styles.songSearchResultArtist}>{item.artist}</Text>
                        </TouchableOpacity>
                      )}
                      keyExtractor={(item, index) => `${item.name}-${item.artist}-${index}`}
                      nestedScrollEnabled={true}
                      style={styles.songSearchResultsList}
                    />
                  </View>
                )}

                {showNoResultsMessage && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No songs found in database</Text>
                    <Text style={styles.noResultsSubtext}>Add this song as a custom entry:</Text>
                    
                    <View style={styles.customSongInputContainer}>
                      <TextInput
                        style={styles.customSongInput}
                        value={customSongInput}
                        onChangeText={setCustomSongInput}
                        placeholder="Enter song name..."
                        placeholderTextColor="#666666"
                      />
                      
                      <TouchableOpacity 
                        style={styles.addCustomSongButton} 
                        onPress={addCustomSong}
                      >
                        <Text style={styles.addCustomSongButtonText}>Add Custom Song</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.songInputButtons}>
                  <TouchableOpacity style={styles.addSongButton} onPress={addSong}>
                    <Text style={styles.songButtonText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelSongButton} onPress={cancelAddingSong}>
                    <Text style={styles.songButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              (profile.songs?.length || 0) < 15 && (
                <TouchableOpacity style={styles.addSongPrompt} onPress={startAddingSong}>
                  <Text style={styles.addSongPromptText}>+ Add Song</Text>
                </TouchableOpacity>
              )
            )}
            
            {profile.songs?.map((song, index) => (
              <View key={index} style={styles.songItemContainer}>
                <TouchableOpacity
                  style={styles.songItem}
                  onPress={() => openUltimateGuitar(song)}
                >
                  <Text style={styles.songText}>{song}</Text>
                  <Text style={styles.linkText}>🔗 Ultimate Guitar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.removeSongButton}
                  onPress={() => removeSong(song)}
                >
                  <Text style={styles.removeSongText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )) || <Text style={styles.noData}>No songs added</Text>}
          </View>

          {/* My Work Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Work</Text>
              <Text style={styles.audioCount}>
                {profile.audioUploads?.length || 0}/5
              </Text>
            </View>

            {isUploadingAudio ? (
              <View style={styles.audioUploadContainer}>
                <Text style={styles.uploadLabel}>Song Name:</Text>
                <TextInput
                  style={styles.audioInput}
                  value={audioUploadData.songName}
                  onChangeText={(text) => setAudioUploadData({...audioUploadData, songName: text})}
                  placeholder="Enter song name..."
                  placeholderTextColor="#666666"
                />
                
                <Text style={styles.uploadLabel}>Description:</Text>
                <TextInput
                  style={styles.audioTextArea}
                  value={audioUploadData.description}
                  onChangeText={(text) => setAudioUploadData({...audioUploadData, description: text})}
                  placeholder="Enter a short description..."
                  placeholderTextColor="#666666"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.audioUploadButtons}>
                  <TouchableOpacity style={styles.uploadAudioButton} onPress={uploadAudio}>
                    <Text style={styles.audioButtonText}>Upload</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelAudioButton} onPress={() => setIsUploadingAudio(false)}>
                    <Text style={styles.audioButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              (profile.audioUploads?.length || 0) < 5 && (
                <TouchableOpacity style={styles.addAudioPrompt} onPress={pickAudioFile}>
                  <Text style={styles.addAudioPromptText}>🎵 Upload Audio (Max 7MB, 3 min)</Text>
                </TouchableOpacity>
              )
            )}

            {profile.audioUploads?.map((audio, index) => {
              const isPlaying = audioStatus[audio.id]?.isPlaying;
              const progress = audioProgress[audio.id] || { position: 0, duration: 0, progress: 0 };
              
              return (
                <View key={index} style={styles.audioItemContainer}>
                  <View style={styles.audioItem}>
                    <View style={styles.audioInfo}>
                      <Text style={styles.audioTitle}>{audio.songName}</Text>
                      <Text style={styles.audioDescription}>{audio.description}</Text>
                      <Text style={styles.audioDate}>
                        {new Date(audio.uploadDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.audioControls}>
                      <TouchableOpacity 
                        style={[styles.playButton, isPlaying && styles.pauseButton]}
                        onPress={() => {
                          if (isPlaying) {
                            pauseAudio(audio.id);
                          } else if (audioStatus[audio.id]?.isLoaded) {
                            resumeAudio(audio.id);
                          } else {
                            playAudio(audio.downloadURL, audio.id);
                          }
                        }}
                      >
                        <Text style={styles.playButtonText}>
                          {isPlaying ? '⏸️' : '▶️'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeAudioButton}
                        onPress={() => removeAudio(audio.id)}
                      >
                        <Text style={styles.removeAudioText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Audio Progress Bar */}
                  {audioStatus[audio.id]?.isLoaded && (
                    <View style={styles.audioProgressContainer}>
                      <View style={styles.timeDisplay}>
                        <Text style={styles.timeText}>
                          {formatTime(progress.position)}
                        </Text>
                        <Text style={styles.timeText}>
                          {formatTime(progress.duration)}
                        </Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <TouchableOpacity
                          style={styles.progressBar}
                          onPress={(event) => {
                            try {
                              // Get the progress bar element dimensions
                              const progressBar = event.target;
                              const rect = progressBar.getBoundingClientRect();
                              const clickX = event.clientX - rect.left;
                              const progressBarWidth = rect.width;
                              
                              // Calculate seek position (0 to 1)
                              const seekPosition = Math.max(0, Math.min(1, clickX / progressBarWidth));
                              
                              // Seek to the calculated position
                              seekAudio(audio.id, seekPosition);
                            } catch (error) {
                              console.error('Error seeking audio:', error);
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${(progress.progress || 0) * 100}%` }
                            ]} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            }) || <Text style={styles.noData}>No audio uploads yet</Text>}
          </View>

          <TouchableOpacity style={styles.meetingButton} onPress={setupMeeting}>
            <Text style={styles.meetingButtonText}>Setup Zoom Meeting</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
  },
  profilePic: {
    fontSize: 80,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  skillLevel: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 15,
  },
  emailContainer: {
    width: '100%',
    alignItems: 'center',
  },
  addEmailButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addEmailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emailDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emailText: {
    color: '#ffffff',
    fontSize: 16,
    marginRight: 10,
  },
  editEmailButton: {
    padding: 5,
  },
  editEmailIcon: {
    fontSize: 16,
  },
  emailEditContainer: {
    width: '100%',
    alignItems: 'center',
  },
  emailInput: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    width: '100%',
    marginBottom: 10,
  },
  emailEditButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  saveEmailButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelEmailButton: {
    backgroundColor: '#666666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  songCount: {
    color: '#cccccc',
    fontSize: 14,
  },
  addSongPrompt: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4285f4',
    borderStyle: 'dashed',
  },
  addSongPromptText: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: '600',
  },
  addSongContainer: {
    marginBottom: 10,
  },
  songInput: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  songInputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addSongButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelSongButton: {
    backgroundColor: '#666666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  songButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  songItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  songItem: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 10,
  },
  songText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  linkText: {
    color: '#4285f4',
    fontSize: 14,
  },
  removeSongButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSongText: {
    fontSize: 16,
  },
  bioText: {
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 24,
  },
  artistsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  artistChip: {
    backgroundColor: '#4285f4',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  noData: {
    color: '#666666',
    fontStyle: 'italic',
  },
  meetingButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  meetingButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editSection: {
    padding: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  picSelector: {
    marginBottom: 15,
  },
  picOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedPic: {
    backgroundColor: '#4285f4',
  },
  picText: {
    fontSize: 24,
  },
  skillPickerButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillPickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  dropdownArrow: {
    color: '#cccccc',
    fontSize: 12,
  },
  skillPickerDropdown: {
    backgroundColor: '#333333',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  skillOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  selectedSkillOption: {
    backgroundColor: '#4285f4',
  },
  skillOptionText: {
    color: '#ffffff',
    fontSize: 16,
  },
  selectedSkillOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  audioCount: {
    color: '#cccccc',
    fontSize: 14,
  },
  audioUploadContainer: {
    marginBottom: 10,
  },
  uploadLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  audioInput: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  audioTextArea: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  audioUploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadAudioButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelAudioButton: {
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  audioButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  addAudioPrompt: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4285f4',
    borderStyle: 'dashed',
  },
  addAudioPromptText: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: '600',
  },
  audioItemContainer: {
    marginBottom: 10,
  },
  audioItem: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
    marginRight: 10,
  },
  audioTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  audioDescription: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 5,
  },
  audioDate: {
    color: '#666666',
    fontSize: 12,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#4285f4',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  pauseButton: {
    backgroundColor: '#ff9500',
  },
  removeAudioButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 8,
  },
  removeAudioText: {
    color: '#ffffff',
    fontSize: 16,
  },
  addArtistContainer: {
    marginBottom: 15,
  },
  artistSearchInput: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  artistSearchResults: {
    maxHeight: 200,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#333333',
    marginBottom: 10,
  },
  artistSearchResultsList: {
    // No specific styles needed, FlatList handles its own styling
  },
  artistSearchResult: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  artistSearchResultText: {
    color: '#ffffff',
    fontSize: 16,
  },
  artistInputButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelArtistButton: {
    backgroundColor: '#666666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  artistButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  artistChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  removeArtistButton: {
    backgroundColor: '#ff4444',
    padding: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeArtistText: {
    color: '#ffffff',
    fontSize: 14,
  },
  addArtistPrompt: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4285f4',
    borderStyle: 'dashed',
  },
  addArtistPromptText: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: '600',
  },
  artistCount: {
    color: '#cccccc',
    fontSize: 14,
  },
  audioProgressContainer: {
    marginTop: 10,
    paddingHorizontal: 15,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#444444',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
    width: '100%',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 3,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  timeText: {
    color: '#cccccc',
    fontSize: 12,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  songSearchResultsContainer: {
    maxHeight: 200,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#333333',
    marginBottom: 10,
  },
  songSearchResultsList: {
    // No specific styles needed, FlatList handles its own styling
  },
  songSearchResult: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  songSearchResultText: {
    color: '#ffffff',
    fontSize: 16,
  },
  songSearchResultArtist: {
    color: '#666666',
    fontSize: 14,
    marginTop: 5,
  },
  noResultsContainer: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#666666',
  },
  noResultsText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  noResultsSubtext: {
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  customSongInputContainer: {
    alignItems: 'center',
  },
  customSongInput: {
    backgroundColor: '#444444',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    width: '100%',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555555',
  },
  addCustomSongButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addCustomSongButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emailSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});

export default ProfileScreen; 