import { Platform, StyleSheet, ScrollView, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { HobbyService } from '@/services/hobbies';

const HOBBIES = [
  { id: 'Musica', label: 'Música', icon: 'musical-notes-outline', desc: 'Retos de canto, instrumentos y audio' },
  { id: 'Deporte', label: 'Deporte', icon: 'football-outline', desc: 'Rutinas físicas y actividad corporal' },
  { id: 'Videojuegos', label: 'Videojuegos', icon: 'game-controller-outline', desc: 'Retos de gaming y estrategia' },
  { id: 'Arte', label: 'Arte', icon: 'color-palette-outline', desc: 'Dibujo, pintura y creación visual' },
  { id: 'Lectura', label: 'Lectura', icon: 'book-outline', desc: 'Hábitos de lectura y literatura' },
  { id: 'Cocina', label: 'Cocina', icon: 'restaurant-outline', desc: 'Recetas y habilidades culinarias' },
];

export default function HobbiesScreen() {
  const router = useRouter();
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(['Musica', 'Lectura']);
  const [saving, setSaving] = useState(false);
  const initialHobbiesRef = useRef<string[]>(['Musica', 'Lectura']);

  useEffect(() => {
    let active = true;

    const loadHobbies = async () => {
      const { hobbies } = await HobbyService.getHobbies();
      if (active && hobbies && hobbies.length > 0) {
        initialHobbiesRef.current = hobbies;
        setSelectedHobbies(hobbies);
      }
    };

    loadHobbies();
    return () => {
      active = false;
    };
  }, []);

  const toggleHobby = (hobbyId: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobbyId) ? prev.filter(h => h !== hobbyId) : [...prev, hobbyId]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    const toAdd = selectedHobbies.filter(h => !initialHobbiesRef.current.includes(h));
    const toRemove = initialHobbiesRef.current.filter(h => !selectedHobbies.includes(h));

    let firstError: string | null = null;

    for (const hobbyId of toAdd) {
      const result = await HobbyService.addHobby(hobbyId);
      if (result.error && !firstError) firstError = result.error;
    }

    for (const hobbyId of toRemove) {
      const result = await HobbyService.removeHobby(hobbyId);
      if (result.error && !firstError) firstError = result.error;
    }

    setSaving(false);

    if (firstError) {
      const message = `No se pudieron guardar todos los hobbies: ${firstError}`;
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    initialHobbiesRef.current = selectedHobbies;

    if (Platform.OS === 'web') {
      window.alert('¡Hobbies guardados exitosamente!');
      router.back();
    } else {
      Alert.alert(
        'Guardado',
        'Tus hobbies han sido actualizados exitosamente.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea}>
          {/* Cabecera con botón de regresar */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color="#6F4E37" />
              <ThemedText style={styles.backButtonText}>Volver</ThemedText>
            </Pressable>
            <ThemedText style={styles.mainTitle}>Mis Hobbies</ThemedText>
            <ThemedText style={styles.subtitle}>
              Selecciona tus pasatiempos favoritos para personalizar los retos diarios que Hobi tiene para ti.
            </ThemedText>
          </View>

          {/* Lista de Hobbies */}
          <View style={styles.listContainer}>
            {HOBBIES.map(hobby => {
              const isSelected = selectedHobbies.includes(hobby.id);
              return (
                <Pressable
                  key={hobby.id}
                  style={({ pressed }) => [
                    styles.hobbyCard,
                    isSelected ? styles.hobbyCardSelected : styles.hobbyCardUnselected,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                  onPress={() => toggleHobby(hobby.id)}>
                  <View style={[styles.iconBox, isSelected ? styles.iconBoxSelected : styles.iconBoxUnselected]}>
                    <Ionicons
                      name={hobby.icon as any}
                      size={22}
                      color={isSelected ? '#FFFFFF' : '#6F4E37'}
                    />
                  </View>
                  <View style={styles.hobbyInfo}>
                    <ThemedText style={[styles.hobbyTitle, isSelected && styles.hobbyTitleSelected]}>
                      {hobby.label}
                    </ThemedText>
                    <ThemedText style={[styles.hobbyDesc, isSelected && styles.hobbyDescSelected]}>
                      {hobby.desc}
                    </ThemedText>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>

      {/* Botón Guardar Fixed Footer */}
      <View style={styles.fixedFooter}>
        <View style={styles.footerInner}>
          <Pressable
            style={({ pressed }) => [styles.saveButton, { opacity: pressed || saving ? 0.85 : 1 }]}
            onPress={handleSave}
            disabled={saving}>
            <ThemedText style={styles.saveButtonText}>
              {saving ? 'Guardando...' : 'Guardar'}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 100,
    paddingTop: Spacing.two,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    alignItems: 'stretch',
    gap: Spacing.four,
  },
  header: {
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#F5F2ED',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    alignSelf: 'flex-start',
    marginBottom: Spacing.half,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6F4E37',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F1F1F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginTop: 2,
  },
  listContainer: {
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  hobbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three + 2,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: Spacing.three,
  },
  hobbyCardSelected: {
    backgroundColor: '#F5F2ED',
    borderColor: '#6F4E37',
  },
  hobbyCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EAE6E1',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: '#6F4E37',
  },
  iconBoxUnselected: {
    backgroundColor: '#F5F2ED',
  },
  hobbyInfo: {
    flex: 1,
    gap: 2,
  },
  hobbyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  hobbyTitleSelected: {
    color: '#6F4E37',
  },
  hobbyDesc: {
    fontSize: 12,
    color: '#8E8E93',
  },
  hobbyDescSelected: {
    color: '#5C4033',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1CDCA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#6F4E37',
    borderColor: '#6F4E37',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#EAE6E1',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  saveButton: {
    height: 52,
    backgroundColor: '#6F4E37',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
