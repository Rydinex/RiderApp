import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { API_BASE_URL } from '../config/network';
import {
  RideCategory,
  RequestRideCategory,
  UpfrontPricingQuote,
  TripPoint,
  DEFAULT_REGION,
  RIDE_CATEGORY_OPTIONS,
  formatRideCategoryLabel,
} from '../../App'; // Adjust path if needed

const PREMIUM_COLORS = {
  background: '#131314',
  card: '#1f1f20',
  cardHigh: '#2a2a2b',
  cardHighest: '#353436',
  textPrimary: '#e5e2e3',
  textSecondary: '#c2c6d7',
  divider: '#424654',
  accent: '#276ef1',
  accentSoft: '#31477c',
  successSoft: '#163828',
  warningSoft: '#3d2f1b',
  danger: '#ffb4ab',
  shadow: '#000000',
};

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1b1b1c" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8c90a0" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#131314" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#e5e2e3" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#8c90a0" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#1f1f20" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2a2a2b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#2a2a2b" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#353436" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#353436" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e0e0f" }] }
];

export default function RequestRideScreen({ navigation, context }: any) {
  const [pickupAddress, setPickupAddress] = useState('Current Location');
  const [dropoffAddress, setDropoffAddress] = useState('');
  
  // For simplicity in UI, default coordinates (San Francisco or Lagos)
  const [pickupLat, setPickupLat] = useState(DEFAULT_REGION.latitude);
  const [pickupLng, setPickupLng] = useState(DEFAULT_REGION.longitude);
  const [dropoffLat, setDropoffLat] = useState(DEFAULT_REGION.latitude + 0.05);
  const [dropoffLng, setDropoffLng] = useState(DEFAULT_REGION.longitude + 0.05);

  const [rideCategory, setRideCategory] = useState<RideCategory>('black_car');
  const [upfrontPricing, setUpfrontPricing] = useState<UpfrontPricingQuote | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestRideCategory = useMemo<RequestRideCategory>(() => {
    const selected = RIDE_CATEGORY_OPTIONS.find(opt => opt.value === rideCategory);
    return selected?.requestCategory || 'black_car';
  }, [rideCategory]);

  const geocodeAddress = useCallback(async (address: string) => {
    const trimmed = address.trim();
    if (trimmed.length < 3) return null;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'Rydinex/1.0' }
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !data[0]) return null;
      return { latitude: Number(data[0].lat), longitude: Number(data[0].lon) };
    } catch {
      return null;
    }
  }, []);

  const handleDropoffSubmit = async () => {
    if (dropoffAddress.trim().length > 2) {
      setPricingLoading(true);
      const coords = await geocodeAddress(dropoffAddress);
      if (coords) {
        setDropoffLat(coords.latitude);
        setDropoffLng(coords.longitude);
        await loadPricing({
          pickup: { latitude: pickupLat, longitude: pickupLng, address: pickupAddress },
          dropoff: { latitude: coords.latitude, longitude: coords.longitude, address: dropoffAddress }
        });
      }
      setPricingLoading(false);
    }
  };

  const loadPricing = async (tripPoints: { pickup: TripPoint, dropoff: TripPoint }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/trips/upfront-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tripPoints,
          rideCategory: requestRideCategory,
        }),
      });
      const data = await response.json();
      if (response.ok && data) setUpfrontPricing(data);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmRide = async () => {
    if (!context?.riderId) return;
    if (!dropoffAddress.trim()) {
      Alert.alert('Dropoff Required', 'Please enter a destination.');
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/trips/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: context.riderId,
          rideCategory: requestRideCategory,
          pickup: { latitude: pickupLat, longitude: pickupLng, address: pickupAddress },
          dropoff: { latitude: dropoffLat, longitude: dropoffLng, address: dropoffAddress },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to request ride');
      
      navigation.replace('WaitingForDriver', { tripId: data?.trip?._id });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedClassLabel = formatRideCategoryLabel(rideCategory).replace(/^Rydinex\s+/i, '').replace(/^Black\s+/i, '');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Map Background with Route */}
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          customMapStyle={mapStyle}
          region={{
            latitude: (pickupLat + dropoffLat) / 2,
            longitude: (pickupLng + dropoffLng) / 2,
            latitudeDelta: Math.abs(pickupLat - dropoffLat) * 2 + 0.02,
            longitudeDelta: Math.abs(pickupLng - dropoffLng) * 2 + 0.02,
          }}
          showsUserLocation={false}
          showsCompass={false}
          showsMyLocationButton={false}
        >
          <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }}>
            <View style={styles.pickupDot} />
          </Marker>
          {dropoffAddress.length > 2 && (
            <>
              <Marker coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}>
                <View style={styles.dropoffDot} />
              </Marker>
              <Polyline
                coordinates={[
                  { latitude: pickupLat, longitude: pickupLng },
                  { latitude: dropoffLat, longitude: dropoffLng }
                ]}
                strokeColor={PREMIUM_COLORS.accent}
                strokeWidth={4}
                lineDashPattern={[5, 10]}
              />
            </>
          )}
        </MapView>
      </View>

      {/* Header & Location Inputs */}
      <View style={styles.headerContainer}>
        <View style={styles.topNav}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Plan your ride</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={styles.pickupDot} />
            <TextInput
              style={styles.locationInput}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Pickup Location"
              placeholderTextColor="#8c90a0"
            />
          </View>
          <View style={styles.locationDivider} />
          <View style={styles.locationRow}>
            <View style={styles.dropoffDot} />
            <TextInput
              style={styles.locationInput}
              value={dropoffAddress}
              onChangeText={setDropoffAddress}
              placeholder="Where to?"
              placeholderTextColor="#8c90a0"
              onSubmitEditing={handleDropoffSubmit}
              returnKeyType="search"
            />
            {pricingLoading && <ActivityIndicator size="small" color={PREMIUM_COLORS.accent} />}
          </View>
        </View>
      </View>

      {/* Bottom Sheet for Ride Selection */}
      <View style={styles.bottomSheet}>
        <View style={styles.handleBar} />
        
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Choose your ride</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM SERVICE</Text>
          </View>
        </View>

        <ScrollView style={styles.rideOptionsList} showsVerticalScrollIndicator={false}>
          {/* Rydinex Rider X */}
          <Pressable 
            style={[styles.rideOption, rideCategory === 'black_car' && styles.rideOptionSelected]}
            onPress={() => setRideCategory('black_car')}
          >
            <View style={styles.rideIconContainer}>
              <Text style={styles.rideIcon}>🚙</Text>
            </View>
            <View style={styles.rideDetails}>
              <View style={styles.rideDetailsRow}>
                <Text style={styles.rideName}>Rydinex Rider X</Text>
                <Text style={styles.ridePrice}>
                  {upfrontPricing?.upfrontFare ? `$${upfrontPricing.upfrontFare.toFixed(2)}` : '$24.50'}
                </Text>
              </View>
              <View style={styles.rideMetaRow}>
                <Text style={styles.rideMetaIcon}>⏱</Text>
                <Text style={styles.rideMetaText}>3 min away</Text>
                <View style={styles.metaDot} />
                <Text style={styles.rideMetaText}>Efficient</Text>
              </View>
            </View>
          </Pressable>

          {/* Rydinex Comfort */}
          <Pressable 
            style={[styles.rideOption, rideCategory === 'comfort' && styles.rideOptionSelected]}
            onPress={() => setRideCategory('comfort')}
          >
            <View style={[styles.rideIconContainer, { backgroundColor: 'rgba(53,52,54,0.3)' }]}>
              <Text style={[styles.rideIcon, { opacity: 0.7 }]}>🚐</Text>
            </View>
            <View style={styles.rideDetails}>
              <View style={styles.rideDetailsRow}>
                <Text style={styles.rideName}>Rydinex Comfort</Text>
                <Text style={styles.ridePriceInactive}>
                  {upfrontPricing?.upfrontFare ? `$${(upfrontPricing.upfrontFare * 1.5).toFixed(2)}` : '$38.20'}
                </Text>
              </View>
              <View style={styles.rideMetaRow}>
                <Text style={styles.rideMetaIcon}>⏱</Text>
                <Text style={styles.rideMetaText}>5 min away</Text>
                <View style={styles.metaDot} />
                <Text style={styles.rideMetaText}>Extra legroom</Text>
              </View>
            </View>
          </Pressable>

          {/* Rydinex XL */}
          <Pressable 
            style={[styles.rideOption, rideCategory === 'xl' && styles.rideOptionSelected]}
            onPress={() => setRideCategory('xl')}
          >
            <View style={[styles.rideIconContainer, { backgroundColor: 'rgba(53,52,54,0.3)' }]}>
              <Text style={[styles.rideIcon, { opacity: 0.7 }]}>🔋</Text>
            </View>
            <View style={styles.rideDetails}>
              <View style={styles.rideDetailsRow}>
                <Text style={styles.rideName}>Rydinex XL</Text>
                <Text style={styles.ridePriceInactive}>
                  {upfrontPricing?.upfrontFare ? `$${(upfrontPricing.upfrontFare * 1.8).toFixed(2)}` : '$45.00'}
                </Text>
              </View>
              <View style={styles.rideMetaRow}>
                <Text style={styles.rideMetaIcon}>⏱</Text>
                <Text style={styles.rideMetaText}>8 min away</Text>
                <View style={styles.metaDot} />
                <Text style={styles.rideMetaText}>6 seats</Text>
              </View>
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.ctaContainer}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentMethod}>
              <View style={styles.paymentIconContainer}>
                <Text style={styles.paymentIcon}>💳</Text>
              </View>
              <Text style={styles.paymentText}> -  -  -  -  4242</Text>
            </View>
            <View style={styles.profileToggle}>
              <Text style={styles.profileToggleActive}>Personal</Text>
            </View>
          </View>
          
          <Pressable 
            style={({pressed}) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
            onPress={confirmRide}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm {selectedClassLabel}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b1b1c',
  },
  mapContainer: {
    flex: 1,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PREMIUM_COLORS.accent,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffb694', // tertiary
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 31, 32, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#e5e2e3',
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e2e3',
  },
  locationCard: {
    backgroundColor: 'rgba(31, 31, 32, 0.9)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#e5e2e3',
    height: 40,
  },
  locationDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
    marginLeft: 24,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1b1b1c',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '60%',
  },
  handleBar: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#e5e2e3',
  },
  premiumBadge: {
    backgroundColor: '#353436',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffb694',
    letterSpacing: 1,
  },
  rideOptionsList: {
    marginBottom: 16,
  },
  rideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1f1f20',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rideOptionSelected: {
    backgroundColor: 'rgba(39, 110, 241, 0.1)',
    borderColor: '#276ef1',
  },
  rideIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#353436',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rideIcon: {
    fontSize: 32,
  },
  rideDetails: {
    flex: 1,
  },
  rideDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e2e3',
  },
  ridePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#276ef1',
  },
  ridePriceInactive: {
    fontSize: 20,
    fontWeight: '700',
    color: '#c2c6d7',
  },
  rideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rideMetaIcon: {
    fontSize: 12,
    color: '#c2c6d7',
    marginRight: 4,
  },
  rideMetaText: {
    fontSize: 12,
    color: '#c2c6d7',
    opacity: 0.8,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#424654',
    marginHorizontal: 8,
  },
  ctaContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(39, 110, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIcon: {
    fontSize: 16,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e2e3',
    marginLeft: 8,
  },
  profileToggle: {
    backgroundColor: '#353436',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  profileToggleActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e5e2e3',
  },
  confirmButton: {
    backgroundColor: '#276ef1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#276ef1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
});
