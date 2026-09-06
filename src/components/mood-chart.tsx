import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { MoodEntry, MoodId, MoodStats, TimeRange } from '@/types/mood';
import { MOOD_MAP, MOOD_OPTIONS } from '@/constants/moods';

interface MoodChartProps {
  stats: MoodStats;
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  entries?: MoodEntry[];
}

export function MoodChart({
  stats,
  selectedRange,
  onRangeChange,
  entries = [],
}: MoodChartProps) {
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  const dominantMoodObj = stats.dominantMood ? MOOD_MAP[stats.dominantMood] : null;

  const maxChartHeight = 140;

  return (
    <View style={styles.container}>
      {/* Header con selector de período (Semana, Mes, Año, Todo) */}
      <View style={styles.periodSelector}>
        <Pressable
          style={[styles.periodTab, selectedRange === 'week' && styles.periodTabActive]}
          onPress={() => {
            setSelectedBarIndex(null);
            onRangeChange('week');
          }}>
          <ThemedText
            style={[styles.periodTabText, selectedRange === 'week' && styles.periodTabTextActive]}>
            Semana
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.periodTab, selectedRange === 'month' && styles.periodTabActive]}
          onPress={() => {
            setSelectedBarIndex(null);
            onRangeChange('month');
          }}>
          <ThemedText
            style={[styles.periodTabText, selectedRange === 'month' && styles.periodTabTextActive]}>
            Mes
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.periodTab, selectedRange === 'year' && styles.periodTabActive]}
          onPress={() => {
            setSelectedBarIndex(null);
            onRangeChange('year');
          }}>
          <ThemedText
            style={[styles.periodTabText, selectedRange === 'year' && styles.periodTabTextActive]}>
            Año
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.periodTab, selectedRange === 'all' && styles.periodTabActive]}
          onPress={() => {
            setSelectedBarIndex(null);
            onRangeChange('all');
          }}>
          <ThemedText
            style={[styles.periodTabText, selectedRange === 'all' && styles.periodTabTextActive]}>
            Todo
          </ThemedText>
        </Pressable>
      </View>

      {/* Tarjetas de Métricas Resumen */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="sparkles" size={14} color="#6F4E37" />
            <ThemedText style={styles.metricLabel}>Positividad</ThemedText>
          </View>
          <ThemedText style={styles.metricValue}>{stats.positivityRate}%</ThemedText>
          <ThemedText style={styles.metricSub}>Días positivos</ThemedText>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="flame" size={14} color="#FF5722" />
            <ThemedText style={styles.metricLabel}>Racha</ThemedText>
          </View>
          <ThemedText style={styles.metricValue}>
            {stats.currentStreak} {stats.currentStreak === 1 ? 'día' : 'días'}
          </ThemedText>
          <ThemedText style={styles.metricSub}>De registro diario</ThemedText>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Ionicons name="heart" size={14} color="#E91E63" />
            <ThemedText style={styles.metricLabel}>Frecuente</ThemedText>
          </View>
          <ThemedText style={styles.metricValue}>
            {dominantMoodObj ? `${dominantMoodObj.emoji} ${dominantMoodObj.label}` : '—'}
          </ThemedText>
          <ThemedText style={styles.metricSub}>Estado dominante</ThemedText>
        </View>
      </View>

      {/* Gráfico Principal */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <ThemedText style={styles.chartTitle}>
              {selectedRange === 'week' && 'Evolución de la Semana'}
              {selectedRange === 'month' && 'Tendencia del Mes'}
              {selectedRange === 'year' && 'Promedio Mensual del Año'}
              {selectedRange === 'all' && 'Historial Completo'}
            </ThemedText>
            <ThemedText style={styles.chartSubtitle}>
              Promedio: {stats.averageScore > 0 ? `${stats.averageScore}/5.0` : 'Sin datos'}
            </ThemedText>
          </View>
          <View style={styles.chartLegend}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <ThemedText style={styles.legendText}>Excelente</ThemedText>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <ThemedText style={styles.legendText}>Bien</ThemedText>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <ThemedText style={styles.legendText}>Bajo</ThemedText>
          </View>
        </View>

        {/* Líneas guía de fondo */}
        <View style={styles.barsContainerWrapper}>
          <View style={styles.gridLinesContainer}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          {/* Barras dinámicas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.barsScrollView}>
            {stats.trendData.map((item, index) => {
              const isSelected = selectedBarIndex === index;
              const hasScore = item.score > 0;
              const heightPercent = hasScore ? Math.min(100, Math.max(18, (item.score / 5) * 100)) : 8;
              const barHeight = (heightPercent / 100) * maxChartHeight;

              // Color determination
              let barColor = '#EAE6E1';
              if (item.moodId && MOOD_MAP[item.moodId]) {
                barColor = MOOD_MAP[item.moodId].color;
              } else if (item.score >= 4.0) {
                barColor = '#10B981';
              } else if (item.score >= 3.0) {
                barColor = '#3B82F6';
              } else if (item.score >= 2.0) {
                barColor = '#F59E0B';
              } else if (item.score > 0) {
                barColor = '#EF4444';
              }

              return (
                <Pressable
                  key={`bar-${item.label}-${index}`}
                  style={[styles.barCol, isSelected && styles.barColActive]}
                  onPress={() => setSelectedBarIndex(isSelected ? null : index)}>
                  {/* Tooltip flotante al tocar una barra */}
                  {isSelected && (
                    <View style={styles.tooltip}>
                      <ThemedText style={styles.tooltipText}>
                        {item.moodId && MOOD_MAP[item.moodId]
                          ? `${MOOD_MAP[item.moodId].emoji} ${MOOD_MAP[item.moodId].label}`
                          : item.score > 0
                          ? `⭐ ${item.score}/5`
                          : 'Sin registro'}
                      </ThemedText>
                    </View>
                  )}

                  {/* Icono de emoji superior en vista semanal */}
                  <View style={styles.barTopIcon}>
                    {item.moodId && MOOD_MAP[item.moodId] ? (
                      <ThemedText style={styles.barEmoji}>
                        {MOOD_MAP[item.moodId].emoji}
                      </ThemedText>
                    ) : hasScore ? (
                      <ThemedText style={styles.barScoreText}>{item.score}</ThemedText>
                    ) : (
                      <View style={styles.barEmptyDot} />
                    )}
                  </View>

                  {/* La barra visual */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                          opacity: hasScore ? (isSelected ? 1 : 0.88) : 0.25,
                        },
                      ]}
                    />
                  </View>

                  {/* Etiquetas inferiores */}
                  <ThemedText style={[styles.barLabel, isSelected && styles.barLabelActive]}>
                    {item.label}
                  </ThemedText>
                  {item.subLabel ? (
                    <ThemedText style={styles.barSubLabel}>{item.subLabel}</ThemedText>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Desglose de Distribución de Ánimo */}
      <View style={styles.distributionCard}>
        <ThemedText style={styles.distributionTitle}>Distribución de Estados</ThemedText>
        <ThemedText style={styles.distributionSubtitle}>
          Frecuencia de cada estado de ánimo en este período
        </ThemedText>

        <View style={styles.distributionList}>
          {MOOD_OPTIONS.map((mood) => {
            const count = stats.distribution[mood.id] || 0;
            const percentage = stats.totalLogs > 0 ? Math.round((count / stats.totalLogs) * 100) : 0;

            return (
              <View key={mood.id} style={styles.distRow}>
                <View style={styles.distLeft}>
                  <ThemedText style={styles.distEmoji}>{mood.emoji}</ThemedText>
                  <ThemedText style={styles.distLabel}>{mood.label}</ThemedText>
                </View>

                <View style={styles.distBarTrack}>
                  <View
                    style={[
                      styles.distBarFill,
                      {
                        width: `${Math.max(percentage > 0 ? 6 : 0, percentage)}%`,
                        backgroundColor: mood.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.distRight}>
                  <ThemedText style={styles.distCount}>{count}</ThemedText>
                  <ThemedText style={styles.distPercent}>{percentage}%</ThemedText>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Historial Reciente de Registros */}
      {entries.length > 0 && (
        <View style={styles.historyCard}>
          <ThemedText style={styles.historyTitle}>Registros Recientes</ThemedText>
          <View style={styles.historyList}>
            {entries
              .slice()
              .reverse()
              .slice(0, 5)
              .map((entry) => {
                const moodObj = MOOD_MAP[entry.mood];
                const [y, m, d] = entry.date.split('-');
                const formattedDate = `${d}/${m}/${y}`;

                return (
                  <View key={entry.id} style={styles.historyItem}>
                    <View style={[styles.historyIconBox, { backgroundColor: moodObj.bgLight }]}>
                      <ThemedText style={styles.historyEmoji}>{moodObj.emoji}</ThemedText>
                    </View>

                    <View style={styles.historyInfo}>
                      <View style={styles.historyInfoHeader}>
                        <ThemedText style={styles.historyMoodName}>{moodObj.label}</ThemedText>
                        <ThemedText style={styles.historyDate}>{formattedDate}</ThemedText>
                      </View>
                      {entry.note ? (
                        <ThemedText style={styles.historyNote} numberOfLines={1}>
                          "{entry.note}"
                        </ThemedText>
                      ) : null}
                      {entry.tags && entry.tags.length > 0 ? (
                        <View style={styles.historyTagsRow}>
                          {entry.tags.map((t, idx) => (
                            <View key={idx} style={styles.historyTagPill}>
                              <ThemedText style={styles.historyTagText}>{t}</ThemedText>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    width: '100%',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F2ED',
    borderRadius: BorderRadius.medium,
    padding: 4,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.small,
  },
  periodTabActive: {
    backgroundColor: '#6F4E37',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F4E37',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: BorderRadius.medium,
    padding: Spacing.two + 2,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    color: '#A0A0A5',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing.one,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 1,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
  },
  barsContainerWrapper: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 25,
    bottom: 35,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F0EBE6',
    width: '100%',
  },
  barsScrollView: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    minWidth: '100%',
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 38,
    paddingHorizontal: 2,
    position: 'relative',
  },
  barColActive: {
    transform: [{ scale: 1.05 }],
  },
  tooltip: {
    position: 'absolute',
    top: -24,
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.small,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  barTopIcon: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  barEmoji: {
    fontSize: 15,
  },
  barScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F4E37',
  },
  barEmptyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1CBC4',
  },
  barTrack: {
    width: 14,
    height: 100,
    backgroundColor: '#F5F2ED',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6F4E37',
    marginTop: 6,
  },
  barLabelActive: {
    color: '#1F1F1F',
    fontWeight: '900',
  },
  barSubLabel: {
    fontSize: 9,
    color: '#A0A0A5',
    fontWeight: '600',
  },
  distributionCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.two,
  },
  distributionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  distributionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: Spacing.one,
  },
  distributionList: {
    gap: Spacing.two,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  distLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 100,
  },
  distEmoji: {
    fontSize: 16,
  },
  distLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  distBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#EAE6E1',
    borderRadius: 5,
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  distRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    width: 55,
  },
  distCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  distPercent: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.two,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  historyList: {
    gap: Spacing.two,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2ED',
  },
  historyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmoji: {
    fontSize: 20,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyMoodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  historyDate: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  historyNote: {
    fontSize: 12,
    color: '#6B655E',
    fontStyle: 'italic',
  },
  historyTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  historyTagPill: {
    backgroundColor: '#F5F2ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  historyTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6F4E37',
  },
});
