import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JournalEntry {
  id?: number;
  game_id?: number;
  content: string;
  is_featured: boolean;
  created_at?: string;
  updated_at?: string;
  // Propiedades locales exclusivas del frontend para la interfaz:
  isEditing?: boolean; 
  originalContent?: string; // 🚀 AÑADE ESTA LÍNEA
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  private http = inject(HttpClient);
  private apiUrl: string = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 1. Obtener todas las notas de un juego
  getEntries(gameId: number | string): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}/games/${gameId}/journal`, {
      headers: this.getHeaders()
    });
  }

  // 2. Crear una nota nueva
  createEntry(gameId: number | string, content: string, isFeatured: boolean = false): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/games/${gameId}/journal`, 
      { content, is_featured: isFeatured }, 
      { headers: this.getHeaders() }
    );
  }

  // 3. Editar el texto o la estrella de una nota
  updateEntry(entryId: number | string, data: { content?: string; is_featured?: boolean }): Observable<JournalEntry> {
    return this.http.patch<JournalEntry>(`${this.apiUrl}/journal/${entryId}`, data, {
      headers: this.getHeaders()
    });
  }

  // 4. Borrar una nota
  deleteEntry(entryId: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/journal/${entryId}`, {
      headers: this.getHeaders()
    });
  }
}