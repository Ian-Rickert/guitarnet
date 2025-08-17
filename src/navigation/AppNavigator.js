import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import MissionScreen from '../screens/MissionScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  const { logout } = useAuth();

  const SignOutButton = () => (
    <TouchableOpacity style={styles.signOutButton} onPress={logout}>
      <Text style={styles.signOutText}>Sign Out</Text>
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
        },
        tabBarActiveTintColor: '#4285f4',
        tabBarInactiveTintColor: '#666666',
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#ffffff',
        headerRight: () => <SignOutButton />,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="My Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
          headerRight: () => null, // Remove sign out button from this tab
        }}
      />
      <Tab.Screen
        name="Mission"
        component={MissionScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🎯</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  signOutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AppNavigator; 