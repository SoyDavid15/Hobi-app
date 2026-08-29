import { supabase } from '@/lib/supabase';

/**
 * Servicio de Autenticación con Supabase
 * Prioriza la seguridad y evita la filtración de datos sensibles en logs o respuestas.
 */

export const AuthService = {
  /**
   * Iniciar sesión con correo y contraseña
   */
  async signIn(email: string, pass: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (err: any) {
      // Registrar solo mensaje genérico para evitar filtración de información interna
      return { user: null, session: null, error: err.message || 'Error al iniciar sesión' };
    }
  },

  /**
   * Registrar un nuevo usuario con correo, contraseña y nombre de usuario (máx 8 caracteres)
   */
  async signUp(email: string, pass: string, username: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (err: any) {
      return { user: null, session: null, error: err.message || 'Error al registrar usuario' };
    }
  },

  /**
   * Cerrar sesión actual de forma segura
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Error al cerrar sesión' };
    }
  },

  /**
   * Obtener sesión activa actual
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, error: null };
    } catch (err: any) {
      return { session: null, error: err.message || 'Error al obtener sesión' };
    }
  },
};
