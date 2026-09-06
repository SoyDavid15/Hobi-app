import {
  Platform,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { MaxContentWidth, Spacing, BorderRadius } from '@/constants/theme';
import { HobiSocialService } from '@/services/hobi';
import { MoodService } from '@/services/mood';
import { MoodEntry, MoodId, MoodStats, TimeRange } from '@/types/mood';
import { MoodSelector } from '@/components/mood-selector';
import { MoodChart } from '@/components/mood-chart';
import { MoodGraphModal } from '@/components/mood-graph-modal';
import { useAlert } from '@/context/AlertContext';

export default function HobiScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { showAlert } = useAlert();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'mood' | 'friends' | 'battles'>('mood');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mood State
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');
  const [moodStats, setMoodStats] = useState<MoodStats>({
    totalLogs: 0,
    averageScore: 0,
    positivityRate: 0,
    dominantMood: null,
    currentStreak: 0,
    distribution: { rad: 0, good: 0, neutral: 0, tired: 0, sad: 0, stressed: 0 },
    trendData: [],
  });
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);

  // Profile & Friends State
  const [profile, setProfile] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);

  // Groups / Battles State
  const [groups, setGroups] = useState<any[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, friendsRes, groupsRes, todayRes, allEntriesRes, statsRes] =
        await Promise.all([
          HobiSocialService.getProfile(),
          HobiSocialService.getFriends(),
          HobiSocialService.getGroups(),
          MoodService.getTodayEntry(),
          MoodService.getAllEntries(),
          MoodService.getStats(selectedRange),
        ]);

      if (profileRes.profile) setProfile(profileRes.profile);
      if (friendsRes.friends) setFriends(friendsRes.friends);
      if (groupsRes.groups) setGroups(groupsRes.groups);

      setTodayMood(todayRes);
      setMoodEntries(allEntriesRes);
      setMoodStats(statsRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRange]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadData();
    }
  }, [loadData]);

  // Reload stats when time range changes
  const handleRangeChange = async (newRange: TimeRange) => {
    setSelectedRange(newRange);
    const updatedStats = await MoodService.getStats(newRange);
    setMoodStats(updatedStats);
  };

  const handleSaveMood = async (mood: MoodId, note?: string, tags?: string[]) => {
    try {
      const saved = await MoodService.saveMood(mood, note, tags);
      setTodayMood(saved);
      const all = await MoodService.getAllEntries();
      setMoodEntries(all);
      const stats = await MoodService.getStats(selectedRange);
      setMoodStats(stats);

      showAlert({
        title: '¡Estado Guardado! ✨',
        message: 'Tu estado de ánimo de hoy ha sido registrado con éxito.',
        type: 'success',
      });
    } catch {
      showAlert({
        title: 'Error',
        message: 'No se pudo guardar tu estado de ánimo.',
        type: 'error',
      });
    }
  };

  const handleCopyCode = async () => {
    if (profile?.friend_code) {
      await Clipboard.setStringAsync(profile.friend_code);
      showAlert({
        title: '¡Copiado!',
        message: 'Tu código de amigo ha sido copiado al portapapeles.',
        type: 'success',
      });
    }
  };

  const handleAddFriend = async () => {
    const code = friendCodeInput.trim();
    if (!code) {
      showAlert({
        title: 'Error',
        message: 'Ingresa un código de amigo válido.',
        type: 'warning',
      });
      return;
    }
    setAddingFriend(true);
    const { error, message } = await HobiSocialService.addFriend(code);
    setAddingFriend(false);
    if (error) {
      showAlert({
        title: 'No se pudo agregar',
        message: error,
        type: 'error',
      });
    } else {
      showAlert({
        title: '¡Solicitud enviada!',
        message: message || 'Solicitud de amistad enviada con éxito.',
        type: 'success',
      });
      setFriendCodeInput('');
      loadData();
    }
  };

  const handleRespondFriend = async (friendshipId: string, action: 'accept' | 'reject') => {
    const { error, message } = await HobiSocialService.respondFriend(friendshipId, action);
    if (error) {
      showAlert({
        title: 'Error',
        message: error,
        type: 'error',
      });
    } else {
      if (message) {
        showAlert({
          title: 'Listo',
          message,
          type: 'success',
        });
      }
      loadData();
    }
  };

  const handleToggleSelectFriend = (friendId: string) => {
    if (selectedFriendIds.includes(friendId)) {
      setSelectedFriendIds(selectedFriendIds.filter((id) => id !== friendId));
    } else {
      setSelectedFriendIds([...selectedFriendIds, friendId]);
    }
  };

  const handleCreateGroup = async () => {
    const name = groupNameInput.trim();
    if (!name) {
      showAlert({
        title: 'Error',
        message: 'Dale un nombre a tu grupo de batalla.',
        type: 'warning',
      });
      return;
    }
    if (selectedFriendIds.length < 1) {
      showAlert({
        title: 'Error',
        message: 'Selecciona al menos 1 amigo (mínimo 2 participantes en total).',
        type: 'warning',
      });
      return;
    }

    setCreatingGroup(true);
    const { error } = await HobiSocialService.createGroup(name, selectedFriendIds);
    setCreatingGroup(false);

    if (error) {
      showAlert({
        title: 'Error al crear grupo',
        message: error,
        type: 'error',
      });
    } else {
      showAlert({
        title: '¡Batalla iniciada! ⚔️',
        message: 'El grupo de reto ha sido creado. ¡Que gane el que mantenga su racha!',
        type: 'success',
      });
      setGroupNameInput('');
      setSelectedFriendIds([]);
      setIsGroupModalOpen(false);
      loadData();
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    showAlert({
      title: 'Eliminar Grupo',
      message: '¿Estás seguro de que deseas disolver este grupo de batalla?',
      type: 'warning',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await HobiSocialService.deleteGroup(groupId);
            if (error) {
              showAlert({
                title: 'Error',
                message: error,
                type: 'error',
              });
            } else {
              loadData();
            }
          },
        },
      ],
    });
  };

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const incomingRequests = friends.filter((f) => f.is_incoming && f.status === 'pending');

  return (
    <View style={styles.container}>
      {/* Fondo circular decorativo */}
      <View
        style={[
          styles.bottomCircle,
          {
            width: width * 2,
            left: '-50%',
            height: height * 0.45,
            borderTopLeftRadius: width,
            borderTopRightRadius: width,
          },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6F4E37']}
            tintColor="#6F4E37"
          />
        }>
        <SafeAreaView style={styles.safeArea}>
          {/* Cabecera superior moderna */}
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.headerTitle}>Hobi</ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Bienestar, Amigos & Batallas de Retos
              </ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [styles.homeBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push('/')}>
              <Ionicons name="home" size={20} color="#6F4E37" />
            </Pressable>
          </View>

          {/* Segmented Switch de 3 pestañas: Bienestar, Amigos, Batallas */}
          <View style={styles.tabSwitch}>
            <Pressable
              style={[styles.tabButton, activeTab === 'mood' && styles.tabButtonActive]}
              onPress={() => setActiveTab('mood')}>
              <Ionicons
                name="happy"
                size={17}
                color={activeTab === 'mood' ? '#FFFFFF' : '#6F4E37'}
              />
              <ThemedText
                style={[styles.tabButtonText, activeTab === 'mood' && styles.tabButtonTextActive]}>
                Bienestar
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === 'friends' && styles.tabButtonActive]}
              onPress={() => setActiveTab('friends')}>
              <Ionicons
                name="people"
                size={17}
                color={activeTab === 'friends' ? '#FFFFFF' : '#6F4E37'}
              />
              <ThemedText
                style={[
                  styles.tabButtonText,
                  activeTab === 'friends' && styles.tabButtonTextActive,
                ]}>
                Amigos ({acceptedFriends.length})
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === 'battles' && styles.tabButtonActive]}
              onPress={() => setActiveTab('battles')}>
              <Ionicons
                name="trophy"
                size={17}
                color={activeTab === 'battles' ? '#FFFFFF' : '#6F4E37'}
              />
              <ThemedText
                style={[
                  styles.tabButtonText,
                  activeTab === 'battles' && styles.tabButtonTextActive,
                ]}>
                Batallas ({groups.length})
              </ThemedText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#6F4E37" />
            </View>
          ) : activeTab === 'mood' ? (
            /* ================= BIENESTAR / ESTADOS DE ÁNIMO TAB ================= */
            <View style={styles.sectionContainer}>
              {/* Sección "¿Cómo te sientes hoy?" */}
              <MoodSelector
                todayEntry={todayMood}
                onSaveMood={handleSaveMood}
                onOpenGraph={() => setIsGraphModalOpen(true)}
              />

              {/* Gráfico y Estadísticas de Bienestar Integrado */}
              <View style={styles.chartSectionHeader}>
                <View style={styles.chartHeaderLeft}>
                  <Ionicons name="analytics" size={18} color="#6F4E37" />
                  <ThemedText style={styles.chartSectionTitle}>
                    Evolución de Estado de Ánimo
                  </ThemedText>
                </View>
              </View>

              <MoodChart
                stats={moodStats}
                selectedRange={selectedRange}
                onRangeChange={handleRangeChange}
                entries={moodEntries}
              />
            </View>
          ) : activeTab === 'friends' ? (
            /* ================= AMIGOS TAB ================= */
            <View style={styles.sectionContainer}>
              {/* Tarjeta de Código de Amigo Propio */}
              <View style={styles.myCodeCard}>
                <View style={styles.myCodeHeader}>
                  <Ionicons name="qr-code-outline" size={22} color="#6F4E37" />
                  <ThemedText style={styles.myCodeTitle}>Tu Código de Amigo</ThemedText>
                </View>
                <View style={styles.codeRow}>
                  <ThemedText style={styles.codeText}>
                    {profile?.friend_code || 'HOBI-XXXXXX'}
                  </ThemedText>
                  <Pressable
                    style={({ pressed }) => [styles.copyButton, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={handleCopyCode}>
                    <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.copyButtonText}>Copiar</ThemedText>
                  </Pressable>
                </View>
                <ThemedText style={styles.myCodeHint}>
                  Comparte este código con tus amigos para que puedan agregarte y competir.
                </ThemedText>
              </View>

              {/* Agregar Amigo por Código */}
              <View style={styles.addCard}>
                <ThemedText style={styles.cardTitle}>Agregar Amigo</ThemedText>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. HOBI-A1B2C3"
                    placeholderTextColor="#A0A0A5"
                    value={friendCodeInput}
                    onChangeText={setFriendCodeInput}
                    autoCapitalize="characters"
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.addButton,
                      { opacity: pressed || addingFriend ? 0.8 : 1 },
                    ]}
                    onPress={handleAddFriend}
                    disabled={addingFriend}>
                    {addingFriend ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={16} color="#FFFFFF" />
                        <ThemedText style={styles.addButtonText}>Agregar</ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Solicitudes Entrantes */}
              {incomingRequests.length > 0 && (
                <View style={styles.subSection}>
                  <ThemedText style={styles.subSectionTitle}>Solicitudes Pendientes</ThemedText>
                  {incomingRequests.map((req) => (
                    <View key={req.friendship_id} style={styles.requestCard}>
                      <View style={styles.requestUserInfo}>
                        <View style={styles.avatarMini}>
                          <Ionicons name="person" size={16} color="#6F4E37" />
                        </View>
                        <View>
                          <ThemedText style={styles.requestName}>
                            {req.friend.username}
                          </ThemedText>
                          <ThemedText style={styles.requestCode}>
                            {req.friend.friend_code}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.requestActions}>
                        <Pressable
                          style={styles.acceptButton}
                          onPress={() => handleRespondFriend(req.friendship_id, 'accept')}>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        </Pressable>
                        <Pressable
                          style={styles.rejectButton}
                          onPress={() => handleRespondFriend(req.friendship_id, 'reject')}>
                          <Ionicons name="close" size={18} color="#6F4E37" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Lista de Amigos Aceptados */}
              <View style={styles.subSection}>
                <ThemedText style={styles.subSectionTitle}>
                  Mis Amigos ({acceptedFriends.length})
                </ThemedText>
                {acceptedFriends.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={32} color="#A0A0A5" />
                    <ThemedText style={styles.emptyText}>
                      Aún no tienes amigos agregados. ¡Comparte tu código o agrega a alguien!
                    </ThemedText>
                  </View>
                ) : (
                  acceptedFriends.map((item) => (
                    <View key={item.friendship_id} style={styles.friendCard}>
                      <View style={styles.friendInfo}>
                        <View style={styles.avatarMini}>
                          <Ionicons name="person" size={16} color="#6F4E37" />
                        </View>
                        <View>
                          <ThemedText style={styles.friendName}>{item.friend.username}</ThemedText>
                          <ThemedText style={styles.friendCode}>{item.friend.friend_code}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.friendBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <ThemedText style={styles.friendBadgeText}>Amigos</ThemedText>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          ) : (
            /* ================= BATALLAS TAB ================= */
            <View style={styles.sectionContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.createBattleButton,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => setIsGroupModalOpen(true)}>
                <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                <ThemedText style={styles.createBattleButtonText}>Crear Grupo de Batalla</ThemedText>
              </Pressable>

              <ThemedText style={styles.battleRuleHint}>
                ⚡ Regla: Cada miembro debe cumplir sus retos diarios. El que rompa su racha desde la
                creación del grupo queda eliminado. ¡El último en pie gana! 🏆
              </ThemedText>

              {groups.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="trophy-outline" size={36} color="#6F4E37" />
                  <ThemedText style={styles.emptyTitle}>Sin batallas activas</ThemedText>
                  <ThemedText style={styles.emptyText}>
                    Crea un grupo de batalla con tus amigos para competir por rachas.
                  </ThemedText>
                </View>
              ) : (
                groups.map((group) => {
                  const isCreator = group.creator_id === profile?.id;
                  const winner = group.winner;
                  return (
                    <View key={group.id} style={styles.groupCard}>
                      <View style={styles.groupHeader}>
                        <View>
                          <ThemedText style={styles.groupName}>{group.name}</ThemedText>
                          <ThemedText style={styles.groupDate}>
                            Iniciada: {group.start_date} • {group.active_count} activos
                          </ThemedText>
                        </View>
                        {isCreator && (
                          <Pressable
                            onPress={() => handleDeleteGroup(group.id)}
                            style={styles.deleteGroupBtn}>
                            <Ionicons name="trash-outline" size={18} color="#FF5722" />
                          </Pressable>
                        )}
                      </View>

                      {winner ? (
                        <View style={styles.winnerBanner}>
                          <Ionicons name="trophy" size={20} color="#FFD700" />
                          <ThemedText style={styles.winnerText}>
                            ¡Ganador: {winner.username}! 👑
                          </ThemedText>
                        </View>
                      ) : null}

                      <View style={styles.membersList}>
                        {group.members.map((m: any) => {
                          const isActive = m.status === 'active';
                          return (
                            <View key={m.user_id} style={styles.memberRow}>
                              <View style={styles.memberInfo}>
                                <Ionicons
                                  name={isActive ? 'shield-checkmark' : 'close-circle'}
                                  size={18}
                                  color={isActive ? '#4CAF50' : '#FF5722'}
                                />
                                <ThemedText
                                  style={[
                                    styles.memberName,
                                    !isActive && styles.memberNameEliminated,
                                  ]}>
                                  {m.username} {m.user_id === profile?.id ? '(Tú)' : ''}
                                </ThemedText>
                              </View>
                              <View
                                style={[
                                  styles.statusBadge,
                                  isActive ? styles.badgeActive : styles.badgeEliminated,
                                ]}>
                                <ThemedText
                                  style={[
                                    styles.statusText,
                                    isActive ? styles.textActive : styles.textEliminated,
                                  ]}>
                                  {isActive ? '🟢 En Batalla' : '🔴 Eliminado'}
                                </ThemedText>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>

      {/* Modal para Crear Grupo de Batalla */}
      <Modal
        visible={isGroupModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsGroupModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsGroupModalOpen(false)} />
          <View style={styles.modalContent}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setIsGroupModalOpen(false)}>
              <Ionicons name="close" size={20} color="#1F1F1F" />
            </Pressable>

            <ThemedText style={styles.modalTitle}>Crear Grupo de Batalla</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              Selecciona a tus amigos para competir. Mínimo 2 participantes en total.
            </ThemedText>

            <TextInput
              style={styles.inputModal}
              placeholder="Nombre del Grupo (ej. Reto de Verano)"
              placeholderTextColor="#A0A0A5"
              value={groupNameInput}
              onChangeText={setGroupNameInput}
            />

            <ThemedText style={styles.selectFriendsLabel}>Seleccionar Amigos:</ThemedText>
            {acceptedFriends.length === 0 ? (
              <ThemedText style={styles.noFriendsWarning}>
                No tienes amigos aceptados aún. Agrega a alguien primero para invitarlo.
              </ThemedText>
            ) : (
              <ScrollView style={styles.friendsSelectList} showsVerticalScrollIndicator={false}>
                {acceptedFriends.map((item) => {
                  const isSelected = selectedFriendIds.includes(item.friend.id);
                  return (
                    <Pressable
                      key={item.friend.id}
                      style={[styles.friendSelectItem, isSelected && styles.friendSelectItemActive]}
                      onPress={() => handleToggleSelectFriend(item.friend.id)}>
                      <View style={styles.memberInfo}>
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={isSelected ? '#6F4E37' : '#A0A0A5'}
                        />
                        <ThemedText style={styles.friendSelectName}>
                          {item.friend.username}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.friendSelectCode}>
                        {item.friend.friend_code}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitGroupButton,
                { opacity: pressed || creatingGroup ? 0.8 : 1 },
              ]}
              onPress={handleCreateGroup}
              disabled={creatingGroup}>
              {creatingGroup ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitGroupButtonText}>Iniciar Batalla ⚔️</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal flotante de Gráfico de Bienestar */}
      <MoodGraphModal
        visible={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
        stats={moodStats}
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
        entries={moodEntries}
      />
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
    bottom: -60,
    backgroundColor: '#6F4E37',
    zIndex: 0,
    opacity: 0.12,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 140,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F1F1F',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  homeBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F5F2ED',
    borderRadius: BorderRadius.medium,
    padding: 4,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.small,
    gap: 5,
  },
  tabButtonActive: {
    backgroundColor: '#6F4E37',
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6F4E37',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    gap: Spacing.four,
  },
  chartSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  myCodeCard: {
    backgroundColor: '#F7F6F3',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.two,
  },
  myCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  myCodeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6F4E37',
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6F4E37',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half + 2,
    borderRadius: BorderRadius.small,
    gap: 4,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  myCodeHint: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    lineHeight: 16,
  },
  addCard: {
    backgroundColor: '#F7F6F3',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.two,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F1F1F',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6F4E37',
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.medium,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  subSection: {
    gap: Spacing.two,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F1F1F',
    marginTop: Spacing.one,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8F5',
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#FFD8CC',
  },
  requestUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  requestName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  requestCode: {
    fontSize: 12,
    color: '#8E8E93',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F6F3',
    borderRadius: BorderRadius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  friendCode: {
    fontSize: 12,
    color: '#8E8E93',
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  friendBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    backgroundColor: '#F9F9FB',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.two,
  },
  emptyText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  createBattleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6F4E37',
    paddingVertical: 14,
    borderRadius: BorderRadius.medium,
    gap: 8,
    shadowColor: '#6F4E37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  createBattleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  battleRuleHint: {
    fontSize: 12,
    color: '#6B655E',
    backgroundColor: '#F5F2ED',
    padding: Spacing.three,
    borderRadius: BorderRadius.medium,
    lineHeight: 18,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  groupCard: {
    backgroundColor: '#F7F6F3',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    gap: Spacing.three,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  groupDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  deleteGroupBtn: {
    padding: 6,
  },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: Spacing.three,
    borderRadius: BorderRadius.medium,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  winnerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B78103',
  },
  membersList: {
    gap: Spacing.two,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  memberNameEliminated: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeActive: {
    backgroundColor: '#E8F5E9',
  },
  badgeEliminated: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textActive: {
    color: '#2E7D32',
  },
  textEliminated: {
    color: '#C62828',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.large,
    padding: Spacing.four,
    gap: Spacing.three,
    zIndex: 10,
    maxHeight: '80%',
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F1F1F',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  inputModal: {
    backgroundColor: '#F9F9FB',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F1F1F',
  },
  selectFriendsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
    marginTop: Spacing.one,
  },
  noFriendsWarning: {
    fontSize: 13,
    color: '#8E8E93',
    fontStyle: 'italic',
    paddingVertical: Spacing.two,
  },
  friendsSelectList: {
    maxHeight: 200,
  },
  friendSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9FB',
    padding: Spacing.three,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#EAE6E1',
  },
  friendSelectItemActive: {
    backgroundColor: '#F5F2ED',
    borderColor: '#6F4E37',
  },
  friendSelectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  friendSelectCode: {
    fontSize: 12,
    color: '#8E8E93',
  },
  submitGroupButton: {
    backgroundColor: '#6F4E37',
    paddingVertical: 14,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitGroupButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
