import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

// We will use simple text emojis/symbols since vector icons aren't installed yet
export default function MainTabNavigator({ route, navigation, context }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#131314',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#b1c5ff',
        tabBarInactiveTintColor: '#424654',
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 10,
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>🏠</Text>,
        }}
      >
        {(props) => <HomeScreen {...props} context={context} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="ActivityTab" 
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📋</Text>,
        }}
      >
        {(props) => <ActivityScreen {...props} context={context} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="AccountTab" 
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>👤</Text>,
        }}
      >
        {(props) => <AccountSettingsScreen {...props} context={context} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
