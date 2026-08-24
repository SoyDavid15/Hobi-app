import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';

/**
 * Tipo de período de 12 horas
 */
export type ChallengePeriod = 'AM' | 'PM';

/**
 * Interface para un reto diario
 */
export interface DailyChallenge {
  id?: string;
  challenge: string;
  isCompleted: boolean;
  photoUrl: string | null;
  challengeDate: string;
  period: ChallengePeriod;
  hobbyId?: string;
  completedAt?: string | null;
}

/**
 * Interface para un reto completado en el historial / galería
 */
export interface CompletedChallengeItem {
  id: string;
  challenge: string;
  photo_url: string;
  challenge_date: string;
  period?: ChallengePeriod;
  hobby_id?: string;
  completed_at?: string;
  created_at?: string;
}

/**
 * Obtener la fecha local YYYY-MM-DD y período actual (AM < 12:00, PM >= 12:00)
 */
export function getCurrentSlot(): { date: string; period: ChallengePeriod } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;
  const period: ChallengePeriod = now.getHours() < 12 ? 'AM' : 'PM';
  return { date, period };
}

/**
 * Helper para decodificar base64 a Uint8Array compatible con Supabase Storage
 */
function base64ToUint8Array(base64String: string): Uint8Array {
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = base64Data.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string');
  }

  for (
    let bc = 0, bs = 0, buffer: number, idx = 0;
    (buffer = str.charCodeAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(String.fromCharCode(buffer));
  }

  const bytes = new Uint8Array(output.length);
  for (let i = 0; i < output.length; i++) {
    bytes[i] = output.charCodeAt(i);
  }
  return bytes;
}

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export const ChallengeService = {
  /**
   * Obtener el reto del turno actual (AM o PM) según la hora local del usuario
   */
  async getChallenge(): Promise<{
    challenge: string | null;
    isCompleted: boolean;
    photoUrl: string | null;
    challengeDate: string | null;
    period: ChallengePeriod;
    error: string | null;
  }> {
    const { date: clientDate, period } = getCurrentSlot();

    try {
      const token = await getAccessToken();
      if (!token) {
        return { challenge: null, isCompleted: false, photoUrl: null, challengeDate: null, period, error: 'No hay sesión activa' };
      }

      const params = new URLSearchParams({ client_date: clientDate, period });
      const res = await fetch(`${API_URL}/message?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      return {
        challenge: data.message ?? null,
        isCompleted: Boolean(data.is_completed),
        photoUrl: data.photo_url ?? null,
        challengeDate: data.challenge_date ?? clientDate,
        period: (data.period as ChallengePeriod) ?? period,
        error: null,
      };
    } catch (err: any) {
      return {
        challenge: null,
        isCompleted: false,
        photoUrl: null,
        challengeDate: null,
        period,
        error: err.message || 'Error al cargar el reto',
      };
    }
  },

  /**
   * Subir la imagen de evidencia a Supabase Storage
   */
  async uploadChallengePhoto(
    photoUri: string,
    photoBase64?: string | null,
    mimeType: string = 'image/jpeg'
  ): Promise<{ photoUrl: string | null; error: string | null }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { photoUrl: null, error: 'Usuario no autenticado' };
      }

      const { date: today, period } = getCurrentSlot();
      const filename = `${user.id}/${today}_${period}_${Date.now()}.jpg`;

      let fileData: Uint8Array | Blob;

      if (photoBase64) {
        fileData = base64ToUint8Array(photoBase64);
      } else {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        fileData = blob;
      }

      const { error: uploadError } = await supabase.storage
        .from('challenge-photos')
        .upload(filename, fileData, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.warn('Error en storage upload:', uploadError);
        throw new Error(uploadError.message);
      }

      const { data: publicData } = supabase.storage
        .from('challenge-photos')
        .getPublicUrl(filename);

      return { photoUrl: publicData.publicUrl, error: null };
    } catch (err: any) {
      return { photoUrl: null, error: err.message || 'Error al subir la foto' };
    }
  },

  /**
   * Completar el reto del turno actual guardando la foto en Supabase
   */
  async completeChallenge(
    photoUri: string,
    photoBase64?: string | null,
    challengeDate?: string
  ): Promise<{ success: boolean; photoUrl: string | null; error: string | null }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { success: false, photoUrl: null, error: 'Usuario no autenticado' };
      }

      const { date: slotDate, period } = getCurrentSlot();
      const today = challengeDate || slotDate;

      // 1. Subir foto a Supabase Storage
      const { photoUrl, error: uploadErr } = await this.uploadChallengePhoto(photoUri, photoBase64);
      if (uploadErr || !photoUrl) {
        return { success: false, photoUrl: null, error: uploadErr || 'No se pudo subir la foto' };
      }

      // 2. Intentar actualizar directamente en Supabase DB (con period)
      const { error: dbError } = await supabase
        .from('daily_challenges')
        .update({
          photo_url: photoUrl,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('challenge_date', today)
        .eq('period', period);

      if (dbError) {
        // Fallback: sincronizar a través del Backend API
        const token = await getAccessToken();
        if (token) {
          await fetch(`${API_URL}/challenges/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              photo_url: photoUrl,
              challenge_date: today,
              period,
            }),
          });
        }
      }

      return { success: true, photoUrl, error: null };
    } catch (err: any) {
      return { success: false, photoUrl: null, error: err.message || 'Error al completar el reto' };
    }
  },

  /**
   * Obtener el historial de retos completados con foto para la pantalla de Perfil
   */
  async getCompletedChallenges(): Promise<{
    challenges: CompletedChallengeItem[];
    error: string | null;
  }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { challenges: [], error: 'Usuario no autenticado' };
      }

      // Consultar directamente Supabase
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('id, challenge, photo_url, challenge_date, hobby_id, period, completed_at, created_at')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .not('photo_url', 'is', null)
        .order('challenge_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return { challenges: data as CompletedChallengeItem[], error: null };
      }

      // Fallback al Backend
      const token = await getAccessToken();
      if (token) {
        const res = await fetch(`${API_URL}/challenges/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const body = await res.json();
          return { challenges: body.history || [], error: null };
        }
      }

      return { challenges: (data as CompletedChallengeItem[]) || [], error: null };
    } catch (err: any) {
      return { challenges: [], error: err.message || 'Error al obtener historial de retos' };
    }
  },
};