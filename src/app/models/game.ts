export type GameStatus = 'pendiente' | 'jugando' | 'completado' | 'abandonado';
export type GameSource = 'steam' | 'igdb' | string;

export interface Game {
  id?: number;
  title?: string;
  name?: string;
  appid?: number;
  steam_appid?: string;
  image_url?: string;
  logo?: string;
  status?: GameStatus;
  personal_rating?: number;
  notes?: string;
  start_date?: string;
  source?: GameSource;
  es_igdb?: boolean;
  yaLoTengo?: boolean;
  
  // --- NUEVAS PROPIEDADES DE LAS APIs (Steam / IGDB) ---
  background?: string;
  genres?: any[]; 
  summary?: string; 
  description?: string; 
  detailed_description?: string; 
  about_the_game?: string;
}