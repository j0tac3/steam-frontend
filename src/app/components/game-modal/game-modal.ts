import { Component, input, output, signal, inject, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Game } from '../../models/game';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-game-modal',
  standalone: true,
  imports: [CommonModule, 
            FormsModule,
            QuillModule
          ],
  templateUrl: './game-modal.html',
  styleUrl: './game-modal.scss'
})
export class GameModalComponent {
  private sanitizer = inject(DomSanitizer);

  juegoDetalle = input<Game | null>(null);
  cargandoDetalle = input<boolean>(false);
  esBiblioteca = input<boolean>(false);
  
  guardarDiario = output<Game>();
  close = output<void>(); 
  
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

  // Devuelve un array [true, true, false, false, false] basado en la nota
  getStarArray(): boolean[] {
    const rating = this.juegoDetalle()?.personal_rating || 0;
    const count = Math.round(rating / 2);
    return Array(5).fill(false).map((_, i) => i < count);
  }

  onGuardar() {
    const juego = this.juegoDetalle();
    if (juego) {
      this.guardarDiario.emit(juego);
    }
  }

  onClose() {
    this.close.emit();
  }

// --- LÓGICA DE GESTOS Y ESTADO ---
  translateY = signal<number>(0);
  isDragging = signal<boolean>(false);
  private startY = 0;

  // AÑADIDO: Guardamos el ID del juego actual para saber si hemos cambiado de juego
  private currentOpenGameId: number | string | null = null;

  backdropOpacity = computed(() => {
    const drag = this.translateY();
    const opacity = 0.8 * (1 - Math.min(drag / 300, 1));
    return `rgba(0, 0, 0, ${opacity})`;
  });

  constructor() {
    effect(() => {
      const currentJuego = this.juegoDetalle();
      if (currentJuego) {
        // 🚀 LA MAGIA: Solo reseteamos a la pestaña 'info' si el ID es diferente (es un juego nuevo)
        // Si es el mismo juego (porque hemos guardado y actualizado los datos), NO tocamos las pestañas.
        if (this.currentOpenGameId !== currentJuego.id) {
          this.activeTab.set('info');
          this.translateY.set(0);
          this.currentOpenGameId = currentJuego.id ?? null;
        }
      } else {
        this.currentOpenGameId = null; // Reseteamos al cerrar
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
    setTimeout(() => {
      this.onClose();
    }, 200); 
  }
}