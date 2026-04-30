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

  cover?: {
    id: number;
    image_id: string;
  };

  genres?: Array<{ id: number; name: string }>;
  platforms?: Array<{ id: number; name: string }>;
  
  videos?: Array<{
    id: number;
    name: string;
    video_id: string;
  }>;
}