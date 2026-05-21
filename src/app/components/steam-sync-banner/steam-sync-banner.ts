import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamSyncService } from '../../services/steam-sync';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-steam-sync-banner',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './steam-sync-banner.html',
  styleUrl: './steam-sync-banner.scss'
})
export class SteamSyncBannerComponent {
  public syncService = inject(SteamSyncService);

  // 🚀 RECUPERAMOS EL CÁLCULO DE PROGRESO
  progressPercentage = computed(() => {
    const total = this.syncService.totalGames();
    const processed = this.syncService.processedGames();
    if (total === 0) return 0;
    return (processed / total) * 100;
  });
}