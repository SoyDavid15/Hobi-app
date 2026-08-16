import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';

/**
 * Servicio de Hobbies vía API backend
 * El backend valida la sesión y persiste en Supabase por usuario.
 */

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export const HobbyService = {
  /**
   * Obtener los hobbies guardados del usuario autenticado
   */
  async getHobbies() {
    try {
      const token = await getAccessToken();
      if (!token) return { hobbies: [], error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/hobbies`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      return { hobbies: data.hobbies, error: null };
    } catch (err: any) {
      return { hobbies: [], error: err.message || 'Error al cargar hobbies' };
    }
  },

  /**
   * Añadir un hobby al usuario autenticado
   */
  async addHobby(hobbyId: string) {
    try {
      const token = await getAccessToken();
      if (!token) return { error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/hobbies/${hobbyId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Error al guardar hobby' };
    }
  },

  /**
   * Eliminar un hobby del usuario autenticado
   */
  async removeHobby(hobbyId: string) {
    try {
      const token = await getAccessToken();
      if (!token) return { error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/hobbies/${hobbyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Error al eliminar hobby' };
    }
  },
};