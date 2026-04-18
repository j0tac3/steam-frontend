import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-card.html',
  styleUrl: './game-card.scss'
})
export class GameCardComponent {
  // Recibe el juego individual
  @Input() game: any;

  // Avisamos al padre de las acciones
  @Output() verInfo = new EventEmitter<any>();
  @Output() borrar = new EventEmitter<number>();
  @Output() cambiarEstado = new EventEmitter<{id: number, nuevoEstado: string}>();

  // Función extraída de biblioteca.ts
  generarEstrellas(rating: number | null | undefined): string {
    if (!rating || rating === 0) return 'Sin puntuar';
    
    const notaSobre5 = Math.round(rating / 2); 
    const estrellasLlenas = '★'.repeat(notaSobre5);
    const estrellasVacias = '☆'.repeat(5 - notaSobre5);
    
    return estrellasLlenas + estrellasVacias;
  }

  // Funciones intermedias para emitir los eventos
  onVerInfo() {
    this.verInfo.emit(this.game);
  }

  onBorrar() {
    this.borrar.emit(this.game.id);
  }

  onCambiarEstado(evento: any) {
    this.cambiarEstado.emit({
      id: this.game.id, 
      nuevoEstado: evento.target.value
    });
  }
}