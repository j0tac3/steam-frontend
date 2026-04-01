import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // Necesario para que funcionen las rutas
  template: `
    <div style="background-color: #1b2838; min-height: 100vh; color: white;">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {}