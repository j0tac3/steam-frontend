import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // 🚀 Importamos el environment

@Injectable({
  providedIn: 'root'
})
export class IgdbDataService {
  
  // 🚀 Construimos la base de la URL usando la variable dinámica
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  buscarJuegos(termino: string): Observable<any> {
    // 🚀 Usamos la variable en lugar de localhost
    const url = `${this.baseUrl}/buscar-en-igdb?nombre=${termino}`;
    return this.http.get(url);
  }

  getDetallePro(id: number): Observable<any> {
    // 🚀 Hacemos lo mismo para el detalle del juego
    const url = `${this.baseUrl}/igdb-details/${id}`;
    return this.http.get(url);
  }
}