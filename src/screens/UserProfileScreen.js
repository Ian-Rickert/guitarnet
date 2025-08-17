import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserProfileScreen = ({ navigation, route }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [route.params?.userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userId = route.params?.userId;
      if (!userId) {
        navigation.goBack();
        return;
      }

      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        Alert.alert('Error', 'Profile not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
      navigation.goBack();
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    >
      {/* Header with back button and sign out */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
        
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

      <View style={styles.profileHeader}>
        <Text style={styles.profilePic}>{profile.profilePic || '🎸'}</Text>
        <Text style={styles.username}>{profile.username || 'Guitarist'}</Text>
        <Text style={styles.skillLevel}>{profile.skillLevel || 'Beginner'}</Text>
        
        {profile.email && (
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{profile.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bioText}>{profile.bio || 'No bio yet...'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Artists</Text>
          <View style={styles.artistsContainer}>
            {profile.favoriteArtists?.map((artist, index) => (
              <Text key={index} style={styles.artistChip}>{artist}</Text>
            )) || <Text style={styles.noData}>No artists added</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Songs I Can Play</Text>
          {profile.songs?.map((song, index) => (
            <View key={index} style={styles.songItemContainer}>
              <TouchableOpacity
                style={styles.songItem}
                onPress={() => openUltimateGuitar(song)}
              >
                <Text style={styles.songText}>{song}</Text>
                <Text style={styles.linkText}>🔗 Ultimate Guitar</Text>
              </TouchableOpacity>
            </View>
          )) || <Text style={styles.noData}>No songs added</Text>}
        </View>

        {/* My Work Section - Read Only */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Work</Text>
          {profile.audioUploads?.map((audio, index) => (
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
                    style={styles.playButton}
                    onPress={() => {
                      // Note: Audio playback would need to be implemented here
                      // For now, just show a message
                      Alert.alert('Audio Playback', 'Audio playback feature coming soon!');
                    }}
                  >
                    <Text style={styles.playButtonText}>▶️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )) || <Text style={styles.noData}>No audio uploads yet</Text>}
        </View>

        <TouchableOpacity style={styles.meetingButton} onPress={setupMeeting}>
          <Text style={styles.meetingButtonText}>Setup Zoom Meeting</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
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
    backgroundColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emailText: {
    color: '#ffffff',
    fontSize: 16,
  },
  content: {
    padding: 20,
    minHeight: '100%',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
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
  songItemContainer: {
    marginBottom: 10,
  },
  songItem: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  noData: {
    color: '#666666',
    fontStyle: 'italic',
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
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
});

export default UserProfileScreen; 