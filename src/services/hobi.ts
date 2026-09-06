import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/api';

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export const HobiSocialService = {
  async getProfile() {
    try {
      const token = await getAccessToken();
      if (!token) return { profile: null, error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      return { profile: data, error: null };
    } catch (err: any) {
      return { profile: null, error: err.message || 'Error al obtener perfil' };
    }
  },

  async getFriends() {
    try {
      const token = await getAccessToken();
      if (!token) return { friends: [], error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      return { friends: data.friends || [], error: null };
    } catch (err: any) {
      return { friends: [], error: err.message || 'Error al obtener amigos' };
    }
  },

  async addFriend(friendCode: string) {
    try {
      const token = await getAccessToken();
      if (!token) return { error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/friends/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friend_code: friendCode }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || `Error ${res.status}`);
      }

      return { error: null, message: body.message };
    } catch (err: any) {
      return { error: err.message || 'Error al agregar amigo' };
    }
  },

  async respondFriend(friendshipId: string, action: 'accept' | 'reject') {
    try {
      const token = await getAccessToken();
      if (!token) return { error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/friends/respond`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendship_id: friendshipId, action }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || `Error ${res.status}`);
      }

      return { error: null, message: body.message };
    } catch (err: any) {
      return { error: err.message || 'Error al responder solicitud' };
    }
  },

  async getGroups() {
    try {
      const token = await getAccessToken();
      if (!token) return { groups: [], error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data = await res.json();
      return { groups: data.groups || [], error: null };
    } catch (err: any) {
      return { groups: [], error: err.message || 'Error al obtener grupos' };
    }
  },

  async createGroup(name: string, friendIds: string[]) {
    try {
      const token = await getAccessToken();
      if (!token) return { error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, friend_ids: friendIds }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || `Error ${res.status}`);
      }

      return { error: null, groupId: body.group_id };
    } catch (err: any) {
      return { error: err.message || 'Error al crear grupo' };
    }
  },

  async deleteGroup(groupId: string) {
    try {
      const token = await getAccessToken();
      if (!token) return { error: 'No hay sesión activa' };

      const res = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || `Error ${res.status}`);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Error al eliminar grupo' };
    }
  },
};
