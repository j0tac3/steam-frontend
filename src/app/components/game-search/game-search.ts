import { Component, Output, input, EventEmitter, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { IconComponent } from '../icon/icon';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card';
import { CardCleanComponent } from '../../sandbox/card-clean/card-clean';

// 🚀 IMPORTAMOS LOS NUEVOS MODELOS LIMPIOS
import { GameSearchResult, LibraryGame } from '../../models/game'; 

// Interfaz extendida solo para esta vista (añade el chivato "yaLoTengo")
export interface SearchResultView extends GameSearchResult {
  yaLoTengo?: boolean;
}

@Component({
  selector: 'app-game-search',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonCardComponent, CardCleanComponent],
  templateUrl: './game-search.html',
  styleUrl: './game-search.scss'
})
export class GameSearchComponent {
  private gameService = inject(GameService);
  
  public isPanelExpanded = signal<boolean>(true);
  public searchCategory: string = 'juego';

  // 🚀 ACTUALIZAMOS LOS TIPOS
  searchResults = signal<GameSearchResult[]>([]);
  cargando = signal<boolean>(false);
  misJuegos = input<LibraryGame[]>([]); // 🚀 Ahora sabe que recibe juegos de BD
  busquedaRealizada = signal<boolean>(false);

  paginaActual = signal<number>(1);
  elementosPorPagina = signal<number>(10);

  // 🚀 LOS EMISORES AHORA ENVÍAN GameSearchResult AL PADRE
  @Output() addGame = new EventEmitter<GameSearchResult>();
  @Output() viewDetails = new EventEmitter<GameSearchResult>();
  @Output() notificar = new EventEmitter<{mensaje: string, tipo: 'success' | 'error' | 'warning'}>();

  esqueletosArray = computed(() => new Array(this.elementosPorPagina()).fill(0));

  resultadosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina();
    const fin = inicio + this.elementosPorPagina();
    const pagina = (this.searchResults() || []).slice(inicio, fin);
    const bibliotecaActual = this.misJuegos() || [];

    return pagina.map(game => ({
      ...game,
      // 🚀 EL GRAN FIX: Comparamos el ID de IGDB de la biblioteca con el external_id de la búsqueda
      yaLoTengo: bibliotecaActual.some(m => String(m.igdb_id) === String(game.external_id))
    })) as SearchResultView[];
  });

  totalPaginas = computed(() => {
    const total = (this.searchResults() || []).length;
    return Math.ceil(total / this.elementosPorPagina()) || 1;
  });

  paginasArray = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  togglePanel() {
    this.isPanelExpanded.update(v => !v);
  }

  buscar(termino: string, autoCollapse: boolean = true) {
    if (!termino.trim()) return;

    this.cargando.set(true);
    this.searchResults.set([]);
    this.paginaActual.set(1); 
    this.busquedaRealizada.set(false);

    this.gameService.searchGames(termino, this.searchCategory).subscribe({
      next: (res: GameSearchResult[]) => {
        this.searchResults.set(res || []);
        this.busquedaRealizada.set(true);
        this.cargando.set(false);
        
        if (autoCollapse) {
          this.isPanelExpanded.set(false);
        }

        if (this.searchResults().length === 0) {
          this.notificar.emit({ mensaje: `No se encontró ningún juego llamado "${termino}"`, tipo: 'warning' });
        }
      },
      error: (err) => {
        console.error('Error en búsqueda:', err);
        this.cargando.set(false);
        this.notificar.emit({ mensaje: 'Error de conexión con el servidor', tipo: 'error' });
      }
    });
  }

  limpiar(inputEl: HTMLInputElement) {
    this.searchResults.set([]);
    this.paginaActual.set(1);
    this.busquedaRealizada.set(false);
    
    if (inputEl) {
      inputEl.value = '';
    }
  }

  private hacerScrollArriba() {
    const contenedor = document.querySelector('.premium-layout-wrapper');
    if (contenedor) contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  setCategory(cat: string, inputEl: HTMLInputElement) {
    this.searchCategory = cat;
    const textoActual = inputEl?.value?.trim();
    
    if (textoActual && textoActual !== '') {
      this.buscar(textoActual, false);
    }
  }
}