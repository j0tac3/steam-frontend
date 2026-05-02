export interface IgdbGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  
  // Objetos anidados
  cover?: {
    id: number;
    url?: string;
    image_id?: string;
  };

  // 🚀 AÑADIMOS ESTO PARA QUITAR EL ERROR
  screenshots?: {
    id: number;
    image_id: string;
  }[];

  artworks?: {
    id: number;
    image_id: string;
  }[];

  genres?: {
    id: number;
    name: string;
  }[];

  game_modes?: {
    id: number;
    name: string;
  }[];

  platforms?: {
    id: number;
    name: string;
  }[];

  videos?: {
    id: number;
    name: string;
    video_id: string;
  }[];
}