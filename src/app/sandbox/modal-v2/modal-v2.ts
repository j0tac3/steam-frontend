import { Component, Output, EventEmitter, signal, inject, input, effect, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SteamService } from '../../services/steam';
import { JournalService, JournalEntry } from '../../services/journal'; // 🚀 AÑADIDO EL NUEVO SERVICIO

@Component({
  selector: 'app-modal-v2',
  standalone: true,
  imports: [DecimalPipe, CommonModule, FormsModule], 
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
  @Output() journalStatusChanged = new EventEmitter<{hasNotes: boolean, hasFeaturedNotes: boolean}>();
  
  public game = signal<any | null>(null); 
  public loading = signal<boolean>(true);
  public activeTab = signal<'tech' | 'experience'>('tech');
  public showOnlyFeatured = signal<boolean>(false);
  public isDropdownOpen = false;
  public currentImageIndex = signal<number>(0);
  
  // Lista filtrada reactiva
  public filteredEntries = computed(() => {
    const entries = this.journalEntries();
    return this.showOnlyFeatured() 
      ? entries.filter(e => e.is_featured) 
      : entries;
  });

  // Método para alternar el filtro
  toggleFilter() {
    this.showOnlyFeatured.update(v => !v);
  }

  private gameService = inject(SteamService);
  private journalService = inject(JournalService); // 🚀 INYECTADO

  modalMode: 'read' | 'action' = 'read';

  // 🚀 NOTA: Hemos eliminado 'notes' de aquí. Ya no forma parte de los datos generales del juego.
  detalleForm = { 
    platforms: [] as string[], 
    status: 'pendiente',
    personal_rating: 0,
    activePlatforms: [] as string[]
  };
  originalForm = { 
    platforms: [] as string[], 
    status: 'pendiente',
    personal_rating: 0,
    activePlatforms: [] as string[]
  };
  
  isFavorite = signal<boolean>(false);
  hasChanges: boolean = false;

  // 📝 --- ESTADO DEL DIARIO (JOURNALING) ---
  journalEntries = signal<JournalEntry[]>([]);
  isCreatingNote = signal<boolean>(false);
  newNoteContent = signal<string>('');

  ngOnInit() {
    this.cargarDatos(this.gameId(), this.source());
    this.modalMode = this.initialMode();
  }

  constructor() {
    effect(() => {
      const data = this.existingData();
      if (data) {
        // 1. Parsear Inventario (Dónde lo tengo)
        let parsedPlatforms: string[] = [];
        if (Array.isArray(data.platform)) parsedPlatforms = [...data.platform];
        else if (typeof data.platform === 'string') {
          // El filter evita que si está vacío ("") se cree un array con un string vacío [""]
          parsedPlatforms = data.platform.split(',').map((p:string) => p.trim()).filter((p:string) => p);
        }

        // 2. 🎯 NUEVO: Parsear Plataformas Activas (Dónde lo juego)
        let parsedActivePlatforms: string[] = [];
        if (Array.isArray(data.active_platforms)) parsedActivePlatforms = [...data.active_platforms];
        else if (typeof data.active_platforms === 'string') {
          parsedActivePlatforms = data.active_platforms.split(',').map((p:string) => p.trim()).filter((p:string) => p);
        }

        // 3. Asignar al formulario
        this.detalleForm = { 
          platforms: parsedPlatforms, 
          status: data.status || 'pendiente',
          personal_rating: data.personal_rating || 0,
          activePlatforms: parsedActivePlatforms // 🎯 Carga desde la BD
        };
        
        this.originalForm = { 
          platforms: [...parsedPlatforms], 
          status: data.status || 'pendiente',
          personal_rating: data.personal_rating || 0,
          activePlatforms: [...parsedActivePlatforms] // 🎯 Carga desde la BD para evaluar cambios
        };
        
        this.isFavorite.set(data.is_favorite || false);

        // 🚀 Cargar las notas si el juego existe en la BD
        if (data.id) {
          this.loadJournalEntries(data.id);
        }

      } else {
        // Inicialización para juegos nuevos (Añadir a mi lista)
        this.detalleForm = { platforms: [], status: 'pendiente', personal_rating: 0, activePlatforms: [] };
        this.originalForm = { platforms: [], status: 'pendiente', personal_rating: 0, activePlatforms: [] };
      }
      this.evaluarCambios();
    });
  }

  // ==========================================
  // 📖 LÓGICA DEL DIARIO (NUEVA)
  // ==========================================

  loadJournalEntries(internalGameId: number | string) {
    this.journalService.getEntries(internalGameId).subscribe({
      next: (entries) => {
        // Mapeamos para añadir propiedades locales de UI
        const mapped = entries.map(e => ({ ...e, isEditing: false, originalContent: e.content }));
        this.journalEntries.set(mapped);
      },
      error: (err) => console.error("Error al cargar diario", err)
    });
  }

  startCreatingNote() { this.isCreatingNote.set(true); }
  
  cancelCreatingNote() { 
    this.isCreatingNote.set(false); 
    this.newNoteContent.set(''); 
  }

  editNote(entry: JournalEntry) { 
    // Actualizamos a través del Signal para que la UI reaccione al instante
    this.journalEntries.update(entries => 
      entries.map(e => e.id === entry.id ? { ...e, isEditing: true } : e)
    );
  }

  cancelEdit(entry: JournalEntry) { 
    this.journalEntries.update(entries => 
      entries.map(e => e.id === entry.id ? { ...e, content: e.originalContent || '', isEditing: false } : e)
    );
  }

  saveNewNote() {
    const internalId = this.existingData()?.id;
    if (!internalId || !this.newNoteContent().trim()) return;

    this.journalService.createEntry(internalId, this.newNoteContent()).subscribe({
      next: (newEntry) => {
        // La añadimos al principio de la lista
        this.journalEntries.update(entries => [{ ...newEntry, isEditing: false, originalContent: newEntry.content }, ...entries]);
        this.cancelCreatingNote();
        this.mostrarToastLocal('Nota añadida a tu diario.');
        this.emitJournalStatus()
      },
      error: () => this.mostrarToastLocal('Error al guardar la nota.', true)
    });
  }

  updateNote(entry: JournalEntry) {
    if (!entry.id) return;
    this.journalService.updateEntry(entry.id, { content: entry.content }).subscribe({
      next: (updated) => {
        // Al recibir el OK del servidor, actualizamos el Signal correctamente
        this.journalEntries.update(entries => 
          entries.map(e => e.id === entry.id ? { 
            ...e, 
            content: updated.content, 
            originalContent: updated.content, 
            isEditing: false 
          } : e)
        );
        this.mostrarToastLocal('Nota actualizada.');
        this.emitJournalStatus()
      },
      error: () => this.mostrarToastLocal('Error al actualizar.', true)
    });
  }

  deleteNote(entry: JournalEntry) {
    if (!entry.id) return;
    if (confirm('¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.')) {
      this.journalService.deleteEntry(entry.id).subscribe({
        next: () => {
          this.journalEntries.update(entries => entries.filter(e => e.id !== entry.id));
          this.mostrarToastLocal('Nota eliminada.');
        this.emitJournalStatus()
        },
        error: () => this.mostrarToastLocal('Error al eliminar.', true)
      });
    }
  }

  copyNote(entry: JournalEntry) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(entry.content).then(() => {
        this.mostrarToastLocal('Copiado al portapapeles');
      });
    }
  }

  toggleFeatured(entry: JournalEntry) {
    if (!entry.id) return;
    const oldStatus = entry.is_featured;
    entry.is_featured = !oldStatus; // Optimistic UI

    // 🚀 1. AVISAMOS AL PADRE DEL CAMBIO AL INSTANTE
    this.emitJournalStatus();

    this.journalService.updateEntry(entry.id, { is_featured: entry.is_featured }).subscribe({
      error: () => {
        entry.is_featured = oldStatus; // Revertir si falla
        // 🚀 2. AVISAMOS SI HA HABIDO QUE REVERTIR POR ERROR DE RED
        this.emitJournalStatus();
        this.mostrarToastLocal('Error al destacar.', true);
      }
    });
  }

  mostrarToastLocal(mensaje: string, isError = false) {
    // Como el Toast principal pertenece a biblioteca.ts, usamos un alert nativo temporal 
    // o un console log si no quieres interrumpir. En Angular 18 lo ideal es inyectar un ToastService global.
    // Para no romper tu UI, usamos log. (Podemos conectarlo a tu notificación si pasas un evento global).
    console.log(isError ? '❌ ' + mensaje : '✅ ' + mensaje);
  }


  // ==========================================
  // 🎮 LÓGICA DEL JUEGO (MANTENIDA)
  // ==========================================

  togglePlatform(plat: string) {
    const idx = this.detalleForm.platforms.indexOf(plat);
    if (idx > -1) this.detalleForm.platforms.splice(idx, 1); 
    else this.detalleForm.platforms.push(plat); 
    
    this.evaluarCambios();
    
    // Dispara el guardado a la base de datos al instante
    if (this.hasChanges) {
      this.guardarJuego();
    }
  }

  toggleActivePlatform(platName: string) {
    const idx = this.detalleForm.activePlatforms.indexOf(platName);
    if (idx > -1) {
      this.detalleForm.activePlatforms.splice(idx, 1); // Lo quita si ya estaba
    } else {
      this.detalleForm.activePlatforms.push(platName); // Lo añade
    }
    this.evaluarCambios();
  }

  setStatus(newStatus: string) {
    // 🗑️ Eliminado el freno
    this.detalleForm.status = newStatus;
    this.evaluarCambios();
  }

  setRating(rating: number) {
    // 🗑️ Eliminado el freno
    this.detalleForm.personal_rating = rating;
    this.evaluarCambios();
    
    // 🚀 Guardado automático silencioso e instantáneo al tocar la estrella
    if (this.hasChanges) {
      this.guardarJuego(); 
    }
  }

  cerrarDropdown() {
    this.isDropdownOpen = false;
    if (this.hasChanges) {
      this.guardarJuego();
    }
  }

evaluarCambios() {
    const p1 = this.detalleForm.platforms.slice().sort().join(',');
    const p2 = this.originalForm.platforms.slice().sort().join(',');
    
    const ap1 = this.detalleForm.activePlatforms.slice().sort().join(',');
    const ap2 = this.originalForm.activePlatforms.slice().sort().join(',');

    this.hasChanges = (
      p1 !== p2 || 
      this.detalleForm.status !== this.originalForm.status ||
      this.detalleForm.personal_rating !== this.originalForm.personal_rating ||
      ap1 !== ap2 // 🎯 Evalúa cambios en las plataformas activas
    );
  }

  cargarDatos(id: string | number, source: 'igdb' | 'steam') {
    this.loading.set(true);
    this.gameService.getGameDetails(id, source).subscribe({
      next: (res) => { this.game.set(res); this.loading.set(false); },
      error: (err) => { console.error('Error al cargar', err); this.loading.set(false); }
    });
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    if (!this.existingData()?.id) return; 

    const currentVal = this.isFavorite();
    this.isFavorite.set(!currentVal);
    this.favoriteChanged.emit(!currentVal);
    
    this.gameService.toggleFavorite(this.existingData().id).subscribe({
      error: () => this.isFavorite.set(currentVal) 
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
      personal_rating: this.detalleForm.personal_rating,
      active_platforms: this.detalleForm.activePlatforms.join(', ') // 🎯 ENVÍA EL ARRAY COMO TEXTO A LA BBDD
    };

    this.saved.emit(payload);
    this.modalMode = 'read';
    this.originalForm = { ...this.detalleForm, platforms: [...this.detalleForm.platforms] };
    this.hasChanges = false;
  }

  get availablePlatforms(): { id: string, name: string, icon: string }[] {
    const rawPlatforms = this.game()?.platforms || [];
    const mapped = new Map<string, { id: string, name: string, icon: string }>();

    rawPlatforms.forEach((p: string) => {
  const lower = p.toLowerCase();
    if (lower.includes('pc') || lower.includes('windows') || lower.includes('mac')) 
      mapped.set('PC', { id: 'PC', name: 'PC', icon: '⚪' }); // Punto blanco/gris para PC
    if (lower.includes('playstation') || lower.includes('ps4') || lower.includes('ps5')) 
      mapped.set('PlayStation', { id: 'PlayStation', name: 'PlayStation', icon: '🔵' }); // Punto azul para PS
    if (lower.includes('xbox')) 
      mapped.set('Xbox', { id: 'Xbox', name: 'Xbox', icon: '🟢' }); // Punto verde para Xbox
    if (lower.includes('switch') || lower.includes('nintendo')) 
      mapped.set('Nintendo', { id: 'Nintendo', name: 'Nintendo', icon: '🔴' }); // Punto rojo para Switch
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

  onCarouselScroll(event: Event) {
    const container = event.target as HTMLElement;
    if (!container.firstElementChild) return;
    
    // 🎯 Calculamos el ancho real de la foto en esta pantalla + los 15px de separación (gap)
    const itemWidth = (container.firstElementChild as HTMLElement).offsetWidth + 15; 
    const newIndex = Math.round(container.scrollLeft / itemWidth);
    
    this.currentImageIndex.set(newIndex);
  }

  getFormattedDate(timestamp?: number): string {
    if (!timestamp) return 'Fecha de salida sin confirmar';
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private emitJournalStatus() {
    const entries = this.journalEntries();
    this.journalStatusChanged.emit({
      hasNotes: entries.length > 0,
      hasFeaturedNotes: entries.some(e => e.is_featured)
    });
  }

  cerrar() { this.close.emit(); }
}