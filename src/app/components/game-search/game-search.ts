import { Component, Output, input, EventEmitter, signal, inject } from '@angular/core';
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
  misJuegos = input<any[]>([]);

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
        const juegosRaw = Array.isArray(res) ? res : (res.data || []);

        const resultadosMapeados = juegosRaw.map((j: any) => {
          const idActual = this.motorBusqueda() === 'igdb' ? j.id : j.appid;
          
          // 🔥 LÓGICA DE DUPLICADOS:
          // Comprobamos si el ID existe en nuestra biblioteca actual
          const yaLoTengo = this.misJuegos().some(m => 
            String(m.steam_appid) === String(idActual)
          );

          const finalUrl = this.motorBusqueda() === 'igdb' 
            ? (j.cover?.url ? this.steamService.formatIgdbImageUrl(j.cover.url, 't_cover_big') : 'assets/no-image.png')
            : (j.logo || j.header_image);

          return {
            name: j.name,
            appid: idActual,
            logo: finalUrl,
            image_url: finalUrl,
            es_igdb: this.motorBusqueda() === 'igdb',
            source: this.motorBusqueda(),
            yaLoTengo: yaLoTengo // <-- Nueva propiedad booleana
          };
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