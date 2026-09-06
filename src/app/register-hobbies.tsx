import { Platform, StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { HobbyService } from '@/services/hobbies';
import { useAlert } from '@/context/AlertContext';

const HOBBIES = [
  { id: 'Musica', label: 'Música', icon: 'musical-notes-outline', desc: 'Retos de canto, instrumentos y audio' },
  { id: 'Deporte', label: 'Deporte', icon: 'football-outline', desc: 'Rutinas físicas y actividad corporal' },
  { id: 'Videojuegos', label: 'Videojuegos', icon: 'game-controller-outline', desc: 'Retos de gaming y estrategia' },
  { id: 'Arte', label: 'Arte', icon: 'color-palette-outline', desc: 'Dibujo, pintura y creación visual' },
  { id: 'Lectura', label: 'Lectura', icon: 'book-outline', desc: 'Hábitos de lectura y literatura' },
  { id: 'Cocina', label: 'Cocina', icon: 'restaurant-outline', desc: 'Recetas y habilidades culinarias' },
];

export default function RegisterHobbiesScreen() {
  const router = useRouter();
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(['Musica', 'Lectura']);
  const { showAlert } = useAlert();

  const toggleHobby = (hobbyId: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobbyId) ? prev.filter(h => h !== hobbyId) : [...prev, hobbyId]
    );
  };

  const handleCompleteRegistration = async () => {
    if (selectedHobbies.length === 0) {
      showAlert({
        title: 'Atención',
        message: 'Por favor selecciona al menos un hobby para continuar.',
        type: 'warning',
      });
      return;
    }

    for (const hobbyId of selectedHobbies) {
      const result = await HobbyService.addHobby(hobbyId);
      if (result.error) {
        showAlert({
          title: 'Error',
          message: result.error === 'No hay sesión activa'
            ? 'Debes verificar tu correo e iniciar sesión antes de guardar tus hobbies.'
            : result.error,
          type: 'error',
        });
        return;
      }
    }

    showAlert({
      title: '¡Todo listo!',
      message: 'Tus hobbies han sido guardados. Revisa tu correo para verificar tu cuenta e iniciar sesión.',
      type: 'success',
      buttons: [
        {
          text: 'Continuar',
          onPress: () => router.replace('/auth'),
        },
      ],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.brand}>Hobi</ThemedText>
            <ThemedText style={styles.mainTitle}>Elige tus Hobbies</ThemedText>
            <ThemedText style={styles.subtitle}>
              Selecciona tus pasatiempos favoritos para personalizar los retos diarios y ayudarte a salir del doomscroll.
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

      {/* Botón Fixed Footer */}
      <View style={styles.fixedFooter}>
        <View style={styles.footerInner}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCompleteRegistration}>
            <ThemedText style={styles.primaryButtonText}>Guardar y Continuar</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 100,
    paddingTop: Spacing.four,
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
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: '#6F4E37',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F1F1F',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.two,
  },
  listContainer: {
    gap: Spacing.three,
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
    backgroundColor: '#F9F8F6',
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
    backgroundColor: '#EAE6E1',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  primaryButton: {
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
