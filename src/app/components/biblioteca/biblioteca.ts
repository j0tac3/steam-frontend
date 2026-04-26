import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamService } from '../../services/steam';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { GameModalComponent } from '../game-modal/game-modal';
import { GameCardComponent } from '../game-card/game-card';
import { StatsPanelComponent } from '../stats-panel/stats-panel';
import { SearchGameCardComponent } from '../search-game-card/search-game-card';
import { GameSearchComponent } from '../game-search/game-search';
import { GameFiltersComponent } from '../game-filters/game-filters';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [
    CommonModule,
    GameModalComponent,
    GameCardComponent,
    StatsPanelComponent,
    GameSearchComponent,
    GameFiltersComponent
  ],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss',
})
export class BibliotecaComponent implements OnInit {
  public searchResults = signal<any[]>([]);
  public myLibrary = signal<any[]>([]);

  private authService = inject(AuthService);
  private router = inject(Router);
  private steamService = inject(SteamService);

  // Señales para los filtros y ordenación
  filtroTexto = signal('');
  filtroEstado = signal('todos');
  criterioOrden = signal<'nombre' | 'rating' | 'reciente'>('nombre');

  // Control del modal
  juegoDetalle = signal<any>(null);
  cargandoDetalle = signal(false);

  ngOnInit() {
    this.cargarBiblioteca();
  }

  cargarBiblioteca() {
    this.steamService.getMyGames().subscribe({
      next: (juegos) => {
        this.myLibrary.set(juegos);
      },
      error: (err) => console.error('Error al cargar biblioteca:', err)
    });
  }

  // Lógica reactiva de filtrado y ordenación
  bibliotecaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const estado = this.filtroEstado();
    const orden = this.criterioOrden();
    
    // Filtrado
    let lista = this.myLibrary().filter(juego => {
      const nombreJuego = (juego.title || juego.name || '').toLowerCase();
      const coincideTexto = nombreJuego.includes(texto);
      const coincideEstado = estado === 'todos' || juego.status === estado;
      return coincideTexto && coincideEstado;
    });

    // Ordenación segura contra undefined
    return lista.sort((a, b) => {
      if (orden === 'nombre') {
        const nombreA = (a.title || a.name || '');
        const nombreB = (b.title || b.name || '');
        return nombreA.localeCompare(nombreB);
      } else if (orden === 'rating') {
        return (b.personal_rating || 0) - (a.personal_rating || 0);
      } else {
        return (b.id || 0) - (a.id || 0);
      }
    });
  });

  // Totales calculados
  totalJuegos = computed(() => this.myLibrary().length);
  pendientes = computed(() => this.myLibrary().filter(g => g.status === 'pendiente').length);
  jugando = computed(() => this.myLibrary().filter(g => g.status === 'jugando').length);
  completados = computed(() => this.myLibrary().filter(g => g.status === 'completado').length);
  abandonado = computed(() => this.myLibrary().filter(g => g.status === 'abandonado').length);

  // Acciones de la biblioteca
  guardarJuego(game: any) {
    const payload = {
      title: game.name, 
      steam_appid: String(game.appid),
      image_url: game.logo,
      status: 'pendiente',
      source: game.es_igdb ? 'igdb' : 'steam'
    };

    this.steamService.saveGame(payload).subscribe({
      next: () => {
        this.cargarBiblioteca();
        this.searchResults.set([]);
      },
      error: (err) => console.error("Error al guardar:", err)
    });
  }

  borrarJuego(id: number) {
    if (confirm('¿Seguro que quieres eliminar este juego?')) {
      this.steamService.deleteGame(id).subscribe({
        next: () => this.cargarBiblioteca(),
        error: (err) => console.error('Error al borrar:', err)
      });
    }
  }

  actualizarEstado(id: number, nuevoEstado: string) {
    this.steamService.updateStatus(id, nuevoEstado).subscribe({
      next: () => this.cargarBiblioteca(),
      error: (err) => console.error('Error al actualizar:', err)
    });
  }

  verDetalles(game: any) {
    this.cargandoDetalle.set(true);
    this.juegoDetalle.set(game);

    const gameId = game.steam_appid || game.appid || game.id;
    const esIgdb = game.source === 'igdb' || game.es_igdb === true;

    if (esIgdb) {
      this.steamService.getIgdbDetails(gameId).subscribe({
        next: (data) => {
          this.juegoDetalle.set({ ...game, ...data, source: 'igdb' });
          this.cargandoDetalle.set(false);
        }
      });
    } else {
      this.steamService.getGameDetails(gameId).subscribe({
        next: (data) => {
          this.juegoDetalle.set({ ...game, ...data, source: 'steam' });
          this.cargandoDetalle.set(false);
        }
      });
    }
  }

  guardarDiario(game: any) {
    const payload = {
      notes: game.notes,
      personal_rating: game.personal_rating,
      start_date: game.start_date
    };

    this.steamService.updateGameDiario(game.id, payload).subscribe({
      next: (response) => {
        if (response.game) {
          this.juegoDetalle.set({ ...this.juegoDetalle(), ...response.game });
        }
        this.cargarBiblioteca(); 
      },
      error: (err) => console.error(err)
    });
  }

  generarEstrellas(rating: number | null | undefined): string {
    if (!rating || rating === 0) return 'Sin puntuar';
    const notaSobre5 = Math.round(rating / 2); 
    const estrellasLlenas = '★'.repeat(notaSobre5);
    const estrellasVacias = '☆'.repeat(5 - notaSobre5);
    return estrellasLlenas + estrellasVacias;
  }

  resetFiltros() {
    this.filtroTexto.set('');
    this.filtroEstado.set('todos');
    this.criterioOrden.set('nombre');
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}