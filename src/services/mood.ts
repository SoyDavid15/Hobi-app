import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
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

async function getCurrentUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || 'guest_user';
  } catch {
    return 'guest_user';
  }
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const MoodService = {
  async getAllEntries(): Promise<MoodEntry[]> {
    const userId = await getCurrentUserId();
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    const raw = await getStorageItem(storageKey);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filtrar cualquier dato de prueba anterior para asegurar solo datos reales
          const realEntries = parsed.filter((e) => !e.id?.startsWith('seed_'));
          if (realEntries.length !== parsed.length) {
            await setStorageItem(storageKey, JSON.stringify(realEntries));
          }
          return realEntries;
        }
      } catch {
        // fallback
      }
    }

    return [];
  },

  async getTodayEntry(): Promise<MoodEntry | null> {
    const entries = await this.getAllEntries();
    const todayStr = formatDate(new Date());
    const found = entries.find((e) => e.date === todayStr);
    return found || null;
  },

  async saveMood(
    mood: MoodId,
    note?: string,
    tags?: string[],
    energy?: number,
    customDate?: string
  ): Promise<MoodEntry> {
    const userId = await getCurrentUserId();
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    const entries = await this.getAllEntries();

    const dateStr = customDate || formatDate(new Date());
    const existingIndex = entries.findIndex((e) => e.date === dateStr);

    const newEntry: MoodEntry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : `mood_${Date.now()}`,
      date: dateStr,
      timestamp: new Date().toISOString(),
      mood,
      note: note?.trim() || undefined,
      tags: tags && tags.length > 0 ? tags : undefined,
      energy: energy || Math.min(5, Math.max(1, Math.round(MOOD_MAP[mood].score))),
    };

    if (existingIndex >= 0) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }

    // Sort by date ascending
    entries.sort((a, b) => a.date.localeCompare(b.date));

    await setStorageItem(storageKey, JSON.stringify(entries));
    return newEntry;
  },

  async deleteEntry(entryId: string): Promise<void> {
    const userId = await getCurrentUserId();
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    const entries = await this.getAllEntries();
    const filtered = entries.filter((e) => e.id !== entryId);
    await setStorageItem(storageKey, JSON.stringify(filtered));
  },

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
      // Last 7 days (including today)
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
          distribution[entry.mood]++;
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
      // Last 30 days grouped into 6 slices of 5 days
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

        const sliceEntries = entries.filter((e) => e.date >= startStrSlice && e.date <= endStrSlice);
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
      // 12 months
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
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
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const mName = monthNames[parseInt(m, 10) - 1] || m;
          const avgScore =
            mEntries.reduce((acc, curr) => acc + (MOOD_MAP[curr.mood]?.score || 0), 0) / mEntries.length;

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
    let currentStreak = 0;
    if (entries.length > 0) {
      const sortedDates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse();
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
