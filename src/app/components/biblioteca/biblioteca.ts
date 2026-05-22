import { Component, OnInit, signal, computed, inject, HostListener, effect, NgZone } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { toObservable } from '@angular/core/rxjs-interop'; 
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators'; 
import { ActivatedRoute } from '@angular/router';

import { GameService } from '../../services/game.service';
import { AuthService } from '../../services/auth';

import { StatsPanelComponent } from '../stats-panel/stats-panel';
import { SteamSyncButtonComponent } from '../steam-sync-button/steam-sync-button';
import { GameSearchComponent } from '../game-search/game-search';
import { GameFiltersComponent } from '../game-filters/game-filters';
import { IconComponent } from '../icon/icon';
import { GameModal } from '../game-modal/game-modal'; 
import { CardCleanComponent } from '../../sandbox/card-clean/card-clean';
import { environment } from '../../../environments/environment';
import { UserProfileCardComponent } from '../user-profile-card/user-profile-card';

import { Game, LibraryGame } from '../../models/game'; 
import confetti from 'canvas-confetti';
import { SteamSyncBannerComponent } from "../steam-sync-banner/steam-sync-banner";

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [
    CommonModule, StatsPanelComponent, GameSearchComponent, GameFiltersComponent,
    IconComponent, DragDropModule, RouterModule,
    GameModal, CardCleanComponent, ScrollingModule, UserProfileCardComponent, SteamSyncButtonComponent,
    SteamSyncBannerComponent
],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss',
})
export class BibliotecaComponent implements OnInit {
  public myLibrary = signal<LibraryGame[]>([]); 
  public cargandoBiblioteca = signal<boolean>(true);

  private route = inject(ActivatedRoute);
  public isReadOnly = signal<boolean>(false);
  public profileOwner = signal<any>(null);

  filtros = signal({ status: 'todos', platform: 'todas', search: '', page: 1, _t: Date.now() });

  estadisticas = signal({ total: 0, pendientes: 0, jugando: 0, completados: 0, abandonado: 0 });
  totalEncontrados = signal<number>(0);
  totalPaginas = signal<number>(1);
  paginasArray = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  private authService = inject(AuthService);
  private router = inject(Router);
  private gameService = inject(GameService); 
  private ngZone = inject(NgZone);

  notificacion = signal<{mensaje: string, tipo: 'success' | 'error' | 'warning', mostrarBoton?: boolean} | null>(null);
  vistaActual = signal<'cuadricula' | 'tablero'>((localStorage.getItem('vistaBiblioteca') as 'cuadricula' | 'tablero') || 'cuadricula');
  isMobile = window.innerWidth <= 768;

  isModalOpen = signal<boolean>(false);
  selectedGameId = signal<number | string | null>(null);
  selectedGameSource = signal<'igdb' | 'steam' | 'local'>('igdb');
  modoModal = signal<'read' | 'action'>('read'); 
  juegoModalEnBiblioteca = signal<boolean>(false);
  juegoSeleccionadoData = signal<LibraryGame | null>(null); 

  isMenuRapidoOpen = signal<boolean>(false);
  juegoMenuRapido = signal<LibraryGame | null>(null);

  // ==========================================
  // 🚀 SELECTORES NATIVOS MULTICONSOLA
  // ==========================================
  getInventory(game: LibraryGame): any[] {
    return game?.inventory_entries || (game as any)?.inventoryEntries || [];
  }

  getMainStatus(game: LibraryGame): string {
    const entries = this.getInventory(game);
    if (!entries || entries.length === 0) return 'pendiente';
    const isPlaying = entries.find((e: any) => e.status === 'jugando');
    return isPlaying ? 'jugando' : entries[0].status;
  }

  isFavorite(game: LibraryGame): boolean {
    const entries = this.getInventory(game);
    return entries ? entries.some((e: any) => e.is_favorite) : false;
  }

  getMainRating(game: LibraryGame): number {
    const entries = this.getInventory(game);
    if (!entries || entries.length === 0) return 0;
    return Math.max(...entries.map((e: any) => e.personal_rating || 0));
  }

  updateLocalGame(gameId: number | string, updates: any) {
    this.myLibrary.update(juegos => 
      juegos.map(j => {
        if (String(j.igdb_id) === String(gameId) || String(j.id) === String(gameId)) {
          const newEntries = this.getInventory(j).map(e => ({ ...e, ...updates }));
          return { ...j, inventory_entries: newEntries } as LibraryGame;
        }
        return j;
      })
    );
  }

  usuarioPerfil = computed(() => {
    const owner = this.profileOwner();
    const stats = this.estadisticas();
    const juegos = this.myLibrary();

    const topFavoritos = juegos
      .filter(j => this.isFavorite(j))
      .slice(0, 3)
      .map(j => ({ id: String(j.igdb_id), cover_url: this.getCover(j), title: j.name }));

    return {
      avatar: owner?.avatar || '/default-avatar.png', 
      username: owner?.username || owner?.name || 'Jugador Oculto',
      badge: stats.completados > 10 ? 'Completista' : 'Cazatrofeos', 
      juegosTotales: stats.total || 0,
      juegosCompletados: stats.completados || 0,
      favoritosCount: juegos.filter(j => this.isFavorite(j)).length,
      topJuegos: topFavoritos
    };
  });

  constructor() {
    const usernameParam = this.route.snapshot.paramMap.get('username');
    this.isReadOnly.set(!!usernameParam);

    // 1. Recarga silenciosa (por cada juego)
    this.gameService.juegoSincronizado$.subscribe(() => {
        this.forzarRecargaDatos();
    });
    // 2. 🔥 Notificación visual (solo al final)
    this.gameService.sincronizacionTerminada$.subscribe(() => {
        this.mostrarNotificacion('¡Sincronización de Steam finalizada!', 'success');
    });

    effect(() => {
      const nuevaVista = this.vistaActual();
      localStorage.setItem('vistaBiblioteca', nuevaVista);
      if (!this.isReadOnly() && localStorage.getItem('token')) {
        this.gameService.updateUserPreferences({ vista_biblioteca: nuevaVista }).subscribe();
      }
    });

    toObservable(this.filtros).pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => this.cargandoBiblioteca.set(true)),
      switchMap(f => {
        if (this.isReadOnly() && usernameParam) {
          return this.gameService.getPublicGames(usernameParam, f.status, f.platform, f.search);
        }
        return this.gameService.getMyGames(f.status, f.platform, f.search, f.page);
      })
    ).subscribe({
      next: (res: any) => {
        const listado = res.data ? res.data : (res.games ? res.games : res);
        this.myLibrary.set(listado);
        this.totalPaginas.set(res.last_page || 1);
        this.totalEncontrados.set(res.total || listado.length);
        
        if (res.stats) {
          this.profileOwner.set(res.owner || null);
          this.estadisticas.set({
            total: res.stats.total || 0,
            pendientes: res.stats.pendiente || 0,  
            jugando: res.stats.jugando || 0,
            completados: res.stats.completado || 0, 
            abandonado: res.stats.abandonado || 0
          });
        } else {
          this.cargarEstadisticas();
        }
        this.cargandoBiblioteca.set(false);
      },
      error: () => this.cargandoBiblioteca.set(false)
    });
  }

  ngOnInit() {
    if (!this.isReadOnly()) {
      this.cargarEstadisticas();
      this.authService.getUser().subscribe({ next: (userData) => this.profileOwner.set(userData) });
    }
  }

  getCover(game: any): string {
    if (game.cover_url) return game.cover_url; 
    if (game.media && game.media.length > 0) {
      const primary = game.media.find((m: any) => m.is_primary) || game.media[0];
      
      // 🚀 FIX: Si la ruta ya es una URL web completa (ej. la carátula de Steam de emergencia)
      if (primary.path && primary.path.startsWith('http')) {
        return primary.path;
      }

      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${primary.path}.jpg`;
    }
    return '/no-image.svg';
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

  forzarRecargaDatos() { this.filtros.update(f => ({ ...f, _t: Date.now() })); this.cargarEstadisticas(); }
  actualizarFiltroPlataforma(p: string) { this.filtros.update(f => ({ ...f, platform: p, page: 1 })); }
  actualizarFiltroEstado(e: string) { this.filtros.update(f => ({ ...f, status: e, page: 1 })); }
  actualizarFiltroTexto(t: string) { this.filtros.update(f => ({ ...f, search: t, page: 1 })); }
  actualizarPagina(p: number) { this.filtros.update(f => ({ ...f, page: p })); }

  guardarJuegoDesdeModal(payload: any) {
    // Como ahora somos puristas, sabemos el ID real del juego que está abierto
    const internalId = this.juegoSeleccionadoData()?.id;

    // 👇 1. INTERCEPTAMOS EL CAMBIO DE PORTADA (Optimistic UI) 👇
    if (payload.action === 'update_cover') {
      this.myLibrary.update(juegos => 
        juegos.map(j => {
          if (j.id === payload.game_id) {
            
            // 1. Actualizamos el array media (por si acaso)
            const mediaActualizada = (j.media || []).map((m: any) => {
              if (m.type === 'cover') {
                return { ...m, is_primary: m.path === payload.new_cover_path };
              }
              return m;
            });

            // 🚀 2. LA SOLUCIÓN: Calculamos la nueva URL final
            let nuevaUrl = payload.new_cover_path;
            if (nuevaUrl && !nuevaUrl.startsWith('http')) {
               nuevaUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${nuevaUrl}.jpg`;
            }

            // 3. Sobrescribimos TAMBIÉN el 'cover_url' explícitamente para derrotar al if de getCover()
            return { ...j, media: mediaActualizada, cover_url: nuevaUrl };
          }
          return j;
        })
      );
      
      return; 
    }
    // 👆 FIN DEL BLOQUE DE PORTADAS 👆

    if (payload.action === 'delete' && internalId) {
      this.gameService.deleteGame(`${internalId}?platform_id=${payload.platform_id}`).subscribe({
        next: () => { this.forzarRecargaDatos(); this.cerrarModal(); }
      });
    } else if (payload.platform_ids) {
      this.gameService.saveGame(payload).subscribe({
        next: () => { this.forzarRecargaDatos(); this.mostrarNotificacion('¡Añadido a tu colección!', 'success'); }
      });
    } else if (payload.platform_id && internalId) {
      this.gameService.updateStatus(internalId, payload).subscribe({
        next: () => this.forzarRecargaDatos()
      });
    }
  }

  getJuegosPorEstado(estado: string): LibraryGame[] {
    return this.myLibrary().filter(j => this.getMainStatus(j) === estado);
  }

  onJuegoSoltado(event: CdkDragDrop<LibraryGame[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const juegoMovido = event.previousContainer.data[event.previousIndex];
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      
      const entries = this.getInventory(juegoMovido);
      const platformId = entries.length > 0 ? entries[0].platform_id : null;
      
      this.updateLocalGame(juegoMovido.id, { status: nuevoEstado });

      if (juegoMovido.id && platformId) {
        this.gameService.updateStatus(juegoMovido.id, { status: nuevoEstado, platform_id: platformId }).subscribe({
          next: () => { this.mostrarNotificacion('Estado actualizado', 'success'); this.cargarEstadisticas(); },
          error: () => this.forzarRecargaDatos()
        });
      }
    }
  }

  abrirModoLectura(game: any) {
    if (game.id) {
      console.log('Datos del juego al hacer clic:', game);
      // 🛡️ ENFOQUE SOBERANO: El juego ya está en nuestra base de datos relacional
      this.selectedGameId.set(game.id);
      this.selectedGameSource.set('steam'); // 'steam' evita el bloque de IGDB en Laravel y fuerza la consulta local directa, respetando el estricto tipado del modal
      this.juegoModalEnBiblioteca.set(true);
      this.juegoSeleccionadoData.set(game);
    } else {
      // Si el juego viene puramente de los resultados del buscador general
      this.selectedGameId.set(game.external_id || game.igdb_id); 
      this.selectedGameSource.set(game.source || 'igdb');
      this.juegoModalEnBiblioteca.set(false);
      this.juegoSeleccionadoData.set(null);
    }
    this.modoModal.set('read');
    this.isModalOpen.set(true);
  }

  abrirModoAccion(game: any) {
      console.log('Datos del juego al hacer clic:', game);
    if (game.id) {
      this.selectedGameId.set(game.id);
      this.selectedGameSource.set('steam');
      this.juegoModalEnBiblioteca.set(true);
      this.juegoSeleccionadoData.set(game);
    } else {
      this.selectedGameId.set(game.external_id || game.igdb_id);
      this.selectedGameSource.set(game.source || 'igdb');
      this.juegoModalEnBiblioteca.set(false);
      this.juegoSeleccionadoData.set(null);
    }
    this.modoModal.set('action');
    this.isModalOpen.set(true);
  }
  
  @HostListener('window:resize') onResize() { this.isMobile = window.innerWidth <= 768; }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success') {
    this.notificacion.set({ mensaje, tipo });
    setTimeout(() => this.notificacion.set(null), 4000); 
  }

  cerrarModal() { this.isModalOpen.set(false); this.selectedGameId.set(null); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }
  abrirMenuRapido(game: LibraryGame) { this.juegoMenuRapido.set(game); this.isMenuRapidoOpen.set(true); }
  cerrarMenuRapido() { this.isMenuRapidoOpen.set(false); setTimeout(() => this.juegoMenuRapido.set(null), 300); }

  cambiarEstadoRapido(nuevoEstado: 'pendiente' | 'jugando' | 'completado' | 'abandonado') {
    const juego = this.juegoMenuRapido();
    if (!juego || !juego.id) return;

    const entries = this.getInventory(juego);
    const platformId = entries.length > 0 ? entries[0].platform_id : null;

    this.updateLocalGame(juego.id, { status: nuevoEstado });
    if (platformId) {
      this.gameService.updateStatus(juego.id, { status: nuevoEstado, platform_id: platformId }).subscribe({
        next: () => { this.mostrarNotificacion(`Movido a ${nuevoEstado}`, 'success'); this.forzarRecargaDatos(); }
      });
    }
    this.cerrarMenuRapido();
  }

  toggleFavoriteSheet() {
    const juego = this.juegoMenuRapido();
    if (!juego || !juego.id) return;

    const nuevoEstadoFav = !this.isFavorite(juego);
    this.updateLocalGame(juego.id, { is_favorite: nuevoEstadoFav });
    this.gameService.toggleFavorite(juego.id).subscribe({ error: () => this.forzarRecargaDatos() });
    this.cerrarMenuRapido();
  }

  abrirEdicionDesdeMenu() { const j = this.juegoMenuRapido(); this.cerrarMenuRapido(); if (j) setTimeout(() => this.abrirModoAccion(j), 100); }

  eliminarJuegoRapido() {
    const juego = this.juegoMenuRapido();
    if (juego && confirm(`¿Estás seguro de que deseas eliminar "${juego.name}" de tu biblioteca?`)) {
      this.gameService.deleteGame(juego.id).subscribe({
        next: () => { this.forzarRecargaDatos(); this.mostrarNotificacion('Juego eliminado', 'success'); }
      });
      this.cerrarMenuRapido();
    }
  }

  marcarComoCompletado(game: LibraryGame, coords?: any) {
    if (!game || !game.id) return;
    if (coords?.preventDefault) { coords.preventDefault(); coords.stopPropagation(); }

    if (coords && coords.clientX) {
      this.ngZone.runOutsideAngular(() => {
        confetti({ particleCount: 80, spread: 60, origin: { x: coords.clientX / window.innerWidth, y: coords.clientY / window.innerHeight }, colors: ['#198754', '#30d760', '#ffffff'], zIndex: 1060 });
      });
    }
    this.mostrarNotificacion(`¡Enhorabuena! Has terminado ${game.name}`, 'success');

    const entries = this.getInventory(game);
    const platformId = entries.length > 0 ? entries[0].platform_id : null;
    if (platformId) {
      this.gameService.updateStatus(game.id, { status: 'completado', platform_id: platformId }).subscribe({
        next: () => setTimeout(() => this.forzarRecargaDatos(), 600)
      });
    }
  }

  vibrarAlArrastrar() { if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(50); }
  actualizarFavoritoLocal(isFav: boolean) { this.forzarRecargaDatos(); }

  actualizarEstadoDiarioEnLista(event: {hasNotes: boolean, hasFeaturedNotes: boolean}) {
    const gameId = this.selectedGameId(); 
    this.myLibrary.update(lista => 
      lista.map(g => 
        String(g.id) === String(gameId) || String(g.igdb_id) === String(gameId) 
          ? { ...g, has_notes: event.hasNotes, has_featured_notes: event.hasFeaturedNotes } 
          : g
      )
    );
  }

  compartirPerfil() {
    const url = `${environment.apiUrl.replace(/\/api$/, '')}/share/${this.profileOwner()?.username || 'mi_perfil'}`;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => this.mostrarNotificacion('¡Enlace público copiado!', 'success'));
  }

  togglePrivacidad(event: any) { this.togglePrivacidadDirecto(event.target.checked); }

  togglePrivacidadDirecto(nuevoEstado: boolean) {
    this.profileOwner.update(user => user ? { ...user, is_public: nuevoEstado } : null);
    this.gameService.updateUserPreferences({ is_public: nuevoEstado }).subscribe();
  }
}