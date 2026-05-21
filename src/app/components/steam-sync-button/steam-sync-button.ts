import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SteamSyncService } from '../../services/steam-sync';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-steam-sync-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './steam-sync-button.html',
  styleUrl: './steam-sync-button.scss'
})
export class SteamSyncButtonComponent {
  steamId = signal('');
  // 🚀 RECUPERAMOS EL ESTADO: Controla si mostramos el botón o el input
  showInput = signal(false); 
  
  public syncService = inject(SteamSyncService);
  private gameService = inject(GameService);

  triggerSync() {
    const id = this.steamId().trim();
    if (id && !this.syncService.isSyncing()) {
      this.syncService.startSync(id);
      // Volvemos a mostrar el botón inicial tras lanzar la sincro
      this.showInput.set(false); 
      this.steamId.set('');
    }
  }
}