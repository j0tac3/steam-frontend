import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
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
import { IconComponent } from '../icon/icon';
import { Game } from '../../models/game';
import { SkeletonCardComponent } from '../skeleton-card/skeleton-card';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
//import { RadarComponent } from '../radar/radar';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [
    CommonModule,
    GameModalComponent,
    GameCardComponent,
    StatsPanelComponent,
    GameSearchComponent,
    GameFiltersComponent,
    IconComponent,
    SkeletonCardComponent,
    DragDropModule,
    //RadarComponent
  ],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss',
})
export class BibliotecaComponent implements OnInit {
  public myLibrary = signal<Game[]>([]);
  public cargandoBiblioteca = signal<boolean>(true);

  private authService = inject(AuthService);
  private router = inject(Router);
  private steamService = inject(SteamService);

  filtroPlataforma = signal('todas');
  filtroTexto = signal('');
  filtroEstado = signal('todos');
  criterioOrden = signal<'nombre' | 'rating' | 'reciente'>('nombre');

  juegoDetalle = signal<Game | null>(null);
  cargandoDetalle = signal(false);
  
  // AÑADIDO: Soporte para 'warning'
  notificacion = signal<{mensaje: string, tipo: 'success' | 'error' | 'warning'} | null>(null);

  paginaActual = signal<number>(1);
  elementosPorPagina = signal<number>(12);

  vistaActual = signal<'cuadricula' | 'tablero'>('cuadricula');
    // Variables para controlar el modo edición en móviles
  isMobile = window.innerWidth <= 768;
  modoEdicion = false;

ngOnInit() {
    // Solo llamamos a la función. El estado inicial de la señal ya es true.
    this.cargarBiblioteca();
  }

  cargarBiblioteca() {
    // Opcional: asegurarnos de que el esqueleto se muestra al recargar
    this.cargandoBiblioteca.set(true); 

    this.steamService.getMyGames().subscribe({
      next: (juegos) => {
        this.myLibrary.set(juegos);
        // ¡MAGIA ASÍNCRONA! Apagamos el esqueleto AQUÍ ADENTRO
        this.cargandoBiblioteca.set(false); 
      },
      error: (err) => {
        console.error('Error al cargar biblioteca:', err);
        // Apagamos el esqueleto también si hay error para no dejar la pantalla bloqueada
        this.cargandoBiblioteca.set(false); 
      }
    });
  }

  // AÑADIDO: Soporte para 'warning'
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success') {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 3500); 
  }

  bibliotecaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const estado = this.filtroEstado();
    const plataforma = this.filtroPlataforma(); // 🟢 NUEVO
    const orden = this.criterioOrden();

    let lista = this.myLibrary().filter(juego => {
      const nombreJuego = (juego.title || juego.name || '').toLowerCase();
      const coincideTexto = nombreJuego.includes(texto);
      const coincideEstado = estado === 'todos' || juego.status === estado;

      // 🟢 NUEVA LÓGICA DE PLATAFORMA
      // Si buscamos 'todas', pasa. Si no, debe coincidir exactamente.
      const coincidePlataforma = plataforma === 'todas' || juego.platform === plataforma;

      return coincideTexto && coincideEstado && coincidePlataforma;
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

  totalJuegos = computed(() => this.myLibrary().length);
  pendientes = computed(() => this.myLibrary().filter(g => g.status === 'pendiente').length);
  jugando = computed(() => this.myLibrary().filter(g => g.status === 'jugando').length);
  completados = computed(() => this.myLibrary().filter(g => g.status === 'completado').length);
  abandonado = computed(() => this.myLibrary().filter(g => g.status === 'abandonado').length);

  actualizarFiltroPlataforma(plataforma: string) {
    this.filtroPlataforma.set(plataforma);
    this.paginaActual.set(1);
  }

  actualizarFiltroEstado(estado: string) {
    this.filtroEstado.set(estado);
    this.paginaActual.set(1);
  }

  actualizarFiltroTexto(texto: string) {
    this.filtroTexto.set(texto);
    this.paginaActual.set(1);
  }

  actualizarCriterioOrden(orden: 'nombre' | 'rating' | 'reciente') {
    this.criterioOrden.set(orden);
    this.paginaActual.set(1);
  }

  resetFiltros() {
    this.filtroTexto.set('');
    this.filtroEstado.set('todos');
    this.filtroPlataforma.set('todas'); // 🟢 NUEVO
    this.criterioOrden.set('nombre');
    this.paginaActual.set(1);
  }

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

  guardarJuego(game: Game) {
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
        next: () => {
          this.cargarBiblioteca();
          this.mostrarNotificacion('Juego eliminado de tu biblioteca', 'success');
        },
        error: (err) => {
          console.error('Error al borrar:', err);
          this.mostrarNotificacion('Error al intentar eliminar el juego', 'error');
        }
      });
    }
  }

  actualizarEstado(id: number, nuevoEstado: string) {
    this.steamService.updateStatus(id, nuevoEstado).subscribe({
      next: () => {
        this.cargarBiblioteca();
        const estadoFormateado = nuevoEstado.charAt(0).toUpperCase() + nuevoEstado.slice(1);
        this.mostrarNotificacion(`Estado cambiado a: ${estadoFormateado}`, 'success');
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        this.mostrarNotificacion('Error al cambiar el estado', 'error');
      }
    });
  }

  verDetalles(game: Game) {
    const gameId = game.steam_appid || game.appid || game.id;

    // GUARDIA DE TIPO: Si no hay ID, TypeScript detiene la ejecución y evitamos el error
    if (!gameId) {
      console.error('El juego seleccionado no tiene un ID válido:', game);
      this.mostrarNotificacion('Error al abrir: El juego no tiene ID', 'error');
      return; 
    }

    this.cargandoDetalle.set(true);
    this.juegoDetalle.set(game);

    const esIgdb = game.source === 'igdb' || game.es_igdb === true;

    // A partir de aquí, TypeScript ya sabe al 100% que gameId NO es undefined
    if (esIgdb) {
      this.steamService.getIgdbDetails(gameId).subscribe({
        next: (data) => {
          this.juegoDetalle.set({ ...game, ...data, source: 'igdb' });
          this.cargandoDetalle.set(false);
        }
      });
    } else {
      // Envolvemos gameId en String() para garantizar que sea un texto
      this.steamService.getGameDetails(String(gameId)).subscribe({
        next: (data) => {
          this.juegoDetalle.set({ ...game, ...data, source: 'steam' });
          this.cargandoDetalle.set(false);
        }
      });
    }
  }

  guardarDiario(game: Game) {
    if (!game.id) {
          console.error('Intento de guardar un diario de un juego sin ID');
          return; 
    }

    const payload = {
      notes: game.notes,
      personal_rating: game.personal_rating,
      start_date: game.start_date,
      platform: game.platform
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

  // Filtra los juegos al vuelo para cada columna
  getJuegosPorEstado(estado: string): Game[] {
    return this.bibliotecaFiltrada().filter(j => j.status === estado);
  }

  // La física de soltar la tarjeta
  onJuegoSoltado(event: CdkDragDrop<Game[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      // Si lo sueltas en la misma columna, solo cambia el orden visual
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Si lo cambias de columna, hacemos la transferencia y actualizamos tu Base de Datos
      const juegoMovido = event.previousContainer.data[event.previousIndex];
      juegoMovido.status = nuevoEstado as Game['status'];
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Usamos tu función existente para guardar el cambio en la BBDD
      if (juegoMovido.id) {
        this.actualizarEstado(juegoMovido.id, nuevoEstado);
      }
    }
  }

  // Opcional pero recomendado: detectar si el usuario gira la pantalla
  @HostListener('window:resize') // <-- Le quitamos el ['$event']
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleEdicion() {
    this.modoEdicion = !this.modoEdicion;
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}