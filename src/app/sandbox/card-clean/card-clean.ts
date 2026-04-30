import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para ngClass
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
  @Output() clicked = new EventEmitter<number>();

  isFavorite = true; // Para la demo, el corazón rojo está activo

  getCoverUrl(cover?: any): string {
    if (!cover || !cover.url) {
      return 'https://placehold.co/300x400/1a1a1a/6441a5?text=Sin+Imagen'; 
    }
    let fullUrl = 'https:' + cover.url;
    return fullUrl.replace('t_thumb', 't_cover_big');
  }

  // Coge la primera plataforma y la pone en mayúsculas (ej: "XBOX")
  getPlatformBadge(): string {
    if (!this.game.platforms || this.game.platforms.length === 0) return 'PC';
    
    // Filtramos para buscar si existe la palabra Xbox, si no, devolvemos la primera
    const xbox = this.game.platforms.find(p => p.name.toLowerCase().includes('xbox'));
    if (xbox) return 'XBOX';
    
    return this.game.platforms[0].name.toUpperCase().substring(0, 8); // Máximo 8 letras para que no rompa el diseño
  }

  // Convierte el rating (0-100) en estrellas (1-5)
  isStarFilled(starIndex: number): boolean {
    if (!this.game.rating) return false;
    const ratingInStars = Math.round(this.game.rating / 20); // 85 / 20 = 4.25 -> 4
    return starIndex <= ratingInStars;
  }

  toggleFavorite(event: Event) {
    event.stopPropagation(); // Evita que al hacer clic en el corazón se abra el Modal
    this.isFavorite = !this.isFavorite;
  }

  verDetalle() {
    this.clicked.emit(this.game.id);
  }
}