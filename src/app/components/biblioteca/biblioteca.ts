import { Component, OnInit, signal, computed, inject, HostListener, effect, NgZone } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { toObservable } from '@angular/core/rxjs-interop'; 
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators'; 

import { SteamService } from '../../services/steam';
import { AuthService } from '../../services/auth';

import { StatsPanelComponent } from '../stats-panel/stats-panel';
import { GameSearchComponent } from '../game-search/game-search';
import { GameFiltersComponent } from '../game-filters/game-filters';
import { IconComponent } from '../icon/icon';
import { ModalV2Component } from '../../sandbox/modal-v2/modal-v2';
import { CardCleanComponent } from '../../sandbox/card-clean/card-clean';

import { SavedGame } from '../../models/saved-games';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [
    CommonModule, StatsPanelComponent, GameSearchComponent, GameFiltersComponent,
    IconComponent, DragDropModule, RouterModule,
    ModalV2Component, CardCleanComponent, ScrollingModule
  ],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss',
})
export class BibliotecaComponent implements OnInit {
  public myLibrary = signal<SavedGame[]>([]);
  public cargandoBiblioteca = signal<boolean>(true);

  // 🧠 CEREBRO CENTRAL: Aquí vive todo el estado de la vista
  filtros = signal({
    status: 'todos',
    platform: 'todas',
    search: '',
    page: 1,
    _t: Date.now() // Token para forzar recargas
  });

  // 📊 ESTADÍSTICAS (Directas desde Laravel)
  estadisticas = signal({ total: 0, pendientes: 0, jugando: 0, completados: 0, abandonado: 0 });
  totalEncontrados = signal<number>(0);
  totalPaginas = signal<number>(1);
  paginasArray = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  private authService = inject(AuthService);
  private router = inject(Router);
  private gameService = inject(SteamService); 
  private ngZone = inject(NgZone);

  notificacion = signal<{mensaje: string, tipo: 'success' | 'error' | 'warning', mostrarBoton?: boolean} | null>(null);
  vistaActual = signal<'cuadricula' | 'tablero'>((localStorage.getItem('vistaBiblioteca') as 'cuadricula' | 'tablero') || 'cuadricula');
  isMobile = window.innerWidth <= 768;

  isModalOpen = signal<boolean>(false);
  selectedGameId = signal<number | string | null>(null);
  selectedGameSource = signal<'igdb' | 'steam'>('igdb');
  modoModal = signal<'read' | 'action'>('read'); 
  juegoModalEnBiblioteca = signal<boolean>(false);
  juegoSeleccionadoData = signal<any>(null); 

  isMenuRapidoOpen = signal<boolean>(false);
  juegoMenuRapido = signal<any>(null);

  constructor() {
    effect(() => {
      const nuevaVista = this.vistaActual();
      localStorage.setItem('vistaBiblioteca', nuevaVista);
      this.gameService.updateUserPreferences({ vista_biblioteca: nuevaVista }).subscribe({
        error: (err) => console.error('No se pudo guardar la preferencia en BD', err)
      });
    });

    // 🚀 TUBERÍA REACTIVA: Escucha los filtros y pide los datos a Laravel
    toObservable(this.filtros).pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.cargandoBiblioteca.set(true)),
      switchMap(f => this.gameService.getMyGames(f.status, f.platform, f.search, f.page))
    ).subscribe({
      next: (res: any) => {
        this.myLibrary.set(res.data ? res.data : res);
        this.totalPaginas.set(res.last_page || 1);
        this.totalEncontrados.set(res.total || (res.data ? res.data.length : res.length));
        this.cargandoBiblioteca.set(false);
      },
      error: (err) => {
        console.error('Error al cargar biblioteca:', err);
        this.cargandoBiblioteca.set(false);
      }
    });
  }

  ngOnInit() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.gameService.getLibraryStats().subscribe({
      next: (res: any) => {
        this.estadisticas.set({
          total: res.total || 0,
          pendientes: res.pendiente || 0,
          jugando: res.jugando || 0,
          completados: res.completado || 0,
          abandonado: res.abandonado || 0
        });
      }
    });
  }

  forzarRecargaDatos() {
    this.filtros.update(f => ({ ...f, _t: Date.now() }));
    this.cargarEstadisticas();
  }

  actualizarFiltroPlataforma(p: string) { this.filtros.update(f => ({ ...f, platform: p, page: 1 })); }
  actualizarFiltroEstado(e: string) { this.filtros.update(f => ({ ...f, status: e, page: 1 })); }
  actualizarFiltroTexto(t: string) { this.filtros.update(f => ({ ...f, search: t, page: 1 })); }
  actualizarPagina(p: number) { this.filtros.update(f => ({ ...f, page: p })); }

  guardarJuegoDesdeModal(payload: any) {
    const juegoExistente = this.myLibrary().find(g => String(g.external_id) === String(payload.external_id));

    if (juegoExistente && juegoExistente.id) {
      this.gameService.updateGame(juegoExistente.id, payload).subscribe({
        next: () => {
          this.juegoSeleccionadoData.set({ ...juegoExistente, ...payload });
          this.forzarRecargaDatos(); 
          this.mostrarNotificacion(`¡${payload.title} ha sido actualizado!`, 'success');
        },
        error: () => this.mostrarNotificacion('Error al actualizar el juego', 'error')
      });
    } else {
      this.gameService.saveGame(payload).subscribe({
        next: () => {
          this.forzarRecargaDatos(); 
          this.mostrarNotificacion(`¡${payload.title} añadido a tu colección!`, 'success', true);
          this.cerrarModal();
        },
        error: () => this.mostrarNotificacion('Error al guardar el juego', 'error')
      });
    }
  }

  getJuegosPorEstado(estado: string): SavedGame[] {
    return this.myLibrary().filter(j => j.status === estado);
  }

  onJuegoSoltado(event: CdkDragDrop<SavedGame[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const juegoMovido = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      
      this.myLibrary.update(juegos => 
        juegos.map(juego => 
          juego.id === juegoMovido.id 
            ? { ...juego, status: nuevoEstado as 'pendiente' | 'jugando' | 'completado' | 'abandonado' } 
            : juego
        )
      );

      if (juegoMovido.id) {
        this.gameService.updateStatus(juegoMovido.id, nuevoEstado).subscribe({
          next: () => {
            this.mostrarNotificacion('Estado actualizado', 'success');
            this.cargarEstadisticas();
          },
          error: () => {
            this.forzarRecargaDatos(); 
            this.mostrarNotificacion('Error al actualizar', 'error');
          }
        });
      }
    }
  }

  abrirModoLectura(game: any) {
    this.selectedGameId.set(game.external_id);
    this.selectedGameSource.set(game.source || 'igdb');
    this.modoModal.set('read');
    
    const juegoExistente = this.myLibrary().find(g => String(g.external_id) === String(game.external_id));
    this.juegoModalEnBiblioteca.set(!!juegoExistente);
    this.juegoSeleccionadoData.set(juegoExistente || null);
    
    this.isModalOpen.set(true);
  }

  abrirModoAccion(game: any) {
    this.selectedGameId.set(game.external_id);
    this.selectedGameSource.set(game.source || 'igdb');
    this.modoModal.set('action');
    
    const juegoExistente = this.myLibrary().find(g => String(g.external_id) === String(game.external_id));
    this.juegoModalEnBiblioteca.set(!!juegoExistente);
    this.juegoSeleccionadoData.set(juegoExistente || null); 
    
    this.isModalOpen.set(true);
  }

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 768; }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success', mostrarBoton = false) {
    this.notificacion.set({ mensaje, tipo, mostrarBoton });
    setTimeout(() => this.notificacion.set(null), 4000); 
  }

  cerrarModal() { this.isModalOpen.set(false); this.selectedGameId.set(null); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }

  abrirMenuRapido(game: any) {
    this.juegoMenuRapido.set(game);
    this.isMenuRapidoOpen.set(true);
  }

  cerrarMenuRapido() {
    this.isMenuRapidoOpen.set(false);
    setTimeout(() => this.juegoMenuRapido.set(null), 300); 
  }

  cambiarEstadoRapido(nuevoEstado: 'pendiente' | 'jugando' | 'completado' | 'abandonado') {
    const juego = this.juegoMenuRapido();
    if (!juego || !juego.id) return;

    this.myLibrary.update(juegos => 
      juegos.map(j => j.id === juego.id ? { ...j, status: nuevoEstado } : j)
    );

    this.gameService.updateStatus(juego.id, nuevoEstado).subscribe({
      next: () => {
        this.mostrarNotificacion(`Movido a ${nuevoEstado}`, 'success');
        this.forzarRecargaDatos(); // 🚀 Asegura que desaparezca del filtro actual
      },
      error: () => {
        this.forzarRecargaDatos(); 
        this.mostrarNotificacion('Error al cambiar el estado', 'error');
      }
    });

    this.cerrarMenuRapido();
  }

  toggleFavoriteSheet() {
    const juego = this.juegoMenuRapido();
    if (!juego || !juego.id) return;

    const nuevoEstadoFav = !juego.is_favorite;

    this.myLibrary.update(juegos => 
      juegos.map(j => j.id === juego.id ? { ...j, is_favorite: nuevoEstadoFav } : j)
    );
    this.juegoMenuRapido.set({ ...juego, is_favorite: nuevoEstadoFav });

    this.gameService.toggleFavorite(juego.id).subscribe({
      error: () => {
        this.forzarRecargaDatos(); 
        this.mostrarNotificacion('Error al actualizar favorito', 'error');
      }
    });

    this.cerrarMenuRapido();
  }

  abrirEdicionDesdeMenu() {
    const juego = this.juegoMenuRapido();
    this.cerrarMenuRapido();
    if (juego) setTimeout(() => this.abrirModoAccion(juego), 100); 
  }

  eliminarJuegoRapido() {
    const juego = this.juegoMenuRapido();
    if (!juego || !juego.id) return;

    if (confirm(`¿Estás seguro de que deseas eliminar "${juego.title}" de tu biblioteca?`)) {
      this.gameService.deleteGame(juego.id).subscribe({
        next: () => {
          this.forzarRecargaDatos();
          this.mostrarNotificacion('Juego eliminado', 'success');
        },
        error: () => this.mostrarNotificacion('Error al eliminar', 'error')
      });
      this.cerrarMenuRapido();
    }
  }

  marcarComoCompletado(game: any, coords?: any) {
    if (!game || !game.id) return;

    if (coords?.preventDefault) { coords.preventDefault(); coords.stopPropagation(); }

    // 1. Efectos visuales instantáneos (Confeti y Notificación)
    if (coords && coords.clientX) {
      this.ngZone.runOutsideAngular(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { x: coords.clientX / window.innerWidth, y: coords.clientY / window.innerHeight },
          colors: ['#198754', '#30d760', '#ffffff'],
          zIndex: 1060,
          disableForReducedMotion: true 
        });
      });
    }
    
    this.mostrarNotificacion(`¡Enhorabuena! Has terminado ${game.title}`, 'success');

    // 2. Petición silenciosa al servidor
    this.gameService.updateStatus(game.id, 'completado').subscribe({
      next: () => {
        // 3. Le damos 600ms de margen para que la tarjeta termine de desaparecer
        // con su propia animación CSS antes de recargar la red.
        setTimeout(() => {
          this.forzarRecargaDatos();
        }, 600);
      },
      error: () => this.mostrarNotificacion('Error al actualizar el estado', 'error')
    });
  }

  vibrarAlArrastrar() {
    if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  }

  actualizarFavoritoLocal(isFav: boolean) {
    const currentId = this.selectedGameId();
    if (!currentId) return;
    
    this.myLibrary.update(juegos => 
      juegos.map(j => String(j.external_id) === String(currentId) ? { ...j, is_favorite: isFav } : j)
    );
    
    if (this.juegoSeleccionadoData()) {
      this.juegoSeleccionadoData.update(data => ({ ...data, is_favorite: isFav }));
    }
  }
}