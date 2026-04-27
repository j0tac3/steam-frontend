import { Component, Output, input, EventEmitter, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamService } from '../../services/steam';
import { SearchGameCardComponent } from '../search-game-card/search-game-card';
import { IconComponent } from '../icon/icon';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card';
import { Game } from '../../models/game';

@Component({
  selector: 'app-game-search',
  standalone: true,
  imports: [CommonModule, 
            SearchGameCardComponent,
            IconComponent,
            SkeletonCardComponent
          ],
  templateUrl: './game-search.html',
  styleUrl: './game-search.scss'
})
export class GameSearchComponent {
  private steamService = inject(SteamService);

  motorBusqueda = signal<'igdb' | 'steam'>('igdb');
  searchResults = signal<Game[]>([]);
  cargando = signal<boolean>(false);
  misJuegos = input<any[]>([]);
  
  // NUEVO: Controlamos si ya se ha hecho al menos una búsqueda
  busquedaRealizada = signal<boolean>(false);

  // ESTADO DE PAGINACIÓN
  paginaActual = signal<number>(1);
  elementosPorPagina = signal<number>(10);

  @Output() addGame = new EventEmitter<Game>();
  @Output() viewDetails = new EventEmitter<Game>();
  
  // NUEVO: Emisor para conectar con el sistema de Toasts de la biblioteca
  @Output() notificar = new EventEmitter<{mensaje: string, tipo: 'success' | 'error' | 'warning'}>();

  // NUEVO: Crea un array vacío del tamaño exacto de tus elementos por página
  esqueletosArray = computed(() => new Array(this.elementosPorPagina()).fill(0));

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

  // MÉTODOS DE BÚSQUEDA Y CONTROL
  cambiarMotor() {
    this.motorBusqueda.set(this.motorBusqueda() === 'igdb' ? 'steam' : 'igdb');
    this.limpiar();
  }

  buscar(termino: string) {
    if (!termino.trim()) return;

    this.cargando.set(true);
    this.searchResults.set([]);
    this.paginaActual.set(1); 
    this.busquedaRealizada.set(false); // Reiniciamos el estado al empezar a buscar

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
        this.busquedaRealizada.set(true); // Marcamos que la búsqueda ha finalizado
        this.cargando.set(false);

        // NUEVO: Si no hay resultados, avisamos al Toast del padre
        if (resultadosMapeados.length === 0) {
          this.notificar.emit({ 
            mensaje: `No se encontró ningún juego llamado "${termino}" en ${this.motorBusqueda().toUpperCase()}`, 
            tipo: 'warning' 
          });
        }
      },
      error: (err) => {
        console.error('Error en búsqueda:', err);
        this.cargando.set(false);
        this.notificar.emit({ mensaje: 'Error de conexión al buscar', tipo: 'error' });
      }
    });
  }

  limpiar() {
    this.searchResults.set([]);
    this.paginaActual.set(1);
    this.busquedaRealizada.set(false);
  }

  // MÉTODOS DE PAGINACIÓN Y UX
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