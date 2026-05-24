// ==========================================
// 🔗 1. MODELOS AUXILIARES (Relaciones)
// ==========================================
export interface GameMedia {
  id: number;
  type: 'cover' | 'screenshot' | 'trailer';
  source: 'igdb' | 'steam' | 'local';
  path: string;
  is_primary: boolean;
}

export interface Platform {
  id: number;
  name: string;
  family: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

// ==========================================
// 📦 2. ENTIDAD DE INVENTARIO MULTICONSONA
// ==========================================
export interface UserGameVersion {
  id: number;
  user_id: number;
  game_id: number;
  platform_id: number;
  store_id?: number | null;
  status: 'pendiente' | 'jugando' | 'completado' | 'abandonado';
  playtime_minutes: number;
  is_favorite: boolean;
  personal_rating: number;
  created_at?: string;
  updated_at?: string;
  platform?: Platform;
}

// ==========================================
// 🎮 3. LOS CONTEXTOS DEL JUEGO
// ==========================================
export interface GameSearchResult {
  external_id: string;
  title: string;
  cover_url: string;
  source: string;
  category: number;
  release_year?: string;
  in_library?: boolean;

}

export interface Game {
  id: number;
  igdb_id: number;
  name: string;
  slug: string;
  summary?: string;
  release_date?: string;
  rating?: number;
  igdb_user_rating: number;
  metacritic_score?: number;
  steam_rating?: SteamRating;
  media?: GameMedia[];
  platforms?: Platform[];
  genres?: Genre[];
  screenshots?: string[]; 
  time_to_beat?: any; 
}

export interface LibraryGame extends Game {
  // 🚀 ARQUITECTURA PURA: Mapeo directo de la relación de la Base de Datos
  inventory_entries: UserGameVersion[]; 
  has_notes: boolean;
  has_featured_notes: boolean;
}

export interface SteamRating {
  score: number;
  summary: string;
}