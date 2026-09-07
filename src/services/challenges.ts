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
    challengeDate?: string,
    challengeText?: string | null
  ): Promise<{ success: boolean; photoUrl: string | null; feedback?: string | null; error: string | null }> {
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

      const completedAt = new Date().toISOString();
      let aiFeedback: string | null = null;

      // 2. Enviar al Backend API para verificación por IA
      const token = await getAccessToken();
      if (token) {
        try {
          const res = await fetch(`${API_URL}/challenges/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              photo_url: photoUrl,
              challenge_date: today,
              period: period,
            }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const errorMsg = body.detail || 'La foto no cumple con el reto indicado por la IA.';
            return { success: false, photoUrl: null, error: errorMsg };
          }

          const responseData = await res.json();
          aiFeedback = responseData.feedback || null;
        } catch (apiErr: any) {
          // Si hay error de red con el backend, permitimos continuar localmente pero con advertencia
          console.warn('Backend AI verification notice:', apiErr);
        }
      }

      // 3. Guardar/Actualizar en Supabase DB local
      const { data: existingRows } = await supabase
        .from('daily_challenges')
        .select('id, challenge, period, challenge_date')
        .eq('user_id', user.id)
        .eq('challenge_date', today)
        .eq('period', period);

      let dbSaved = false;

      if (existingRows && existingRows.length > 0) {
        const targetId = existingRows[0].id;
        const { error: updateErr } = await supabase
          .from('daily_challenges')
          .update({
            photo_url: photoUrl,
            is_completed: true,
            completed_at: completedAt,
          })
          .eq('id', targetId);

        if (!updateErr) dbSaved = true;
      }

      if (!dbSaved) {
        const { data: todayRows } = await supabase
          .from('daily_challenges')
          .select('id')
          .eq('user_id', user.id)
          .eq('challenge_date', today);

        if (todayRows && todayRows.length > 0) {
          const { error: updateErr } = await supabase
            .from('daily_challenges')
            .update({
              photo_url: photoUrl,
              is_completed: true,
              period: period,
              completed_at: completedAt,
            })
            .eq('id', todayRows[0].id);

          if (!updateErr) dbSaved = true;
        }
      }

      if (!dbSaved) {
        const { error: insertErr } = await supabase
          .from('daily_challenges')
          .insert({
            user_id: user.id,
            challenge_date: today,
            period: period,
            hobby_id: 'General',
            challenge: challengeText || 'Reto completado con éxito',
            photo_url: photoUrl,
            is_completed: true,
            completed_at: completedAt,
          });

        if (!insertErr) dbSaved = true;
      }

      return { success: true, photoUrl, feedback: aiFeedback, error: null };
    } catch (err: any) {
      return { success: false, photoUrl: null, error: err.message || 'Error al completar el reto' };
    }
  },

  /**
   * Obtener el historial de retos completados con foto para la pantalla de Perfil.
   * Cuenta con triple verificación:
   * 1. Consulta directa en la tabla daily_challenges de Supabase.
   * 2. Fallback de archivos directos en Supabase Storage (challenge-photos).
   * 3. Fallback al Backend API.
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

      const resultsMap = new Map<string, CompletedChallengeItem>();

      // 1. Consultar directamente Supabase DB
      try {
        const { data: dbData } = await supabase
          .from('daily_challenges')
          .select('id, challenge, photo_url, challenge_date, hobby_id, period, completed_at, created_at')
          .eq('user_id', user.id)
          .order('challenge_date', { ascending: false });

        if (dbData && dbData.length > 0) {
          for (const row of dbData) {
            if (row.photo_url) {
              const key = row.id || `${row.challenge_date}_${row.period}`;
              resultsMap.set(key, row as CompletedChallengeItem);
            }
          }
        }
      } catch (dbQueryErr) {
        console.warn('DB query error:', dbQueryErr);
      }

      // 2. Si no hay registros o para respaldar, consultar Storage directamente
      try {
        const { data: storageFiles } = await supabase.storage
          .from('challenge-photos')
          .list(user.id, {
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (storageFiles && storageFiles.length > 0) {
          for (const file of storageFiles) {
            if (!file.name || file.name === '.emptyFolderPlaceholder') continue;

            const { data: publicData } = supabase.storage
              .from('challenge-photos')
              .getPublicUrl(`${user.id}/${file.name}`);

            const publicUrl = publicData.publicUrl;

            // Extraer fecha y período del nombre: ej. "2026-08-23_PM_1740345678.jpg"
            const parts = file.name.split('_');
            const fileDate = parts[0] || new Date().toISOString().split('T')[0];
            const filePeriod: ChallengePeriod = (parts[1] === 'PM' || parts[1] === 'AM') ? parts[1] : 'AM';

            // Comprobar si ya existe en resultsMap por URL o fecha
            let alreadyExists = false;
            for (const item of resultsMap.values()) {
              if (item.photo_url === publicUrl || (item.challenge_date === fileDate && item.period === filePeriod)) {
                alreadyExists = true;
                break;
              }
            }

            if (!alreadyExists) {
              const synthesizedItem: CompletedChallengeItem = {
                id: file.id || file.name,
                challenge: 'Reto completado con éxito',
                photo_url: publicUrl,
                challenge_date: fileDate,
                period: filePeriod,
                completed_at: file.created_at || new Date().toISOString(),
                created_at: file.created_at || new Date().toISOString(),
              };
              resultsMap.set(file.name, synthesizedItem);
            }
          }
        }
      } catch (storageListErr) {
        console.warn('Storage list error:', storageListErr);
      }

      // 3. Fallback al Backend API si está vacío
      if (resultsMap.size === 0) {
        const token = await getAccessToken();
        if (token) {
          try {
            const res = await fetch(`${API_URL}/challenges/history`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const body = await res.json();
              if (body.history && body.history.length > 0) {
                for (const item of body.history) {
                  if (item.photo_url) {
                    resultsMap.set(item.id || `${item.challenge_date}_${item.period}`, item);
                  }
                }
              }
            }
          } catch (apiErr) {
            console.warn('API history error:', apiErr);
          }
        }
      }

      const list = Array.from(resultsMap.values()).sort((a, b) => {
        return (b.challenge_date || '').localeCompare(a.challenge_date || '');
      });

      return { challenges: list, error: null };
    } catch (err: any) {
      return { challenges: [], error: err.message || 'Error al obtener historial de retos' };
    }
  },

  /**
   * Obtener lista de fechas con retos completados para cálculo rápido de racha.
   */
  async getCompletedDates(): Promise<string[]> {
    try {
      const user = await getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('daily_challenges')
        .select('challenge_date')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (error || !data) return [];
      return Array.from(new Set(data.map((row: any) => row.challenge_date)));
    } catch {
      return [];
    }
  },
};