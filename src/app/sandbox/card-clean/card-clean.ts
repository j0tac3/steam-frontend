import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card-clean',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-clean.html',
  styleUrl: './card-clean.scss'
})
export class CardCleanComponent {
  game = input.required<any>();

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