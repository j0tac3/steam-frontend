import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { IgdbDataService } from '../../services/igdb-data'; // Verifica tu ruta
import { IgdbGame } from '../../interfaces/igdb'; // Verifica tu ruta

@Component({
  selector: 'app-modal-v2',
  standalone: true,
  imports: [DecimalPipe], 
  templateUrl: './modal-v2.html',
  styleUrls: ['./modal-v2.scss']
})
export class ModalV2Component implements OnInit {
  @Input({ required: true }) gameId!: number;
  @Output() close = new EventEmitter<void>();
  
  public game = signal<IgdbGame | null>(null);
  public loading = signal<boolean>(true);

  constructor(private igdbService: IgdbDataService) {}

  ngOnInit() {
    this.igdbService.getDetallePro(this.gameId).subscribe({
      next: (res) => {
        this.game.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar:', err);
        this.loading.set(false);
      }
    });
  }

  getFullCover(imageId?: string): string {
    return imageId 
      ? `https://images.igdb.com/igdb/image/upload/t_720p/${imageId}.jpg`
      : 'https://placehold.co/600x800/1a1a1a/6441a5?text=Sin+Portada';
  }

  getPlatformsText(): string {
    const currentGame = this.game();
    if (!currentGame?.platforms) return 'Desconocido';
    return currentGame.platforms.map(p => p.name).join(' • ');
  }

  getScreenshotUrl(imageId: string): string {
    return `https://images.igdb.com/igdb/image/upload/t_screenshot_med/${imageId}.jpg`;
  }

  abrirImagenCompleta(imageId: string) {
    const urlFull = `https://images.igdb.com/igdb/image/upload/t_1080p/${imageId}.jpg`;
    window.open(urlFull, '_blank');
  }

  scroll(container: HTMLElement, direction: 'left' | 'right') {
    const scrollAmount = 320; 
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  cerrar() {
    this.close.emit();
  }
}