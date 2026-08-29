/**
 * Frases motivacionales para el modal de reto completado en Hobi.
 */

const MOTIVATIONAL_QUOTES = [
  'Cada pequeño paso te acerca a tu mejor versión.',
  'La constancia construye grandes resultados. ¡Sigue así!',
  'Tu futuro yo te lo agradece.',
  'Un hábito a la vez transforma tu vida.',
  'Elegiste el crecimiento por encima del doomscroll.',
  'La disciplina es elegir entre lo que quieres ahora y lo que quieres más.',
  '¡Qué gran momento para invertir en ti!',
  'Un día más sumando a tu bienestar y enfoque.',
];

/**
 * Retorna una frase motivacional seleccionada al azar del pool.
 */
export function getRandomMotivationalMessage(): string {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}
