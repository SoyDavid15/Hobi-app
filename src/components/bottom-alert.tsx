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

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface BottomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  buttons?: AlertButton[];
  onDismiss: () => void;
}

export function BottomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onDismiss,
}: BottomAlertProps) {
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

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#2E7D32', bg: '#E8F5E9', border: '#C8E6C9' };
      case 'error':
        return { name: 'alert-circle' as const, color: '#C63D0F', bg: '#FFEBEE', border: '#FFCDD2' };
      case 'warning':
        return { name: 'warning' as const, color: '#E65100', bg: '#FFF3E0', border: '#FFE0B2' };
      default:
        return { name: 'information-circle' as const, color: '#6F4E37', bg: '#F3EAE0', border: '#E2D3C3' };
    }
  };

  const iconConfig = getIconConfig();

  const resolvedButtons = buttons && buttons.length > 0 ? buttons : [
    {
      text: 'Aceptar',
      onPress: onDismiss,
      style: 'default' as const,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropPressable} onPress={onDismiss} />

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

            <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg, borderColor: iconConfig.border }]}>
              <Ionicons name={iconConfig.name} size={30} color={iconConfig.color} />
            </View>

            <ThemedText style={styles.title}>{title}</ThemedText>

            <ThemedText style={styles.message}>{message}</ThemedText>

            <View style={styles.buttonContainer}>
              {resolvedButtons.map((btn, index) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.button,
                      resolvedButtons.length > 1 ? styles.buttonHalf : styles.buttonFull,
                      isDestructive && styles.destructiveButton,
                      isCancel && styles.cancelButton,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => {
                      if (btn.onPress) {
                        btn.onPress();
                      } else {
                        onDismiss();
                      }
                    }}>
                    <ThemedText
                      style={[
                        styles.buttonText,
                        isDestructive && styles.destructiveButtonText,
                        isCancel && styles.cancelButtonText,
                      ]}>
                      {btn.text}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.half,
    borderWidth: 1.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F1F1F',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    color: '#6B655E',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.two,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6F4E37',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonFull: {
    flex: 1,
  },
  buttonHalf: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#EAE6E1',
    shadowColor: 'transparent',
  },
  destructiveButton: {
    backgroundColor: '#D32F2F',
    shadowColor: '#D32F2F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: '#4A453F',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});
