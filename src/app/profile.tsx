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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { ChallengeService, CompletedChallengeItem } from '@/services/challenges';
import { calculateStreak } from '@/lib/streak';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';
import { useAlert } from '@/context/AlertContext';

type FilterPeriod = 'ALL' | 'AM' | 'PM';

export default function ProfileScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { t } = useLanguage();
  const { showAlert } = useAlert();

  const [challenges, setChallenges] = useState<CompletedChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CompletedChallengeItem | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterPeriod>('ALL');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

  // Racha de días consecutivos
  const streakCount = useMemo(
    () => calculateStreak(challenges.map((c) => c.challenge_date)),
    [challenges]
  );

  // Rango / Título del explorador según racha y retos
  const explorerRank = useMemo(() => {
    if (streakCount >= 14 || challenges.length >= 25) {
      return { title: 'Leyenda Hobi 👑', level: 5, color: '#FFB300', badge: 'LEGEND' };
    }
    if (streakCount >= 7 || challenges.length >= 14) {
      return { title: 'Guerrero de Hábitos ⚡', level: 4, color: '#FF5722', badge: 'MASTER' };
    }
    if (streakCount >= 4 || challenges.length >= 7) {
      return { title: 'Constante Imparable 🔥', level: 3, color: '#E65100', badge: 'PRO' };
    }
    if (streakCount >= 1 || challenges.length >= 1) {
      return { title: 'Explorador Activo 🌱', level: 2, color: '#2E7D32', badge: 'ACTIVE' };
    }
    return { title: 'Principiante Curioso 🐣', level: 1, color: '#6F4E37', badge: 'NOVICE' };
  }, [streakCount, challenges.length]);

  // Filtrado de galería
  const filteredChallenges = useMemo(() => {
    if (activeFilter === 'ALL') return challenges;
    return challenges.filter((c) => c.period === activeFilter);
  }, [challenges, activeFilter]);

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

  const displayName = username || (userEmail ? userEmail.split('@')[0] : 'Explorador Hobi');

  // Compartir tarjeta de perfil
  const handleSharePassport = async () => {
    try {
      await Share.share({
        message: `🔥 ¡Mira mi progreso en Hobi! Llevo una racha de ${streakCount} ${
          streakCount === 1 ? 'día' : 'días'
        } y ${challenges.length} retos superados. 🏆✨\n\n¿Aceptas el reto diario conmigo? Únete en https://hobi.app`,
      });
    } catch {
      // ignore
    }
  };

  // Compartir reto individual
  const handleShareChallenge = async (item: CompletedChallengeItem) => {
    try {
      const periodName = item.period === 'PM' ? 'Tarde 🌙' : 'Mañana ☀️';
      await Share.share({
        message: `🎯 ¡Reto de Hobi completado (${item.challenge_date} - ${periodName})!\n\n"${item.challenge}"\n\n✨ Hecho con Hobi App • Construyendo mejores hábitos cada día.`,
      });
    } catch {
      // ignore
    }
  };

  const handleCopyChallenge = async (item: CompletedChallengeItem) => {
    await Clipboard.setStringAsync(
      `🎯 Reto superado: "${item.challenge}" (${item.challenge_date}) #HobiApp`
    );
    showAlert({
      title: '¡Copiado!',
      message: 'Texto del reto copiado al portapapeles listo para compartir.',
      type: 'success',
    });
  };

  const isFitCharacter = streakCount >= 5;

  return (
    <View style={styles.container}>
      {/* Círculo decorativo ambiental */}
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
          {/* Cabecera superior con botones de acción */}
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.topIconButton, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => router.push('/hobbies')}>
              <Ionicons name="heart" size={16} color="#6F4E37" />
              <ThemedText style={styles.topIconText}>{t('hobbiesBtn')}</ThemedText>
            </Pressable>

            <View style={styles.topBarRight}>
              <Pressable
                style={({ pressed }) => [styles.passportButton, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => setIsPassportOpen(true)}>
                <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                <ThemedText style={styles.passportButtonText}>Tarjeta Social</ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.hamburgerButton, { opacity: pressed ? 0.75 : 1 }]}
                onPress={() => router.push('/settings')}>
                <Ionicons name="settings-outline" size={19} color="#1F1F1F" />
              </Pressable>
            </View>
          </View>

          {/* Tarjeta de Perfil Heroica y Estética */}
          <View style={styles.profileHeroCard}>
            <View style={styles.heroBackgroundAccent} />

            <View style={styles.heroHeaderRow}>
              {/* Avatar con Mascota Hobi Badge */}
              <View style={styles.avatarContainer}>
                <View style={styles.outerRing}>
                  <View style={styles.innerCircle}>
                    <Ionicons name="person" size={38} color="#FFFFFF" />
                  </View>
                </View>

                {/* Mascota Hobi saliendo sutilmente del avatar */}
                <Image
                  source={
                    isFitCharacter
                      ? require('@/assets/images/hobiCharacterFit.png')
                      : require('@/assets/images/hobiCharacter.png')
                  }
                  style={styles.mascotAvatarBadge}
                  contentFit="contain"
                />
              </View>

              <View style={styles.heroInfoColumn}>
                <View style={styles.rankBadge}>
                  <ThemedText style={styles.rankBadgeText}>{explorerRank.badge}</ThemedText>
                  <ThemedText style={styles.rankTitleText}>{explorerRank.title}</ThemedText>
                </View>

                <ThemedText style={styles.userName}>{displayName}</ThemedText>
                <ThemedText style={styles.userEmail}>
                  {userEmail || 'explorador@hobi.app'}
                </ThemedText>
              </View>
            </View>

            {/* Micro banner motivacional para captura */}
            <View style={styles.mottoPill}>
              <Ionicons name="sparkles" size={13} color="#6F4E37" />
              <ThemedText style={styles.mottoText}>
                {streakCount >= 5
                  ? '¡Modo Titán activado! Transformando constancia en poder 🔥'
                  : 'Cada pequeño paso de hoy construye tu mejor versión 🌱'}
              </ThemedText>
            </View>
          </View>

          {/* Estadísticas Trío (Racha, Retos, Nivel) */}
          <View style={styles.statsContainer}>
            {/* Racha */}
            <View style={[styles.statBox, styles.statBoxStreak]}>
              <View style={styles.statIconBadgeStreak}>
                <Ionicons name="flame" size={22} color="#FF5722" />
              </View>
              <ThemedText style={styles.statMainNumber}>{streakCount}</ThemedText>
              <ThemedText style={styles.statSubtitle}>
                {streakCount === 1 ? t('day') : t('days')} de Racha
              </ThemedText>
            </View>

            {/* Retos Superados */}
            <View style={[styles.statBox, styles.statBoxChallenges]}>
              <View style={styles.statIconBadgeChallenges}>
                <Ionicons name="trophy" size={20} color="#D97706" />
              </View>
              <ThemedText style={styles.statMainNumberChallenges}>{challenges.length}</ThemedText>
              <ThemedText style={styles.statSubtitle}>Retos Superados</ThemedText>
            </View>

            {/* Nivel de Explorador */}
            <View style={[styles.statBox, styles.statBoxLevel]}>
              <View style={styles.statIconBadgeLevel}>
                <Ionicons name="shield-checkmark" size={20} color="#6F4E37" />
              </View>
              <ThemedText style={styles.statMainNumberLevel}>Nv. {explorerRank.level}</ThemedText>
              <ThemedText style={styles.statSubtitle}>Constancia</ThemedText>
            </View>
          </View>

          {/* Tarjeta de Donación Ko-fi Estilizada */}
          <Pressable
            style={({ pressed }) => [
              styles.donateCard,
              { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
            ]}
            onPress={handleDonate}>
            <View style={styles.donateIconBox}>
              <Ionicons name="cafe" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.donateInfo}>
              <ThemedText style={styles.donateTitle}>{t('inviteCoffee')}</ThemedText>
              <ThemedText style={styles.donateSubtitle}>{t('supportKoFi')}</ThemedText>
            </View>
            <View style={styles.donateArrow}>
              <Ionicons name="heart" size={14} color="#FF5722" />
              <Ionicons name="chevron-forward" size={14} color="#6F4E37" />
            </View>
          </Pressable>

          {/* Sección de Galería de Conquistas */}
          <View style={styles.gallerySection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <ThemedText style={styles.sectionTitle}>
                  {t('completedChallengesTitle')} 📸
                </ThemedText>
                <ThemedText style={styles.sectionSubtitle}>
                  {challenges.length} {challenges.length === 1 ? t('memory') : t('memories')}{' '}
                  guardados
                </ThemedText>
              </View>

              {/* Filtros de período */}
              <View style={styles.filterPillsContainer}>
                {(['ALL', 'AM', 'PM'] as FilterPeriod[]).map((f) => (
                  <Pressable
                    key={f}
                    style={[
                      styles.filterPill,
                      activeFilter === f && styles.filterPillActive,
                    ]}
                    onPress={() => setActiveFilter(f)}>
                    <ThemedText
                      style={[
                        styles.filterPillText,
                        activeFilter === f && styles.filterPillTextActive,
                      ]}>
                      {f === 'ALL' ? 'Todos' : f === 'AM' ? '☀️ AM' : '🌙 PM'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#6F4E37" />
              </View>
            ) : filteredChallenges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="camera-outline" size={34} color="#6F4E37" />
                </View>
                <ThemedText style={styles.emptyTitle}>
                  {activeFilter === 'ALL' ? t('emptyGalleryTitle') : 'Sin fotos en este turno'}
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  {activeFilter === 'ALL'
                    ? t('emptyGallerySubtitle')
                    : 'Completa un reto en este horario para coleccionar tu recuerdo fotográfico.'}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.galleryGrid}>
                {filteredChallenges.map((item) => (
                  <Pressable
                    key={item.id || `${item.challenge_date}-${item.period}`}
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

                    {/* Gradient Overlay & Glass Chip */}
                    <View style={styles.photoOverlay}>
                      <View style={styles.photoDateBadge}>
                        <Ionicons
                          name={item.period === 'PM' ? 'moon' : 'sunny'}
                          size={11}
                          color="#FFD166"
                        />
                        <ThemedText style={styles.photoDateText}>
                          {item.challenge_date}
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

      {/* ========================================================================= */}
      {/* MODAL 1: HISTORIA DE RETO COMPLETO (STORY / POLAROID SCREENSHOT READY)   */}
      {/* ========================================================================= */}
      <Modal
        visible={Boolean(selectedItem)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedItem(null)} />
          {selectedItem && (
            <View style={styles.storyCardContainer}>
              {/* Botón de cierre */}
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={20} color="#1F1F1F" />
              </Pressable>

              {/* Header de la Tarjeta Story */}
              <View style={styles.storyHeader}>
                <View style={styles.storyBrandRow}>
                  <View style={styles.storyBrandIcon}>
                    <Ionicons name="flame" size={16} color="#FFFFFF" />
                  </View>
                  <View>
                    <ThemedText style={styles.storyBrandName}>HOBI CHALLENGE</ThemedText>
                    <ThemedText style={styles.storyUserTag}>@{displayName}</ThemedText>
                  </View>
                </View>

                <View style={styles.storyVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <ThemedText style={styles.storyVerifiedText}>Verificado</ThemedText>
                </View>
              </View>

              {/* Imagen Central con Aspecto Fotográfico Premium */}
              <View style={styles.storyImageFrame}>
                <Image
                  source={{ uri: selectedItem.photo_url }}
                  style={styles.storyMainImage}
                  contentFit="cover"
                />
                <View style={styles.storyImageTag}>
                  <ThemedText style={styles.storyImageTagText}>
                    {selectedItem.period === 'PM' ? '🌙 Turno Tarde' : '☀️ Turno Mañana'} •{' '}
                    {selectedItem.challenge_date}
                  </ThemedText>
                </View>
              </View>

              {/* Bloque de Reto Superado */}
              <View style={styles.storyPromptBox}>
                <ThemedText style={styles.storyQuoteIcon}>“</ThemedText>
                <ThemedText style={styles.storyChallengeText}>
                  {selectedItem.challenge}
                </ThemedText>
              </View>

              {/* Barra de Acciones para Redes Sociales */}
              <View style={styles.storyActionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.storyShareBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => handleShareChallenge(selectedItem)}>
                  <Ionicons name="share-social" size={17} color="#FFFFFF" />
                  <ThemedText style={styles.storyShareBtnText}>Compartir</ThemedText>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.storyCopyBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => handleCopyChallenge(selectedItem)}>
                  <Ionicons name="copy-outline" size={17} color="#6F4E37" />
                  <ThemedText style={styles.storyCopyBtnText}>Copiar</ThemedText>
                </Pressable>
              </View>

              <ThemedText style={styles.storyWatermark}>
                ✨ Retos diarios que construyen tu mejor versión • hobi.app
              </ThemedText>
            </View>
          )}
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: TARJETA DE EXPLORADOR HOBI (PASSPORT DE PERFIL PARA STORIES)     */}
      {/* ========================================================================= */}
      <Modal
        visible={isPassportOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsPassportOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsPassportOpen(false)} />
          <View style={styles.passportCard}>
            {/* Cierre */}
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setIsPassportOpen(false)}>
              <Ionicons name="close" size={20} color="#1F1F1F" />
            </Pressable>

            {/* Cabecera Passport */}
            <View style={styles.passportHeader}>
              <View style={styles.passportSeal}>
                <Ionicons name="sparkles" size={16} color="#FFD166" />
                <ThemedText style={styles.passportSealText}>PASAPORTE HOBI</ThemedText>
              </View>
              <ThemedText style={styles.passportIdText}>ID: {displayName.toUpperCase()}</ThemedText>
            </View>

            {/* Avatar Central Hero con Mascota */}
            <View style={styles.passportProfileSection}>
              <View style={styles.passportAvatarWrapper}>
                <View style={styles.passportAvatarCircle}>
                  <Ionicons name="person" size={44} color="#FFFFFF" />
                </View>
                <Image
                  source={
                    isFitCharacter
                      ? require('@/assets/images/hobiCharacterFit.png')
                      : require('@/assets/images/hobiCharacter.png')
                  }
                  style={styles.passportMascotImg}
                  contentFit="contain"
                />
              </View>

              <ThemedText style={styles.passportName}>{displayName}</ThemedText>
              <View style={styles.passportRankPill}>
                <ThemedText style={styles.passportRankText}>{explorerRank.title}</ThemedText>
              </View>
            </View>

            {/* Cuadrícula de Conquistas */}
            <View style={styles.passportStatsGrid}>
              <View style={styles.passportStatCell}>
                <ThemedText style={styles.passportStatVal}>🔥 {streakCount}</ThemedText>
                <ThemedText style={styles.passportStatLbl}>Días de Racha</ThemedText>
              </View>
              <View style={styles.passportStatCell}>
                <ThemedText style={styles.passportStatVal}>🎯 {challenges.length}</ThemedText>
                <ThemedText style={styles.passportStatLbl}>Retos Hechos</ThemedText>
              </View>
              <View style={styles.passportStatCell}>
                <ThemedText style={styles.passportStatVal}>⭐ Nivel {explorerRank.level}</ThemedText>
                <ThemedText style={styles.passportStatLbl}>Constancia</ThemedText>
              </View>
            </View>

            {/* Cita de Inspiración */}
            <View style={styles.passportQuoteBox}>
              <ThemedText style={styles.passportQuoteText}>
                “No se trata de ser perfecto, se trata de presentarse cada día.”
              </ThemedText>
            </View>

            {/* Botón de Compartir */}
            <Pressable
              style={({ pressed }) => [
                styles.passportShareButton,
                { opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleSharePassport}>
              <Ionicons name="share-social" size={18} color="#FFFFFF" />
              <ThemedText style={styles.passportShareButtonText}>
                Compartir en Redes Sociales
              </ThemedText>
            </Pressable>

            <ThemedText style={styles.passportFooterBrand}>
              Hobi App • Tu compañero diario de hábitos
            </ThemedText>
          </View>
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
    opacity: 0.1,
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
    gap: Spacing.three + 2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  topIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F2ED',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  topIconText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F4E37',
  },
  passportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6F4E37',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 1,
    borderRadius: BorderRadius.full,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  passportButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  hamburgerButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  profileHeroCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#EFEBE6',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackgroundAccent: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(111, 78, 55, 0.05)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarContainer: {
    position: 'relative',
    width: 86,
    height: 86,
  },
  outerRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#EAE6E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotAvatarBadge: {
    position: 'absolute',
    bottom: -6,
    right: -8,
    width: 44,
    height: 44,
    zIndex: 5,
  },
  heroInfoColumn: {
    flex: 1,
    gap: 3,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0EBE3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5DED4',
  },
  rankBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6F4E37',
    letterSpacing: 0.6,
  },
  rankTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B2314',
  },
  userName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1F1F1F',
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  mottoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 1,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EFEBE6',
  },
  mottoText: {
    fontSize: 12,
    color: '#6F4E37',
    fontWeight: '600',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    gap: 4,
  },
  statBoxStreak: {
    backgroundColor: '#FFF2EC',
    borderColor: '#FFD4C2',
  },
  statBoxChallenges: {
    backgroundColor: '#FEF9EE',
    borderColor: '#FDE6B0',
  },
  statBoxLevel: {
    backgroundColor: '#F7F5F2',
    borderColor: '#EAE5DE',
  },
  statIconBadgeStreak: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE2D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statIconBadgeChallenges: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEEFCB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statIconBadgeLevel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAE4DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statMainNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF5722',
    letterSpacing: -0.5,
  },
  statMainNumberChallenges: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: -0.5,
  },
  statMainNumberLevel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#6F4E37',
    letterSpacing: -0.5,
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C746C',
    textAlign: 'center',
  },
  donateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F5',
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#FFE3D6',
    gap: Spacing.three,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  donateIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donateInfo: {
    flex: 1,
    gap: 2,
  },
  donateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  donateSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  donateArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FFE3D6',
  },
  gallerySection: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F1F1F',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 1,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F5F2ED',
    padding: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  filterPillActive: {
    backgroundColor: '#6F4E37',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A736B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: '#FAF8F5',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EFEBE6',
    gap: Spacing.two,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.three,
  },
  photoCardWrapper: {
    width: '48%',
    height: 190,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    backgroundColor: '#E8E5E1',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  photoCardImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  photoDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 15, 15, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  photoDateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ========================================================================= */
  /* ESTILOS DE MODAL / STORY / POLAROID                                        */
  /* ========================================================================= */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  storyCardContainer: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: Spacing.three + 2,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 30,
    backgroundColor: '#F5F2ED',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 40,
  },
  storyBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storyBrandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBrandName: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6F4E37',
    letterSpacing: 0.8,
  },
  storyUserTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  storyVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  storyVerifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  storyImageFrame: {
    width: '100%',
    height: 290,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  storyMainImage: {
    width: '100%',
    height: '100%',
  },
  storyImageTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  storyImageTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyPromptBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#EFEBE6',
    position: 'relative',
  },
  storyQuoteIcon: {
    position: 'absolute',
    top: -4,
    left: 8,
    fontSize: 24,
    color: '#6F4E37',
    fontWeight: '900',
    opacity: 0.3,
  },
  storyChallengeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D1B13',
    lineHeight: 20,
    paddingLeft: 12,
  },
  storyActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  storyShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6F4E37',
    paddingVertical: Spacing.two + 3,
    borderRadius: BorderRadius.medium,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  storyShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  storyCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5F2ED',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 3,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  storyCopyBtnText: {
    color: '#6F4E37',
    fontSize: 14,
    fontWeight: '700',
  },
  storyWatermark: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
  },

  /* ========================================================================= */
  /* ESTILOS DE PASAPORTE SOCIAL (MODAL 2)                                     */
  /* ========================================================================= */
  passportCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#26160F',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 16,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#6F4E37',
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: Spacing.two,
  },
  passportSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passportSealText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFD166',
    letterSpacing: 1,
  },
  passportIdText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
  },
  passportProfileSection: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
  },
  passportAvatarWrapper: {
    position: 'relative',
    width: 90,
    height: 90,
  },
  passportAvatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#6F4E37',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFD166',
  },
  passportMascotImg: {
    position: 'absolute',
    bottom: -6,
    right: -10,
    width: 48,
    height: 48,
  },
  passportName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  passportRankPill: {
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.4)',
  },
  passportRankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD166',
  },
  passportStatsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passportStatCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  passportStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  passportStatLbl: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '700',
  },
  passportQuoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: BorderRadius.medium,
    padding: Spacing.two + 2,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5722',
  },
  passportQuoteText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontStyle: 'italic',
    lineHeight: 17,
  },
  passportShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5722',
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.medium,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  passportShareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  passportFooterBrand: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontWeight: '600',
  },
});
