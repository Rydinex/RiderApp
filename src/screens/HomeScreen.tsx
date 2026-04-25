import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  PermissionsAndroid,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../config/network';
import {
  RiderHomeData,
  NearbyDriver,
  PendingTripFeedback,
  OnboardingContext,
  DEFAULT_REGION,
} from '../../App'; // Adjust path if App.tsx is root

// Dark Map style from Google Maps to match PRD
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1b1b1c" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8c90a0" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#131314" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#e5e2e3" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8c90a0" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#1f1f20" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#2a2a2b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#2a2a2b" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#353436" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#353436" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0e0e0f" }]
  }
];

export default function HomeScreen({ navigation, context }: any) {
  const [homeData, setHomeData] = useState<RiderHomeData | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const socketRef = useRef<Socket | null>(null);
  const mapRegionRef = useRef<Region>(DEFAULT_REGION);
  const lastNearbySubscriptionAtRef = useRef<number>(0);
  const lastPendingFeedbackPromptTripIdRef = useRef<string>('');

  useEffect(() => {
    if (!context?.riderId) {
      navigation.replace('Registration');
    }
  }, [context?.riderId, navigation]);

  const loadPendingFeedbackPrompt = useCallback(
    async (showAlert: boolean) => {
      if (!context?.riderId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/trips/rider/${context.riderId}/feedback-pending`);
        const payload: PendingTripFeedback = await response.json();

        if (!response.ok || !payload?.tripId) return;

        if (showAlert && lastPendingFeedbackPromptTripIdRef.current !== payload.tripId) {
          lastPendingFeedbackPromptTripIdRef.current = payload.tripId;
          Alert.alert(
            'Rate Your Last Trip',
            payload.promptMessage || 'Rate your driver and add a tip in less than a minute.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Rate Now', onPress: () => navigation.navigate('Receipt', { tripId: payload.tripId }) },
            ]
          );
        }
      } catch {}
    },
    [context?.riderId, navigation]
  );

  const loadHome = useCallback(async () => {
    if (!context?.riderId) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/riders/${context.riderId}/home`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Failed to load home data.');
      setHomeData(payload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [context?.riderId]);

  const loadCurrentLocation = useCallback(async () => {
    if (Platform.OS === 'android') {
      const permissionResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (permissionResult !== PermissionsAndroid.RESULTS.GRANTED) return;
    }

    Geolocation.getCurrentPosition(
      position => {
        const nextRegion = {
          ...mapRegionRef.current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        mapRegionRef.current = nextRegion;
        setMapRegion(nextRegion);
      },
      err => setError(err.message || 'Unable to get location.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );
  }, []);

  const subscribeNearbyDrivers = useCallback((force = false) => {
    if (!context?.riderId) return;

    const now = Date.now();
    if (!force && now - lastNearbySubscriptionAtRef.current < 3500) return;
    lastNearbySubscriptionAtRef.current = now;

    if (!socketRef.current) {
      const socket = io(SOCKET_URL, { transports: ['websocket'] });
      socket.on('connect', () => setSocketConnected(true));
      socket.on('disconnect', () => setSocketConnected(false));
      socket.on('nearby:drivers', payload => {
        const parsedDrivers = Array.isArray(payload?.drivers) ? payload.drivers.map((entry: any) => ({
          driverId: String(entry.driverId),
          latitude: Number(entry.latitude),
          longitude: Number(entry.longitude),
        })) : [];
        setNearbyDrivers(parsedDrivers);
      });
      socketRef.current = socket;
    }

    socketRef.current.emit(
      'rider:subscribeNearby',
      {
        riderId: context.riderId,
        latitude: mapRegionRef.current.latitude,
        longitude: mapRegionRef.current.longitude,
        radiusKm: 5,
        limit: 30,
      }
    );
  }, [context?.riderId]);

  useEffect(() => {
    loadHome();
    loadCurrentLocation();
    loadPendingFeedbackPrompt(false);
  }, [loadCurrentLocation, loadHome, loadPendingFeedbackPrompt]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadPendingFeedbackPrompt(true));
    return unsubscribe;
  }, [loadPendingFeedbackPrompt, navigation]);

  useEffect(() => {
    subscribeNearbyDrivers(true);
  }, [subscribeNearbyDrivers]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('rider:unsubscribeNearby');
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
    };
  }, []);

  const onMapRegionChangeComplete = useCallback((region: Region) => {
    mapRegionRef.current = region;
    setMapRegion(region);
    subscribeNearbyDrivers();
  }, [subscribeNearbyDrivers]);

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        customMapStyle={mapStyle}
        region={mapRegion}
        onRegionChangeComplete={onMapRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {nearbyDrivers.map(driver => (
          <Marker
            key={driver.driverId}
            coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
          >
            <View style={styles.driverMarkerContainer}>
              <Text style={styles.driverMarkerIcon}>🚗</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Navigation Anchor */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3a6Zk_n1yeEniN-R0Ej38SAc2u_aBR55OJQxjTdI6xaelhn_b32X5lIEn9dU27Vt-MuFjozfkLIxFhvSiZkLRttxV02uRZ0FQ0zAmgWjHaKeZEkYI5Q8lkBdcSqlXSgvgo3U-aU8nKGEGBFA0ArqlKB7R3QfXmyeMAE7oc9Dbs-UbHMMJp6bAwB8haGxhdm9kjiuFo46UKtaVrFJ44Z5MAJxS81t8jpx5IDF9dC6aru2qD6qnJLi8IbgCtfudKKlHsqR7i3sQ6xw' }}
            style={styles.profileImage}
          />
          <Text style={styles.logoText}>Rydinex</Text>
        </View>
        <Pressable style={styles.headerRight}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </Pressable>
      </View>

      {/* Gradient Overlay for Bottom UI */}
      <View style={styles.bottomGradient} pointerEvents="none" />

      {/* Floating UI: Booking Container */}
      <View style={styles.bottomFloatingUI}>
        {/* Promotion Chip */}
        <View style={styles.promoChipContainer}>
          <View style={styles.promoChip}>
            <View style={styles.promoDot} />
            <Text style={styles.promoText}>20% OFF PREMIUM LUX</Text>
          </View>
        </View>

        {/* Search Bar Card */}
        <View style={styles.searchCard}>
          <Pressable 
            style={styles.searchBar}
            onPress={() => navigation.navigate('RequestRide')}
          >
            <View style={styles.searchIconContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
            </View>
            <Text style={styles.searchText}>Where to?</Text>
          </Pressable>

          {/* Quick Access Shortcuts */}
          <View style={styles.shortcutsRow}>
            <Pressable 
              style={styles.shortcutButton}
              onPress={() => navigation.navigate('RequestRide')}
            >
              <View style={[styles.shortcutIconContainer, { backgroundColor: 'rgba(49, 71, 124, 0.3)' }]}>
                <Text style={styles.shortcutIcon}>🏠</Text>
              </View>
              <View>
                <Text style={styles.shortcutTitle}>Home</Text>
                <Text style={styles.shortcutSubtitle}>24 Market St.</Text>
              </View>
            </Pressable>

            <Pressable 
              style={styles.shortcutButton}
              onPress={() => navigation.navigate('RequestRide')}
            >
              <View style={[styles.shortcutIconContainer, { backgroundColor: 'rgba(198, 81, 0, 0.2)' }]}>
                <Text style={styles.shortcutIcon}>💼</Text>
              </View>
              <View>
                <Text style={styles.shortcutTitle}>Work</Text>
                <Text style={styles.shortcutSubtitle}>One Infinity Loop</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b1b1c',
  },
  driverMarkerContainer: {
    backgroundColor: 'rgba(39, 110, 241, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(39, 110, 241, 0.5)',
  },
  driverMarkerIcon: {
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 50,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 19, 20, 0.6)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#353436',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#276ef1', // PRD uses #276ef1 for the logo/brand name
    letterSpacing: -0.5,
  },
  headerRight: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(53, 52, 54, 0.5)',
  },
  notificationIcon: {
    fontSize: 18,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(19,19,20,0.8)', // Simulated gradient
  },
  bottomFloatingUI: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  promoChipContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingRight: 10,
  },
  promoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 52, 54, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  promoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffb694', // tertiary color
    marginRight: 8,
  },
  promoText: {
    color: '#e5e2e3',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  searchCard: {
    backgroundColor: 'rgba(31, 31, 32, 0.9)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 52, 54, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(39, 110, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#c2c6d7',
  },
  shortcutsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  shortcutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 42, 43, 0.4)',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  shortcutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutIcon: {
    fontSize: 16,
  },
  shortcutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e2e3',
  },
  shortcutSubtitle: {
    fontSize: 11,
    color: '#c2c6d7',
    opacity: 0.6,
  },
});
