import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameService } from './game.service';
import { concatMap, from, map, catchError, of } from 'rxjs'; // 🚀 AÑADIDOS NUEVOS OPERADORES
import { environment } from '../../environments/environment';

export interface SyncGame {
  steam_id: string;
  name: string;
  playtime_minutes: number;
  status: 'pending' | 'processing' | 'success' | 'error';
}

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
  private apiUrl: string = environment.apiUrl;

  // 🚦 Signals Reactivos
  public isSyncing = signal<boolean>(false);
  public totalGames = signal<number>(0);
  public processedGames = signal<number>(0);
  public currentGameName = signal<string>('');
  
  // 🔥 EL SIGNAL PARA LA VISTA VIRTUAL SCROLL
  public gamesList = signal<SyncGame[]>([]);

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
          
          // 🚀 1. VOLCAMOS LOS JUEGOS A LA LISTA VISUAL CON ESTADO 'PENDIENTE'
          const initialList: SyncGame[] = response.games_to_sync.map(g => ({
            steam_id: String(g.steam_id),
            name: g.name,
            playtime_minutes: g.playtime_minutes,
            status: 'pending' // Empiezan con el reloj de arena
          }));
          this.gamesList.set(initialList);

          // Pasamos a procesarlos
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
    
    // 🚀 1. EL FILTRO HÍBRIDO: Ordenamos la lista antes de procesarla
    games.sort((a, b) => {
      // Nos aseguramos de tener un número (por si acaso viene un undefined o null)
      const horasA = a.playtime_minutes || 0;
      const horasB = b.playtime_minutes || 0;

      // Condición A: Primero por horas jugadas (de mayor a menor)
      if (horasB !== horasA) {
        return horasB - horasA;
      }
      
      // Condición B: Si empatan en horas (ej: 0 horas), orden alfabético estricto (A-Z)
      return a.name.localeCompare(b.name);
    });

    // Empezamos a procesar la cola ya ordenada
    from(games).pipe(
      concatMap(game => {
        this.currentGameName.set(game.name);
        
        // 🚀 2. CAMBIAMOS VISUALMENTE A "PROCESANDO" (Spinner azul)
        this.actualizarEstadoJuego(String(game.steam_id), 'processing');

        // Hacemos la llamada, pero la envolvemos para saber qué juego exacto estamos procesando
        return this.http.post(`${this.apiUrl}/steam/sync-single`, game).pipe(
          map(res => ({ success: true, game, res })), // Si va bien
          catchError(err => of({ success: false, game, err })) // 🛡️ Si falla, atrapamos el error para no romper la cola
        );
      })
    ).subscribe({
      next: (result) => {
        
        this.processedGames.update(count => count + 1);
        
        // 🚀 3. EVALUAMOS EL RESULTADO Y PONEMOS CHECK VERDE O ASPA ROJA
        if (result.success) {
          this.actualizarEstadoJuego(String(result.game.steam_id), 'success');
          this.gameService.juegoSincronizado$.next();
        } else {
          this.actualizarEstadoJuego(String(result.game.steam_id), 'error');
          // 🔥 Engañamos a TypeScript con (result as any) para que nos deje imprimir el error
          console.warn(`Juego omitido (${result.game.name}):`, (result as any).err);
        }
      },
      error: (err) => {
        console.error('Error catastrófico en la cola:', err);
      },
      complete: () => {
        this.currentGameName.set('¡Sincronización completada con éxito! 🎉');
        this.gameService.sincronizacionTerminada$.next(); 
        setTimeout(() => this.resetSync(), 3500);
      }
    });
  }

  // 🚀 HELPER PARA ACTUALIZAR EL ESTADO VISUAL
  private actualizarEstadoJuego(steamId: string, nuevoEstado: 'processing' | 'success' | 'error') {
    this.gamesList.update(lista => 
      lista.map(juego => 
        juego.steam_id === steamId ? { ...juego, status: nuevoEstado } : juego
      )
    );
  }

  private resetSync(): void {
    this.isSyncing.set(false);
    this.totalGames.set(0);
    this.processedGames.set(0);
    this.currentGameName.set('');
  }
}