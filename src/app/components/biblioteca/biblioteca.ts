import { Component, OnInit, signal, computed, inject, HostListener, effect, NgZone } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { SteamService } from '../../services/steam';
import { AuthService } from '../../services/auth';

import { StatsPanelComponent } from '../stats-panel/stats-panel';
import { GameSearchComponent } from '../game-search/game-search';
import { GameFiltersComponent } from '../game-filters/game-filters';
import { IconComponent } from '../icon/icon';
import { ModalV2Component } from '../../sandbox/modal-v2/modal-v2';
import { CardCleanComponent } from '../../sandbox/card-clean/card-clean';

import { SavedGame } from '../../models/saved-games';
import { Game } from '../../models/game'; 
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [
    CommonModule, StatsPanelComponent, GameSearchComponent, GameFiltersComponent,
    IconComponent, DragDropModule, RouterModule,
    ModalV2Component, CardCleanComponent
  ],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss',
})
export class BibliotecaComponent implements OnInit {
  public myLibrary = signal<SavedGame[]>([]);
  public cargandoBiblioteca = signal<boolean>(true);

  private authService = inject(AuthService);
  private router = inject(Router);
  private gameService = inject(SteamService); 

  filtroTexto = signal('');
  filtroEstado = signal('todos');
  filtroPlataforma = signal('todas');
  criterioOrden = signal<'nombre' | 'rating' | 'reciente'>('nombre');

  notificacion = signal<{mensaje: string, tipo: 'success' | 'error' | 'warning', mostrarBoton?: boolean} | null>(null);
  vistaActual = signal<'cuadricula' | 'tablero'>(
    (localStorage.getItem('vistaBiblioteca') as 'cuadricula' | 'tablero') || 'cuadricula'
  );
  isMobile = window.innerWidth <= 768;

  paginaActual = signal<number>(1);
  elementosPorPagina = signal<number>(12);

  isModalOpen = signal<boolean>(false);
  selectedGameId = signal<number | string | null>(null);
  selectedGameSource = signal<'igdb' | 'steam'>('igdb');
  modoModal = signal<'read' | 'action'>('read'); 
  juegoModalEnBiblioteca = signal<boolean>(false);
  juegoSeleccionadoData = signal<any>(null); 

  // --- VARIABLES DEL MENÚ RÁPIDO (BOTTOM SHEET) ---
  isMenuRapidoOpen = signal<boolean>(false);
  juegoMenuRapido = signal<any>(null);

  private ngZone = inject(NgZone);

  constructor() {
    effect(() => {
      const nuevaVista = this.vistaActual();
      // Cada vez que vistaActual cambie, Angular ejecutará esta línea automáticamente
      localStorage.setItem('vistaBiblioteca', this.vistaActual());

      this.gameService.updateUserPreferences({ vista_biblioteca: nuevaVista }).subscribe({
        error: (err) => console.error('No se pudo guardar la preferencia en BD', err)
      });
    });
  }

  ngOnInit() {
    this.cargarBiblioteca();
  }

  cargarBiblioteca() {
    this.cargandoBiblioteca.set(true); 
    this.gameService.getMyGames().subscribe({
      next: (res: any) => {
        this.myLibrary.set(res.data ? res.data : res);
        this.cargandoBiblioteca.set(false); 
      },
      error: (err) => {
        console.error('Error al cargar biblioteca:', err);
        this.cargandoBiblioteca.set(false); 
      }
    });
  }

  // --- LÓGICA COMPUTADA ---
  bibliotecaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const estado = this.filtroEstado();
    const plataforma = this.filtroPlataforma();
    const orden = this.criterioOrden();

    let lista = this.myLibrary().filter(juego => {
      const coincideTexto = juego.title.toLowerCase().includes(texto);
      const coincideEstado = estado === 'todos' || juego.status === estado;
      const coincidePlataforma = plataforma === 'todas' || (juego as any).platform === plataforma;
      return coincideTexto && coincideEstado && coincidePlataforma;
    });

    return lista.sort((a, b) => {
      if (orden === 'nombre') return a.title.localeCompare(b.title);
      if (orden === 'reciente') return Number(b.id || 0) - Number(a.id || 0);
      return 0;
    });
  });

  bibliotecaPaginada = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina();
    return this.bibliotecaFiltrada().slice(inicio, inicio + this.elementosPorPagina());
  });

  totalPaginas = computed(() => Math.ceil(this.bibliotecaFiltrada().length / this.elementosPorPagina()) || 1);
  paginasArray = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  totalJuegos = computed(() => this.myLibrary().length);
  pendientes = computed(() => this.myLibrary().filter(g => g.status === 'pendiente').length);
  jugando = computed(() => this.myLibrary().filter(g => g.status === 'jugando').length);
  completados = computed(() => this.myLibrary().filter(g => g.status === 'completado').length);
  abandonado = computed(() => this.myLibrary().filter(g => g.status === 'abandonado').length);

  actualizarFiltroPlataforma(p: string) { this.filtroPlataforma.set(p); this.paginaActual.set(1); }
  actualizarFiltroEstado(e: string) { this.filtroEstado.set(e); this.paginaActual.set(1); }
  actualizarFiltroTexto(t: string) { this.filtroTexto.set(t); this.paginaActual.set(1); }
  
  // --- ACCIONES DE DATOS ---

  // 🚀 AÑADIDO: Recibe los datos del Modal V2 y decide si CREA o ACTUALIZA
  guardarJuegoDesdeModal(payload: any) {
    // 1. Buscamos si el juego ya existe en nuestra colección cruzando el external_id
    const juegoExistente = this.myLibrary().find(g => String(g.external_id) === String(payload.external_id));

    if (juegoExistente && juegoExistente.id) {
      // 🟢 RUTA A: EDICIÓN (Ya lo tenemos)
      // Usamos el ID interno de tu BD (juegoExistente.id) para actualizarlo
      this.gameService.updateGame(juegoExistente.id, payload).subscribe({
        next: () => {
          this.cargarBiblioteca(); 
          this.mostrarNotificacion(`¡${payload.title} ha sido actualizado!`, 'success');
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al actualizar desde modal', err);
          this.mostrarNotificacion('Error al actualizar el juego', 'error');
        }
      });
    } else {
      this.gameService.saveGame(payload).subscribe({
        next: () => {
          this.cargarBiblioteca(); 
          // 🚀 PASAMOS 'true' AL FINAL PARA MOSTRAR EL BOTÓN
          this.mostrarNotificacion(`¡${payload.title} añadido a tu colección!`, 'success', true);
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al guardar nuevo desde modal', err);
          this.mostrarNotificacion('Error al guardar el juego', 'error');
        }
      });
    }
  }

  // --- DRAG & DROP ---
  getJuegosPorEstado(estado: string): SavedGame[] {
    return this.bibliotecaFiltrada().filter(j => j.status === estado);
  }

  onJuegoSoltado(event: CdkDragDrop<SavedGame[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const juegoMovido = event.previousContainer.data[event.previousIndex];
      
      // 1. Movimiento visual temporal (Angular CDK)
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      
      // 🚀 2. LA MAGIA: Actualizamos la señal principal localmente
      // Así Angular sabe que este juego ahora pertenece a otra columna y no lo devuelve atrás
      // 🚀 2. LA MAGIA: Actualizamos la señal principal localmente
      this.myLibrary.update(juegos => 
        juegos.map(juego => 
          juego.id === juegoMovido.id 
            // Le decimos a TypeScript que confíe en que nuevoEstado es de este tipo exacto
            ? { ...juego, status: nuevoEstado as 'pendiente' | 'jugando' | 'completado' | 'abandonado' } 
            : juego
        )
      );

      // 3. Actualizamos en el Backend en segundo plano
      if (juegoMovido.id) {
        this.gameService.updateStatus(juegoMovido.id, nuevoEstado).subscribe({
          next: () => this.mostrarNotificacion('Estado actualizado', 'success'),
          error: () => {
            // Si el servidor da error, recargamos la BD original para revertir la tarjeta
            this.cargarBiblioteca(); 
            this.mostrarNotificacion('Error al actualizar', 'error');
          }
        });
      }
    }
  }

  // --- MODAL ---

  // 🚀 AÑADIDO: Abre el modal en modo LECTURA (Curiosear)
  abrirModoLectura(game: any) {
    this.selectedGameId.set(game.external_id);
    this.selectedGameSource.set(game.source || 'igdb');
    this.modoModal.set('read');
    
    // 🚀 Buscamos el juego entero
    const juegoExistente = this.myLibrary().find(g => String(g.external_id) === String(game.external_id));
    this.juegoModalEnBiblioteca.set(!!juegoExistente);
    this.juegoSeleccionadoData.set(juegoExistente || null);
    
    this.isModalOpen.set(true);
  }

  // 🚀 AÑADIDO: Abre el modal en modo ACCIÓN (Configurar para guardar)
  abrirModoAccion(game: any) {
    this.selectedGameId.set(game.external_id);
    this.selectedGameSource.set(game.source || 'igdb');
    this.modoModal.set('action');
    
    this.juegoModalEnBiblioteca.set(false);
    this.juegoSeleccionadoData.set(null); // 🚀 Como es nuevo, pasamos null
    
    this.isModalOpen.set(true);
  }

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 768; }

    mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success', mostrarBoton = false) {
    this.notificacion.set({ mensaje, tipo, mostrarBoton });
    setTimeout(() => this.notificacion.set(null), 4000); // 💡 Le damos medio segundo extra al usuario para que le dé tiempo a hacer clic
  }

  cerrarModal() { this.isModalOpen.set(false); this.selectedGameId.set(null); }
  cerrarSesion() { this.authService.logout(); this.router.navigate(['/login']); }

  // --- LÓGICA DEL MENÚ RÁPIDO ---
  abrirMenuRapido(game: any) {
    this.juegoMenuRapido.set(game);
    this.isMenuRapidoOpen.set(true);
  }

  cerrarMenuRapido() {
    this.isMenuRapidoOpen.set(false);
    // Esperamos a que termine la animación CSS (300ms) antes de vaciar los datos
    setTimeout(() => this.juegoMenuRapido.set(null), 300); 
  }

  cambiarEstadoRapido(nuevoEstado: 'pendiente' | 'jugando' | 'completado' | 'abandonado') {
    const juego = this.juegoMenuRapido();
    if (!juego || !juego.id) return;

    // 1. Optimistic UI: Actualizamos localmente al instante
    this.myLibrary.update(juegos => 
      juegos.map(j => j.id === juego.id ? { ...j, status: nuevoEstado } : j)
    );

    // 2. Petición en segundo plano
    this.gameService.updateStatus(juego.id, nuevoEstado).subscribe({
      next: () => this.mostrarNotificacion(`Movido a ${nuevoEstado}`, 'success'),
      error: () => {
        this.cargarBiblioteca(); // Revertimos si falla
        this.mostrarNotificacion('Error al cambiar el estado', 'error');
      }
    });

    this.cerrarMenuRapido();
  }

  abrirEdicionDesdeMenu() {
    const juego = this.juegoMenuRapido();
    this.cerrarMenuRapido();
    if (juego) {
      // Pequeño timeout para evitar que se superpongan las animaciones de los modales
      setTimeout(() => this.abrirModoAccion(juego), 100); 
    }
  }

  eliminarJuegoRapido() {
    const juego = this.juegoMenuRapido();
    if (!juego || !juego.id) return;

    if (confirm(`¿Estás seguro de que deseas eliminar "${juego.title}" de tu biblioteca?`)) {
      this.gameService.deleteGame(juego.id).subscribe({
        next: () => {
          this.myLibrary.update(juegos => juegos.filter(j => j.id !== juego.id));
          this.mostrarNotificacion('Juego eliminado', 'success');
        },
        error: () => this.mostrarNotificacion('Error al eliminar', 'error')
      });
      this.cerrarMenuRapido();
    }
  }

  // 🚀 FUNCIÓN DEL BOTÓN DE VICTORIA
// 🚀 COREOGRAFÍA DEL ÉXITO
  marcarComoCompletado(game: any, coords?: {clientX: number, clientY: number}) {
    if (!game || !game.id) return;

    // 0.2s - EL MICRO-CONFETI (Calculando coordenadas en pantalla)
    setTimeout(() => {
      if (coords) {
        this.ngZone.runOutsideAngular(() => {
          confetti({
            particleCount: 80,
            spread: 60,
            // Convertimos píxeles a porcentajes (0 a 1) para la librería
            origin: { 
              x: coords.clientX / window.innerWidth, 
              y: coords.clientY / window.innerHeight 
            },
            colors: ['#198754', '#30d760', '#ffffff'],
            zIndex: 1060,
            disableForReducedMotion: true // Buenas prácticas de accesibilidad
          });
        });
      }
    }, 200);

    // 0.4s - EL MENSAJE TOAST
    setTimeout(() => {
      this.mostrarNotificacion(`¡Enhorabuena! Has terminado ${game.title}`, 'success');
    }, 400);

    // 0.8s - LA DESPEDIDA (Optimistic UI retrasado)
    // Esperamos a que termine la animación CSS para borrar la tarjeta del DOM
    setTimeout(() => {
      this.myLibrary.update(juegos => 
        juegos.map(j => j.id === game.id ? { ...j, status: 'completado' } : j)
      );

      // Petición backend silenciosa
      this.gameService.updateStatus(game.id, 'completado').subscribe({
        error: () => {
          this.cargarBiblioteca(); 
          this.mostrarNotificacion('Error al actualizar el estado', 'error');
        }
      });
    }, 800);
  }

  // 🚀 FEEDBACK HÁPTICO
  vibrarAlArrastrar() {
    // Comprobamos si el dispositivo soporta vibración (los iPhone en web a veces lo bloquean, Android funciona perfecto)
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Vibra suavemente durante 50 milisegundos
    }
  }
}