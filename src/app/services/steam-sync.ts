import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameService } from './game.service';
import { concatMap, from } from 'rxjs';

export interface SteamGamePayload {
  steam_id: number;
  name: string;
  playtime_minutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class SteamSyncService {
  private http = inject(HttpClient);
  private gameService = inject(GameService); 
  
  // ⚠️ Cambia esto por la URL de tu backend Laravel
  private apiUrl = 'http://localhost:8000/api'; 

  // 🚦 Signals Reactivos
  public isSyncing = signal<boolean>(false);
  public totalGames = signal<number>(0);
  public processedGames = signal<number>(0);
  public currentGameName = signal<string>('');

  public startSync(steamId: string): void {
    if (this.isSyncing()) return;

    this.isSyncing.set(true);
    this.processedGames.set(0);
    this.totalGames.set(0);
    this.currentGameName.set('Conectando con Steam...');

    this.http.post<{ success: boolean, total_found: number, games_to_sync: SteamGamePayload[] }>(
      `${this.apiUrl}/steam/sync-prepare`, 
      { steam_id: steamId }
    ).subscribe({
      next: (response) => {
        if (response.success && response.games_to_sync.length > 0) {
          this.totalGames.set(response.games_to_sync.length);
          this.processQueue(response.games_to_sync);
        } else {
          this.resetSync();
        }
      },
      error: (err) => {
        console.error('Error al conectar con Steam:', err);
        this.resetSync();
      }
    });
  }

  private processQueue(games: SteamGamePayload[]): void {
    from(games).pipe(
      concatMap(game => {
        this.currentGameName.set(game.name);
        return this.http.post(`${this.apiUrl}/steam/sync-single`, game);
      })
    ).subscribe({
      next: () => {
        this.processedGames.update(count => count + 1);
        // 🚀 EL CAMBIO MAGISTRAL: Avisamos a la biblioteca por cada juego insertado
        this.gameService.juegoSincronizado$.next();
      },
      error: (err) => {
        this.processedGames.update(count => count + 1);
        console.warn('Juego omitido por la aduana:', err);
      },
      complete: () => {
        this.currentGameName.set('¡Sincronización completada con éxito! 🎉');
        this.gameService.sincronizacionTerminada$.next(); 
        setTimeout(() => this.resetSync(), 3500);
      }
    });
  }

  private resetSync(): void {
    this.isSyncing.set(false);
    this.totalGames.set(0);
    this.processedGames.set(0);
    this.currentGameName.set('');
  }
}