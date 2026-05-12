// 1. Interfaces Auxiliares para Datos Relacionales
export interface GameImage {
  id?: number;
  url: string;
  image_id?: string; // Útil si quieres pedir imágenes en alta resolución a IGDB
}

export interface GenericEntity {
  id: number;
  name: string;
}

export interface GameCompany {
  id?: number;
  company: GenericEntity;
  developer: boolean;
  publisher: boolean;
}

export interface GameWebsite {
  id?: number;
  category: number; // IGDB usa números para saber si es Steam, Twitter, Wiki...
  url: string;
}

export interface SimilarGame {
  id: number;
  name: string;
  cover?: GameImage;
}

// 2. 🚀 MODELO PRINCIPAL DE JUEGO (God Mode)
export interface Game {
  // --- CAMPOS BÁSICOS (Usados en la lista de búsqueda) ---
  external_id: string;
  source: string;
  title: string;
  cover_url: string | null;
  category?: number;
  parent_game?: string;
  yaLoTengo?: boolean; // Propiedad que calculas dinámicamente en el frontend

  // --- CAMPOS DETALLADOS (Usados solo al ver la Ficha Completa) ---
  
  // Textos y Fechas
  summary?: string;
  release_year?: string;
  storyline?: string;
  first_release_date?: number; // IGDB lo envía como Unix Timestamp (segundos)
  
  // Notas
  rating?: number;             // Nota media de los usuarios (0 - 100)
  rating_count?: number;       // Número de usuarios que han votado
  aggregated_rating?: number;  // Nota media de la prensa (0 - 100)
  
  // Multimedia
  artworks?: GameImage[];
  screenshots?: GameImage[];
  
  // Etiquetas (IGDB las devuelve como un array de objetos con id y name)
  genres?: GenericEntity[];
  platforms?: GenericEntity[];
  game_modes?: GenericEntity[];
  themes?: GenericEntity[];
  player_perspectives?: GenericEntity[];

  // Compañías y Enlaces
  involved_companies?: GameCompany[];
  websites?: GameWebsite[];

  // Recomendaciones
  similar_games?: SimilarGame[];
}