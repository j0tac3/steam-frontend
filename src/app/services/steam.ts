import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importamos HttpHeaders
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SteamService {
  private myAppUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Función privada para generar las cabeceras.
   * Esto añade el Token y evita el error de CORS.
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Recuperamos el token guardado al loguear
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 1. Buscar juegos
  getGames(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.myAppUrl}/steam/search?q=${termino}`, {
      headers: this.getHeaders()
    });
  }

  // 2. Obtener MI biblioteca (Aquí es donde te daba el error)
  getMyGames(): Observable<any[]> {
    return this.http.get<any[]>(`${this.myAppUrl}/games`, {
      headers: this.getHeaders() // Enviamos el token
    });
  }

  // 3. Guardar un juego
  saveGame(juego: any): Observable<any> {
    return this.http.post(`${this.myAppUrl}/games`, juego, {
      headers: this.getHeaders()
    });
  }

  // 4. Borrar un juego
  deleteGame(id: number): Observable<any> {
    return this.http.delete(`${this.myAppUrl}/games/${id}`, {
      headers: this.getHeaders()
    });
  }

  // 5. Actualizar estado
 // En services/steam.ts
  updateStatus(id: number, status: string): Observable<any> {
    // Cambiamos .patch por .put
    return this.http.put(`${this.myAppUrl}/games/${id}`, { status });
  }

  // 6. Detalles del juego
  getGameDetails(appid: string): Observable<any> {
    return this.http.get(`${this.myAppUrl}/steam/details/${appid}`, {
      headers: this.getHeaders()
    });
  }


// 1b. Buscar juegos en IGDB
  buscarEnIGDB(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.myAppUrl}/igdb/buscar?nombre=${termino}`);
  }

  buscarJuegosIGDB(nombre: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.myAppUrl}/igdb/buscar?nombre=${nombre}`).pipe(
    //tap((res: any) => console.log('📦 Respuesta completa de IGDB:', res))
    tap((res: any) => console.log('', res))
    // El 'tap' permite ver el log sin alterar el flujo de datos
  );
}

  // Obtener detalles extendidos desde IGDB (vía nuestro backend)
  getIgdbDetails(id: string | number): Observable<any> {
    return this.http.get<any>(`${this.myAppUrl}/igdb-details/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateGameDiario(gameId: number | string, data: any): Observable<any> {
    return this.http.patch(`${this.myAppUrl}/games/${gameId}/diario`, data);
  }

  /**
   * UTILIDAD: Limpiador de portadas de IGDB
   * IGDB devuelve miniaturas por defecto. Este método cambia el tamaño
   */
  formatIgdbImageUrl(url: string, size: string = 't_cover_big'): string {
    if (!url) return 'assets/no-image.png';
    // Cambiamos t_thumb por el tamaño deseado y aseguramos el https:
    return 'https:' + url.replace('t_thumb', size);
  }

}