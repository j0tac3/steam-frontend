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
  public myLibrary = signal<any[]>([]);

  private authService = inject(AuthService);
  private router = inject(Router);
  private steamService = inject(SteamService);

  // Señales para los filtros y ordenación
  filtroTexto = signal('');
  filtroEstado = signal('todos');
  criterioOrden = signal<'nombre' | 'rating' | 'reciente'>('nombre');

  // Control del modal y notificaciones
  juegoDetalle = signal<any>(null);
  cargandoDetalle = signal(false);
  notificacion = signal<{mensaje: string, tipo: 'success' | 'error'} | null>(null);

  // Estado de Paginación Local
  paginaActual = signal<number>(1);
  elementosPorPagina = signal<number>(12);

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

  // Función UX para mostrar el Toast
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' = 'success') {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 3500); // Se borra a los 3.5s
  }

  // Lógica reactiva de filtrado y ordenación
  bibliotecaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const estado = this.filtroEstado();
    const orden = this.criterioOrden();
    
    let lista = this.myLibrary().filter(juego => {
      const nombreJuego = (juego.title || juego.name || '').toLowerCase();
      const coincideTexto = nombreJuego.includes(texto);
      const coincideEstado = estado === 'todos' || juego.status === estado;
      return coincideTexto && coincideEstado;
    });

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

  bibliotecaPaginada = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina();
    const fin = inicio + this.elementosPorPagina();
    return this.bibliotecaFiltrada().slice(inicio, fin);
  });

  totalPaginas = computed(() => {
    const total = this.bibliotecaFiltrada().length;
    return Math.ceil(total / this.elementosPorPagina()) || 1;
  });

  paginasArray = computed(() => {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i + 1);
  });

  // Totales para Stats
  totalJuegos = computed(() => this.myLibrary().length);
  pendientes = computed(() => this.myLibrary().filter(g => g.status === 'pendiente').length);
  jugando = computed(() => this.myLibrary().filter(g => g.status === 'jugando').length);
  completados = computed(() => this.myLibrary().filter(g => g.status === 'completado').length);
  abandonado = computed(() => this.myLibrary().filter(g => g.status === 'abandonado').length);

  // Wrappers de Filtros
  actualizarFiltroTexto(texto: string) {
    this.filtroTexto.set(texto);
    this.paginaActual.set(1);
  }

  actualizarFiltroEstado(estado: string) {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
  }

  actualizarCriterioOrden(orden: 'nombre' | 'rating' | 'reciente') {
    this.criterioOrden.set(orden);
    this.paginaActual.set(1);
  }

  resetFiltros() {
    this.filtroTexto.set('');
    this.filtroEstado.set('todos');
    this.criterioOrden.set('nombre');
    this.paginaActual.set(1);
  }

  // Navegación
  private hacerScrollArriba() {
    const contenedor = document.getElementById('ancla-grid-biblioteca');
    if (contenedor) {
      const y = contenedor.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
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

  // ==========================================
  // ACCIONES CRUD (Con notificaciones)
  // ==========================================
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
        this.cargarBiblioteca(); // Esto actualiza el componente hijo de forma mágica y reactiva
        this.mostrarNotificacion(`¡${game.name} añadido a tu colección!`, 'success');
      },
      error: (err) => {
        console.error("Error al guardar:", err);
        this.mostrarNotificacion('Hubo un error al guardar el juego', 'error');
      }
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
        this.mostrarNotificacion('Progreso actualizado', 'success');
      },
      error: (err) => console.error(err)
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}