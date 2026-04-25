import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// We will eventually move this to a shared theme file, but defining it here for now to match App.tsx
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

// Replace with correct import path if you extracted RootStackParamList to a types file
// type RootStackParamList = any; 

type AccountSettingsProps = {
  navigation: any; // Using any for navigation to avoid circular dependency with App.tsx for now
  context: {
    riderId: string;
    setRiderId: (id: string) => void;
  };
};

export default function AccountSettingsScreen({ navigation, context }: AccountSettingsProps) {
  
  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: () => {
          context.setRiderId('');
          navigation.replace('Registration');
        }
      }
    ]);
  }, [context, navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* User Profile Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEeoUr2PJ12EW5tI4GpddAfD8fSIrOzaeotkI4EzuDPvz2lpyP217esAWD0ifodc5F_3iceAUuQFlDyyhm9SixJh883qiWyZPb2tmC4cC7_3GecFhxulQYywauii6jkNx75hRw1MiSBG8jQ_VtCdnELSVYFQ01fSXxqtQPrE1oMlo3JIvQ94halo7Msjs52PmpmU6YmoOCwnnW8nZQ53Qbh5cpjoxq1dOlVCeWOPDHfrIa6MG8iRGoe44lTkxK1AQTdow7irKmAFM' }} 
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </View>
        
        <View style={styles.nameContainer}>
          <Text style={styles.nameText}>Marcus Chen</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingValue}>5.0</Text>
            <Text style={styles.ratingLabel}>Rider Rating</Text>
          </View>
        </View>
      </View>

      {/* Bento Grid: Main Actions */}
      <View style={styles.bentoGrid}>
        {/* Payment Methods */}
        <Pressable 
          style={[styles.glassCard, styles.fullWidthCard]}
          onPress={() => navigation.navigate('AddPaymentMethod')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.chevronIcon}>›</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardSubtitle}>PAYMENT METHODS</Text>
            <View style={styles.paymentRow}>
              <View style={styles.visaBadge}>
                <Text style={styles.visaText}>VISA</Text>
              </View>
              <Text style={styles.paymentText}> -  -  -  -  4242</Text>
            </View>
          </View>
        </Pressable>

        {/* Saved Places: Home */}
        <Pressable style={styles.glassCard}>
          <Text style={styles.cardIconPrimary}>🏠</Text>
          <Text style={styles.cardSubtitle}>HOME</Text>
          <Text style={styles.locationText} numberOfLines={1}>123 Emerald Heights</Text>
        </Pressable>

        {/* Saved Places: Work */}
        <Pressable style={styles.glassCard}>
          <Text style={styles.cardIconTertiary}>💼</Text>
          <Text style={styles.cardSubtitle}>WORK</Text>
          <Text style={styles.locationText} numberOfLines={1}>Tech Plaza, Tower B</Text>
        </Pressable>
      </View>

      {/* App Settings List */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>APP SETTINGS</Text>
        
        <View style={styles.settingsList}>
          {/* Notifications */}
          <Pressable style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
              <Text style={styles.settingsItemText}>Notifications</Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </Pressable>

          {/* Privacy & Security */}
          <Pressable style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>🛡️</Text>
              </View>
              <Text style={styles.settingsItemText}>Privacy & Security</Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </Pressable>

          {/* Appearance */}
          <Pressable style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>🌙</Text>
              </View>
              <Text style={styles.settingsItemText}>Appearance</Text>
            </View>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>DARK</Text>
              <View style={styles.toggleTrack}>
                <View style={styles.toggleThumb} />
              </View>
            </View>
          </Pressable>

          {/* Support */}
          <Pressable style={styles.settingsItem} onPress={() => navigation.navigate('Support')}>
            <View style={styles.settingsItemLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>❓</Text>
              </View>
              <Text style={styles.settingsItemText}>Support</Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <Pressable 
          style={({pressed}) => [styles.signOutButton, pressed && styles.signOutButtonPressed]}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonIcon}>🚪</Text>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
        <Text style={styles.versionText}>VELOCITY V2.4.0  -  BUILD 882</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    backgroundColor: PREMIUM_COLORS.background,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: PREMIUM_COLORS.accent,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PREMIUM_COLORS.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  editBadgeText: {
    color: '#ffffff',
    fontSize: 16,
  },
  nameContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: PREMIUM_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ratingStar: {
    color: '#ffb694', // tertiary-fixed-dim
    fontSize: 14,
    marginRight: 4,
  },
  ratingValue: {
    fontWeight: '700',
    fontSize: 14,
    color: PREMIUM_COLORS.textPrimary,
  },
  ratingLabel: {
    fontSize: 12,
    color: PREMIUM_COLORS.textSecondary,
    marginLeft: 6,
    opacity: 0.6,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  glassCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(53, 52, 54, 0.4)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(66, 70, 84, 0.1)', // outline-variant/10
  },
  fullWidthCard: {
    width: '100%',
    minWidth: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    color: PREMIUM_COLORS.accent,
  },
  cardIconPrimary: {
    fontSize: 24,
    marginBottom: 12,
  },
  cardIconTertiary: {
    fontSize: 24,
    marginBottom: 12,
  },
  chevronIcon: {
    fontSize: 20,
    color: PREMIUM_COLORS.textSecondary,
    opacity: 0.6,
  },
  cardContent: {
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: PREMIUM_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  visaBadge: {
    backgroundColor: PREMIUM_COLORS.cardHighest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  visaText: {
    fontSize: 12,
    fontWeight: '900',
    color: PREMIUM_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '500',
    color: PREMIUM_COLORS.textPrimary,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: PREMIUM_COLORS.textPrimary,
    marginTop: 4,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: PREMIUM_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  settingsList: {
    gap: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: PREMIUM_COLORS.cardHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: PREMIUM_COLORS.textPrimary,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PREMIUM_COLORS.accent,
    textTransform: 'uppercase',
  },
  toggleTrack: {
    width: 40,
    height: 24,
    backgroundColor: PREMIUM_COLORS.accent,
    borderRadius: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  dangerZone: {
    paddingTop: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PREMIUM_COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.2)', // error/20
    paddingVertical: 20,
    borderRadius: 16,
  },
  signOutButtonPressed: {
    backgroundColor: 'rgba(255, 180, 171, 0.1)',
  },
  signOutButtonIcon: {
    fontSize: 18,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: PREMIUM_COLORS.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: PREMIUM_COLORS.textSecondary,
    opacity: 0.4,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 24,
  },
});
