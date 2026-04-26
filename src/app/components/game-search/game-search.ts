import { Component, Output, input, EventEmitter, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamService } from '../../services/steam';
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

  // ==========================================
  // ESTADO DE PAGINACIÓN
  // ==========================================
  paginaActual = signal<number>(1);
  elementosPorPagina = signal<number>(8);

  // 🔥 SOLUCIÓN: Calculamos 'yaLoTengo' de forma reactiva comprobando contra 'misJuegos()'
  resultadosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina();
    const fin = inicio + this.elementosPorPagina();
    const pagina = (this.searchResults() || []).slice(inicio, fin);

    const bibliotecaActual = this.misJuegos() || [];

    return pagina.map(game => ({
      ...game,
      yaLoTengo: bibliotecaActual.some(m => String(m.steam_appid) === String(game.appid))
    }));
  });

  totalPaginas = computed(() => {
    const total = (this.searchResults() || []).length;
    return Math.ceil(total / this.elementosPorPagina()) || 1;
  });

  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  @Output() addGame = new EventEmitter<any>();
  @Output() viewDetails = new EventEmitter<any>();

  // ==========================================
  // MÉTODOS DE BÚSQUEDA Y CONTROL
  // ==========================================
  cambiarMotor() {
    this.motorBusqueda.set(this.motorBusqueda() === 'igdb' ? 'steam' : 'igdb');
    this.limpiar();
  }

  buscar(termino: string) {
    if (!termino.trim()) return;

    this.cargando.set(true);
    this.searchResults.set([]);
    this.paginaActual.set(1); 

    const search$ = this.motorBusqueda() === 'igdb'
      ? this.steamService.buscarEnIGDB(termino)
      : this.steamService.getGames(termino);

    search$.subscribe({
      next: (res: any) => {
        const juegosRaw = Array.isArray(res) ? res : (res.data || []);

        const resultadosMapeados = juegosRaw.map((j: any) => {
          const idActual = this.motorBusqueda() === 'igdb' ? j.id : j.appid;
          
          const finalUrl = this.motorBusqueda() === 'igdb' 
            ? (j.cover?.url ? this.steamService.formatIgdbImageUrl(j.cover.url, 't_cover_big') : 'assets/no-image.png')
            : (j.logo || j.header_image);

          return {
            name: j.name || j.title || 'Juego desconocido',
            appid: idActual,
            logo: finalUrl,
            image_url: finalUrl,
            es_igdb: this.motorBusqueda() === 'igdb',
            source: this.motorBusqueda()
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
    this.paginaActual.set(1);
  }

  // ==========================================
  // MÉTODOS DE PAGINACIÓN Y UX
  // ==========================================
  private hacerScrollArriba() {
    const contenedor = document.querySelector('.premium-layout-wrapper');
    if (contenedor) {
      contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  irAPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.hacerScrollArriba();
    }
  }

  siguientePagina() {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.set(this.paginaActual() + 1);
      this.hacerScrollArriba();
    }
  }

  paginaAnterior() {
    if (this.paginaActual() > 1) {
      this.paginaActual.set(this.paginaActual() - 1);
      this.hacerScrollArriba();
    }
  }
}