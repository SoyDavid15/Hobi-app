import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';

/**
 * Servicio de Retos diarios vía API backend
 * El backend genera el reto según los hobbies del usuario autenticado.
 */

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export const ChallengeService = {
  /**
   * Obtener el reto diario generado según los hobbies del usuario
   */
  async getChallenge() {
    try {
      const token = await getAccessToken();
      if (!token) return { challenge: null, error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/message`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      return { challenge: data.message ?? null, error: null };
    } catch (err: any) {
      return { challenge: null, error: err.message || 'Error al cargar el reto' };
    }
  },
};