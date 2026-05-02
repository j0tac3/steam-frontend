import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { IgdbGame } from '../../interfaces/igdb';

@Component({
  selector: 'app-card-clean',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-clean.html',
  styleUrls: ['./card-clean.scss']
})
export class CardCleanComponent {
  @Input({ required: true }) game!: IgdbGame;
  @Input() showAddButton = false;
  
  @Output() clicked = new EventEmitter<number>();
  @Output() addClicked = new EventEmitter<number>();

  getCoverUrl(cover?: any): string {
    if (!cover || !cover.url) {
      return 'https://placehold.co/300x400/1a1a1a/6441a5?text=Sin+Imagen'; 
    }
    let fullUrl = 'https:' + cover.url;
    return fullUrl.replace('t_thumb', 't_cover_big');
  }

  verDetalle() {
    this.clicked.emit(this.game.id);
  }

  onAddClick(event: Event) {
    event.stopPropagation(); 
    this.addClicked.emit(this.game.id);
  }
}