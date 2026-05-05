import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; //

@Injectable({ providedIn: 'root' })
// Sugerencia: Renombra la clase a GameService (y el archivo a game.service.ts)
// ya que Steam ya no es el centro de tu app.
export class SteamService { 
  private apiUrl: string = environment.apiUrl; //[cite: 7]

  constructor(private http: HttpClient) {}

  /**
   * Genera las cabeceras con el Token de autenticación[cite: 7]
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // --- 1. BUSCADOR CENTRALIZADO ---
  searchGames(termino: string): Observable<any[]> {
    // Angular solo llama a tu Laravel, y Laravel se encarga de IGDB
    return this.http.get<any[]>(`${this.apiUrl}/games/search?q=${termino}`, {
      headers: this.getHeaders()
    });
  }

  // --- 2. GESTIÓN DE MI BIBLIOTECA ---
  getMyGames(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/games`, {
      headers: this.getHeaders() //[cite: 7]
    });
  }

  saveGame(juego: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/games`, juego, {
      headers: this.getHeaders() //[cite: 7]
    });
  }

  deleteGame(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/games/${id}`, {
      headers: this.getHeaders() //[cite: 7]
    });
  }

  // --- 3. ACTUALIZACIONES PARCIALES (PATCH) ---
  
  updateStatus(id: number, status: string): Observable<any> {
    // Cambiado a PATCH y añadidos los headers correctos[cite: 7]
    return this.http.patch(`${this.apiUrl}/games/${id}/status`, { status }, {
      headers: this.getHeaders()
    });
  }

  updateGameDiario(gameId: number | string, data: any): Observable<any> {
    // Añadidos los headers que faltaban[cite: 7]
    return this.http.patch(`${this.apiUrl}/games/${gameId}/diario`, data, {
      headers: this.getHeaders()
    });
  }

  toggleFavorite(gameId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/games/${gameId}/favorite`, {}, {
      headers: this.getHeaders() //[cite: 7]
    });
  }

  // --- 4. EXTRAS ---
  getRadarOfertas(): Observable<any[]> {
    // Esta ruta es pública, no necesita token[cite: 7]
    return this.http.get<any[]>(`${this.apiUrl}/radar/ofertas`); 
  }

  // --- 5. DETALLES DEL JUEGO (Laravel Orquestador) ---
  getGameDetails(id: string | number, source: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/games/details/${id}?source=${source}`, {
      headers: this.getHeaders()
    });
  }

  updateGame(id: number | string, data: any): Observable<any> {
    // IMPORTANTE: Aquí se usa PUT o PATCH, no POST.
    return this.http.put(`${this.apiUrl}/games/${id}`, data);
  }
}