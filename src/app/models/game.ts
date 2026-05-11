export interface Game {
  external_id: string;
  source: string;
  title: string;
  cover_url: string | null;
  category?: number;
}