import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-v2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-v2.html',
  styleUrl: './modal-v2.scss'
})
export class ModalV2Component {
  // Recibimos el juego
  game = input.required<any>();
  
  // Emitimos un evento cuando el usuario quiera cerrar el modal
  cerrarModal = output<void>();

  cerrar() {
    this.cerrarModal.emit();
  }

  generarEstrellas(rating: any): string {
    const numRating = Number(rating);
    
    // Si no hay nota, es nula o es 0
    if (isNaN(numRating) || numRating <= 0) return 'Sin evaluar';

    // Aseguramos que la nota esté entre 1 y 5 (y redondeamos por si hay decimales)
    const estrellasSolidas = Math.min(Math.max(Math.round(numRating), 1), 5);
    const estrellasVacias = 5 - estrellasSolidas;

    return '★'.repeat(estrellasSolidas) + '☆'.repeat(estrellasVacias);
  }
}