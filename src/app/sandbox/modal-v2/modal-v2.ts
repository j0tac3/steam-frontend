import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core'; // 🚀 Añadimos signal
import { DecimalPipe, DatePipe } from '@angular/common';
import { IgdbDataService } from '../../services/igdb-data'; // Verifica que la ruta sea correcta
import { IgdbGame } from '../../interfaces/igdb';

@Component({
  selector: 'app-modal-v2',
  standalone: true,
  imports: [DecimalPipe, DatePipe], 
  templateUrl: './modal-v2.html',
  styleUrls: ['./modal-v2.scss']
})
export class ModalV2Component implements OnInit {
  @Input({ required: true }) gameId!: number;
  @Output() close = new EventEmitter<void>();
  
  // 🚀 Convertimos a Signals para una reactividad instantánea
  public game = signal<IgdbGame | null>(null);
  public loading = signal<boolean>(true);

  constructor(private igdbService: IgdbDataService) {}

  ngOnInit() {
    this.igdbService.getDetallePro(this.gameId).subscribe({
      next: (res) => {
        // 🚀 Usamos .set() para actualizar el valor
        this.game.set(res);
        this.loading.set(false);
        console.log('✅ Datos cargados en el Signal:', res);
      },
      error: (err) => {
        console.error('❌ Error al cargar:', err);
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
    const currentGame = this.game(); // Extraemos el valor del signal
    if (!currentGame?.platforms) return 'Desconocido';
    return currentGame.platforms.map(p => p.name).join(' • ');
  }

  cerrar() {
    this.close.emit();
  }
}