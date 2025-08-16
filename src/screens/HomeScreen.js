import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { searchArtists, getPopularArtists } from '../services/artistService';
import { searchSongs } from '../services/songService';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [users, setUsers] = useState([]);
  const [artistSearchResults, setArtistSearchResults] = useState([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [showArtistResults, setShowArtistResults] = useState(false);
  const [searchType, setSearchType] = useState('artist'); // 'artist' or 'song'
  const [songSearchResults, setSongSearchResults] = useState([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);
  const [showSongResults, setShowSongResults] = useState(false);
  const [selectedSong, setSelectedSong] = useState('');

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Debounced search for artists or songs
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        if (searchType === 'artist') {
          setIsSearchingArtists(true);
          const results = await searchArtists(searchQuery);
          setArtistSearchResults(results);
          setIsSearchingArtists(false);
          setShowArtistResults(true);
          setShowSongResults(false);
        } else if (searchType === 'song') {
          setIsSearchingSongs(true);
          const results = await searchSongs(searchQuery, 20);
          setSongSearchResults(results);
          setIsSearchingSongs(false);
          setShowSongResults(true);
          setShowArtistResults(false);
        }
      } else {
        setArtistSearchResults([]);
        setSongSearchResults([]);
        setShowArtistResults(false);
        setShowSongResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  const searchUsers = async () => {
    try {
      let q = collection(db, 'users');
      
      if (searchType === 'artist' && selectedArtist) {
        q = query(q, where('favoriteArtists', 'array-contains', selectedArtist));
      } else if (searchType === 'song' && selectedSong) {
        q = query(q, where('songs', 'array-contains', selectedSong));
      }
      
      if (selectedSkill) {
        q = query(q, where('skillLevel', '==', selectedSkill));
      }

      const querySnapshot = await getDocs(q);
      const userList = [];
      querySnapshot.forEach((doc) => {
        // Filter out the current user from search results
        if (doc.id !== user?.uid) {
          userList.push({ id: doc.id, ...doc.data() });
        }
      });
      
      setUsers(userList);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const selectArtist = (artist) => {
    setSelectedArtist(artist);
    setSearchQuery(artist);
    setShowArtistResults(false);
  };

  const clearArtistSelection = () => {
    setSelectedArtist('');
    setSearchQuery('');
    setShowArtistResults(false);
  };

  const selectSong = (song) => {
    setSelectedSong(song.name);
    setSearchQuery(song.name);
    setShowSongResults(false);
  };

  const clearSongSelection = () => {
    setSelectedSong('');
    setSearchQuery('');
    setShowSongResults(false);
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Text style={styles.userName}>{item.username}</Text>
      <Text style={styles.userSkill}>Skill: {item.skillLevel}</Text>
      <Text style={styles.userArtists}>
        Artists: {item.favoriteArtists?.slice(0, 3).join(', ')}
      </Text>
    </TouchableOpacity>
  );

  const renderArtistResult = ({ item }) => (
    <TouchableOpacity
      style={styles.artistResultItem}
      onPress={() => selectArtist(item)}
    >
      <Text style={styles.artistResultText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSongResult = ({ item }) => (
    <TouchableOpacity
      style={styles.songResultItem}
      onPress={() => selectSong(item)}
    >
      <Text style={styles.songResultText}>{item.name}</Text>
      <Text style={styles.songResultArtist}>{item.artist}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Guitarists</Text>
      
      <View style={styles.searchSection}>
        <View style={styles.searchHeaderContainer}>
          <Text style={styles.sectionTitle}>Search by </Text>
          <TouchableOpacity
            style={styles.searchTypeToggle}
            onPress={() => {
              setSearchType(searchType === 'artist' ? 'song' : 'artist');
              setSearchQuery('');
              setSelectedArtist('');
              setSelectedSong('');
              setShowArtistResults(false);
              setShowSongResults(false);
            }}
          >
            <Text style={styles.searchTypeToggleText}>
              {searchType === 'artist' ? 'Artist' : 'Song'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>:</Text>
        </View>

        {searchType === 'artist' ? (
          <>
            <View style={styles.artistSearchContainer}>
              <TextInput
                style={styles.artistSearchInput}
                placeholder="Type to search artists..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowArtistResults(true);
                  }
                }}
              />
              {selectedArtist && (
                <TouchableOpacity style={styles.clearButton} onPress={clearArtistSelection}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {isSearchingArtists && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4285f4" />
                <Text style={styles.loadingText}>Searching artists...</Text>
              </View>
            )}
            
            {showArtistResults && artistSearchResults.length > 0 && (
              <View style={styles.artistResultsContainer}>
                <FlatList
                  data={artistSearchResults}
                  renderItem={renderArtistResult}
                  keyExtractor={(item) => item}
                  style={styles.artistResultsList}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
            
            {selectedArtist && (
              <View style={styles.selectedArtistContainer}>
                <Text style={styles.selectedArtistText}>Selected: {selectedArtist}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.songSearchContainer}>
              <TextInput
                style={styles.songSearchInput}
                placeholder="Type to search songs..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowSongResults(true);
                  }
                }}
              />
              {selectedSong && (
                <TouchableOpacity style={styles.clearButton} onPress={clearSongSelection}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {isSearchingSongs && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4285f4" />
                <Text style={styles.loadingText}>Searching songs...</Text>
              </View>
            )}
            
            {showSongResults && songSearchResults.length > 0 && (
              <View style={styles.songResultsContainer}>
                <FlatList
                  data={songSearchResults}
                  renderItem={renderSongResult}
                  keyExtractor={(item, index) => `${item.name}-${item.artist}-${index}`}
                  style={styles.songResultsList}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
            
            {selectedSong && (
              <View style={styles.selectedSongContainer}>
                <Text style={styles.selectedSongText}>Selected: {selectedSong}</Text>
              </View>
            )}
          </>
        )}
        
        <Text style={styles.sectionTitle}>Filter by Skill Level:</Text>
        <FlatList
          horizontal
          data={skillLevels}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedSkill === item && styles.selectedChip]}
              onPress={() => setSelectedSkill(selectedSkill === item ? '' : item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
        />
        
        <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
          <Text style={styles.searchButtonText}>
            Search
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        style={styles.userList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {users.length === 0 && !selectedArtist && !selectedSong && !selectedSkill 
              ? `Search for guitarists by ${searchType === 'artist' ? 'artist' : 'song'} or skill level`
              : 'No guitarists found matching your criteria'
            }
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 15,
  },
  artistSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistSearchInput: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#666666',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    color: '#cccccc',
    marginLeft: 10,
  },
  artistResultsContainer: {
    backgroundColor: '#333333',
    borderRadius: 10,
    maxHeight: 200,
    marginTop: 5,
  },
  artistResultsList: {
    maxHeight: 200,
  },
  artistResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  artistResultText: {
    color: '#ffffff',
    fontSize: 16,
  },
  selectedArtistContainer: {
    backgroundColor: '#4285f4',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  selectedArtistText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterChip: {
    backgroundColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedChip: {
    backgroundColor: '#4285f4',
  },
  chipText: {
    color: '#ffffff',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userList: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userSkill: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 5,
  },
  userArtists: {
    color: '#cccccc',
    fontSize: 14,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  songResultItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  songResultText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  songResultArtist: {
    color: '#cccccc',
    fontSize: 14,
  },

  songSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  songSearchInput: {
    backgroundColor: '#333333',
    color: '#ffffff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    flex: 1,
  },
  songResultsContainer: {
    backgroundColor: '#333333',
    borderRadius: 10,
    maxHeight: 200,
    marginTop: 5,
  },
  songResultsList: {
    maxHeight: 200,
  },
  selectedSongContainer: {
    backgroundColor: '#4285f4',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  selectedSongText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchTypeToggle: {
    backgroundColor: '#333333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444444',
  },
  searchTypeToggleText: {
    color: '#4285f4',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen; 