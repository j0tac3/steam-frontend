import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon';
import { SavedGame } from '../../models/saved-games'; // 🚀 Import the extended model

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './game-card.html',
  styleUrl: './game-card.scss'
})
export class GameCardComponent {
  // 🚀 Change Game to SavedGame
  @Input() game!: SavedGame;

  // 🚀 Update the event emitter type
  @Output() verInfo = new EventEmitter<SavedGame>();
  @Output() borrar = new EventEmitter<number>();
  @Output() cambiarEstado = new EventEmitter<{id: number, nuevoEstado: string}>();

  generarEstrellas(rating: number | null | undefined): string {
    if (!rating || rating === 0) return 'Sin puntuar';
    
    const notaSobre5 = Math.round(rating / 2); 
    const estrellasLlenas = '★'.repeat(notaSobre5);
    const estrellasVacias = '☆'.repeat(5 - notaSobre5);
    
    return estrellasLlenas + estrellasVacias;
  }

  onVerInfo() {
    this.verInfo.emit(this.game);
  }

  onBorrar() {
    // 🚀 Since game is now SavedGame, TypeScript knows 'id' exists
    if (this.game.id) {
      this.borrar.emit(this.game.id);
    }
  }

  onCambiarEstado(evento: Event) {
    const selectElement = evento.target as HTMLSelectElement;
    if (this.game.id) {
      this.cambiarEstado.emit({
        id: this.game.id, 
        nuevoEstado: selectElement.value
      });
    }
  }
}