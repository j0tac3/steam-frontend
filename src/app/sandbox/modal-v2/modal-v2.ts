import { Component, Output, EventEmitter, signal, inject, input, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SteamService } from '../../services/steam';

@Component({
  selector: 'app-modal-v2',
  standalone: true,
  imports: [DecimalPipe, CommonModule], 
  templateUrl: './modal-v2.html',
  styleUrls: ['./modal-v2.scss']
})
export class ModalV2Component {
  gameId = input.required<number | string>();
  source = input.required<'igdb' | 'steam'>(); 
  initialMode = input<'read' | 'action'>('read');
  enBiblioteca = input<boolean>(false);
  existingData = input<any>(null);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>(); // Emitir cuando se guarde
  
  public game = signal<any | null>(null); 
  public loading = signal<boolean>(true);

  private gameService = inject(SteamService);

  // 🚀 Gestión de Modos
  modalMode: 'read' | 'action' = 'read';

  detalleForm = { platforms: [] as string[], status: 'pendiente' };
  originalForm = { platforms: [] as string[], status: 'pendiente' };
  hasChanges: boolean = false;

  ngOnInit() {
    // 🚀 Aquí es el lugar correcto. Angular ya ha conectado los inputs.
    this.cargarDatos(this.gameId(), this.source());
    // Configurar el modo inicial al abrir el modal
    this.modalMode = this.initialMode();
  }

  constructor() {
    effect(() => {
      const data = this.existingData();
      if (data) {
        // Adaptamos por si la BD nos devuelve un string (ej: "PC, Switch") o ya es un array
        let parsedPlatforms: string[] = [];
        if (Array.isArray(data.platform)) parsedPlatforms = [...data.platform];
        else if (typeof data.platform === 'string') parsedPlatforms = data.platform.split(',').map((p:string) => p.trim());

        this.detalleForm = { platforms: parsedPlatforms, status: data.status || 'pendiente' };
        this.originalForm = { platforms: [...parsedPlatforms], status: data.status || 'pendiente' };
      } else {
        this.detalleForm = { platforms: [], status: 'pendiente' };
        this.originalForm = { platforms: [], status: 'pendiente' };
      }
      this.evaluarCambios();
    });
  }

  togglePlatform(plat: string) {
    const idx = this.detalleForm.platforms.indexOf(plat);
    if (idx > -1) {
      this.detalleForm.platforms.splice(idx, 1); // Si ya estaba, la quitamos
    } else {
      this.detalleForm.platforms.push(plat); // Si no estaba, la añadimos
    }
    this.evaluarCambios();
  }

  setStatus(newStatus: string) {
    this.detalleForm.status = newStatus;
    this.evaluarCambios();
  }

  evaluarCambios() {
    // Comparamos los arrays ordenados para saber si hay diferencias
    const p1 = this.detalleForm.platforms.slice().sort().join(',');
    const p2 = this.originalForm.platforms.slice().sort().join(',');
    const s1 = this.detalleForm.status;
    const s2 = this.originalForm.status;
    
    // Si la plataforma o el estado cambian, hasChanges es true
    this.hasChanges = (p1 !== p2) || (s1 !== s2);
  }

  cargarDatos(id: string | number, source: 'igdb' | 'steam') {
    this.loading.set(true);

    this.gameService.getGameDetails(id, source).subscribe({
      next: (res) => {
        this.game.set(res);
        // Si el juego viniera con plataformas de la BD, lo asignaríamos aquí
        this.loading.set(false);
      },
      error: (err) => { 
        console.error('Error al cargar detalles:', err); 
        this.loading.set(false); 
      }
    });
  }

  activarEdicion() {
    this.modalMode = 'action';
  }

  guardarJuego() {
    if (!this.hasChanges) return; // Protección extra

    const payload = {
      external_id: this.gameId(),
      source: this.source(),
      title: this.game()?.name,
      cover_url: this.game()?.coverUrl,
      // Unimos el array en un string separado por comas para no romper tu base de datos actual de Laravel
      platform: this.detalleForm.platforms.join(', '), 
      status: this.detalleForm.status
    };

    // Esto es un ejemplo. Deberás llamar a tu servicio para hacer el POST/PUT
    console.log('Guardando juego en BD...', payload);
    
    // Por ahora, simulamos éxito, emitimos y cerramos
    this.saved.emit(payload);
    this.cerrar();
  }

  abrirImagenCompleta(url: string) {
    if (!url) return;
    const urlFull = url.replace('t_screenshot_med', 't_1080p');
    window.open(urlFull, '_blank');
  }

  scroll(container: HTMLElement, direction: 'left' | 'right') {
    const scrollAmount = 320; 
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }

  getFormattedDate(timestamp?: number): string {
    if (!timestamp) return 'Fecha de salida sin confirmar';
    const date = new Date(timestamp * 1000); 
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  cerrar() {
    this.close.emit();
  }
}