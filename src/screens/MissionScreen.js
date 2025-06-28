import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MissionScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Our Mission</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎸 Why GuitarNet?</Text>
          <Text style={styles.text}>
            GuitarNet was created to bridge the gap between guitarists who want to connect, 
            collaborate, and grow together. Music is inherently social, and learning guitar 
            shouldn't be a solitary journey.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 What We Do</Text>
          <Text style={styles.text}>
            We connect guitarists based on shared musical interests and skill levels. 
            Whether you're a beginner looking for guidance or an advanced player seeking 
            collaboration, GuitarNet helps you find the perfect musical partner.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 How It Works</Text>
          <Text style={styles.text}>
            • Search for guitarists by favorite artists and skill level{'\n'}
            • View detailed profiles with songs they can play{'\n'}
            • Connect through Zoom meetings for virtual jam sessions{'\n'}
            • Share and discover new music together
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💻 The Tech Behind It</Text>
          <Text style={styles.text}>
            GuitarNet is built with modern web technologies:{'\n\n'}
            <Text style={styles.techHighlight}>Frontend:</Text> React Native with Expo{'\n'}
            <Text style={styles.techHighlight}>Backend:</Text> Firebase Firestore{'\n'}
            <Text style={styles.techHighlight}>Authentication:</Text> Firebase Auth with Google Sign-in{'\n'}
            <Text style={styles.techHighlight}>UI/UX:</Text> Custom dark theme with modern design principles
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Development Process</Text>
          <Text style={styles.text}>
            This app was developed using an iterative approach:{'\n\n'}
            1. <Text style={styles.techHighlight}>Planning:</Text> Defined user stories and technical requirements{'\n'}
            2. <Text style={styles.techHighlight}>Setup:</Text> Configured Firebase and React Native environment{'\n'}
            3. <Text style={styles.techHighlight}>Core Features:</Text> Built authentication and user profiles{'\n'}
            4. <Text style={styles.techHighlight}>Search:</Text> Implemented user discovery by artists and skill level{'\n'}
            5. <Text style={styles.techHighlight}>Polish:</Text> Added UI improvements and user experience enhancements
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Future Vision</Text>
          <Text style={styles.text}>
            We envision GuitarNet becoming the go-to platform for guitarists worldwide. 
            Future features include:{'\n\n'}
            • Real-time chat and messaging{'\n'}
            • Video call integration{'\n'}
            • Song collaboration tools{'\n'}
            • Practice session scheduling{'\n'}
            • Progress tracking and achievements
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤝 Join the Community</Text>
          <Text style={styles.text}>
            Whether you're just starting your guitar journey or you're a seasoned player, 
            there's a place for you in the GuitarNet community. Let's make music together!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  text: {
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 24,
  },
  techHighlight: {
    color: '#4285f4',
    fontWeight: '600',
  },
});

export default MissionScreen; 