import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IgdbGame } from '../interfaces/igdb';

@Injectable({
  providedIn: 'root'
})
export class IgdbDataService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  buscarJuegos(nombre: string): Observable<IgdbGame[]> {
    return this.http.get<IgdbGame[]>(`${this.apiUrl}/buscar-en-igdb`, { params: { nombre } });
  }

  getDetallePro(id: number): Observable<IgdbGame> {
    return this.http.get<IgdbGame>(`${this.apiUrl}/igdb-details/${id}`);
  }
}