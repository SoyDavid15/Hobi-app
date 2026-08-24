import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  Modal,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { ChallengeService, CompletedChallengeItem } from '@/services/challenges';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<CompletedChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CompletedChallengeItem | null>(null);

  const loadProfileData = useCallback(async () => {
    const { challenges: items } = await ChallengeService.getCompletedChallenges();
    setChallenges(items);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfileData();
  }, [loadProfileData]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProfileData();
    }, [loadProfileData])
  );

  // Calcular racha en base a retos completados
  const calculateStreak = (items: CompletedChallengeItem[]) => {
    if (!items || items.length === 0) return 0;
    const dates = Array.from(new Set(items.map((i) => i.challenge_date))).sort().reverse();
    let streak = 0;
    const today = new Date();
    
    // Comprobar si completó hoy o ayer para mantener la racha activa
    for (let i = 0; i < dates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const formatted = checkDate.toISOString().split('T')[0];
      
      if (dates.includes(formatted)) {
        streak++;
      } else if (i === 0) {
        // Si no completó hoy, comprobar si completó ayer
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yFormatted = yesterday.toISOString().split('T')[0];
        if (dates.includes(yFormatted)) {
          continue;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return Math.max(streak, items.length > 0 ? 1 : 0);
  };

  const streakCount = calculateStreak(challenges);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: '#FFFFFF' }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#6F4E37']}
          tintColor="#6F4E37"
        />
      }>
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
            <View style={styles.innerCircle}>
              <Ionicons name="person" size={44} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Tarjeta de Racha con icono de fuego (Ionicons) */}
        <View style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Ionicons name="flame" size={26} color="#FF5722" />
            <ThemedText style={styles.streakText}>Racha</ThemedText>
            <ThemedText style={styles.streakNumber}>
              {streakCount} {streakCount === 1 ? 'día' : 'días'}
            </ThemedText>
          </View>
        </View>

        {/* Título de la Galería */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Retos Completados</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            {challenges.length} {challenges.length === 1 ? 'foto guardada' : 'fotos guardadas'}
          </ThemedText>
        </View>

        {/* Galería / Fotos de retos */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6F4E37" />
          </View>
        ) : challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="camera-outline" size={36} color="#8E8E93" />
            </View>
            <ThemedText style={styles.emptyTitle}>Aún no tienes fotos de retos</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Presiona "Hecho" en la pantalla de Inicio y tómale una foto a tu evidencia diaria para llenar tu galería.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.galleryGrid}>
            {challenges.map((item) => (
              <Pressable
                key={item.id || item.challenge_date}
                style={({ pressed }) => [
                  styles.photoCardWrapper,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => setSelectedItem(item)}>
                <Image
                  source={{ uri: item.photo_url }}
                  style={styles.photoCardImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.photoDateBadge}>
                  <ThemedText style={styles.photoDateText}>
                    {item.challenge_date} • {item.period === 'PM' ? 'Tarde' : 'Mañana'}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>

      {/* Modal de Detalle de Reto */}
      <Modal
        visible={Boolean(selectedItem)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedItem(null)} />
          {selectedItem && (
            <View style={styles.modalContent}>
              <Pressable style={styles.modalCloseButton} onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={24} color="#1F1F1F" />
              </Pressable>

              <Image
                source={{ uri: selectedItem.photo_url }}
                style={styles.modalImage}
                contentFit="cover"
              />

              <View style={styles.modalInfo}>
                <View style={styles.modalTag}>
                  <Ionicons name="calendar-outline" size={14} color="#6F4E37" />
                  <ThemedText style={styles.modalTagText}>
                    {selectedItem.challenge_date} • {selectedItem.period === 'PM' ? 'Tarde' : 'Mañana'}
                  </ThemedText>
                </View>

                <ThemedText style={styles.modalChallengeTitle}>Reto completado:</ThemedText>
                <ThemedText style={styles.modalChallengeText}>
                  {selectedItem.challenge}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </Modal>
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
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  loadingBox: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#F9F9FB',
    borderRadius: BorderRadius.medium,
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    justifyContent: 'space-between',
  },
  photoCardWrapper: {
    width: '48%',
    height: 160,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    backgroundColor: '#E2E2E2',
    position: 'relative',
  },
  photoCardImage: {
    width: '100%',
    height: '100%',
  },
  photoDateBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.small,
  },
  photoDateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    zIndex: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#E0E0E0',
  },
  modalInfo: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F4E37',
  },
  modalChallengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  modalChallengeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
    lineHeight: 22,
  },
});
