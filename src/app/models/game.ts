export type GameStatus = 'pendiente' | 'jugando' | 'completado' | 'abandonado';
export type GameSource = 'steam' | 'igdb';

export interface Game {
  id?: number;                  // ID interno de tu base de datos
  title?: string;               // Título en tu base de datos
  name?: string;                // Nombre que viene de la API de Steam/IGDB
  appid?: number;               // ID original de la API
  steam_appid?: string;         // ID guardado en tu base de datos
  image_url?: string;           // URL de la portada en tu DB
  logo?: string;                // URL de la portada en la API
  status?: GameStatus;          // Estado actual en la biblioteca
  personal_rating?: number;     // Puntuación del 1 al 10
  notes?: string;               // Notas del diario
  start_date?: string;          // Fecha en la que se empezó a jugar
  source?: GameSource;          // Origen de los datos
  es_igdb?: boolean;            // Flag temporal usado en las búsquedas
  yaLoTengo?: boolean;          // Flag dinámico usado en el buscador
}