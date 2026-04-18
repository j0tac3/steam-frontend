import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-game-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-game-card.html',
  styleUrl: './search-game-card.scss'
})
export class SearchGameCardComponent {
  @Input() game: any;
  
  @Output() add = new EventEmitter<any>();
  @Output() verInfo = new EventEmitter<any>(); // 🔥 FALTA ESTA LÍNEA

  onAdd() {
    this.add.emit(this.game);
  }

  // 🔥 FALTA ESTA FUNCIÓN
  onVerInfo() {
    this.verInfo.emit(this.game);
  }
}