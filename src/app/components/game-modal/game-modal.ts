import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; // IMPORTANTE

@Component({
  selector: 'app-game-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-modal.html',
  styleUrl: './game-modal.scss'
})
export class GameModalComponent {
  private sanitizer = inject(DomSanitizer);
  // Entradas de datos (Inputs)
  juegoDetalle = input<any>(null);
  cargandoDetalle = input<boolean>(false);
  esBiblioteca = input<boolean>(false);
  
  // Salida de datos (Output)
  guardarDiario = output<any>();
  
  // Estado visual
  activeTab = signal<'info' | 'diario'>('info');

  setRating(valor: number) {
    const juego = this.juegoDetalle();
    if (juego) {
      juego.personal_rating = valor * 2;
    }
  }

  // Método para limpiar el HTML y quitar el error de consola
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getStarArray(): boolean[] {
    const rating = this.juegoDetalle()?.personal_rating || 0;
    const count = Math.round(rating / 2);
    return Array(5).fill(false).map((_, i) => i < count);
  }

  onGuardar() {
    this.guardarDiario.emit(this.juegoDetalle());
  }
}