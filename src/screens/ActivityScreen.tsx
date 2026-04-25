import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your recent trips will appear here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131314',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e5e2e3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#c2c6d7',
    opacity: 0.6,
  },
});
