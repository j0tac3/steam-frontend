import { Component, Output, EventEmitter, signal, inject, input, effect, computed, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { GameService } from '../../services/game.service';
import { JournalService, JournalEntry } from '../../services/journal'; 
import { Game, LibraryGame } from '../../models/game';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [DecimalPipe, CommonModule, FormsModule], 
  templateUrl: './game-modal.html',
  styleUrls: ['./game-modal.scss']
})
export class GameModal implements OnInit {
  gameId = input.required<number | string>();
  source = input.required<'igdb' | 'steam' | 'local'>(); 
  initialMode = input<'read' | 'action'>('read');
  enBiblioteca = input<boolean>(false);
  existingData = input<LibraryGame | any>(null);

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>(); 
  @Output() favoriteChanged = new EventEmitter<boolean>();
  @Output() journalStatusChanged = new EventEmitter<{hasNotes: boolean, hasFeaturedNotes: boolean}>();

  // 🚀 VARIABLES DE ESTADO
  public game = signal<Game | null>(null); 
  public loading = signal<boolean>(true);
  public isFavorite = signal<boolean>(false);
  public activeTab = signal<'tech' | 'experience'>('tech');
  public currentImageIndex = signal<number>(0);
  public modalMode: 'read' | 'action' = 'read';
  public toastMessage = signal<string | null>(null);
  
  // Computado para extraer fácilmente todas las portadas
  public allCovers = computed(() => {
    return this.game()?.media?.filter(m => m.type === 'cover') || [];
  });
  
  // 🚀 VARIABLES DEL INVENTARIO (Acordeón e instant-save)
  public myVersions = signal<any[]>([]); 
  public ownedPlatformIds = computed(() => this.myVersions().map(v => v.platform_id));
  public pendingPlatforms = signal<number[]>([]); 
  public platDrafts = signal<Record<number, {status: string, personal_rating: number}>>({});
  public activeDropdown = signal<number | null>(null);

  // 📝 VARIABLES DEL DIARIO
  public journalEntries = signal<JournalEntry[]>([]);
  public isCreatingNote = signal<boolean>(false);
  public newNoteContent = signal<string>('');
  public showOnlyFeatured = signal<boolean>(false);
  public filteredEntries = computed(() => {
    const entries = this.journalEntries();
    return this.showOnlyFeatured() ? entries.filter(e => e.is_featured) : entries;
  });

  private gameService = inject(GameService);
  private journalService = inject(JournalService); 

  constructor() {
    effect(() => {
      const data = this.existingData();
      if (data) {
        // Tolerancia bi-direccional: lee de cualquier estructura disponible
        const versions = data.my_versions || data.inventory_entries || [];
        const isFav = versions.some((v: any) => v.is_favorite) || false;
        this.isFavorite.set(isFav);
        
        if (data.id) {
          this.loadJournalEntries(data.id);
        }
      }
    });
  }

  ngOnInit() {
    this.cargarDatos(this.gameId(), this.source());
    this.modalMode = this.initialMode();
  }

  // ==========================================
  // 🎮 LÓGICA PRINCIPAL Y COLECCIÓN EN TIEMPO REAL
  // ==========================================
  cargarDatos(id: string | number, source: string) { 
    this.loading.set(true);
    this.gameService.getGameDetails(id, source).subscribe({
      next: (res: any) => { 
        this.game.set(res.data ? res.data : res); 
        if (res.my_versions) {
          this.myVersions.set(res.my_versions);
          
          // Sincronización instantánea del corazón con los datos reales del servidor
          const isFav = res.my_versions.some((v: any) => v.is_favorite) || false;
          this.isFavorite.set(isFav);

          const drafts: Record<number, any> = {};
          res.my_versions.forEach((v: any) => {
              drafts[v.platform_id] = { status: v.status, personal_rating: v.personal_rating };
          });
          this.platDrafts.set(drafts);
        }
        this.loading.set(false); 
      },
      error: (err) => { this.loading.set(false); }
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

  // 🚀 INTERACCIÓN DIRECTA: Añade o elimina la consola al instante al pulsar la fila
  togglePlatformOwnership(platId: number) {
    if (this.ownedPlatformIds().includes(platId)) {
      // Si ya la tiene, la desvinculamos inmediatamente de la BBDD (Estrellas desaparecen)
      this.myVersions.update(list => list.filter(v => v.platform_id !== platId));
      this.saved.emit({ action: 'delete', platform_id: platId, external_id: this.gameId() });
    } else {
      // Si la pulsa, se añade inmediatamente en estado 'pendiente' y las estrellas aparecen abajo
      this.myVersions.update(list => [...list, { platform_id: platId, status: 'pendiente', personal_rating: 0 }]);
      this.platDrafts.update(d => ({ ...d, [platId]: { status: 'pendiente', personal_rating: 0 } }));
      this.saved.emit({
        external_id: this.game()?.igdb_id || this.gameId(),
        status: 'pendiente',
        platform_ids: [platId]
      });
    }
  }

  // 🚀 PUNTUACIÓN INSTANTÁNEA: Cambia las estrellas e informa al servidor al momento
  setPlatRating(platId: number, rating: number) {
    const currentRating = this.getPlatRating(platId);
    const nuevoRating = currentRating === rating ? 0 : rating; // Si pulsa la misma estrella, se limpia a 0
    
    this.platDrafts.update(d => ({ ...d, [platId]: { ...(d[platId] || { status: 'pendiente' }), personal_rating: nuevoRating } }));
    this.saved.emit({
      external_id: this.gameId(),
      platform_id: platId,
      status: this.getPlatStatus(platId),
      personal_rating: nuevoRating
    });
  }

  // 🚀 CAMBIO DE ESTADO INSTANTÁNEO desde el dropdown interno de la consola
  setPlatStatus(platId: number, status: string) {
    this.platDrafts.update(d => ({ ...d, [platId]: { ...(d[platId] || { personal_rating: 0 }), status } }));
    this.activeDropdown.set(null);
    this.saved.emit({
      external_id: this.gameId(),
      platform_id: platId,
      status: status,
      personal_rating: this.getPlatRating(platId)
    });
  }

  toggleDropdown(platId: number | null) {
    this.activeDropdown.set(this.activeDropdown() === platId ? null : platId);
  }

  getPlatRating(platId: number): number { return this.platDrafts()[platId]?.personal_rating || 0; }
  getPlatStatus(platId: number): string { return this.platDrafts()[platId]?.status || 'pendiente'; }
  
  getPlatStatusText(platId: number): string {
    const st = this.getPlatStatus(platId);
    if (st === 'completado') return '🏆 Completado';
    if (st === 'jugando') return '🎮 Jugando';
    if (st === 'abandonado') return '❌ Abandonado';
    return '⏳ Pendiente';
  }

  get availablePlatforms(): { id: number, name: string, icon: string, family: string }[] {
    const rawPlatforms = this.game()?.platforms || [];
    const mapped = new Map<number, { id: number, name: string, icon: string, family: string }>();

    rawPlatforms.forEach((p: any) => {
      const lower = p.name.toLowerCase();
      let icon = 'bi-controller';
      let assignedFamily = p.family || 'other';

      if (assignedFamily === 'pc' || lower.includes('pc') || lower.includes('mac') || lower.includes('windows')) {
        icon = 'bi-pc-display'; assignedFamily = 'pc';
      } else if (assignedFamily === 'playstation' || lower.includes('playstation') || lower.includes('ps')) {
        icon = 'bi-playstation'; assignedFamily = 'playstation';
      } else if (assignedFamily === 'xbox' || lower.includes('xbox')) {
        icon = 'bi-xbox'; assignedFamily = 'xbox';
      } else if (assignedFamily === 'nintendo' || lower.includes('switch')) {
        icon = 'bi-nintendo-switch'; assignedFamily = 'nintendo';
      } 
      // 🚀 NUEVA REGLA: Icono de móvil para iOS y Android
      else if (assignedFamily === 'mobile' || lower.includes('android') || lower.includes('ios')) {
        icon = 'bi-phone'; assignedFamily = 'mobile';
      }

      mapped.set(p.id, { id: p.id, name: p.name, icon: icon, family: assignedFamily });
    });
    return Array.from(mapped.values());
  }

  // ==========================================
  // 📖 LÓGICA DEL DIARIO 
  // ==========================================
  loadJournalEntries(internalGameId: number | string) {
    this.journalService.getEntries(internalGameId).subscribe({
      next: (entries) => {
        const mapped = entries.map(e => ({ ...e, isEditing: false, originalContent: e.content }));
        this.journalEntries.set(mapped);
      },
      error: (err) => console.error("Error al cargar diario", err)
    });
  }

  toggleFilter() { this.showOnlyFeatured.update(v => !v); }
  startCreatingNote() { this.isCreatingNote.set(true); }
  cancelCreatingNote() { this.isCreatingNote.set(false); this.newNoteContent.set(''); }
  editNote(entry: JournalEntry) { this.journalEntries.update(entries => entries.map(e => e.id === entry.id ? { ...e, isEditing: true } : e)); }
  cancelEdit(entry: JournalEntry) { this.journalEntries.update(entries => entries.map(e => e.id === entry.id ? { ...e, content: e.originalContent || '', isEditing: false } : e)); }

  saveNewNote() {
    const internalId = this.existingData()?.id;
    if (!internalId || !this.newNoteContent().trim()) return;
    this.journalService.createEntry(internalId, this.newNoteContent()).subscribe({
      next: (newEntry) => {
        this.journalEntries.update(entries => [{ ...newEntry, isEditing: false, originalContent: newEntry.content }, ...entries]);
        this.cancelCreatingNote();
        this.emitJournalStatus();
      }
    });
  }

  updateNote(entry: JournalEntry) {
    if (!entry.id) return;
    this.journalService.updateEntry(entry.id, { content: entry.content }).subscribe({
      next: (updated) => {
        this.journalEntries.update(entries => entries.map(e => e.id === entry.id ? { ...e, content: updated.content, originalContent: updated.content, isEditing: false } : e));
        this.emitJournalStatus();
      }
    });
  }

  deleteNote(entry: JournalEntry) {
    if (!entry.id) return;
    if (confirm('¿Estás seguro de eliminar esta nota?')) {
      this.journalService.deleteEntry(entry.id).subscribe({
        next: () => {
          this.journalEntries.update(entries => entries.filter(e => e.id !== entry.id));
          this.emitJournalStatus();
        }
      });
    }
  }

  copyNote(entry: JournalEntry) { if (navigator.clipboard) navigator.clipboard.writeText(entry.content); }

  toggleFeatured(entry: JournalEntry) {
    if (!entry.id) return;
    const oldStatus = entry.is_featured;
    entry.is_featured = !oldStatus;
    this.emitJournalStatus();
    this.journalService.updateEntry(entry.id, { is_featured: entry.is_featured }).subscribe({
      error: () => { entry.is_featured = oldStatus; this.emitJournalStatus(); }
    });
  }

  private emitJournalStatus() {
    const entries = this.journalEntries();
    this.journalStatusChanged.emit({ hasNotes: entries.length > 0, hasFeaturedNotes: entries.some(e => e.is_featured) });
  }

  // ==========================================
  // 🖼️ HELPERS VISUALES 
  // ==========================================
  getCover(): string {
    const media = this.game()?.media;
    if (media && media.length > 0) {
      const primary = media.find(m => m.is_primary) || media[0];
      
      // 🚀 CORRECCIÓN INTERNA: Si la ruta ya empieza por http (URL de Steam Store), la devolvemos intacta
      if (primary.path && primary.path.startsWith('http')) {
        return primary.path;
      }
      
      return `https://images.igdb.com/igdb/image/upload/t_cover_big/${primary.path}.jpg`;
    }
    return '/no-image.svg';
  }

  // Helper para obtener la URL de cualquier portada (no solo la principal)
  getCoverUrl(media: any): string {
    if (media.path && media.path.startsWith('http')) return media.path;
    return `https://images.igdb.com/igdb/image/upload/t_cover_big/${media.path}.jpg`;
  }

  // 🚀 LA ACCIÓN: Cambia la portada al instante sin recargar
  setPrimaryCover(mediaId: number) {
    const currentGame = this.game();
    if (!currentGame || !currentGame.id) return;

    // 1. Optimistic UI: Actualizamos la señal local inmediatamente
    const updatedMedia = currentGame.media?.map(m => {
      if (m.type === 'cover') return { ...m, is_primary: m.id === mediaId };
      return m;
    });
    this.game.update(g => g ? { ...g, media: updatedMedia } : g);

    // 2. Notificación Efímera (Toast)
    this.toastMessage.set('Portada principal actualizada');
    setTimeout(() => this.toastMessage.set(null), 3000);

    // 3. Avisamos al componente padre (La Cuadrícula) y le pasamos la nueva foto
    const selectedCover = currentGame.media?.find(m => m.id === mediaId);
    this.saved.emit({ 
      action: 'update_cover', 
      game_id: currentGame.id,
      new_cover_path: selectedCover?.path 
    });

    // 4. Guardamos en el backend silenciosamente
    this.gameService.setPrimaryCover(currentGame.id, mediaId).subscribe({
      error: (err) => console.error("Error al actualizar portada", err)
    });
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
    const itemWidth = (container.firstElementChild as HTMLElement).offsetWidth + 15; 
    const newIndex = Math.round(container.scrollLeft / itemWidth);
    this.currentImageIndex.set(newIndex);
  }

  getFormattedDate(dateString?: string): string {
    if (!dateString) return 'Fecha de salida sin confirmar';
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  cerrar() { this.close.emit(); }
}