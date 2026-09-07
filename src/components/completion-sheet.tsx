import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing, BorderRadius } from '@/constants/theme';

interface CompletionSheetProps {
  visible: boolean;
  message: string;
  streak: number;
  onAccept: () => void;
}

export function CompletionSheet({
  visible,
  message,
  streak,
  onAccept,
}: CompletionSheetProps) {
  const [slideAnim] = useState(() => new Animated.Value(300));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onAccept}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onAccept} />

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              width: '100%',
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <View style={styles.indicatorBar} />

            {/* Icono de éxito */}
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={28} color="#6F4E37" />
            </View>

            {/* Título */}
            <ThemedText style={styles.title}>¡Reto completado! 🎉</ThemedText>

            {/* Insignia de Racha */}
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#FF5722" />
              <ThemedText style={styles.streakText}>
                {streak === 1 ? '¡Llevas 1 día de racha!' : `¡Llevas ${streak} días de racha!`}
              </ThemedText>
            </View>

            {/* Mensaje motivacional */}
            <ThemedText style={styles.motivationalMessage}>{message}</ThemedText>

            {/* Botón Aceptar */}
            <Pressable
              style={({ pressed }) => [
                styles.acceptButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={onAccept}>
              <ThemedText style={styles.acceptButtonText}>Aceptar</ThemedText>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EAE6E1',
    zIndex: 10,
  },
  indicatorBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1C8BC',
    marginBottom: Spacing.two,
  },
  safeArea: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3EAE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.half,
    borderWidth: 1.5,
    borderColor: '#E2D3C3',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1F1F',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD8CC',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half + 2,
    borderRadius: BorderRadius.full,
    marginVertical: Spacing.half,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C63D0F',
  },
  motivationalMessage: {
    fontSize: 15,
    color: '#6B655E',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.two,
  },
  acceptButton: {
    width: '100%',
    backgroundColor: '#6F4E37',
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
