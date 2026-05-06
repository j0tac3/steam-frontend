import { Component, Output, EventEmitter, signal, inject, input, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 🚀 NECESARIO PARA EL TEXTAREA (ngModel)
import { SteamService } from '../../services/steam';

@Component({
  selector: 'app-modal-v2',
  standalone: true,
  imports: [DecimalPipe, CommonModule, FormsModule], // 🚀 Añadido FormsModule
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
  @Output() saved = new EventEmitter<any>(); 
  @Output() favoriteChanged = new EventEmitter<boolean>();
  
  public game = signal<any | null>(null); 
  public loading = signal<boolean>(true);

  // 🚀 SEÑAL PARA LAS PESTAÑAS (TABS)
  public activeTab = signal<'tech' | 'experience'>('tech');

  private gameService = inject(SteamService);

  modalMode: 'read' | 'action' = 'read';

  // 🚀 ACTUALIZADO: Añadimos personal_rating y notes
  detalleForm = { 
    platforms: [] as string[], 
    status: 'pendiente',
    personal_rating: 0,
    notes: ''
  };
  originalForm = { 
    platforms: [] as string[], 
    status: 'pendiente',
    personal_rating: 0,
    notes: ''
  };
  
  // 🚀 FAVORITO: Lo manejamos fuera del formulario porque se guarda al instante
  isFavorite = signal<boolean>(false);
  
  hasChanges: boolean = false;

  ngOnInit() {
    this.cargarDatos(this.gameId(), this.source());
    this.modalMode = this.initialMode();
  }

  constructor() {
    effect(() => {
      const data = this.existingData();
      if (data) {
        let parsedPlatforms: string[] = [];
        if (Array.isArray(data.platform)) parsedPlatforms = [...data.platform];
        else if (typeof data.platform === 'string') parsedPlatforms = data.platform.split(',').map((p:string) => p.trim());

        this.detalleForm = { 
          platforms: parsedPlatforms, 
          status: data.status || 'pendiente',
          personal_rating: data.personal_rating || 0,
          notes: data.notes || ''
        };
        this.originalForm = { 
          platforms: [...parsedPlatforms], 
          status: data.status || 'pendiente',
          personal_rating: data.personal_rating || 0,
          notes: data.notes || ''
        };
        
        // Seteamos el favorito inicial
        this.isFavorite.set(data.is_favorite || false);
      } else {
        // Valores por defecto si el juego es nuevo
        this.detalleForm = { platforms: [], status: 'pendiente', personal_rating: 0, notes: '' };
        this.originalForm = { platforms: [], status: 'pendiente', personal_rating: 0, notes: '' };
      }
      this.evaluarCambios();
    });
  }

  // --- LOGICA DE CAMBIOS EN FORMULARIO ---

  togglePlatform(plat: string) {
    if (this.modalMode !== 'action') return;
    const idx = this.detalleForm.platforms.indexOf(plat);
    if (idx > -1) this.detalleForm.platforms.splice(idx, 1); 
    else this.detalleForm.platforms.push(plat); 
    this.evaluarCambios();
  }

  setStatus(newStatus: string) {
    if (this.modalMode !== 'action') return;
    this.detalleForm.status = newStatus;
    this.evaluarCambios();
  }

  setRating(rating: number) {
    if (this.modalMode !== 'action') return;
    this.detalleForm.personal_rating = rating;
    this.evaluarCambios();
  }

  evaluarCambios() {
    const p1 = this.detalleForm.platforms.slice().sort().join(',');
    const p2 = this.originalForm.platforms.slice().sort().join(',');
    
    this.hasChanges = (
      p1 !== p2 || 
      this.detalleForm.status !== this.originalForm.status ||
      this.detalleForm.personal_rating !== this.originalForm.personal_rating ||
      this.detalleForm.notes !== this.originalForm.notes
    );
  }

  // --- LOGICA DE DATOS Y API ---

  cargarDatos(id: string | number, source: 'igdb' | 'steam') {
    this.loading.set(true);
    this.gameService.getGameDetails(id, source).subscribe({
      next: (res) => {
        this.game.set(res);
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

  // 🚀 NUEVO: Guardado instantáneo del favorito
  toggleFavorite(event: Event) {
    event.stopPropagation();
    if (!this.existingData()?.id) return; // Si no está en BD, no se puede hacer favorito

    const currentVal = this.isFavorite();
    // 1. Optimistic UI
    this.isFavorite.set(!currentVal);
    this.favoriteChanged.emit(!currentVal);
    
    // 2. Petición al Backend (Asegúrate de que tu SteamService tenga esta función)
    this.gameService.toggleFavorite(this.existingData().id).subscribe({
      error: () => this.isFavorite.set(currentVal) // Revertir si falla
    });
  }

  guardarJuego() {
    if (!this.hasChanges) return;

    const payload = {
      external_id: this.gameId(),
      source: this.source(),
      title: this.game()?.name,
      cover_url: this.game()?.coverUrl,
      platform: this.detalleForm.platforms.join(', '), 
      status: this.detalleForm.status,
      // 🚀 AÑADIMOS ESTO PARA QUE LARAVEL LO ACTUALICE
      personal_rating: this.detalleForm.personal_rating,
      notes: this.detalleForm.notes
    };

    console.log('Guardando juego en BD...', payload);
    this.saved.emit(payload);
    
    // Devolvemos al modo lectura visualmente
    this.modalMode = 'read';
    this.originalForm = { ...this.detalleForm, platforms: [...this.detalleForm.platforms] };
    this.hasChanges = false;
  }

  // --- HELPERS VISUALES ---

  get availablePlatforms(): { id: string, name: string, icon: string }[] {
    const rawPlatforms = this.game()?.platforms || [];
    const mapped = new Map<string, { id: string, name: string, icon: string }>();

    rawPlatforms.forEach((p: string) => {
      const lower = p.toLowerCase();
      if (lower.includes('pc') || lower.includes('windows') || lower.includes('mac')) mapped.set('PC', { id: 'PC', name: 'PC', icon: '💻' });
      if (lower.includes('playstation') || lower.includes('ps4') || lower.includes('ps5')) mapped.set('PlayStation', { id: 'PlayStation', name: 'PlayStation', icon: '🎮' });
      if (lower.includes('xbox')) mapped.set('Xbox', { id: 'Xbox', name: 'Xbox', icon: '🟢' });
      if (lower.includes('switch') || lower.includes('nintendo')) mapped.set('Nintendo', { id: 'Nintendo', name: 'Nintendo', icon: '🔴' });
    });

    return Array.from(mapped.values());
  }

  abrirImagenCompleta(url: string) {
    if (!url) return;
    window.open(url.replace('t_screenshot_med', 't_1080p'), '_blank');
  }

  scroll(container: HTMLElement, direction: 'left' | 'right') {
    container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  }

  getFormattedDate(timestamp?: number): string {
    if (!timestamp) return 'Fecha de salida sin confirmar';
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  cerrar() {
    this.close.emit();
  }
}