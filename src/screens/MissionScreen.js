import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const MissionScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Hero Section with Gradient-like effect */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>🎸</Text>
          </View>
          <Text style={styles.heroTitle}>My Story</Text>
          <View style={styles.heroDivider} />
        </View>

        {/* Main Message Card */}
        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageIcon}></Text>
            <Text style={styles.messageTitle}>A Message from the Creator</Text>
          </View>
          
          <View style={styles.messageContent}>
            <Text style={styles.messageText}>
              My name is <Text style={styles.highlight}>Ian</Text> and I am the creator of this website. 
            </Text>
            
            <Text style={styles.messageText}>
              I recently started playing guitar again and I realized how impactful it would be for someone else to help guide me through that process.
            </Text>
            
            <Text style={styles.messageText}>
              This app is all about <Text style={styles.highlight}>learning from each other</Text> and the community. You can set up meetings through gmail and zoom, which are linked within the app.
            </Text>
            
            <Text style={styles.messageText}>
              My hope is to help whoever needs it and to have a guitar community thriving from each other.
            </Text>
            
            <Text style={styles.messageText}>
              I hope you like it!
            </Text>
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🤝</Text>
            <Text style={styles.featureTitle}>Community First</Text>
            <Text style={styles.featureText}>Connect with fellow guitarists</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={styles.featureTitle}>Learn Together</Text>
            <Text style={styles.featureText}>Share knowledge and skills</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎥</Text>
            <Text style={styles.featureTitle}>Virtual Meetings</Text>
            <Text style={styles.featureText}>Zoom and Gmail integration</Text>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>Ready to join the community?</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.ctaButtonText}>Start Exploring!</Text>
          </TouchableOpacity>
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
    paddingTop: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#4285f4',
  },
  avatar: {
    fontSize: 50,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  heroDivider: {
    width: 60,
    height: 4,
    backgroundColor: '#4285f4',
    borderRadius: 2,
  },
  messageCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  messageContent: {
    gap: 16,
  },
  messageText: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'left',
  },
  highlight: {
    color: '#4285f4',
    fontWeight: 'bold',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  featureCard: {
    backgroundColor: '#333333',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: (width - 60) / 3,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444444',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ctaText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#5a9eff',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MissionScreen; 