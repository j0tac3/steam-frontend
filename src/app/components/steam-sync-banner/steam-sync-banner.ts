import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SteamSyncService } from '../../services/steam-sync';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling'; // 🚀 IMPORTAMOS EL SCROLL VAGO

@Component({
  selector: 'app-steam-sync-banner',
  standalone: true,
  imports: [CommonModule, DragDropModule, ScrollingModule], // 🚀 LO AÑADIMOS AQUÍ
  templateUrl: './steam-sync-banner.html',
  styleUrl: './steam-sync-banner.scss'
})
export class SteamSyncBannerComponent {
  public syncService = inject(SteamSyncService);
  
  // 🚀 ESTADO: Controla si el panel está minimizado o expandido
  public isExpanded = signal<boolean>(false); 

  progressPercentage = computed(() => {
    const total = this.syncService.totalGames();
    const processed = this.syncService.processedGames();
    if (total === 0) return 0;
    return (processed / total) * 100;
  });

  // Alterna entre la vista compacta y la vista detallada
  toggleExpand() {
    this.isExpanded.update(v => !v);
  }
}