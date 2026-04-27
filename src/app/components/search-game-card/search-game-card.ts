import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../models/game'; // Ajusta la ruta a tu carpeta de modelos

@Component({
  selector: 'app-search-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-game-card.html',
  styleUrl: './search-game-card.scss'
})
export class SearchGameCardComponent {
  // Sustituimos 'any' por 'Game'
  @Input() game!: Game;
  
  // Tipamos los emisores de eventos
  @Output() add = new EventEmitter<Game>();
  @Output() verInfo = new EventEmitter<Game>(); 

  onAdd() {
    this.add.emit(this.game);
  }

  onVerInfo() {
    this.verInfo.emit(this.game);
  }
}