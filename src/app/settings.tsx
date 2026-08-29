import { Platform, StyleSheet, ScrollView, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { AuthService } from '@/services/auth';
import { useLanguage } from '@/context/LanguageContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const handleSignOut = () => {
    const msg = t('signOutConfirm');
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        AuthService.signOut();
      }
    } else {
      Alert.alert(
        t('signOut'),
        msg,
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('signOut'),
            style: 'destructive',
            onPress: () => AuthService.signOut(),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleDeleteAccount = () => {
    const message = t('deleteAccountConfirm');
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        AuthService.signOut();
      }
    } else {
      Alert.alert(
        t('deleteAccount'),
        message,
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: () => {
              AuthService.signOut();
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'es' ? 'en' : 'es';
    setLanguage(nextLang);
  };

  const languageLabel = language === 'es' ? 'Español' : 'English';

  return (
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
            <ThemedText style={styles.backButtonText}>{t('back')}</ThemedText>
          </Pressable>
          <ThemedText style={styles.mainTitle}>{t('settingsTitle')}</ThemedText>
        </View>

        {/* Tarjeta de Preferencias */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="options-outline" size={18} color="#6F4E37" />
            <ThemedText style={styles.sectionHeader}>{t('preferences')}</ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={toggleLanguage}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="globe-outline" size={20} color="#6F4E37" />
              </View>
              <View style={styles.rowLabelContainer}>
                <ThemedText style={styles.rowLabel}>{t('language')}</ThemedText>
                <ThemedText style={styles.rowSubLabel}>{t('currentLangDesc')}</ThemedText>
              </View>
            </View>
            <View style={styles.languageBadge}>
              <ThemedText style={styles.languageBadgeText}>{languageLabel}</ThemedText>
              <Ionicons name="chevron-forward" size={14} color="#6F4E37" />
            </View>
          </Pressable>
        </View>

        {/* Tarjeta de Hobbies */}
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/hobbies')}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="heart-outline" size={20} color="#6F4E37" />
              </View>
              <View style={styles.rowLabelContainer}>
                <ThemedText style={styles.rowLabel}>{t('hobbiesSetting')}</ThemedText>
                <ThemedText style={styles.rowSubLabel}>{t('hobbiesSettingDesc')}</ThemedText>
              </View>
            </View>
            <View style={styles.languageBadge}>
              <ThemedText style={styles.languageBadgeText}>{t('manage')}</ThemedText>
              <Ionicons name="chevron-forward" size={14} color="#6F4E37" />
            </View>
          </Pressable>
        </View>

        {/* Tarjeta de Cuenta */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="person-outline" size={18} color="#6F4E37" />
            <ThemedText style={styles.sectionHeader}>{t('account')}</ThemedText>
          </View>
          
          <Pressable
            style={({ pressed }) => [styles.signOutButton, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color="#6F4E37" />
            <ThemedText style={styles.signOutButtonText}>{t('signOut')}</ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
            <ThemedText style={styles.deleteButtonText}>{t('deleteAccount')}</ThemedText>
          </Pressable>
        </View>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.five,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0ECE6',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabelContainer: {
    gap: 2,
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  rowSubLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: '#F5F2ED',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  languageBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6F4E37',
  },
  signOutButton: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#F5F2ED',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one + 2,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  signOutButtonText: {
    color: '#6F4E37',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#FFEBEE',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one + 2,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontSize: 15,
    fontWeight: '700',
  },
});
