import { Platform, StyleSheet, ScrollView, View, Pressable, useWindowDimensions, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { CompletionSheet } from '@/components/completion-sheet';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { ChallengeService, getCurrentSlot, type ChallengePeriod } from '@/services/challenges';
import { calculateStreak } from '@/lib/streak';
import { getRandomMotivationalMessage } from '@/lib/motivation';
import { useAlert } from '@/context/AlertContext';

const HOBI_CHARACTER = require('@/assets/images/hobiCharacter.png');
const HOBI_CHARACTER_FIT = require('@/assets/images/hobiCharacterFit.png');

export default function HomeScreen() {
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ChallengePeriod>(getCurrentSlot().period);
  const [showCompletion, setShowCompletion] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0);
  const lastSlotRef = useRef<string>('');
  const { width, height } = useWindowDimensions();
  const { showAlert } = useAlert();

  const loadChallenge = useCallback(async () => {
    const { date: slotDate, period: slotPeriod } = getCurrentSlot();
    const slotKey = `${slotDate}:${slotPeriod}`;

    // Avoid reloading the same slot
    if (lastSlotRef.current === slotKey) return;
    lastSlotRef.current = slotKey;

    setPeriod(slotPeriod);
    setChallenge(null);
    setChallengeError(null);
    setCompleted(false);

    const result = await ChallengeService.getChallenge();
    setChallenge(result.challenge);
    setCompleted(result.isCompleted);
    setChallengeError(result.error);
    setPeriod(result.period);

    // Cargar la racha activa para intercambiar el personaje (versión "fit" con racha > 5 días).
    // En caso de error, se muestra el personaje normal (fallback seguro).
    try {
      const dates = await ChallengeService.getCompletedDates();
      setCurrentStreak(calculateStreak(dates));
    } catch {
      setCurrentStreak(0);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChallenge();
  }, [loadChallenge]);

  // Auto-reload when the app comes back to foreground (period might have changed)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const { date: slotDate, period: slotPeriod } = getCurrentSlot();
        const slotKey = `${slotDate}:${slotPeriod}`;
        if (lastSlotRef.current !== slotKey) {
          lastSlotRef.current = ''; // force reload
          loadChallenge();
        }
      }
    });
    return () => sub.remove();
  }, [loadChallenge]);

  // Auto-reload at the next slot boundary (12:00 or 00:00) even if the app stays in foreground
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const scheduleNextBoundary = () => {
      const now = new Date();
      const next = new Date(now);
      if (now.getHours() < 12) {
        next.setHours(12, 0, 0, 0);
      } else {
        next.setDate(now.getDate() + 1);
        next.setHours(0, 0, 0, 0);
      }
      const ms = next.getTime() - now.getTime();
      timer = setTimeout(() => {
        if (cancelled) return;
        lastSlotRef.current = ''; // force reload
        loadChallenge();
        scheduleNextBoundary(); // re-arm for the following boundary
      }, ms + 1000);
    };

    scheduleNextBoundary();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [loadChallenge]);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Permiso requerido',
          message: 'Se necesita acceso a la cámara para tomar la foto de tu reto diario.',
          type: 'warning',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setSubmitting(true);

      const { success, error } = await ChallengeService.completeChallenge(
        asset.uri,
        asset.base64,
        undefined,
        challenge
      );

      if (success) {
        setCompleted(true);
        try {
          const dates = await ChallengeService.getCompletedDates();
          const today = getCurrentSlot().date;
          if (!dates.includes(today)) {
            dates.push(today);
          }
          const streak = calculateStreak(dates);
          setCurrentStreak(Math.max(streak, 1));
          setMotivationalMessage(getRandomMotivationalMessage());
          setShowCompletion(true);
        } catch {
          setCurrentStreak(1);
          setMotivationalMessage(getRandomMotivationalMessage());
          setShowCompletion(true);
        }
      } else {
        showAlert({
          title: 'Verificación de IA',
          message: error || 'La foto no cumple con el reto indicado por la IA. Inténtalo de nuevo.',
          type: 'error',
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err?.message || 'Ocurrió un problema al procesar la foto.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const periodLabel = period === 'AM' ? 'Mañana' : 'Tarde';
  const periodIcon = period === 'AM' ? '☀️' : '🌙';
  const challengeReady = challenge !== null;

  const handleRetryLoad = () => {
    if (!challengeError) return;
    lastSlotRef.current = ''; // bypass same-slot guard
    loadChallenge();
  };

  const handlePressHecho = () => {
    if (completed) {
      showAlert({
        title: '¡Reto completado!',
        message: `Ya registraste tu evidencia del turno de la ${periodLabel.toLowerCase()}. ¡Bien hecho!`,
        type: 'success',
      });
      return;
    }
    if (submitting || !challengeReady) return;

    takePhoto();
  };

  return (
    <View style={styles.container}>
      {/* Elementos de fondo ambiental y decorativo */}
      <View style={styles.ambientGlow} />

      {/* Círculo gigante café en la inferior del fondo (200% ancho horizontal, centrado, y mitad vertical) */}
      <View
        style={[
          styles.bottomCircle,
          {
            width: width * 2,
            left: '-50%',
            height: height * 0.5,
            borderTopLeftRadius: width,
            borderTopRightRadius: width,
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea}>
          {/* Cabecera: Hola, soy Hobi */}
          <View style={styles.header}>
            <ThemedText style={styles.subGreeting}>Hola, soy</ThemedText>
            <ThemedText style={styles.mainTitle}>Hobi</ThemedText>
          </View>

          {/* Personaje Hobi (versión "fit" cuando la racha supera los 5 días) */}
          <View style={styles.characterContainer}>
            <Image
              source={currentStreak > 5 ? HOBI_CHARACTER_FIT : HOBI_CHARACTER}
              style={styles.characterImage}
              contentFit="contain"
              transition={250}
            />
          </View>

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>

      {/* Reto del turno actual en la zona inferior café */}
      <View style={[styles.challengeFooter, { bottom: height * 0.12 }]}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{periodIcon} Reto de la {periodLabel.toLowerCase()}</ThemedText>
        </View>
        <Pressable disabled={!challengeError} onPress={handleRetryLoad}>
          <ThemedText style={[styles.challengeTitle, challengeError ? styles.challengeTitleError : null]}>
            {challenge ?? (challengeError ? 'No pudimos cargar tu reto. Intenta de nuevo.' : 'Cargando tu reto...')}
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: completed ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
              opacity: completed ? 1 : (pressed || submitting || !challengeReady ? 0.85 : 1),
            },
          ]}
          disabled={completed || submitting || !challengeReady}
          onPress={handlePressHecho}>
          {submitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6F4E37" />
              <ThemedText style={styles.actionButtonText}>Guardando evidencia...</ThemedText>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              {completed ? (
                <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
              ) : (
                <Ionicons name="camera" size={20} color="#6F4E37" />
              )}
              <ThemedText
                style={[
                  styles.actionButtonText,
                  completed && { color: '#2E7D32' },
                ]}>
                {completed ? '¡Completado!' : 'Hecho'}
              </ThemedText>
            </View>
          )}
        </Pressable>
      </View>

      <CompletionSheet
        visible={showCompletion}
        message={motivationalMessage}
        streak={currentStreak}
        onAccept={() => setShowCompletion(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F3EAE0',
    opacity: 0.7,
    zIndex: 0,
  },
  bottomCircle: {
    position: 'absolute',
    bottom: -50,
    backgroundColor: '#6F4E37',
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: 220,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.five,
  },
  subGreeting: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1F1F1F',
    letterSpacing: -0.5,
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    paddingVertical: Spacing.one,
  },
  characterImage: {
    width: 220,
    height: 220,
  },
  challengeFooter: {
    position: 'absolute',
    bottom: Spacing.four,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    zIndex: 2,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half + 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: Spacing.one,
  },
  challengeTitleError: {
    textDecorationLine: 'underline',
  },
  actionButton: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  actionButtonText: {
    color: '#6F4E37',
    fontSize: 16,
    fontWeight: '700',
  },
});
