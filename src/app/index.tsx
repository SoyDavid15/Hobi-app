import { Platform, StyleSheet, ScrollView, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { ChallengeService } from '@/services/challenges';

export default function HomeScreen() {
  const [completed, setCompleted] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    let active = true;

    const loadChallenge = async () => {
      const { challenge, error } = await ChallengeService.getChallenge();
      if (!active) return;
      setChallenge(challenge);
      setChallengeError(error);
    };

    loadChallenge();
    return () => {
      active = false;
    };
  }, []);

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

      {/* Reto Diario en la zona inferior café */}
      <View style={[styles.challengeFooter, { bottom: height * 0.18 - 15 }]}>
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>Reto diario</ThemedText>
        </View>
        <ThemedText style={styles.challengeTitle}>
          {challenge ?? (challengeError ? 'No pudimos cargar tu reto. Intenta de nuevo.' : 'Cargando tu reto...')}
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: completed ? 'rgba(255, 255, 255, 0.9)' : '#FFFFFF', opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => setCompleted(!completed)}>
          <ThemedText style={styles.actionButtonText}>
            {completed ? '¡Completado!' : 'Hecho'}
          </ThemedText>
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
  },
  actionButtonText: {
    color: '#6F4E37',
    fontSize: 16,
    fontWeight: '700',
  },
});
