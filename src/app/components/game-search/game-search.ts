import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamService } from '../../services/steam'; // Ajustado a tu ruta
import { SearchGameCardComponent } from '../search-game-card/search-game-card';

@Component({
  selector: 'app-game-search',
  standalone: true,
  imports: [CommonModule, SearchGameCardComponent],
  templateUrl: './game-search.html',
  styleUrl: './game-search.scss'
})
export class GameSearchComponent {
  private steamService = inject(SteamService);

  motorBusqueda = signal<'igdb' | 'steam'>('igdb');
  searchResults = signal<any[]>([]);
  cargando = signal<boolean>(false);

  @Output() addGame = new EventEmitter<any>();
  @Output() viewDetails = new EventEmitter<any>();

  buscar(termino: string) {
    if (!termino.trim()) return;

    this.cargando.set(true);
    this.searchResults.set([]);

    // Usamos los mismos métodos que tenías en tu biblioteca original
    const search$ = this.motorBusqueda() === 'igdb'
      ? this.steamService.buscarEnIGDB(termino)
      : this.steamService.getGames(termino);

    search$.subscribe({
      next: (res: any) => {
        // Obtenemos el array de juegos (manejando si viene en .data o directo)
        const juegosRaw = Array.isArray(res) ? res : (res.data || []);

        const resultadosMapeados = juegosRaw.map((j: any) => {
          if (this.motorBusqueda() === 'igdb') {
            // Mapeo exacto que tenías para IGDB
            const finalUrl = j.cover?.url 
              ? this.steamService.formatIgdbImageUrl(j.cover.url, 't_cover_big') 
              : 'assets/no-image.png';

            return {
              name: j.name,
              appid: j.id,       // IGDB ID como appid
              logo: finalUrl,    // Para tu vista
              image_url: finalUrl, // 🔥 FUNDAMENTAL: Para que Laravel no dé error 500
              es_igdb: true,
              source: 'igdb'
            };
          } else {
            // Mapeo exacto que tenías para Steam
            return {
              name: j.name,
              appid: j.appid,
              logo: j.logo,
              image_url: j.logo, // 🔥 FUNDAMENTAL: Para Laravel
              es_igdb: false,
              source: 'steam'
            };
          }
        });

        this.searchResults.set(resultadosMapeados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error en búsqueda:', err);
        this.cargando.set(false);
      }
    });
  }

  limpiar() {
    this.searchResults.set([]);
  }
}