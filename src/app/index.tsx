import { Platform, StyleSheet, ScrollView, View, Pressable, useWindowDimensions, Alert, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { ChallengeService, getCurrentSlot, type ChallengePeriod } from '@/services/challenges';

export default function HomeScreen() {
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [period, setPeriod] = useState<ChallengePeriod>(getCurrentSlot().period);
  const lastSlotRef = useRef<string>('');
  const { width, height } = useWindowDimensions();

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
  }, []);

  useEffect(() => {
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

  const takeOrPickPhoto = async (mode: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'Se necesita acceso a la cámara para tomar la foto de tu reto diario.'
          );
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'Se necesita acceso a tus fotos para elegir la evidencia.'
          );
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
      }

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
        Alert.alert('¡Excelente trabajo! 🎉', 'Tu foto y reto completado se guardaron con éxito.');
      } else {
        Alert.alert('Error', error || 'No se pudo guardar la evidencia. Intenta nuevamente.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Ocurrió un problema al procesar la foto.');
    } finally {
      setSubmitting(false);
    }
  };

  const periodLabel = period === 'AM' ? 'Mañana' : 'Tarde';
  const periodIcon = period === 'AM' ? '☀️' : '🌙';
  const nextChange = period === 'AM' ? '12:00 PM' : '12:00 AM';

  const handlePressHecho = () => {
    if (completed) {
      Alert.alert('¡Reto completado!', `Ya registraste tu evidencia del turno de la ${periodLabel.toLowerCase()}. ¡Bien hecho!`);
      return;
    }
    if (submitting) return;

    if (Platform.OS === 'web') {
      takeOrPickPhoto('camera');
      return;
    }

    Alert.alert(
      'Registrar Evidencia',
      '¿Cómo deseas registrar la evidencia de tu reto?',
      [
        {
          text: 'Tomar foto',
          onPress: () => takeOrPickPhoto('camera'),
        },
        {
          text: 'Elegir de galería',
          onPress: () => takeOrPickPhoto('library'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
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

          {/* Personaje Hobi */}
          <View style={styles.characterContainer}>
            <Image
              source={require('@/assets/images/hobiCharacter.png')}
              style={styles.characterImage}
              contentFit="contain"
            />
          </View>

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>

      {/* Reto del turno actual en la zona inferior café */}
      <View style={[styles.challengeFooter, { bottom: height * 0.18 - 15 }]}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>{periodIcon} Reto de la {periodLabel.toLowerCase()}</ThemedText>
        </View>
        <ThemedText style={styles.challengeTitle}>
          {challenge ?? (challengeError ? 'No pudimos cargar tu reto. Intenta de nuevo.' : 'Cargando tu reto...')}
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: completed ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
              opacity: pressed || submitting ? 0.85 : 1,
            },
          ]}
          disabled={submitting}
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
    marginTop: Spacing.two,
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
