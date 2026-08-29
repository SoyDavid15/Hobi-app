import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { ChallengeService, CompletedChallengeItem } from '@/services/challenges';
import { calculateStreak } from '@/lib/streak';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { t } = useLanguage();
  const [challenges, setChallenges] = useState<CompletedChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CompletedChallengeItem | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (session.user.email) {
          setUserEmail(session.user.email);
        }
        if (session.user.user_metadata?.username) {
          setUsername(session.user.user_metadata.username);
        }
      }
      const { challenges: items } = await ChallengeService.getCompletedChallenges();
      setChallenges(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfileData();
  }, [loadProfileData]);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadProfileData();
    }
  }, [loadProfileData]);

  // Racha de días consecutivos con al menos 1 reto completado (lógica en @/lib/streak)
  const streakCount = calculateStreak(challenges.map((c) => c.challenge_date));

  const handleDonate = async () => {
    const url = 'https://ko-fi.com/samuuu';
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await openBrowserAsync(url, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }
    } catch {
      Linking.openURL(url);
    }
  };

  const displayName = username || (userEmail ? userEmail.split('@')[0] : 'Hobi User');

  return (
    <View style={styles.container}>
      {/* Círculo gigante café inferior (misma estética que Home) */}
      <View
        style={[
          styles.bottomCircle,
          {
            width: width * 2,
            left: '-50%',
            height: height * 0.45,
            borderTopLeftRadius: width,
            borderTopRightRadius: width,
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
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
          {/* Cabecera superior con botones de navegación (Hobbies y Ajustes) */}
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.topIconButton, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push('/hobbies')}>
              <Ionicons name="heart" size={18} color="#6F4E37" />
              <ThemedText style={styles.topIconText}>{t('hobbiesBtn')}</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.hamburgerButton, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={20} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Tarjeta de Perfil / Avatar */}
          <View style={styles.profileHeroCard}>
            <View style={styles.outerRing}>
              <View style={styles.innerCircle}>
                <Ionicons name="person" size={42} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>{displayName}</ThemedText>
              <ThemedText style={styles.userEmail}>
                {userEmail || 'explorador@hobi.app'}
              </ThemedText>
            </View>
          </View>

          {/* Tarjetas de Estadísticas (Racha y Monedas) */}
          <View style={styles.statsContainer}>
            <View style={styles.streakCard}>
              <View style={styles.streakIconBox}>
                <Ionicons name="flame" size={24} color="#FF5722" />
              </View>
              <View>
                <ThemedText style={styles.statLabel}>{t('streak')}</ThemedText>
                <ThemedText style={styles.streakNumber}>
                  {streakCount} {streakCount === 1 ? t('day') : t('days')}
                </ThemedText>
              </View>
            </View>

            <View style={styles.challengesCountCard}>
              <View style={styles.challengesIconBox}>
                <Ionicons name="wallet-outline" size={22} color="#6F4E37" />
              </View>
              <View>
                <ThemedText style={styles.statLabel}>{t('coins')}</ThemedText>
                <ThemedText style={styles.challengesNumber}>
                  —
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Botón / Tarjeta de Donación (Ko-fi) */}
          <Pressable
            style={({ pressed }) => [
              styles.donateCard,
              { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
            ]}
            onPress={handleDonate}>
            <View style={styles.donateIconBox}>
              <Ionicons name="cafe" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.donateInfo}>
              <ThemedText style={styles.donateTitle}>{t('inviteCoffee')}</ThemedText>
              <ThemedText style={styles.donateSubtitle}>{t('supportKoFi')}</ThemedText>
            </View>
            <View style={styles.donateArrow}>
              <Ionicons name="heart" size={16} color="#FF5722" />
              <Ionicons name="chevron-forward" size={16} color="#6F4E37" />
            </View>
          </Pressable>

          {/* Sección de Galería */}
          <View style={styles.gallerySection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{t('completedChallengesTitle')}</ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                {challenges.length} {challenges.length === 1 ? t('memory') : t('memories')}
              </ThemedText>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#6F4E37" />
              </View>
            ) : challenges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="camera-outline" size={36} color="#6F4E37" />
                </View>
                <ThemedText style={styles.emptyTitle}>{t('emptyGalleryTitle')}</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  {t('emptyGallerySubtitle')}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.galleryGrid}>
                {challenges.map((item) => (
                  <Pressable
                    key={item.id || item.challenge_date}
                    style={({ pressed }) => [
                      styles.photoCardWrapper,
                      { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                    ]}
                    onPress={() => setSelectedItem(item)}>
                    <Image
                      source={{ uri: item.photo_url }}
                      style={styles.photoCardImage}
                      contentFit="cover"
                      transition={250}
                    />
                    <View style={styles.photoOverlay}>
                      <View style={styles.photoDateBadge}>
                        <ThemedText style={styles.photoDateText}>
                          {item.challenge_date} • {item.period === 'PM' ? '🌙 Tarde' : '☀️ Mañana'}
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>

      {/* Modal de Detalle Espectacular */}
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
                <Ionicons name="close" size={22} color="#1F1F1F" />
              </Pressable>

              <Image
                source={{ uri: selectedItem.photo_url }}
                style={styles.modalImage}
                contentFit="cover"
              />

              <View style={styles.modalInfo}>
                <View style={styles.modalTag}>
                  <Ionicons name="calendar" size={14} color="#6F4E37" />
                  <ThemedText style={styles.modalTagText}>
                    {selectedItem.challenge_date} • {selectedItem.period === 'PM' ? 'Turno Tarde' : 'Turno Mañana'}
                  </ThemedText>
                </View>

                <ThemedText style={styles.modalChallengeTitle}>Reto superado:</ThemedText>
                <ThemedText style={styles.modalChallengeText}>
                  {selectedItem.challenge}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -60,
    backgroundColor: '#6F4E37',
    zIndex: 0,
    opacity: 0.12,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 140,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    alignItems: 'stretch',
    gap: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  topIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half + 2,
    backgroundColor: '#F5F2ED',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  topIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F4E37',
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  profileHeroCard: {
    backgroundColor: '#F7F6F3',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    marginTop: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EAE6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    alignItems: 'center',
    gap: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1F1F',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  streakCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC5AD',
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  streakIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengesCountCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2ED',
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  challengesIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B655E',
    fontWeight: '600',
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  challengesNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6F4E37',
  },
  donateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    borderRadius: BorderRadius.medium,
    padding: Spacing.three + 2,
    borderWidth: 1.5,
    borderColor: '#FFD8CC',
    gap: Spacing.three,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  donateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateInfo: {
    flex: 1,
    gap: 2,
  },
  donateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  donateSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  donateArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FFD8CC',
  },
  gallerySection: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: Spacing.six,
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
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.half,
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
    lineHeight: 19,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.three,
  },
  photoCardWrapper: {
    width: '48%',
    height: 180,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    backgroundColor: '#E2E2E2',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  photoCardImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  photoDateBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  photoDateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalImage: {
    width: '100%',
    height: 280,
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
    backgroundColor: '#F5F2ED',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half + 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F4E37',
  },
  modalChallengeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 2,
  },
  modalChallengeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
    lineHeight: 22,
  },
});
