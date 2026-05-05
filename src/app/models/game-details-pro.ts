export interface GameDetailsPro {
  id: string | number;
  name: string;
  coverUrl: string;
  criticScore?: number;
  criticScoreCount?: number;
  userScore?: number;
  userScoreCount?: number;
  genres: string[];        // Array de strings directamente
  gameModes: string[];     // Array de strings directamente
  platforms: string[];     // Array de strings directamente
  releaseDate?: number;    // Timestamp
  summary?: string;
  screenshots: string[];   // Arrays con las URLs ya completas
}