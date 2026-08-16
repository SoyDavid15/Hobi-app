import { Platform, StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const streakCount = 5;

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: '#FFFFFF' }]}
      contentContainerStyle={styles.contentContainer}>
      <SafeAreaView style={styles.safeArea}>
        {/* Botón Hamburguesa en la esquina superior derecha */}
        <View style={styles.topBar}>
          <Pressable style={styles.hamburgerButton} onPress={() => router.push('/settings')}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </Pressable>
        </View>

        {/* Foto de perfil (Círculo con anillo exterior) */}
        <View style={styles.profileHeader}>
          <View style={styles.outerRing}>
            <View style={styles.innerCircle} />
          </View>
        </View>

        {/* Tarjeta de Racha con icono de fuego (Ionicons) */}
        <View style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Ionicons name="flame" size={26} color="#FF5722" />
            <ThemedText style={styles.streakText}>Racha</ThemedText>
            <ThemedText style={styles.streakNumber}>{streakCount} días</ThemedText>
          </View>
        </View>

        {/* Galería / Fotos de retos (Grid 2x2) */}
        <View style={styles.galleryContainer}>
          <View style={styles.galleryRow}>
            <View style={styles.photoCard} />
            <View style={styles.photoCard} />
          </View>
          <View style={styles.galleryRow}>
            <View style={styles.photoCard} />
            <View style={styles.photoCard} />
          </View>
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.five,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    gap: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.two,
  },
  hamburgerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  hamburgerLine: {
    width: 24,
    height: 2.5,
    backgroundColor: '#1F1F1F',
    borderRadius: 2,
  },
  profileHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  outerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFB067',
  },
  streakCard: {
    backgroundColor: '#FFC5AD',
    borderRadius: BorderRadius.large,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6F4E37',
    marginLeft: 'auto',
  },
  galleryContainer: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  photoCard: {
    flex: 1,
    height: 150,
    backgroundColor: '#E2E2E2',
    borderRadius: BorderRadius.medium,
  },
});
