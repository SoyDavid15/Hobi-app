import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { MoodChart } from '@/components/mood-chart';
import { MoodEntry, MoodStats, TimeRange } from '@/types/mood';

interface MoodGraphModalProps {
  visible: boolean;
  onClose: () => void;
  stats: MoodStats;
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  entries: MoodEntry[];
}

export function MoodGraphModal({
  visible,
  onClose,
  stats,
  selectedRange,
  onRangeChange,
  entries,
}: MoodGraphModalProps) {
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.contentContainer, { maxHeight: height * 0.9 }]}>
          {/* Header del Modal */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="stats-chart" size={18} color="#6F4E37" />
              </View>
              <View>
                <ThemedText style={styles.title}>Gráfico de Bienestar</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Evolución y patrones de tu estado de ánimo
                </ThemedText>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.7 : 1 }]}
              onPress={onClose}>
              <Ionicons name="close" size={20} color="#1F1F1F" />
            </Pressable>
          </View>

          {/* Contenido scrolleable con el gráfico y estadísticas */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <MoodChart
              stats={stats}
              selectedRange={selectedRange}
              onRangeChange={onRangeChange}
              entries={entries}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2ED',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F1F1F',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
});
