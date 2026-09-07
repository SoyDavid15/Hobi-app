import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';
import { MoodEntry, MoodId, MoodStats, TimeRange } from '@/types/mood';
import { MOOD_MAP } from '@/constants/moods';

const STORAGE_KEY_PREFIX = 'hobi_mood_entries_';

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // ignore
  }
}

async function getAuthSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapDbRowToEntry(row: any): MoodEntry {
  return {
    id: row.id || `mood_${Date.now()}`,
    date: row.date,
    timestamp: row.created_at || row.updated_at || new Date().toISOString(),
    mood: row.mood as MoodId,
    note: row.note || undefined,
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : undefined,
    energy: typeof row.energy === 'number' ? row.energy : undefined,
  };
}

export const MoodService = {
  /**
   * Obtiene todos los registros del usuario:
   * 1. Consulta la base de datos Supabase (o Backend API)
   * 2. Si no hay conexión, usa la caché local (SecureStore / localStorage)
   * 3. Si la base de datos está vacía pero hay datos locales, los migra automáticamente a Supabase
   */
  async getAllEntries(): Promise<MoodEntry[]> {
    const session = await getAuthSession();
    const userId = session?.user?.id || 'guest_user';
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

    // 1. Obtener datos locales en caché
    let localEntries: MoodEntry[] = [];
    const raw = await getStorageItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localEntries = parsed.filter((e) => !e.id?.startsWith('seed_'));
        }
      } catch {
        // fallback
      }
    }

    // Si no hay usuario autenticado, devolver la caché local
    if (!session || !session.user?.id) {
      return localEntries;
    }

    // 2. Consultar directamente Supabase
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: true });

      if (!error && data) {
        if (data.length > 0) {
          const dbEntries = data.map(mapDbRowToEntry);
          await setStorageItem(storageKey, JSON.stringify(dbEntries));
          return dbEntries;
        } else if (localEntries.length > 0) {
          // Si la BD está vacía pero tenemos registros locales, migrarlos a Supabase
          const payload = localEntries.map((e) => ({
            user_id: session.user.id,
            date: e.date,
            mood: e.mood,
            energy: e.energy || Math.min(5, Math.max(1, Math.round(MOOD_MAP[e.mood]?.score || 3))),
            note: e.note || null,
            tags: e.tags || null,
            created_at: e.timestamp || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));

          const { data: migratedData, error: migError } = await supabase
            .from('mood_entries')
            .upsert(payload, { onConflict: 'user_id,date' })
            .select('*');

          if (!migError && migratedData && migratedData.length > 0) {
            const mapped = migratedData.map(mapDbRowToEntry);
            await setStorageItem(storageKey, JSON.stringify(mapped));
            return mapped;
          }
        }
        return localEntries;
      }
    } catch (dbErr) {
      console.warn('Error al consultar mood_entries en Supabase:', dbErr);
    }

    // 3. Fallback al Backend API
    try {
      const res = await fetch(`${API_URL}/mood`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const body = await res.json();
        if (body.entries && Array.isArray(body.entries)) {
          const apiEntries = body.entries.map(mapDbRowToEntry);
          await setStorageItem(storageKey, JSON.stringify(apiEntries));
          return apiEntries;
        }
      }
    } catch (apiErr) {
      console.warn('Error al consultar /mood en backend:', apiErr);
    }

    return localEntries;
  },

  /**
   * Obtener el registro de estado de ánimo de hoy
   */
  async getTodayEntry(): Promise<MoodEntry | null> {
    const todayStr = formatDate(new Date());
    const session = await getAuthSession();

    if (session?.user?.id) {
      try {
        const { data, error } = await supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('date', todayStr)
          .maybeSingle();

        if (!error && data) {
          return mapDbRowToEntry(data);
        }
      } catch {
        // fallback
      }
    }

    const entries = await this.getAllEntries();
    return entries.find((e) => e.date === todayStr) || null;
  },

  /**
   * Guardar o actualizar un registro de estado de ánimo en la base de datos
   */
  async saveMood(
    mood: MoodId,
    note?: string,
    tags?: string[],
    energy?: number,
    customDate?: string
  ): Promise<MoodEntry> {
    const session = await getAuthSession();
    const userId = session?.user?.id || 'guest_user';
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    const dateStr = customDate || formatDate(new Date());
    const calculatedEnergy =
      energy || Math.min(5, Math.max(1, Math.round(MOOD_MAP[mood]?.score || 3)));
    const nowIso = new Date().toISOString();

    let savedEntry: MoodEntry = {
      id: `mood_${Date.now()}`,
      date: dateStr,
      timestamp: nowIso,
      mood,
      note: note?.trim() || undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
      energy: calculatedEnergy,
    };

    // 1. Guardar en Supabase Database si está autenticado
    if (session?.user?.id) {
      let savedInDb = false;
      try {
        const dbPayload = {
          user_id: session.user.id,
          date: dateStr,
          mood,
          energy: calculatedEnergy,
          note: note?.trim() || null,
          tags: tags && tags.length > 0 ? tags : null,
          updated_at: nowIso,
        };

        const { data, error } = await supabase
          .from('mood_entries')
          .upsert(dbPayload, { onConflict: 'user_id,date' })
          .select('*')
          .single();

        if (!error && data) {
          savedEntry = mapDbRowToEntry(data);
          savedInDb = true;
        }
      } catch (dbErr) {
        console.warn('Error al guardar en Supabase mood_entries:', dbErr);
      }

      // Fallback a API Backend si el cliente directo falló
      if (!savedInDb) {
        try {
          const res = await fetch(`${API_URL}/mood`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              mood,
              note: note?.trim() || null,
              tags: tags && tags.length > 0 ? tags : null,
              energy: calculatedEnergy,
              custom_date: dateStr,
            }),
          });

          if (res.ok) {
            const body = await res.json();
            if (body.entry) {
              savedEntry = mapDbRowToEntry(body.entry);
            }
          }
        } catch (apiErr) {
          console.warn('Error al enviar /mood al backend:', apiErr);
        }
      }
    }

    // 2. Actualizar caché local
    const raw = await getStorageItem(storageKey);
    let entries: MoodEntry[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) entries = parsed;
      } catch {
        // fallback
      }
    }

    const existingIndex = entries.findIndex((e) => e.date === dateStr);
    if (existingIndex >= 0) {
      entries[existingIndex] = savedEntry;
    } else {
      entries.push(savedEntry);
    }
    entries.sort((a, b) => a.date.localeCompare(b.date));
    await setStorageItem(storageKey, JSON.stringify(entries));

    return savedEntry;
  },

  /**
   * Eliminar un registro de estado de ánimo
   */
  async deleteEntry(entryId: string): Promise<void> {
    const session = await getAuthSession();
    const userId = session?.user?.id || 'guest_user';
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

    if (session?.user?.id) {
      try {
        await supabase
          .from('mood_entries')
          .delete()
          .eq('id', entryId)
          .eq('user_id', session.user.id);
      } catch (dbErr) {
        console.warn('Error al eliminar en Supabase:', dbErr);
      }

      try {
        await fetch(`${API_URL}/mood/${entryId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch {
        // ignore
      }
    }

    const raw = await getStorageItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((e) => e.id !== entryId);
          await setStorageItem(storageKey, JSON.stringify(filtered));
        }
      } catch {
        // ignore
      }
    }
  },

  /**
   * Calcular estadísticas del estado de ánimo
   */
  async getStats(range: TimeRange): Promise<MoodStats> {
    const entries = await this.getAllEntries();
    const now = new Date();

    const distribution: Record<MoodId, number> = {
      rad: 0,
      good: 0,
      neutral: 0,
      tired: 0,
      sad: 0,
      stressed: 0,
    };

    let filteredEntries: MoodEntry[] = [];
    const trendData: MoodStats['trendData'] = [];

    if (range === 'week') {
      // Últimos 7 días (incluyendo hoy)
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const past7Days: string[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        past7Days.push(formatDate(d));
      }

      const mapByDate = new Map<string, MoodEntry>();
      entries.forEach((e) => mapByDate.set(e.date, e));

      past7Days.forEach((dateStr) => {
        const entry = mapByDate.get(dateStr);
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        const dayLabel = dayNames[d.getDay()];

        if (entry) {
          filteredEntries.push(entry);
          if (distribution[entry.mood] !== undefined) {
            distribution[entry.mood]++;
          }
          trendData.push({
            label: dayLabel,
            subLabel: `${day}`,
            score: MOOD_MAP[entry.mood]?.score || 0,
            moodId: entry.mood,
            date: dateStr,
          });
        } else {
          trendData.push({
            label: dayLabel,
            subLabel: `${day}`,
            score: 0,
            date: dateStr,
          });
        }
      });
    } else if (range === 'month') {
      // Últimos 30 días agrupados en 6 periodos de 5 días
      const daysCount = 30;
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysCount);
      const startStr = formatDate(startDate);

      filteredEntries = entries.filter((e) => e.date >= startStr);
      filteredEntries.forEach((e) => {
        if (distribution[e.mood] !== undefined) {
          distribution[e.mood]++;
        }
      });

      for (let slice = 5; slice >= 0; slice--) {
        const sliceEnd = new Date(now);
        sliceEnd.setDate(sliceEnd.getDate() - slice * 5);
        const sliceStart = new Date(sliceEnd);
        sliceStart.setDate(sliceStart.getDate() - 4);

        const startStrSlice = formatDate(sliceStart);
        const endStrSlice = formatDate(sliceEnd);

        const sliceEntries = entries.filter(
          (e) => e.date >= startStrSlice && e.date <= endStrSlice
        );
        const avgScore =
          sliceEntries.length > 0
            ? sliceEntries.reduce((acc, curr) => acc + (MOOD_MAP[curr.mood]?.score || 0), 0) /
              sliceEntries.length
            : 0;

        const label = `${sliceStart.getDate()}/${sliceStart.getMonth() + 1}`;
        trendData.push({
          label,
          subLabel: `${sliceEnd.getDate()}/${sliceEnd.getMonth() + 1}`,
          score: Math.round(avgScore * 10) / 10,
          count: sliceEntries.length,
        });
      }
    } else if (range === 'year') {
      // 12 meses
      const monthNames = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ];
      const currentYear = now.getFullYear();

      for (let m = 0; m < 12; m++) {
        const monthPrefix = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));

        monthEntries.forEach((e) => {
          filteredEntries.push(e);
          if (distribution[e.mood] !== undefined) {
            distribution[e.mood]++;
          }
        });

        const avgScore =
          monthEntries.length > 0
            ? monthEntries.reduce((acc, curr) => acc + (MOOD_MAP[curr.mood]?.score || 0), 0) /
              monthEntries.length
            : 0;

        trendData.push({
          label: monthNames[m],
          score: Math.round(avgScore * 10) / 10,
          count: monthEntries.length,
        });
      }
    } else {
      // 'all'
      filteredEntries = [...entries];
      filteredEntries.forEach((e) => {
        if (distribution[e.mood] !== undefined) {
          distribution[e.mood]++;
        }
      });

      if (entries.length > 0) {
        const monthMap = new Map<string, MoodEntry[]>();
        entries.forEach((e) => {
          const key = e.date.substring(0, 7); // YYYY-MM
          if (!monthMap.has(key)) {
            monthMap.set(key, []);
          }
          monthMap.get(key)!.push(e);
        });

        const sortedKeys = Array.from(monthMap.keys()).sort();
        sortedKeys.forEach((key) => {
          const mEntries = monthMap.get(key) || [];
          const [y, m] = key.split('-');
          const monthNames = [
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sep',
            'Oct',
            'Nov',
            'Dic',
          ];
          const mName = monthNames[parseInt(m, 10) - 1] || m;
          const avgScore =
            mEntries.reduce((acc, curr) => acc + (MOOD_MAP[curr.mood]?.score || 0), 0) /
            mEntries.length;

          trendData.push({
            label: `${mName} '${y.slice(2)}`,
            score: Math.round(avgScore * 10) / 10,
            count: mEntries.length,
          });
        });
      }
    }

    const totalLogs = filteredEntries.length;
    const totalScore = filteredEntries.reduce(
      (sum, e) => sum + (MOOD_MAP[e.mood]?.score || 0),
      0
    );
    const averageScore = totalLogs > 0 ? Math.round((totalScore / totalLogs) * 10) / 10 : 0;

    // Positivity rate: percentage of days with score >= 3.5
    const positiveCount = filteredEntries.filter(
      (e) => (MOOD_MAP[e.mood]?.score || 0) >= 3.5
    ).length;
    const positivityRate = totalLogs > 0 ? Math.round((positiveCount / totalLogs) * 100) : 0;

    // Dominant mood
    let dominantMood: MoodId | null = null;
    let maxCount = 0;
    (Object.keys(distribution) as MoodId[]).forEach((m) => {
      if (distribution[m] > maxCount) {
        maxCount = distribution[m];
        dominantMood = m;
      }
    });

    // Calculate current logging streak
    let currentStreak = 1;
    if (entries.length > 0) {
      const sortedDates = Array.from(new Set(entries.map((e) => e.date)))
        .sort()
        .reverse();
      const todayStr = formatDate(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);

      let checkDate = sortedDates.includes(todayStr)
        ? new Date(now)
        : sortedDates.includes(yesterdayStr)
        ? yesterday
        : null;

      if (checkDate) {
        while (true) {
          const dStr = formatDate(checkDate);
          if (sortedDates.includes(dStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    return {
      totalLogs,
      averageScore,
      positivityRate,
      dominantMood,
      currentStreak,
      distribution,
      trendData,
    };
  },
};
