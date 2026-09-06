export type MoodId = 'rad' | 'good' | 'neutral' | 'tired' | 'sad' | 'stressed';

export interface MoodOption {
  id: MoodId;
  label: string;
  emoji: string;
  score: number; // 1 to 5
  color: string;
  accentColor: string;
  bgLight: string;
  quote: string;
}

export interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  mood: MoodId;
  note?: string;
  tags?: string[];
  energy?: number; // 1 to 5
}

export type TimeRange = 'week' | 'month' | 'year' | 'all';

export interface MoodStats {
  totalLogs: number;
  averageScore: number;
  positivityRate: number; // 0 to 100%
  dominantMood: MoodId | null;
  currentStreak: number;
  distribution: Record<MoodId, number>;
  trendData: {
    label: string;
    subLabel?: string;
    score: number;
    moodId?: MoodId;
    date?: string;
    count?: number;
  }[];
}
