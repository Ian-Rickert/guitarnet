import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Linking } from 'react-native';

const ProfileScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [newSongInput, setNewSongInput] = useState('');

  const presetPics = [
    '🎸', '🎵', '🎶', '🎼', '🎹', '🥁', '🎤', '🎧'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = route.params?.userId || user?.uid;
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
      
      Alert.alert('Success', 'Song added successfully!');
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
  };

  const cancelAddingSong = () => {
    setIsAddingSong(false);
    setNewSongInput('');
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
        <Text style={styles.profilePic}>{profile.profilePic || '🎸'}</Text>
        <Text style={styles.username}>{profile.username || 'Guitarist'}</Text>
        <Text style={styles.skillLevel}>{profile.skillLevel || 'Beginner'}</Text>
        
        {/* Email Section */}
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
            <Text style={styles.sectionTitle}>Favorite Artists</Text>
            <View style={styles.artistsContainer}>
              {profile.favoriteArtists?.map((artist, index) => (
                <Text key={index} style={styles.artistChip}>{artist}</Text>
              )) || <Text style={styles.noData}>No artists added</Text>}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Songs I Can Play</Text>
              {!route.params?.userId && (
                <Text style={styles.songCount}>
                  {profile.songs?.length || 0}/15
                </Text>
              )}
            </View>
            
            {isAddingSong ? (
              <View style={styles.addSongContainer}>
                <TextInput
                  style={styles.songInput}
                  value={newSongInput}
                  onChangeText={setNewSongInput}
                  placeholder="Enter song name..."
                  placeholderTextColor="#666666"
                />
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
              !route.params?.userId && (profile.songs?.length || 0) < 15 && (
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
                {!route.params?.userId && (
                  <TouchableOpacity 
                    style={styles.removeSongButton}
                    onPress={() => removeSong(song)}
                  >
                    <Text style={styles.removeSongText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            )) || <Text style={styles.noData}>No songs added</Text>}
          </View>

          <TouchableOpacity style={styles.meetingButton} onPress={setupMeeting}>
            <Text style={styles.meetingButtonText}>Setup Zoom Meeting</Text>
          </TouchableOpacity>

          {!route.params?.userId && (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
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
});

export default ProfileScreen; 