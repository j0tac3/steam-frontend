import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { SteamService } from '../../services/steam';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-biblioteca',
  imports: [],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.scss',
})
export class BibliotecaComponent {
    public searchResults = signal<any[]>([]);
    public myLibrary = signal<any[]>([]);

    private authService = inject(AuthService);
    private router = inject(Router);

    // 1. Señales para los filtros
    filtroTexto = signal('');
    filtroEstado = signal('todos');

    criterioOrden = signal<'nombre' | 'reciente'>('reciente');
    

    constructor(private steamService: SteamService) {}

    ngOnInit() {
      this.cargarBiblioteca();
    }

  buscar(termino: string) {
    this.steamService.getGames(termino).subscribe({
      next: (res: any) => {
        // Forzamos que si res no es un array, se convierta en uno vacío
        const juegos = Array.isArray(res) ? res : (res.data || []);
        this.searchResults.set(juegos);
      },
      error: () => this.searchResults.set([]) // Si hay error, lista vacía
    });
  }


  cargarBiblioteca() {
  console.log('1. Intentando cargar biblioteca...'); // <--- Ver si esto sale al cargar la página
  this.steamService.getMyGames().subscribe({
    next: (juegos) => {
      console.log('2. Juegos recibidos del servidor:', juegos); // <--- Ver si llega el array
      this.myLibrary.set(juegos);
    },
    error: (err) => {
      console.error('3. Error al cargar:', err); // <--- ¿Sale un 401 o 403?
    }
  });
}

  guardarJuego(game: any) {
    // Hacemos un log para ver qué estamos intentando enviar antes de que falle
    console.log('Datos recibidos de la búsqueda:', game);

    // Mapeo manual: nos aseguramos de que cada campo de Laravel reciba el dato correcto
    const payload = {
      title: game.name || game.title,             // Intenta 'name' (Steam) o 'title' (Laravel)
      steam_appid: game.appid || game.steam_appid, // Intenta 'appid' (Steam) o 'steam_appid' (Laravel)
      image_url: game.logo || game.image_url,     // Intenta 'logo' (Steam) o 'image_url' (Laravel)
      status: 'pendiente'                         // Valor por defecto
    };

    console.log('Enviando a Laravel:', payload);

    this.steamService.saveGame(payload).subscribe({
      next: (res) => {
        console.log('Guardado con éxito:', res);
        this.cargarBiblioteca(); // Refresca la lista de abajo
      },
      error: (err) => {
        // Si vuelve a fallar, el log nos dirá exactamente qué campo falta
        console.error('Error al guardar:', err);
      }
    });
  }

  // app.ts
  borrarJuego(id: number) {
    if (confirm('¿Seguro que quieres eliminar este juego de tu biblioteca?')) {
      this.steamService.deleteGame(id).subscribe({
        next: () => {
          console.log('Juego borrado');
          this.cargarBiblioteca(); // Refrescamos la lista de la DB
        },
        error: (err) => console.error('Error al borrar:', err)
      });
    }
  }

  actualizarEstado(id: number, evento: any) {
    const nuevoEstado = evento.target.value;
    
    this.steamService.updateStatus(id, nuevoEstado).subscribe({
      next: () => {
        console.log('Estado actualizado a:', nuevoEstado);
        // No hace falta recargar todo, pero si quieres asegurar:
        this.cargarBiblioteca();
      },
      error: (err) => console.error('Error al actualizar:', err)
    });
  }


// ... dentro de tu clase ...

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

  // 2. Modifica tu bibliotecaFiltrada para que ordene
  bibliotecaFiltrada = computed(() => {
    const texto = this.filtroTexto().toLowerCase();
    const estado = this.filtroEstado();
    const orden = this.criterioOrden();
    
    let lista = this.myLibrary().filter(juego => {
      const coincideTexto = juego.title.toLowerCase().includes(texto);
      const coincideEstado = estado === 'todos' || juego.status === estado;
      return coincideTexto && coincideEstado;
    });

    // Ordenamos según el botón pulsado
    return lista.sort((a, b) => {
      if (orden === 'nombre') {
        return a.title.localeCompare(b.title);
      } else {
        return b.id - a.id; // El ID más alto es el más nuevo (reciente)
      }
    });
  });

  // Señal para guardar los detalles del juego seleccionado
  juegoDetalle = signal<any>(null);
  cargandoDetalle = signal(false);

  verDetalles(appid: string) {
    this.cargandoDetalle.set(true);
    this.juegoDetalle.set(null); // Limpiamos detalles anteriores
    
    this.steamService.getGameDetails(appid).subscribe({
      next: (data) => {
        this.juegoDetalle.set(data);
        this.cargandoDetalle.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargandoDetalle.set(false);
      }
    });
  }

  cerrarSesion() {
    // Solo una línea de código. El servicio se encarga del resto.
    this.authService.logout();
  }
}