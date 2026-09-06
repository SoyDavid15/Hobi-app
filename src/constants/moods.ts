import { MoodId, MoodOption } from '@/types/mood';

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'rad',
    label: 'Increíble',
    emoji: '🤩',
    score: 5,
    color: '#10B981', // Emerald green
    accentColor: '#059669',
    bgLight: '#ECFDF5',
    quote: '¡Qué gran vibra! Aprovecha este impulso y contagia tu energía.',
  },
  {
    id: 'good',
    label: 'Bien',
    emoji: '😊',
    score: 4,
    color: '#3B82F6', // Vibrant blue
    accentColor: '#2563EB',
    bgLight: '#EFF6FF',
    quote: 'Una mente tranquila y enfocada es tu mayor poder. ¡Sigue así!',
  },
  {
    id: 'neutral',
    label: 'Normal',
    emoji: '😐',
    score: 3,
    color: '#8B5CF6', // Purple / Lavender
    accentColor: '#7C3AED',
    bgLight: '#F5F3FF',
    quote: 'Un día sereno es un lienzo en blanco para descubrir algo nuevo.',
  },
  {
    id: 'tired',
    label: 'Cansado',
    emoji: '😴',
    score: 2.5,
    color: '#F59E0B', // Amber
    accentColor: '#D97706',
    bgLight: '#FFFBEB',
    quote: 'El descanso también es productividad. Cuida de tu cuerpo hoy.',
  },
  {
    id: 'sad',
    label: 'Desanimado',
    emoji: '😔',
    score: 2,
    color: '#6366F1', // Indigo
    accentColor: '#4F46E5',
    bgLight: '#EEF2FF',
    quote: 'Hobi está contigo. Está bien no sentirse al 100%, sé amable contigo mismo.',
  },
  {
    id: 'stressed',
    label: 'Estresado',
    emoji: '😤',
    score: 1,
    color: '#EF4444', // Red
    accentColor: '#DC2626',
    bgLight: '#FEF2F2',
    quote: 'Respira hondo durante 10 segundos. Paso a paso se aclara el camino.',
  },
];

export const MOOD_MAP: Record<MoodId, MoodOption> = MOOD_OPTIONS.reduce((acc, mood) => {
  acc[mood.id] = mood;
  return acc;
}, {} as Record<MoodId, MoodOption>);

export const MOOD_TAGS = [
  '🎯 Retos',
  '💼 Trabajo',
  '📚 Estudio',
  '🧘 Relax',
  '🏃 Ejercicio',
  '🥗 Salud',
  '👥 Amigos',
  '🏡 Familia',
  '🎨 Hobbies',
  '✨ Tiempo libre',
];
