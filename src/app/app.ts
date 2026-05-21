import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SteamSyncBannerComponent } from './components/steam-sync-banner/steam-sync-banner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // Necesario para que funcionen las rutas
  template: `
    <div style="min-height: 100vh; color: white;">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {}