/**
 * Sistema de racha diaria de Hobi.
 *
 * Reglas de negocio:
 * - Un día "cumplido" tiene al menos 1 reto completado (turno AM o PM).
 * - La racha se ancla en HOY si ya hay reto completado hoy; si no, en AYER
 *   (la racha sigue viva mientras el usuario aún pueda completar el reto de hoy).
 * - Si ni hoy ni ayer tienen retos completados, la racha es 0 (cadena rota).
 * - Todas las fechas son locales del dispositivo (YYYY-MM-DD), nunca UTC,
 *   consistente con `getCurrentSlot()` de `services/challenges.ts`.
 */

/**
 * Formatea una fecha como YYYY-MM-DD usando la hora LOCAL del dispositivo.
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parsea una fecha 'YYYY-MM-DD' como mediodía LOCAL.
 * El mediodía evita que las transiciones de horario de verano (que ocurren
 * de madrugada) desplacen el día al sumar/restar fechas.
 */
function parseLocalNoon(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00`);
}

/**
 * Calcula la racha de días consecutivos con al menos un reto completado.
 *
 * @param completedDates Fechas 'YYYY-MM-DD' con al menos un reto completado (pueden repetirse).
 * @param today Fecha local de hoy 'YYYY-MM-DD' (por defecto, la fecha actual del dispositivo).
 * @returns Días consecutivos de la racha activa; 0 si la cadena está rota.
 */
export function calculateStreak(
  completedDates: string[],
  today: string = formatLocalDate(new Date())
): number {
  const days = new Set(completedDates.filter(Boolean));
  if (days.size === 0) return 1;

  // Ancla: hoy si se completó algo hoy; si no, ayer (racha viva); si no, racha rota.
  const cursor = parseLocalNoon(today);
  if (!days.has(formatLocalDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(formatLocalDate(cursor))) {
      return 1;
    }
  }

  let streak = 0;
  while (days.has(formatLocalDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return Math.max(streak, 1);
}
