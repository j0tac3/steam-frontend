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
  imports: [CommonModule,
            GameModalComponent,
            GameCardComponent,
            StatsPanelComponent,
            GameSearchComponent,
            GameFiltersComponent],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss',
})
export class BibliotecaComponent implements OnInit { // <-- Añadido implements OnInit
    public searchResults = signal<any[]>([]);
    public myLibrary = signal<any[]>([]);

    private authService = inject(AuthService);
    private router = inject(Router);

    // 1. Señales para los filtros
    filtroTexto = signal('');
    filtroEstado = signal('todos');
    criterioOrden = signal<'nombre' | 'reciente'>('reciente');
    
    // 🔥 NUEVO: Control del motor de búsqueda (por defecto IGDB)
    motorBusqueda: 'igdb' | 'steam' = 'igdb';

    constructor(private steamService: SteamService) {}

    ngOnInit() {
      this.cargarBiblioteca();
    }

  // 🔥 ACTUALIZADO: Búsqueda dual (Steam o IGDB)
  buscar(termino: string) {
    if (!termino) return;
    if (this.motorBusqueda === 'igdb') {
      this.steamService.buscarEnIGDB(termino).subscribe({
        next: (res: any) => {
          const juegos = Array.isArray(res) ? res : (res.data || []);
          this.searchResults.set(juegos.map((j: any) => ({
            name: j.name,
            appid: j.id, // "Disfrazamos" el ID de IGDB como appid
            logo: j.cover?.url ? this.steamService.formatIgdbImageUrl(j.cover.url, 't_cover_big') : 'assets/no-image.png',
            es_igdb: true // Bandera útil por si luego quieres saber de dónde vino
          })));
        }
      });
    } else {
      this.steamService.getGames(termino).subscribe({
        next: (res: any) => {
          const juegos = Array.isArray(res) ? res : (res.data || []);
          this.searchResults.set(juegos.map((j: any) => ({
            name: j.name,
            appid: j.appid, // Steam ya trae appid
            logo: j.logo,
            es_igdb: false
          })));
        }
      });
    }
  }

  cargarBiblioteca() {
  //console.log('1. Intentando cargar biblioteca...'); 
  this.steamService.getMyGames().subscribe({
    next: (juegos) => {
      //console.log('2. Juegos recibidos del servidor:', juegos);
      this.myLibrary.set(juegos);
    },
    error: (err) => {
      //console.error('3. Error al cargar:', err);
    }
  });
}

  guardarJuego(game: any) {
    const payload = {
      title: game.name, 
      steam_appid: String(game.appid), // Lo enviamos como string para evitar líos
      image_url: game.logo,
      status: 'pendiente',
      source: game.es_igdb ? 'igdb' : 'steam'
    };

    //console.log("🚀 Payload enviado al servidor:", payload);
    this.steamService.saveGame(payload).subscribe({
      next: (res) => {
        this.cargarBiblioteca();
        this.searchResults.set([]); // Limpiamos la búsqueda tras añadir
      },
      error: (err) => console.error("Error al guardar:", err)
    });
  }

  // app.ts
  borrarJuego(id: number) {
    if (confirm('¿Seguro que quieres eliminar este juego de tu biblioteca?')) {
      this.steamService.deleteGame(id).subscribe({
        next: () => {
          //console.log('Juego borrado');
          this.cargarBiblioteca(); 
        },
        error: (err) => console.error('Error al borrar:', err)
      });
    }
  }

/*   actualizarEstado(id: number, evento: any) {
    const nuevoEstado = evento.target.value;
    
    this.steamService.updateStatus(id, nuevoEstado).subscribe({
      next: () => {
        //console.log('Estado actualizado a:', nuevoEstado);
        this.cargarBiblioteca();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
  } */

  // Modifica la función actualizarEstado que ya tienes para que quede así:
  actualizarEstado(id: number, nuevoEstado: string) {
    this.steamService.updateStatus(id, nuevoEstado).subscribe({
      next: () => {
        this.cargarBiblioteca();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
  }

  // Totales calculados automáticamente
  totalJuegos = computed(() => this.myLibrary().length);

  pendientes = computed(() => 
    this.myLibrary().filter(g => g.status === 'pendiente').length
  );

  jugando = computed(() => 
    this.myLibrary().filter(g => g.status === 'jugando').length
  );
  completados = computed(() => 
    this.myLibrary().filter(g => g.status === 'completado').length
  );
  abandonado = computed(() => 
    this.myLibrary().filter(g => g.status === 'abandonado').length
  );

  bibliotecaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase();
    const estado = this.filtroEstado();
    const orden = this.criterioOrden();
    
    let lista = this.myLibrary().filter(juego => {
      const coincideTexto = juego.title.toLowerCase().includes(texto);
      const coincideEstado = estado === 'todos' || juego.status === estado;
      return coincideTexto && coincideEstado;
    });

    return lista.sort((a, b) => {
      if (orden === 'nombre') {
        return a.title.localeCompare(b.title);
      } else {
        return b.id - a.id; 
      }
    });
  });

  juegoDetalle = signal<any>(null);
  cargandoDetalle = signal(false);

  verDetalles(game: any) {
    this.cargandoDetalle.set(true);
    this.juegoDetalle.set(null);

    const gameId = (typeof game === 'object') ? (game.steam_appid || game.appid) : game;
    const esIgdb = (typeof game === 'object') ? (game.source === 'igdb' || game.es_igdb === true) : false;

    if (!gameId) {
      this.cargandoDetalle.set(false);
      return;
    }

    if (esIgdb) {
      this.steamService.getIgdbDetails(gameId).subscribe({
        next: (data) => {
          this.juegoDetalle.set({
            ...game, // 1. Mantenemos tus notas, rating y campos de Laravel que ya vienen en 'game'
            ...data, // 2. Añadimos la info extra de IGDB
            short_description: data.summary,
            header_image: this.steamService.formatIgdbImageUrl(data.cover?.url, 't_720p'),
            source: 'igdb',
            genres: data.genres ? data.genres.map((g: any) => g.name) : []
          });
          this.cargandoDetalle.set(false);
        }
      });
    } else {
      this.steamService.getGameDetails(gameId).subscribe({
        next: (data) => {
          this.juegoDetalle.set({ 
            ...game, // 1. Mantenemos tus notas, rating y campos de Laravel que ya vienen en 'game'
            ...data, // 2. Añadimos la info extra de Steam
            source: 'steam',
            steam_appid: gameId,
            price: data.price_overview ? data.price_overview.final_formatted : (data.is_free ? 'Gratis' : 'N/D'),
            genres: data.genres ? data.genres.map((g: any) => g.description) : []
          });
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
        // PRIMERO: Actualizamos el objeto del modal con lo que devuelve Laravel
        if (response.game) {
          // Fusionamos lo que ya tenemos con lo que llega para no perder la descripción de Steam
          this.juegoDetalle.set({ ...this.juegoDetalle(), ...response.game });
        }

        // SEGUNDO: Refrescamos la lista de atrás de forma silenciosa
        this.cargarBiblioteca(); 
        
        //('✅ Guardado y sincronizado');
      },
      error: (err) => console.error(err)
    });
  }

  // Convierte una nota de 0-10 en un texto de estrellas (Ej: 8 -> "★★★★☆")
  generarEstrellas(rating: number | null | undefined): string {
    if (!rating || rating === 0) return 'Sin puntuar';
    
    const notaSobre5 = Math.round(rating / 2); 
    const estrellasLlenas = '★'.repeat(notaSobre5);
    const estrellasVacias = '☆'.repeat(5 - notaSobre5);
    
    return estrellasLlenas + estrellasVacias;
  }

  // En biblioteca.component.ts
  cambiarFiltroEstado(nuevoEstado: string) {
    this.filtroEstado.set(nuevoEstado);
  }

  cerrarSesion() {
    this.authService.logout();
  }
}