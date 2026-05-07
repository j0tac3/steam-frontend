import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SteamService { 
  private http = inject(HttpClient);
  private apiUrl: string = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  searchGames(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/games/search?q=${termino}`, {
      headers: this.getHeaders()
    });
  }

  getMyGames(status: string | null = null, platform: string | null = null, search: string = '', page: number = 1): Observable<any> {
    let params = new HttpParams().set('page', page.toString());
    
    if (status && status !== 'todos') params = params.set('status', status);
    if (platform && platform !== 'todas') params = params.set('platform', platform);
    if (search) params = params.set('search', search);

    return this.http.get<any>(`${this.apiUrl}/games`, {
      headers: this.getHeaders(),
      params
    });
  }

  getLibraryStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/stats`, {
      headers: this.getHeaders()
    });
  }

  saveGame(juego: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/games`, juego, {
      headers: this.getHeaders() 
    });
  }

  updateGame(id: number | string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/games/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteGame(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/games/${id}`, {
      headers: this.getHeaders() 
    });
  }
  
  updateStatus(id: number | string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/games/${id}/status`, { status }, {
      headers: this.getHeaders()
    });
  }

  updateGameDiario(gameId: number | string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/games/${gameId}/diario`, data, {
      headers: this.getHeaders()
    });
  }

  toggleFavorite(gameId: number | string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/games/${gameId}/favorite`, {}, {
      headers: this.getHeaders() 
    });
  }

  getRadarOfertas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/radar/ofertas`); 
  }

  getGameDetails(id: string | number, source: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/details/${id}?source=${source}`, {
      headers: this.getHeaders()
    });
  }

  updateUserPreferences(preferences: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/user/preferences`, preferences, {
      headers: this.getHeaders()
    });
  }
}