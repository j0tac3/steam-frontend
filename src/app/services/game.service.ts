import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GameService { 
  private http = inject(HttpClient);
  private apiUrl: string = environment.apiUrl;
  public juegoSincronizado$ = new Subject<void>();
  public sincronizacionTerminada$ = new Subject<void>();

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

/*   searchGames(term: string, category: string): Observable<any[]> {

    const params = new HttpParams()
      .set('q', term)
      .set('category', category);

    return this.http.get<any[]>(`${this.apiUrl}/games/search`, { params });
  } */

  searchGames(termino: string, category: string = 'todas'): Observable<any[]> {
    // category puede ser "juego", "dlc", "juego,dlc" o "todas"
    return this.http.get<any[]>(`${this.apiUrl}/games/search?q=${termino}&category=${category}`, {      
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
  
  updateStatus(id: number | string, data: any) {
    // 🚀 CAMBIAMOS .put POR .patch
    return this.http.patch(`${this.apiUrl}/games/${id}/status`, data);
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

  updateUserPreferences(prefs: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/user/preferences`, prefs, {
      headers: this.getHeaders() // 🚀 ¡ESTA ES LA LLAVE QUE FALTABA!
    });
  }

  getPublicGames(username: string, status: string = 'todos', platform: string = 'todas', search: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('status', status)
      .set('platform', platform);
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get(`${this.apiUrl}/public/profile/${username}`, { params });
  }

  getAdvancedStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/advanced`);
  }

  getDiscoverFeed(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/discover/feed`);
  }

  setPrimaryCover(gameId: number | string, mediaId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/games/${gameId}/primary-cover`, { media_id: mediaId }, {
      headers: this.getHeaders() 
    });
  }
}