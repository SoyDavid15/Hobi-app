import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Spacing } from '@/constants/theme';
import { MoodEntry, MoodId } from '@/types/mood';
import { MOOD_MAP, MOOD_OPTIONS, MOOD_TAGS } from '@/constants/moods';

interface MoodSelectorProps {
  todayEntry: MoodEntry | null;
  onSaveMood: (mood: MoodId, note?: string, tags?: string[]) => Promise<void>;
  onOpenGraph?: () => void;
}

export function MoodSelector({
  todayEntry,
  onSaveMood,
}: MoodSelectorProps) {
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(todayEntry?.mood || null);
  const [note, setNote] = useState<string>(todayEntry?.note || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(todayEntry?.tags || []);
  const [isEditing, setIsEditing] = useState<boolean>(!todayEntry);
  const [saving, setSaving] = useState<boolean>(false);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleSave = async () => {
    if (!selectedMood) return;
    setSaving(true);
    try {
      await onSaveMood(selectedMood, note, selectedTags);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const activeMoodObj = selectedMood ? MOOD_MAP[selectedMood] : null;

  return (
    <View style={styles.container}>
      {/* Cabecera de la sección */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.iconBadge}>
            <Ionicons name="happy" size={20} color="#6F4E37" />
          </View>
          <View>
            <ThemedText style={styles.sectionTitle}>¿Cómo te sientes hoy?</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>
              Tu bienestar emocional impulsa tus hábitos diarios
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Si ya registró y no está en modo edición */}
      {!isEditing && todayEntry && activeMoodObj ? (
        <View style={[styles.savedMoodCard, { borderColor: activeMoodObj.color }]}>
          <View style={styles.savedMoodTop}>
            <View style={[styles.moodAvatarLarge, { backgroundColor: activeMoodObj.bgLight }]}>
              <ThemedText style={styles.moodEmojiLarge}>{activeMoodObj.emoji}</ThemedText>
            </View>

            <View style={styles.savedMoodInfo}>
              <View style={styles.savedBadgeRow}>
                <View style={[styles.moodPill, { backgroundColor: activeMoodObj.color }]}>
                  <ThemedText style={styles.moodPillText}>{activeMoodObj.label}</ThemedText>
                </View>
                <ThemedText style={styles.savedTime}>Hoy registrado</ThemedText>
              </View>
              <ThemedText style={styles.moodQuote}>&ldquo;{activeMoodObj.quote}&rdquo;</ThemedText>
            </View>
          </View>

          {/* Tags o Nota si existen */}
          {(todayEntry.note || (todayEntry.tags && todayEntry.tags.length > 0)) && (
            <View style={styles.savedExtras}>
              {todayEntry.note ? (
                <ThemedText style={styles.savedNoteText}>&ldquo;{todayEntry.note}&rdquo;</ThemedText>
              ) : null}
              {todayEntry.tags && todayEntry.tags.length > 0 ? (
                <View style={styles.savedTagsRow}>
                  {todayEntry.tags.map((t, idx) => (
                    <View key={idx} style={styles.savedTagPill}>
                      <ThemedText style={styles.savedTagPillText}>{t}</ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}

          {/* Botón de acción: Cambiar estado */}
          <View style={styles.savedActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.editMoodBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={16} color="#6F4E37" />
              <ThemedText style={styles.editMoodBtnText}>Cambiar estado</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Modo Selector de Ánimo */
        <View style={styles.selectorCard}>
          <ThemedText style={styles.selectorPrompt}>
            Selecciona el estado que mejor describe tu energía:
          </ThemedText>

          {/* Grid de opciones de estado de ánimo */}
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = selectedMood === mood.id;

              return (
                <Pressable
                  key={mood.id}
                  style={({ pressed }) => [
                    styles.moodOptionButton,
                    isSelected && {
                      backgroundColor: mood.bgLight,
                      borderColor: mood.color,
                      transform: [{ scale: 1.04 }],
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => setSelectedMood(mood.id)}>
                  <View
                    style={[
                      styles.moodEmojiCircle,
                      isSelected && { backgroundColor: '#FFFFFF' },
                    ]}>
                    <ThemedText style={styles.moodOptionEmoji}>{mood.emoji}</ThemedText>
                  </View>
                  <ThemedText
                    style={[
                      styles.moodOptionLabel,
                      isSelected && { color: mood.accentColor, fontWeight: '800' },
                    ]}>
                    {mood.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Si se seleccionó un estado, mostrar detalles opcionales */}
          {selectedMood && activeMoodObj && (
            <View style={styles.expandedDetailsBox}>
              <View style={[styles.moodAdviceBanner, { backgroundColor: activeMoodObj.bgLight }]}>
                <Ionicons name="bulb-outline" size={16} color={activeMoodObj.accentColor} />
                <ThemedText
                  style={[styles.moodAdviceText, { color: activeMoodObj.accentColor }]}>
                  {activeMoodObj.quote}
                </ThemedText>
              </View>

              {/* Tags de contexto (opcional) */}
              <ThemedText style={styles.tagsLabel}>¿Qué influye en tu día? (máx 3):</ThemedText>
              <View style={styles.tagsContainer}>
                {MOOD_TAGS.map((tag) => {
                  const isTagSelected = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      style={[
                        styles.tagChip,
                        isTagSelected && styles.tagChipActive,
                      ]}
                      onPress={() => handleToggleTag(tag)}>
                      <ThemedText
                        style={[
                          styles.tagChipText,
                          isTagSelected && styles.tagChipTextActive,
                        ]}>
                        {tag}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Nota personal corta */}
              <TextInput
                style={styles.noteInput}
                placeholder="Escribe una pequeña nota o reflexión (opcional)..."
                placeholderTextColor="#A0A0A5"
                value={note}
                onChangeText={setNote}
                maxLength={100}
              />

              {/* Botón Guardar */}
              <View style={styles.actionButtonsContainer}>
                {todayEntry && (
                  <Pressable
                    style={styles.cancelEditBtn}
                    onPress={() => setIsEditing(false)}>
                    <ThemedText style={styles.cancelEditBtnText}>Cancelar</ThemedText>
                  </Pressable>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.saveMoodBtn,
                    { opacity: pressed || saving ? 0.85 : 1 },
                  ]}
                  onPress={handleSave}
                  disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <ThemedText style={styles.saveMoodBtnText}>
                        {todayEntry ? 'Actualizar mi estado' : 'Registrar mi estado'}
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F1F1F',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  graphShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F2ED',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  graphShortcutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F4E37',
  },
  savedMoodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 1.5,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  savedMoodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  moodAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'visible',
  },
  moodEmojiLarge: {
    fontSize: 38,
    lineHeight: 46,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  savedMoodInfo: {
    flex: 1,
    gap: 4,
  },
  savedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  moodPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  savedTime: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  moodQuote: {
    fontSize: 13,
    color: '#4B4B4B',
    lineHeight: 18,
    fontWeight: '600',
  },
  savedExtras: {
    backgroundColor: '#FAF8F5',
    padding: Spacing.three,
    borderRadius: BorderRadius.medium,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  savedNoteText: {
    fontSize: 13,
    color: '#1F1F1F',
    fontStyle: 'italic',
  },
  savedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  savedTagPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  savedTagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6F4E37',
  },
  savedActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  editMoodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5F2ED',
    paddingVertical: 10,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  editMoodBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F4E37',
  },
  viewStatsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6F4E37',
    paddingVertical: 10,
    borderRadius: BorderRadius.medium,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewStatsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectorCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.three,
  },
  selectorPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F4E37',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  moodOptionButton: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#EAE6E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  moodEmojiCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F2ED',
    overflow: 'visible',
  },
  moodOptionEmoji: {
    fontSize: 28,
    lineHeight: 32,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  moodOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  expandedDetailsBox: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  moodAdviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.three,
    borderRadius: BorderRadius.medium,
  },
  moodAdviceText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1F1F',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  tagChipActive: {
    backgroundColor: '#6F4E37',
    borderColor: '#6F4E37',
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B655E',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1F1F1F',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  cancelEditBtn: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.medium,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
  },
  saveMoodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6F4E37',
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveMoodBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
