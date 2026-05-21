import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';
import { GameModal } from '../game-modal/game-modal';

@Component({
  selector: 'app-discover-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, GameModal],
  templateUrl: './discover-dashboard.html',
  styleUrls: ['./discover-dashboard.scss']
})
export class DiscoverDashboard implements OnInit {
  private gameService = inject(GameService);

  public loading = signal<boolean>(true);
  
  // Arrays para almacenar cada categoría
  public releases: any[] = [];
  public recommendations: any[] = [];
  public trending: any[] = [];

  // 🎯 Control del Modal
  public selectedGameId = signal<number | null>(null);

  abrirModal(id: number) {
    this.selectedGameId.set(id);
  }

  cerrarModal() {
    this.selectedGameId.set(null);
  }

  ngOnInit() {
    this.cargarFeed();
  }

  cargarFeed() {
    this.gameService.getDiscoverFeed().subscribe({
      next: (res: any) => {
        this.releases = res.releases_this_month || [];
        this.recommendations = res.recommended_for_you || [];
        this.trending = res.top_rated_global || [];
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando el feed de descubrimiento', err);
        this.loading.set(false);
      }
    });
  }

  // Utilidad para formatear fechas Unix de IGDB
  formatDate(unixTimestamp: number): string {
    if (!unixTimestamp) return 'Fecha desconocida';
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  }
}