import { Component, input, output, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-game-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-modal.html',
  styleUrl: './game-modal.scss'
})
export class GameModalComponent {
  private sanitizer = inject(DomSanitizer);

  game = input<any>(null);
  juegoDetalle = input<any>(null);
  cargandoDetalle = input<boolean>(false);
  esBiblioteca = input<boolean>(false);
  
  guardarDiario = output<any>();
  close = output<void>(); // NUEVO EVENTO DE CIERRE
  
  activeTab = signal<'info' | 'diario'>('info');

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  setRating(valor: number) {
    const juego = this.juegoDetalle();
    if (juego) {
      juego.personal_rating = valor * 2;
    }
  }

  getStarArray(): boolean[] {
    const rating = this.juegoDetalle()?.personal_rating || 0;
    const count = Math.round(rating / 2);
    return Array(5).fill(false).map((_, i) => i < count);
  }

  onGuardar() {
    this.guardarDiario.emit(this.juegoDetalle());
    this.onClose(); // Auto-cierra el modal al guardar (Mejor UX)
  }

  // Función limpia para cerrar el modal en Angular
  onClose() {
    this.close.emit();
  }

  // --- LÓGICA DE GESTOS ---
  translateY = signal<number>(0);
  isDragging = signal<boolean>(false);
  private startY = 0;

  backdropOpacity = computed(() => {
    const drag = this.translateY();
    const opacity = 0.8 * (1 - Math.min(drag / 300, 1));
    return `rgba(0, 0, 0, ${opacity})`;
  });

  constructor() {
    effect(() => {
      if (this.juegoDetalle()) {
        this.activeTab.set('info');
        this.translateY.set(0); 
      }
    });
  }

  onTouchStart(event: TouchEvent) {
    this.startY = event.touches[0].clientY;
    this.isDragging.set(true);
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging()) return;
    const deltaY = event.touches[0].clientY - this.startY;
    if (deltaY > 0) this.translateY.set(deltaY);
  }

  onTouchEnd() {
    this.isDragging.set(false);
    if (this.translateY() > 150) {
      this.cerrarModalManual();
    } else {
      this.translateY.set(0);
    }
  }

  cerrarModalManual() {
    this.translateY.set(1000);
    // Añadimos un pequeño timeout para que dé tiempo a la animación de swipe down
    setTimeout(() => {
      this.onClose();
    }, 200); 
  }
}