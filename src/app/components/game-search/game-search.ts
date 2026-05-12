import { Component, Output, input, EventEmitter, signal, inject, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamService } from '../../services/steam';
import { IconComponent } from '../icon/icon';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card';
import { Game } from '../../models/game'; 
import { CardCleanComponent } from '../../sandbox/card-clean/card-clean';

@Component({
  selector: 'app-game-search',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonCardComponent, CardCleanComponent],
  templateUrl: './game-search.html',
  styleUrl: './game-search.scss'
})
export class GameSearchComponent {
  private gameService = inject(SteamService);
  
  // 🚀 Usamos viewChild de Angular 17+ en lugar del antiguo @ViewChild
  public cajaBusqueda = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // 🚀 Por defecto buscamos 'juego' (o 'todas', según prefieras)
  public searchCategory: string = 'juego';

  searchResults = signal<Game[]>([]);
  cargando = signal<boolean>(false);
  misJuegos = input<any[]>([]); 
  busquedaRealizada = signal<boolean>(false);

  paginaActual = signal<number>(1);
  elementosPorPagina = signal<number>(10);

  @Output() addGame = new EventEmitter<Game>();
  @Output() viewDetails = new EventEmitter<Game>();
  @Output() notificar = new EventEmitter<{mensaje: string, tipo: 'success' | 'error' | 'warning'}>();

  esqueletosArray = computed(() => new Array(this.elementosPorPagina()).fill(0));

  resultadosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina();
    const fin = inicio + this.elementosPorPagina();
    const pagina = (this.searchResults() || []).slice(inicio, fin);
    const bibliotecaActual = this.misJuegos() || [];

    return pagina.map(game => ({
      ...game,
      yaLoTengo: bibliotecaActual.some(m => String(m.external_id) === String(game.external_id))
    }));
  });

  totalPaginas = computed(() => {
    const total = (this.searchResults() || []).length;
    return Math.ceil(total / this.elementosPorPagina()) || 1;
  });

  paginasArray = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));


  buscar(termino: string) {
    if (!termino.trim()) return;

    this.cargando.set(true);
    this.searchResults.set([]);
    this.paginaActual.set(1); 
    this.busquedaRealizada.set(false);

    this.gameService.searchGames(termino, this.searchCategory).subscribe({
      next: (res: Game[]) => {
        this.searchResults.set(res || []);
        this.busquedaRealizada.set(true);
        this.cargando.set(false);

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

  limpiar() {
    this.searchResults.set([]);
    this.paginaActual.set(1);
    this.busquedaRealizada.set(false);
    
    // 🚀 Limpiamos visualmente la caja de texto accediendo a la Signal
    const inputEl = this.cajaBusqueda();
    if (inputEl) {
      inputEl.nativeElement.value = '';
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

  // 🚀 Método que es llamado desde los botones y lanza la búsqueda si ya había texto
  setCategory(cat: string) {
    this.searchCategory = cat;
    
    const textoActual = this.cajaBusqueda()?.nativeElement?.value?.trim();
    
    if (textoActual && textoActual !== '') {
      this.buscar(textoActual);
    }
  }
}