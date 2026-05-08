import { Game } from './game';

export interface SavedGame extends Game {
  id: number; // El ID interno de tu tabla en MySQL
  status: 'pendiente' | 'jugando' | 'completado' | 'abandonado';
  notes?: string | null;
  personal_rating: number;
  start_date?: string | null;
  platform?: string | null;
  is_favorite: boolean;
  created_at?: string;
  updated_at?: string;

  has_notes?: boolean;
  has_featured_notes?: boolean;
}